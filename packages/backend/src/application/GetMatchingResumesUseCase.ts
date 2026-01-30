import { IResumeRepository } from './IResumeRepository';
import { StackMatchCalculator } from '../domain/StackMatchCalculator';
import { TechStackValue } from '../domain/TechStackValue';

/**
 * Response interface for matching resumes
 */
export interface MatchingResumeDTO {
  id: string;
  company: string;
  role: string;
  techStack: string[];
  score: number;
  createdAt: Date;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Use case for retrieving and scoring resumes based on tech stack matching.
 * 
 * This use case orchestrates the resume selection workflow:
 * 1. Fetch all resume metadata from the repository
 * 2. Create a TechStackValue from the target tech stack
 * 3. Calculate match scores for each resume using StackMatchCalculator
 * 4. Sort resumes by score (descending) and creation date (descending for ties)
 * 5. Return the top 30 matches
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */
export class GetMatchingResumesUseCase {
  constructor(
    private readonly resumeRepository: IResumeRepository,
    private readonly calculator: StackMatchCalculator
  ) {}

  /**
   * Execute the use case to get matching resumes
   * 
   * @param targetTechStack - Array of technology names to match against
   * @returns Promise resolving to array of up to 30 matching resumes with scores
   * @throws Error if repository access fails
   */
  async execute(targetTechStack: string[]): Promise<MatchingResumeDTO[]> {
    // 1. Create TechStackValue from target tech stack
    const targetStack = new TechStackValue(targetTechStack);

    // 2. Fetch all resume metadata from repository
    const allResumes = await this.resumeRepository.getAllResumeMetadata();

    // 3. Calculate scores and sort using StackMatchCalculator
    const scored = this.calculator.sortByScore(allResumes, targetStack);

    // 4. Return top 30 matches, converting to DTO format with matched/missing skills
    return scored
      .slice(0, 30)
      .map(item => {
        const resumeStack = item.metadata.getTechStack();
        const matchedSkills = targetStack.getMatchingTechnologies(resumeStack);
        const missingSkills = targetStack.getMissingTechnologies(resumeStack);
        
        return {
          id: item.metadata.getId(),
          company: item.metadata.getCompany(),
          role: item.metadata.getRole(),
          techStack: item.metadata.getTechStack().getTechnologies(),
          score: item.score,
          createdAt: item.metadata.getCreatedAt(),
          matchedSkills,
          missingSkills
        };
      });
  }
}
