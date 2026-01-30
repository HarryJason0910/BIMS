import { ResumeMetadata } from '../domain/ResumeMetadata';

/**
 * Repository interface for Resume file management.
 * Placed in application layer following dependency inversion principle.
 * 
 * This interface abstracts file system operations for resume retrieval,
 * allowing the domain and application layers to remain infrastructure-independent.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.1, 4.3
 */
export interface IResumeRepository {
  /**
   * Retrieve metadata for all saved resumes in the upload directory.
   * 
   * Scans the upload directory structure and parses directory names to extract
   * company, role, and tech stack information. Only includes resumes with valid
   * directory names and existing resume.pdf files.
   * 
   * @returns Promise resolving to array of ResumeMetadata objects
   * @throws Error if upload directory cannot be accessed
   * 
   * Requirements: 1.1, 1.2
   */
  getAllResumeMetadata(): Promise<ResumeMetadata[]>;

  /**
   * Retrieve the resume file content for a specific resume ID.
   * 
   * The resume ID is a base64-encoded file path. This method decodes the ID
   * and reads the corresponding PDF file from the file system.
   * 
   * @param resumeId - Base64 encoded file path identifying the resume
   * @returns Promise resolving to Buffer containing the PDF file content
   * @throws Error if resume ID is invalid or file cannot be read
   * 
   * Requirements: 4.3, 4.4
   */
  getResumeFile(resumeId: string): Promise<Buffer>;

  /**
   * Check if a resume file exists at the specified file path.
   * 
   * Used to validate that a selected resume still exists before submitting
   * a bid, preventing broken references to deleted files.
   * 
   * @param filePath - Absolute or relative path to the resume file
   * @returns Promise resolving to true if file exists, false otherwise
   * 
   * Requirements: 7.3, 7.4
   */
  fileExists(filePath: string): Promise<boolean>;
}
