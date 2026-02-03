/**
 * ExportDictionaryUseCase - Export skill dictionary to JSON
 * 
 * Exports the current skill dictionary with all metadata (version, skills, variations, timestamps)
 * to a JSON format that can be imported later or shared with other systems.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 10.1, 10.2
 */

import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { SkillDictionaryJSON } from '../domain/JDSpecTypes';

export interface ExportDictionaryRequest {
  version?: string; // Optional: export specific version, defaults to current
}

export interface ExportDictionaryResponse {
  success: boolean;
  data: SkillDictionaryJSON;
  message: string;
}

export class ExportDictionaryUseCase {
  constructor(
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {}

  async execute(request: ExportDictionaryRequest = {}): Promise<ExportDictionaryResponse> {
    try {
      // Fetch the dictionary (specific version or current)
      const dictionary = request.version
        ? await this.dictionaryRepository.getVersion(request.version)
        : await this.dictionaryRepository.getCurrent();

      if (!dictionary) {
        return {
          success: false,
          data: {} as SkillDictionaryJSON,
          message: request.version
            ? `Dictionary version '${request.version}' not found`
            : 'No dictionary found'
        };
      }

      // Export to JSON
      const data = dictionary.toJSON();

      return {
        success: true,
        data,
        message: `Successfully exported dictionary version ${data.version} with ${data.skills.length} skills and ${data.variations.length} variations`
      };
    } catch (error) {
      return {
        success: false,
        data: {} as SkillDictionaryJSON,
        message: error instanceof Error ? error.message : 'Unknown error during export'
      };
    }
  }
}
