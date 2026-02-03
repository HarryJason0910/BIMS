/**
 * ManageSkillDictionaryUseCase - Application use case for managing the skill dictionary
 * 
 * Handles CRUD operations on the canonical skills dictionary including:
 * - Adding/removing canonical skills
 * - Adding skill variations
 * - Updating canonical skills
 * - Retrieving skills and variations
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.4, 9.8, 9.9, 9.10, 9.11
 */

import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { TechLayer } from '../domain/JDSpecTypes';

/**
 * Input DTO for adding a canonical skill
 */
export interface AddCanonicalSkillInput {
  name: string;
  category: TechLayer;
}

/**
 * Input DTO for adding a skill variation
 */
export interface AddSkillVariationInput {
  variation: string;
  canonicalName: string;
}

/**
 * Input DTO for removing a canonical skill
 */
export interface RemoveCanonicalSkillInput {
  name: string;
}

/**
 * Input DTO for updating a canonical skill
 */
export interface UpdateCanonicalSkillInput {
  oldName: string;
  newName: string;
  category?: TechLayer;
}

/**
 * Input DTO for getting skills by category
 */
export interface GetSkillsByCategoryInput {
  category: TechLayer;
}

/**
 * Input DTO for getting variations for a skill
 */
export interface GetVariationsInput {
  canonicalName: string;
}

/**
 * Output DTO for skill operations
 */
export interface SkillOperationOutput {
  success: boolean;
  message: string;
  dictionaryVersion?: string;
}

/**
 * Output DTO for getting skills
 */
export interface GetSkillsOutput {
  skills: {
    frontend: Array<{ skill: string; weight: number }>;
    backend: Array<{ skill: string; weight: number }>;
    database: Array<{ skill: string; weight: number }>;
    cloud: Array<{ skill: string; weight: number }>;
    devops: Array<{ skill: string; weight: number }>;
    others: Array<{ skill: string; weight: number }>;
  };
  version: string;
}

/**
 * Output DTO for getting variations
 */
export interface GetVariationsOutput {
  variations: string[];
  canonicalName: string;
}

/**
 * ManageSkillDictionaryUseCase - Manages the canonical skills dictionary
 */
export class ManageSkillDictionaryUseCase {
  constructor(
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {}

  /**
   * Add a new canonical skill to the dictionary
   * @param input - The skill name and category
   * @returns Operation result with new dictionary version
   */
  async addCanonicalSkill(input: AddCanonicalSkillInput): Promise<SkillOperationOutput> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Skill name cannot be empty');
    }

    if (input.name.length > 100) {
      throw new Error('Skill name cannot exceed 100 characters');
    }

    // Get current dictionary
    const dictionary = await this.dictionaryRepository.getCurrent();

    // Check if skill already exists
    const normalizedName = input.name.toLowerCase().trim();
    if (dictionary.hasSkill(normalizedName)) {
      throw new Error(`Skill '${normalizedName}' already exists in the dictionary`);
    }

    // Add the canonical skill
    dictionary.addCanonicalSkill(normalizedName, input.category);

    // Increment version
    const newVersion = dictionary.incrementVersion();

    // Save updated dictionary
    await this.dictionaryRepository.save(dictionary);

    return {
      success: true,
      message: `Canonical skill '${normalizedName}' added successfully`,
      dictionaryVersion: newVersion
    };
  }

  /**
   * Add a skill variation to the dictionary
   * @param input - The variation and its canonical name
   * @returns Operation result
   */
  async addSkillVariation(input: AddSkillVariationInput): Promise<SkillOperationOutput> {
    // Validate input
    if (!input.variation || input.variation.trim().length === 0) {
      throw new Error('Variation name cannot be empty');
    }

    if (!input.canonicalName || input.canonicalName.trim().length === 0) {
      throw new Error('Canonical name cannot be empty');
    }

    // Get current dictionary
    const dictionary = await this.dictionaryRepository.getCurrent();

    // Normalize names
    const normalizedVariation = input.variation.toLowerCase().trim();
    const normalizedCanonical = input.canonicalName.toLowerCase().trim();

    // Check if canonical skill exists
    const canonicalSkill = dictionary.getCanonicalSkill(normalizedCanonical);
    if (!canonicalSkill) {
      throw new Error(`Canonical skill '${normalizedCanonical}' does not exist`);
    }

    // Check if variation already exists
    if (dictionary.hasSkill(normalizedVariation)) {
      const existingMapping = dictionary.mapToCanonical(normalizedVariation);
      if (existingMapping === normalizedCanonical) {
        throw new Error(`Variation '${normalizedVariation}' already maps to '${normalizedCanonical}'`);
      } else {
        throw new Error(`Variation '${normalizedVariation}' already exists and maps to '${existingMapping}'`);
      }
    }

    // Add the variation
    dictionary.addSkillVariation(normalizedVariation, normalizedCanonical);

    // Increment version
    const newVersion = dictionary.incrementVersion();

    // Save updated dictionary
    await this.dictionaryRepository.save(dictionary);

    return {
      success: true,
      message: `Variation '${normalizedVariation}' added for '${normalizedCanonical}'`,
      dictionaryVersion: newVersion
    };
  }

  /**
   * Remove a canonical skill from the dictionary
   * @param input - The skill name to remove
   * @returns Operation result
   */
  async removeCanonicalSkill(input: RemoveCanonicalSkillInput): Promise<SkillOperationOutput> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Skill name cannot be empty');
    }

    // Get current dictionary
    const dictionary = await this.dictionaryRepository.getCurrent();

    // Normalize name
    const normalizedName = input.name.toLowerCase().trim();

    // Check if skill exists
    const skill = dictionary.getCanonicalSkill(normalizedName);
    if (!skill) {
      throw new Error(`Canonical skill '${normalizedName}' does not exist`);
    }

    // Remove the skill (this will also remove associated variations)
    dictionary.removeCanonicalSkill(normalizedName);

    // Increment version
    const newVersion = dictionary.incrementVersion();

    // Save updated dictionary
    await this.dictionaryRepository.save(dictionary);

    return {
      success: true,
      message: `Canonical skill '${normalizedName}' removed successfully`,
      dictionaryVersion: newVersion
    };
  }

  /**
   * Update a canonical skill in the dictionary
   * @param input - The old name, new name, and optional new category
   * @returns Operation result
   */
  async updateCanonicalSkill(input: UpdateCanonicalSkillInput): Promise<SkillOperationOutput> {
    // Validate input
    if (!input.oldName || input.oldName.trim().length === 0) {
      throw new Error('Old skill name cannot be empty');
    }

    if (!input.newName || input.newName.trim().length === 0) {
      throw new Error('New skill name cannot be empty');
    }

    if (input.newName.length > 100) {
      throw new Error('New skill name cannot exceed 100 characters');
    }

    // Get current dictionary
    const dictionary = await this.dictionaryRepository.getCurrent();

    // Normalize names
    const normalizedOldName = input.oldName.toLowerCase().trim();
    const normalizedNewName = input.newName.toLowerCase().trim();

    // Check if old skill exists
    const oldSkill = dictionary.getCanonicalSkill(normalizedOldName);
    if (!oldSkill) {
      throw new Error(`Canonical skill '${normalizedOldName}' does not exist`);
    }

    // If name is changing, check if new name already exists
    if (normalizedOldName !== normalizedNewName) {
      if (dictionary.hasSkill(normalizedNewName)) {
        throw new Error(`Skill '${normalizedNewName}' already exists in the dictionary`);
      }
    }

    // Get all variations for the old skill
    const variations = dictionary.getVariationsFor(normalizedOldName);

    // Remove old skill
    dictionary.removeCanonicalSkill(normalizedOldName);

    // Add new skill with updated name and/or category
    const newCategory = input.category || oldSkill.category;
    dictionary.addCanonicalSkill(normalizedNewName, newCategory);

    // Re-add all variations to point to the new name
    for (const variation of variations) {
      dictionary.addSkillVariation(variation, normalizedNewName);
    }

    // Increment version
    const newVersion = dictionary.incrementVersion();

    // Save updated dictionary
    await this.dictionaryRepository.save(dictionary);

    return {
      success: true,
      message: `Canonical skill updated from '${normalizedOldName}' to '${normalizedNewName}'`,
      dictionaryVersion: newVersion
    };
  }

  /**
   * Get all canonical skills
   * @returns All skills in the dictionary grouped by layer
   */
  async getSkills(): Promise<GetSkillsOutput> {
    const dictionary = await this.dictionaryRepository.getCurrent();
    const allSkills = dictionary.getAllSkills();

    // Group skills by layer
    const skills = {
      frontend: [] as Array<{ skill: string; weight: number }>,
      backend: [] as Array<{ skill: string; weight: number }>,
      database: [] as Array<{ skill: string; weight: number }>,
      cloud: [] as Array<{ skill: string; weight: number }>,
      devops: [] as Array<{ skill: string; weight: number }>,
      others: [] as Array<{ skill: string; weight: number }>
    };

    for (const skill of allSkills) {
      skills[skill.category].push({
        skill: skill.name,
        weight: 1.0 // Default weight for dictionary display
      });
    }

    return {
      skills,
      version: dictionary.getVersion()
    };
  }

  /**
   * Get skills by category
   * @param input - The category to filter by
   * @returns Skills in the specified category
   */
  async getSkillsByCategory(input: GetSkillsByCategoryInput): Promise<GetSkillsOutput> {
    const dictionary = await this.dictionaryRepository.getCurrent();
    const categorySkills = dictionary.getSkillsByCategory(input.category);

    // Initialize empty structure
    const skills = {
      frontend: [] as Array<{ skill: string; weight: number }>,
      backend: [] as Array<{ skill: string; weight: number }>,
      database: [] as Array<{ skill: string; weight: number }>,
      cloud: [] as Array<{ skill: string; weight: number }>,
      devops: [] as Array<{ skill: string; weight: number }>,
      others: [] as Array<{ skill: string; weight: number }>
    };

    // Add skills to the requested category
    skills[input.category] = categorySkills.map(skill => ({
      skill: skill.name,
      weight: 1.0
    }));

    return {
      skills,
      version: dictionary.getVersion()
    };
  }

  /**
   * Get variations for a canonical skill
   * @param input - The canonical skill name
   * @returns All variations for the skill
   */
  async getVariations(input: GetVariationsInput): Promise<GetVariationsOutput> {
    // Validate input
    if (!input.canonicalName || input.canonicalName.trim().length === 0) {
      throw new Error('Canonical name cannot be empty');
    }

    const dictionary = await this.dictionaryRepository.getCurrent();

    // Normalize name
    const normalizedName = input.canonicalName.toLowerCase().trim();

    // Check if skill exists
    const skill = dictionary.getCanonicalSkill(normalizedName);
    if (!skill) {
      throw new Error(`Canonical skill '${normalizedName}' does not exist`);
    }

    const variations = dictionary.getVariationsFor(normalizedName);

    return {
      variations,
      canonicalName: normalizedName
    };
  }
}
