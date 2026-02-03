/**
 * CalculateResumeMatchRateUseCase - Application use case for calculating resume match rates
 * 
 * Calculates how well past resumes match a new job description by:
 * - Fetching resume and its original JD specification
 * - Fetching current JD specification
 * - Calculating JD-to-JD correlation
 * - Returning match rate as percentage
 * 
 * The core insight: resumes are optimized for their original JDs, so the match rate
 * equals the correlation between the current JD and the resume's original JD.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 7.1, 7.2, 7.4, 7.5, 13.1-13.5
 */

import { JDCorrelationCalculator } from '../domain/JDCorrelationCalculator';
import { IJDSpecRepository } from './IJDSpecRepository';
import { IResumeRepository } from './IResumeRepository';
import { TechLayer } from '../domain/JDSpecTypes';

/**
 * Input DTO for calculating match rate for a single resume
 */
export interface CalculateResumeMatchRateInput {
  currentJDId: string;
  resumeId: string;
}

/**
 * Input DTO for calculating match rates for all resumes
 */
export interface CalculateAllResumeMatchRatesInput {
  currentJDId: string;
}

/**
 * Output DTO for a single resume match rate
 */
export interface ResumeMatchResult {
  resumeId: string;
  company: string;
  role: string;
  matchRate: number; // 0-1 correlation score
  matchRatePercentage: number; // 0-100 percentage
  originalJDId: string | null;
  layerBreakdown: Map<TechLayer, {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    layerWeight: number;
  }>;
  currentDictionaryVersion: string;
  originalDictionaryVersion: string | null;
}

/**
 * Output DTO for all resume match rates
 */
export interface CalculateAllResumeMatchRatesOutput {
  results: ResumeMatchResult[];
}

/**
 * CalculateResumeMatchRateUseCase - Calculates resume match rates based on JD correlation
 */
export class CalculateResumeMatchRateUseCase {
  private readonly calculator: JDCorrelationCalculator;

  constructor(
    private readonly jdSpecRepository: IJDSpecRepository,
    private readonly resumeRepository: IResumeRepository
  ) {
    this.calculator = new JDCorrelationCalculator();
  }

  /**
   * Calculate match rate for a single resume
   * 
   * @param input - The current JD ID and resume ID
   * @returns The resume match result with correlation breakdown
   */
  async execute(input: CalculateResumeMatchRateInput): Promise<ResumeMatchResult> {
    // Fetch current JD specification
    const currentJD = await this.jdSpecRepository.findById(input.currentJDId);
    if (!currentJD) {
      throw new Error(`Current JD specification not found: ${input.currentJDId}`);
    }

    // Fetch resume metadata
    const allResumes = await this.resumeRepository.getAllResumeMetadata();
    const resume = allResumes.find(r => r.getId() === input.resumeId);
    if (!resume) {
      throw new Error(`Resume not found: ${input.resumeId}`);
    }

    // Get original JD ID from resume (will be implemented in Task 19)
    // For now, we'll return 0 match rate if no original JD is associated
    const originalJDId = (resume as any).jdSpecId || null;

    if (!originalJDId) {
      // No original JD associated - return 0 match rate
      return {
        resumeId: resume.getId(),
        company: resume.getCompany(),
        role: resume.getRole(),
        matchRate: 0,
        matchRatePercentage: 0,
        originalJDId: null,
        layerBreakdown: new Map(),
        currentDictionaryVersion: currentJD.getDictionaryVersion(),
        originalDictionaryVersion: null
      };
    }

    // Fetch original JD specification
    const originalJD = await this.jdSpecRepository.findById(originalJDId);
    if (!originalJD) {
      // Original JD not found - return 0 match rate
      return {
        resumeId: resume.getId(),
        company: resume.getCompany(),
        role: resume.getRole(),
        matchRate: 0,
        matchRatePercentage: 0,
        originalJDId,
        layerBreakdown: new Map(),
        currentDictionaryVersion: currentJD.getDictionaryVersion(),
        originalDictionaryVersion: null
      };
    }

    // Calculate JD-to-JD correlation
    const correlation = this.calculator.calculate(currentJD, originalJD);

    // Convert correlation to match rate (they are equivalent)
    const matchRate = correlation.overallScore;
    const matchRatePercentage = matchRate * 100;

    return {
      resumeId: resume.getId(),
      company: resume.getCompany(),
      role: resume.getRole(),
      matchRate,
      matchRatePercentage,
      originalJDId,
      layerBreakdown: correlation.layerBreakdown,
      currentDictionaryVersion: correlation.currentDictionaryVersion,
      originalDictionaryVersion: correlation.pastDictionaryVersion
    };
  }

  /**
   * Calculate match rates for all resumes
   * 
   * @param input - The current JD ID
   * @returns Array of resume match results sorted by match rate (descending)
   */
  async executeForAllResumes(
    input: CalculateAllResumeMatchRatesInput
  ): Promise<CalculateAllResumeMatchRatesOutput> {
    // Fetch all resumes
    const allResumes = await this.resumeRepository.getAllResumeMetadata();

    // Calculate match rate for each resume
    const results: ResumeMatchResult[] = [];
    for (const resume of allResumes) {
      const result = await this.execute({
        currentJDId: input.currentJDId,
        resumeId: resume.getId()
      });
      results.push(result);
    }

    // Sort by match rate descending (highest match first)
    results.sort((a, b) => b.matchRate - a.matchRate);

    return {
      results
    };
  }
}
