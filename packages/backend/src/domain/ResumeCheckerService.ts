/**
 * Resume Checker Service - Job Bid and Interview Management System
 * 
 * Domain service that infers whether ATS (Applicant Tracking System) or human
 * recruiters screen resumes based on rejection timing patterns.
 */

import { Bid, ResumeCheckerType, BidStatus } from './Bid';

/**
 * Result of resume checker inference with confidence and reasoning
 */
export interface ResumeCheckerInference {
  type: ResumeCheckerType;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
}

/**
 * Resume Checker Service
 * 
 * Infers screening type based on:
 * - Time from submission to rejection
 * - Patterns across multiple bids to the same company
 * 
 * Timing-based inference rules:
 * - 1-3 days: Likely ATS (high confidence)
 * - 4-7 days: Likely RECRUITER (medium confidence)
 * - 8+ days: Likely RECRUITER (high confidence)
 * 
 * Confidence scoring:
 * - High: 0.8-1.0
 * - Medium: 0.5-0.79
 * - Low: 0.0-0.49
 */
export class ResumeCheckerService {
  /**
   * Infer whether ATS or recruiter screens resumes for a rejected bid
   * 
   * @param bid - The bid that was rejected
   * @param rejectionDate - Date when the rejection occurred
   * @param companyBids - All bids to the same company (for pattern analysis)
   * @returns Inference result with type, confidence, and reasoning
   */
  inferScreeningType(
    bid: Bid,
    rejectionDate: Date,
    companyBids: Bid[]
  ): ResumeCheckerInference {
    // Calculate days from submission to rejection
    const submissionDate = bid.date;
    const daysDiff = this.calculateDaysDifference(submissionDate, rejectionDate);

    // Analyze patterns across multiple bids to same company
    const companyPattern = this.analyzeCompanyPattern(companyBids);

    // Timing-based inference
    if (daysDiff <= 3) {
      // Quick rejection suggests ATS
      const confidence = this.calculateConfidence(daysDiff, 'ATS', companyPattern);
      return {
        type: ResumeCheckerType.ATS,
        confidence,
        reasoning: this.buildReasoning(
          daysDiff,
          ResumeCheckerType.ATS,
          confidence,
          companyPattern
        )
      };
    } else if (daysDiff <= 7) {
      // Medium delay suggests recruiter review
      const confidence = this.calculateConfidence(daysDiff, 'RECRUITER', companyPattern);
      return {
        type: ResumeCheckerType.RECRUITER,
        confidence,
        reasoning: this.buildReasoning(
          daysDiff,
          ResumeCheckerType.RECRUITER,
          confidence,
          companyPattern
        )
      };
    } else {
      // Long delay strongly suggests recruiter review
      const confidence = this.calculateConfidence(daysDiff, 'RECRUITER', companyPattern);
      return {
        type: ResumeCheckerType.RECRUITER,
        confidence,
        reasoning: this.buildReasoning(
          daysDiff,
          ResumeCheckerType.RECRUITER,
          confidence,
          companyPattern
        )
      };
    }
  }

  /**
   * Calculate the number of days between two dates
   */
  private calculateDaysDifference(startDate: Date, endDate: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time to midnight for accurate day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / msPerDay);
  }

  /**
   * Analyze rejection patterns across multiple bids to the same company
   * Returns pattern information to adjust confidence
   */
  private analyzeCompanyPattern(companyBids: Bid[]): {
    hasPattern: boolean;
    consistentlyQuick: boolean;
    consistentlySlow: boolean;
    averageDays: number | null;
  } {
    // Filter for rejected bids only
    const rejectedBids = companyBids.filter(
      bid => bid.bidStatus === BidStatus.REJECTED && bid.resumeChecker !== null
    );

    if (rejectedBids.length === 0) {
      return {
        hasPattern: false,
        consistentlyQuick: false,
        consistentlySlow: false,
        averageDays: null
      };
    }

    // Count ATS vs RECRUITER inferences
    const atsCount = rejectedBids.filter(
      bid => bid.resumeChecker === ResumeCheckerType.ATS
    ).length;
    const recruiterCount = rejectedBids.filter(
      bid => bid.resumeChecker === ResumeCheckerType.RECRUITER
    ).length;

    const total = atsCount + recruiterCount;
    const atsRatio = total > 0 ? atsCount / total : 0;

    return {
      hasPattern: total >= 2,
      consistentlyQuick: atsRatio >= 0.7,
      consistentlySlow: atsRatio <= 0.3,
      averageDays: null // Could calculate if we stored rejection dates
    };
  }

  /**
   * Calculate confidence score based on timing and company patterns
   * 
   * Confidence levels:
   * - High: 0.8-1.0
   * - Medium: 0.5-0.79
   * - Low: 0.0-0.49
   */
  private calculateConfidence(
    daysDiff: number,
    inferredType: 'ATS' | 'RECRUITER',
    pattern: ReturnType<typeof this.analyzeCompanyPattern>
  ): number {
    let baseConfidence: number;

    // Base confidence from timing
    if (inferredType === 'ATS') {
      if (daysDiff === 0 || daysDiff === 1) {
        baseConfidence = 0.95; // Very quick = very confident ATS
      } else if (daysDiff === 2) {
        baseConfidence = 0.85; // Quick = confident ATS
      } else {
        baseConfidence = 0.80; // 3 days = high confidence ATS
      }
    } else {
      // RECRUITER
      if (daysDiff >= 10) {
        baseConfidence = 0.95; // Very slow = very confident RECRUITER
      } else if (daysDiff >= 8) {
        baseConfidence = 0.85; // Slow = confident RECRUITER
      } else if (daysDiff >= 4) {
        baseConfidence = 0.65; // Medium delay = medium confidence RECRUITER
      } else {
        baseConfidence = 0.55; // Just over threshold = lower medium confidence
      }
    }

    // Adjust confidence based on company pattern
    if (pattern.hasPattern) {
      if (inferredType === 'ATS' && pattern.consistentlyQuick) {
        baseConfidence = Math.min(1.0, baseConfidence + 0.05);
      } else if (inferredType === 'RECRUITER' && pattern.consistentlySlow) {
        baseConfidence = Math.min(1.0, baseConfidence + 0.05);
      } else if (inferredType === 'ATS' && pattern.consistentlySlow) {
        baseConfidence = Math.max(0.5, baseConfidence - 0.1);
      } else if (inferredType === 'RECRUITER' && pattern.consistentlyQuick) {
        baseConfidence = Math.max(0.5, baseConfidence - 0.1);
      }
    }

    return Math.round(baseConfidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Build human-readable reasoning for the inference
   */
  private buildReasoning(
    daysDiff: number,
    type: ResumeCheckerType,
    confidence: number,
    pattern: ReturnType<typeof this.analyzeCompanyPattern>
  ): string {
    const confidenceLevel = 
      confidence >= 0.8 ? 'high' : 
      confidence >= 0.5 ? 'medium' : 
      'low';

    let reasoning = `Rejection occurred ${daysDiff} day${daysDiff !== 1 ? 's' : ''} after submission. `;

    if (type === ResumeCheckerType.ATS) {
      reasoning += `Quick rejection suggests automated ATS screening (${confidenceLevel} confidence).`;
    } else {
      reasoning += `Delayed rejection suggests human recruiter review (${confidenceLevel} confidence).`;
    }

    // Add pattern information if available
    if (pattern.hasPattern) {
      if (pattern.consistentlyQuick) {
        reasoning += ' Company consistently rejects quickly, supporting ATS inference.';
      } else if (pattern.consistentlySlow) {
        reasoning += ' Company consistently takes time to reject, supporting recruiter inference.';
      }
    }

    return reasoning;
  }
}
