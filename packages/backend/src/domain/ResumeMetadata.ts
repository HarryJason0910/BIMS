/**
 * ResumeMetadata - Value object representing metadata about a saved resume
 * 
 * Represents information about a resume file including company, role, tech stack,
 * file path, creation date, and associated JD specification ID.
 * This is an immutable value object used for resume selection and matching.
 * 
 * Part of: resume-selection-from-history feature, enhanced-skill-matching feature
 * Requirements: 1.1, 1.2, 13.1, 13.2
 */

import { TechStackValue } from './TechStackValue';

export class ResumeMetadata {
  constructor(
    private readonly id: string,
    private readonly company: string,
    private readonly role: string,
    private readonly techStack: TechStackValue,
    private readonly filePath: string,
    private readonly createdAt: Date,
    private readonly jdSpecId?: string | null
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

  /**
   * Get the JD specification ID associated with this resume
   * @returns The JD spec ID, or null if not associated
   */
  getJDSpecId(): string | null {
    return this.jdSpecId || null;
  }

  /**
   * Serialize to JSON
   * @returns JSON representation of the resume metadata
   */
  toJSON(): {
    id: string;
    company: string;
    role: string;
    techStack: string[];
    filePath: string;
    createdAt: string;
    jdSpecId: string | null;
  } {
    return {
      id: this.id,
      company: this.company,
      role: this.role,
      techStack: this.techStack.getTechnologies(),
      filePath: this.filePath,
      createdAt: this.createdAt.toISOString(),
      jdSpecId: this.jdSpecId || null
    };
  }
}
