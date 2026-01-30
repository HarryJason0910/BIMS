/**
 * StackMatchCalculator - Domain service for calculating tech stack match scores
 * 
 * Calculates how well a resume's tech stack matches a target job's tech stack,
 * returning a score from 0-100. Also provides sorting functionality for resume
 * matches based on score and creation date.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 5.5
 */

import { TechStackValue } from './TechStackValue';
import { ResumeMetadata } from './ResumeMetadata';

export class StackMatchCalculator {
  /**
   * Calculate the match score between a target tech stack and a resume tech stack
   * 
   * Scoring rules:
   * - 100: Resume stack contains all target technologies (exact match or superset)
   * - 50-99: Resume stack contains some target technologies (proportional to overlap)
   * - 0: Resume stack contains no target technologies
   * 
   * The calculation is case-insensitive.
   * 
   * @param targetStack - The tech stack required for the job
   * @param resumeStack - The tech stack associated with the resume
   * @returns A score from 0-100 indicating match quality
   */
  calculateScore(targetStack: TechStackValue, resumeStack: TechStackValue): number {
    const targetTechs = targetStack.getTechnologies();
    
    // If target stack is empty, return 0
    if (targetTechs.length === 0) {
      return 0;
    }
    
    // Calculate overlap (case-insensitive matching)
    const overlap = targetStack.overlapWith(resumeStack);
    
    // Exact match or superset: resume contains all target technologies
    if (overlap === targetTechs.length) {
      return 100;
    }
    
    // Partial match: calculate proportional score
    if (overlap > 0) {
      const overlapPercentage = (overlap / targetTechs.length) * 100;
      // Ensure score is at least 50 for any partial match, but cap at 99
      return Math.max(50, Math.min(99, Math.floor(overlapPercentage)));
    }
    
    // No match
    return 0;
  }

  /**
   * Sort resumes by match score and creation date
   * 
   * Sorting rules:
   * - Primary: Score in descending order (highest score first)
   * - Secondary: Creation date in descending order (most recent first) for ties
   * 
   * @param resumes - Array of resume metadata to sort
   * @param targetStack - The tech stack to match against
   * @returns Array of objects containing metadata and calculated score, sorted
   */
  sortByScore(
    resumes: ResumeMetadata[],
    targetStack: TechStackValue
  ): Array<{ metadata: ResumeMetadata; score: number }> {
    // Calculate scores for all resumes
    const scored = resumes.map(resume => ({
      metadata: resume,
      score: this.calculateScore(targetStack, resume.getTechStack())
    }));
    
    // Sort by score descending, then by date descending for ties
    return scored.sort((a, b) => {
      // Primary sort: by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      
      // Secondary sort: by creation date (descending - most recent first)
      return b.metadata.getCreatedAt().getTime() - a.metadata.getCreatedAt().getTime();
    });
  }
}
