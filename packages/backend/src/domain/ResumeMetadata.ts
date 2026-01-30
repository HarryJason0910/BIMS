/**
 * ResumeMetadata - Value object representing metadata about a saved resume
 * 
 * Represents information about a resume file including company, role, tech stack,
 * file path, and creation date. This is an immutable value object used for
 * resume selection and matching.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.1, 1.2
 */

import { TechStackValue } from './TechStackValue';

export class ResumeMetadata {
  constructor(
    private readonly id: string,
    private readonly company: string,
    private readonly role: string,
    private readonly techStack: TechStackValue,
    private readonly filePath: string,
    private readonly createdAt: Date
  ) {}

  /**
   * Get the unique identifier for this resume
   * @returns The resume ID (base64 encoded file path)
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get the company name associated with this resume
   * @returns The company name
   */
  getCompany(): string {
    return this.company;
  }

  /**
   * Get the role/position associated with this resume
   * @returns The role name
   */
  getRole(): string {
    return this.role;
  }

  /**
   * Get the tech stack associated with this resume
   * @returns The TechStackValue object
   */
  getTechStack(): TechStackValue {
    return this.techStack;
  }

  /**
   * Get the file path where this resume is stored
   * @returns The file path
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Get the creation date of this resume file
   * @returns The creation date
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }
}
