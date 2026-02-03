/**
 * CalculateCorrelationUseCase - Application use case for calculating JD-to-JD correlation
 * 
 * Handles the calculation of correlation scores between two JD specifications by:
 * - Fetching JD specifications from repository
 * - Calling JDCorrelationCalculator domain service
 * - Returning correlation result with breakdown
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 6.1-6.8, 7.6, 7.7
 */

import { JDCorrelationCalculator } from '../domain/JDCorrelationCalculator';
import { IJDSpecRepository } from './IJDSpecRepository';
import { CorrelationResult } from '../domain/JDSpecTypes';

/**
 * Input DTO for CalculateCorrelationUseCase
 */
export interface CalculateCorrelationInput {
  currentJDId: string;
  pastJDId: string;
}

/**
 * Output DTO for CalculateCorrelationUseCase
 */
export interface CalculateCorrelationOutput {
  correlation: CorrelationResult;
}

/**
 * CalculateCorrelationUseCase - Calculates correlation between two JD specifications
 */
export class CalculateCorrelationUseCase {
  private readonly calculator: JDCorrelationCalculator;

  constructor(
    private readonly jdSpecRepository: IJDSpecRepository
  ) {
    this.calculator = new JDCorrelationCalculator();
  }

  /**
   * Execute the use case
   * @param input - The current and past JD IDs
   * @returns The correlation result with breakdown
   */
  async execute(input: CalculateCorrelationInput): Promise<CalculateCorrelationOutput> {
    // Fetch current JD specification
    const currentJD = await this.jdSpecRepository.findById(input.currentJDId);
    if (!currentJD) {
      throw new Error(`Current JD specification not found: ${input.currentJDId}`);
    }

    // Fetch past JD specification
    const pastJD = await this.jdSpecRepository.findById(input.pastJDId);
    if (!pastJD) {
      throw new Error(`Past JD specification not found: ${input.pastJDId}`);
    }

    // Calculate correlation using domain service
    const correlation = this.calculator.calculate(currentJD, pastJD);

    return {
      correlation
    };
  }
}
