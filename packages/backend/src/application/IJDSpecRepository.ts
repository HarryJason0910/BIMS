/**
 * IJDSpecRepository - Repository interface for JD Specifications
 * 
 * Defines the contract for persisting and retrieving canonical JD specifications.
 * Implementations handle the persistence layer (MongoDB, in-memory, etc.).
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';

export interface IJDSpecRepository {
  /**
   * Save a new JD specification
   * @param spec - The JD specification to save
   */
  save(spec: CanonicalJDSpec): Promise<void>;

  /**
   * Find a JD specification by ID
   * @param id - The JD specification ID
   * @returns The JD specification or null if not found
   */
  findById(id: string): Promise<CanonicalJDSpec | null>;

  /**
   * Find all JD specifications
   * @returns Array of all JD specifications
   */
  findAll(): Promise<CanonicalJDSpec[]>;

  /**
   * Update an existing JD specification
   * @param spec - The JD specification to update
   */
  update(spec: CanonicalJDSpec): Promise<void>;

  /**
   * Delete a JD specification by ID
   * @param id - The JD specification ID to delete
   */
  delete(id: string): Promise<void>;
}
