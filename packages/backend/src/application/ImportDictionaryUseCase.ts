/**
 * ImportDictionaryUseCase - Import skill dictionary from JSON
 * 
 * Imports a skill dictionary from JSON format with validation, version conflict checking,
 * and support for merge mode to combine with existing dictionary.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 10.3, 10.4, 10.5, 10.6
 */

import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { SkillDictionary } from '../domain/SkillDictionary';
import { SkillDictionaryJSON } from '../domain/JDSpecTypes';

export interface ImportDictionaryRequest {
  data: SkillDictionaryJSON;
  mode: 'replace' | 'merge'; // replace: overwrite existing, merge: combine with existing
  allowVersionDowngrade?: boolean; // Allow importing older version (default: false)
}

export interface ImportDictionaryResponse {
  success: boolean;
  message: string;
  importedVersion?: string;
  conflictsResolved?: number;
}

export class ImportDictionaryUseCase {
  constructor(
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {}

  async execute(request: ImportDictionaryRequest): Promise<ImportDictionaryResponse> {
    try {
      // Validate JSON structure
      const validationError = this.validateJSON(request.data);
      if (validationError) {
        return {
          success: false,
          message: `Invalid dictionary JSON: ${validationError}`
        };
      }

      // Create dictionary from JSON
      const importedDictionary = SkillDictionary.fromJSON(request.data);

      // Get current dictionary for version checking
      let currentDictionary: SkillDictionary | null = null;
      try {
        currentDictionary = await this.dictionaryRepository.getCurrent();
      } catch (error) {
        // No current dictionary exists, this is fine for first import
      }

      // Check version conflicts
      if (currentDictionary && !request.allowVersionDowngrade) {
        const versionConflict = this.checkVersionConflict(
          currentDictionary.getVersion(),
          importedDictionary.getVersion()
        );
        
        if (versionConflict) {
          return {
            success: false,
            message: versionConflict
          };
        }
      }

      // Handle import based on mode
      if (request.mode === 'replace') {
        return await this.replaceMode(importedDictionary);
      } else {
        return await this.mergeMode(importedDictionary, currentDictionary);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during import'
      };
    }
  }

  /**
   * Validate JSON structure
   */
  private validateJSON(data: SkillDictionaryJSON): string | null {
    if (!data.version) {
      return 'Missing required field: version';
    }

    if (!Array.isArray(data.skills)) {
      return 'Missing or invalid field: skills (must be array)';
    }

    if (!Array.isArray(data.variations)) {
      return 'Missing or invalid field: variations (must be array)';
    }

    if (!data.createdAt) {
      return 'Missing required field: createdAt';
    }

    // Validate skills structure
    for (const skill of data.skills) {
      if (!skill.name || !skill.category || !skill.createdAt) {
        return 'Invalid skill structure: missing required fields (name, category, createdAt)';
      }
    }

    // Validate variations structure
    for (const variation of data.variations) {
      if (!variation.variation || !variation.canonical) {
        return 'Invalid variation structure: missing required fields (variation, canonical)';
      }
    }

    return null;
  }

  /**
   * Check for version conflicts
   * Returns error message if conflict exists, null otherwise
   */
  private checkVersionConflict(currentVersion: string, importedVersion: string): string | null {
    // Parse versions (format: YYYY.N)
    const [currentYear, currentN] = currentVersion.split('.').map(Number);
    const [importedYear, importedN] = importedVersion.split('.').map(Number);

    // Check if imported version is older
    if (importedYear < currentYear) {
      return `Version conflict: Cannot import older version ${importedVersion} over current version ${currentVersion}. Use allowVersionDowngrade option to override.`;
    }

    if (importedYear === currentYear && importedN <= currentN) {
      return `Version conflict: Cannot import version ${importedVersion} as current version ${currentVersion} is equal or newer. Use allowVersionDowngrade option to override.`;
    }

    return null;
  }

  /**
   * Replace mode: overwrite existing dictionary
   */
  private async replaceMode(importedDictionary: SkillDictionary): Promise<ImportDictionaryResponse> {
    await this.dictionaryRepository.save(importedDictionary);

    return {
      success: true,
      message: `Successfully imported dictionary version ${importedDictionary.getVersion()} in replace mode`,
      importedVersion: importedDictionary.getVersion()
    };
  }

  /**
   * Merge mode: combine with existing dictionary
   */
  private async mergeMode(
    importedDictionary: SkillDictionary,
    currentDictionary: SkillDictionary | null
  ): Promise<ImportDictionaryResponse> {
    if (!currentDictionary) {
      // No existing dictionary, just save the imported one
      await this.dictionaryRepository.save(importedDictionary);
      return {
        success: true,
        message: `Successfully imported dictionary version ${importedDictionary.getVersion()} (no existing dictionary to merge)`,
        importedVersion: importedDictionary.getVersion(),
        conflictsResolved: 0
      };
    }

    // Create a new dictionary with incremented version
    const mergedDictionary = currentDictionary.withIncrementedVersion();
    
    // Get all skills from imported dictionary
    const importedSkills = importedDictionary.getAllSkills();
    
    let conflictsResolved = 0;

    // Add all skills from imported dictionary
    for (const skill of importedSkills) {
      try {
        // Check if skill already exists in current dictionary
        const existingSkill = currentDictionary.getCanonicalSkill(skill.name);
        
        if (!existingSkill) {
          // New skill, add it
          mergedDictionary.addCanonicalSkill(skill.name, skill.category);
        } else if (existingSkill.category !== skill.category) {
          // Conflict: same skill name but different category
          // Keep the imported version (overwrite)
          mergedDictionary.removeCanonicalSkill(skill.name);
          mergedDictionary.addCanonicalSkill(skill.name, skill.category);
          conflictsResolved++;
        }
        // If skill exists with same category, no action needed
      } catch (error) {
        // Skill might already exist, continue
      }
    }

    // Add all variations from imported dictionary
    const importedJSON = importedDictionary.toJSON();
    for (const { variation, canonical } of importedJSON.variations) {
      try {
        // Check if canonical skill exists in merged dictionary
        if (mergedDictionary.hasSkill(canonical)) {
          // Check if variation already exists
          const existingCanonical = mergedDictionary.mapToCanonical(variation);
          
          if (!existingCanonical) {
            // New variation, add it
            mergedDictionary.addSkillVariation(variation, canonical);
          } else if (existingCanonical !== canonical) {
            // Conflict: variation maps to different canonical
            // This is a complex conflict, skip it for safety
            conflictsResolved++;
          }
          // If variation exists with same mapping, no action needed
        }
      } catch (error) {
        // Variation might already exist or have conflicts, continue
      }
    }

    // Save the merged dictionary
    await this.dictionaryRepository.save(mergedDictionary);

    return {
      success: true,
      message: `Successfully merged dictionaries. New version: ${mergedDictionary.getVersion()}. Conflicts resolved: ${conflictsResolved}`,
      importedVersion: mergedDictionary.getVersion(),
      conflictsResolved
    };
  }
}
