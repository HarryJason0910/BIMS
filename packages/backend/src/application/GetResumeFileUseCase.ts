import { IResumeRepository } from './IResumeRepository';

/**
 * Use case for retrieving a specific resume file by ID.
 * 
 * This use case provides a simple wrapper around the repository's getResumeFile
 * method, following the clean architecture principle of keeping use cases as
 * the orchestration layer between the presentation and infrastructure layers.
 * 
 * The resume ID is a base64-encoded file path that uniquely identifies a resume
 * in the file system. This use case delegates the actual file retrieval to the
 * repository implementation.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 4.3, 4.4
 */
export class GetResumeFileUseCase {
  constructor(private readonly resumeRepository: IResumeRepository) {}

  /**
   * Execute the use case to retrieve a resume file
   * 
   * @param resumeId - Base64 encoded file path identifying the resume
   * @returns Promise resolving to Buffer containing the PDF file content
   * @throws Error if resume ID is invalid or file cannot be read
   * 
   * Requirements: 4.3, 4.4
   */
  async execute(resumeId: string): Promise<Buffer> {
    return await this.resumeRepository.getResumeFile(resumeId);
  }
}
