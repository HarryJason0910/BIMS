/**
 * ISkillDictionaryRepository - Repository interface for Skill Dictionary
 * 
 * Defines the contract for persisting and retrieving skill dictionaries with versioning.
 * Supports version history and retrieval of specific dictionary versions.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.7, 2.6, 3.4, 3.5
 */

import { SkillDictionary } from '../domain/SkillDictionary';

export interface ISkillDictionaryRepository {
  /**
   * Save a new dictionary version
   * @param dictionary - The skill dictionary to save
   */
  save(dictionary: SkillDictionary): Promise<void>;

  /**
   * Get the current (latest) dictionary version
   * @returns The current skill dictionary
   */
  getCurrent(): Promise<SkillDictionary>;

  /**
   * Get a specific dictionary version
   * @param version - The version identifier (e.g., "2024.1")
   * @returns The dictionary for that version or null if not found
   */
  getVersion(version: string): Promise<SkillDictionary | null>;

  /**
   * Get all dictionary versions
   * @returns Array of all dictionary versions, ordered by version
   */
  getAllVersions(): Promise<SkillDictionary[]>;
}
