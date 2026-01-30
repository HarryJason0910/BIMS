/**
 * FileSystemResumeRepository - Infrastructure implementation for resume file management
 * 
 * Implements IResumeRepository by retrieving resume metadata from bids in the database
 * and providing file access to the resume files.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.1, 1.2, 4.3, 4.4
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { IResumeRepository } from '../application/IResumeRepository';
import { IBidRepository } from '../application/IBidRepository';
import { ResumeMetadata } from '../domain/ResumeMetadata';
import { TechStackValue } from '../domain/TechStackValue';

export class FileSystemResumeRepository implements IResumeRepository {
  constructor(
    private readonly uploadDirectory: string,
    private readonly bidRepository: IBidRepository
  ) {}

  /**
   * Retrieve metadata for all saved resumes from bids in the database.
   * 
   * Fetches all bids from the database and extracts resume metadata from each bid.
   * Only includes resumes where the file actually exists on the file system.
   * 
   * @returns Promise resolving to array of ResumeMetadata objects
   * @throws Error if database access fails
   * 
   * Requirements: 1.1, 1.2
   */
  async getAllResumeMetadata(): Promise<ResumeMetadata[]> {
    try {
      // Fetch all bids from the database
      const allBids = await this.bidRepository.findAll();
      console.log(`[FileSystemResumeRepository] Found ${allBids.length} bids in database`);

      const metadata: ResumeMetadata[] = [];

      for (const bid of allBids) {
        const resumePath = bid.resumePath;
        console.log(`[FileSystemResumeRepository] Checking resume: ${resumePath}`);

        // Check if resume file exists
        const exists = await this.fileExists(resumePath);
        if (!exists) {
          console.log(`[FileSystemResumeRepository] Resume file does not exist: ${resumePath}`);
          continue; // Skip bids where resume file doesn't exist
        }

        // Get file stats for creation date
        let createdAt: Date;
        try {
          const stats = await fs.stat(resumePath);
          createdAt = new Date(stats.birthtime);
        } catch {
          // If we can't get file stats, use bid date
          createdAt = bid.date;
        }

        // Generate unique ID from file path
        const id = this.generateId(resumePath);

        // Create ResumeMetadata object from bid data
        metadata.push(
          new ResumeMetadata(
            id,
            bid.company,
            bid.role,
            new TechStackValue(bid.mainStacks),
            resumePath,
            createdAt
          )
        );
      }

      console.log(`[FileSystemResumeRepository] Returning ${metadata.length} resume metadata objects`);
      return metadata;
    } catch (error) {
      console.error('[FileSystemResumeRepository] Error retrieving resume metadata:', error);
      throw new Error(`Failed to retrieve resume metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique ID from a file path using base64 encoding.
   * 
   * Creates a deterministic ID that can be decoded back to the file path.
   * 
   * @param filePath - The file path to encode
   * @returns Base64 encoded file path
   * 
   * Requirements: 4.3
   */
  private generateId(filePath: string): string {
    return Buffer.from(filePath).toString('base64');
  }

  /**
   * Retrieve the resume file content for a specific resume ID.
   * 
   * Decodes the base64 resume ID to get the file path and reads the PDF file.
   * 
   * @param resumeId - Base64 encoded file path identifying the resume
   * @returns Promise resolving to Buffer containing the PDF file content
   * @throws Error if resume ID is invalid or file cannot be read
   * 
   * Requirements: 4.3, 4.4
   */
  async getResumeFile(resumeId: string): Promise<Buffer> {
    try {
      // Decode base64 ID to get file path
      const filePath = Buffer.from(resumeId, 'base64').toString('utf-8');

      // Read and return file content
      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to retrieve resume file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a resume file exists at the specified file path.
   * 
   * @param filePath - Absolute or relative path to the resume file
   * @returns Promise resolving to true if file exists, false otherwise
   * 
   * Requirements: 7.3, 7.4
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
