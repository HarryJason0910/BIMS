/**
 * Property-Based Tests for Resume Checker Service
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { ResumeCheckerService } from './ResumeCheckerService';
import { Bid, ResumeCheckerType } from './Bid';

function createBidWithDate(bidData: any, submissionDate: Date): Bid {
  const bid = Bid.create(bidData);
  Object.defineProperty(bid, 'date', {
    value: submissionDate,
    writable: false,
    configurable: true
  });
  return bid;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

describe('ResumeCheckerService Property-Based Tests', () => {
  const service = new ResumeCheckerService();

  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
  const nonEmptyArrayArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 10 });
  const urlArb = fc.webUrl();

  const createBidDataArb = fc.record({
    link: urlArb,
    company: nonEmptyStringArb,
    client: nonEmptyStringArb,
    role: nonEmptyStringArb,
    mainStacks: nonEmptyArrayArb,
    jobDescription: nonEmptyStringArb,
    resume: nonEmptyStringArb
  });

  describe('Property 12: Resume Checker Timing-Based Inference', () => {
    it('should infer ATS with high confidence for rejections within 1-3 days', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 0, max: 3 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            const isATS = inference.type === ResumeCheckerType.ATS;
            const hasHighConfidence = inference.confidence >= 0.8;
            const hasReasoning = inference.reasoning.length > 0;
            
            return isATS && hasHighConfidence && hasReasoning;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should infer RECRUITER with medium to high confidence for rejections after 4+ days', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 4, max: 30 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            const isRecruiter = inference.type === ResumeCheckerType.RECRUITER;
            const hasMediumOrHighConfidence = inference.confidence >= 0.5;
            const hasReasoning = inference.reasoning.length > 0;
            
            return isRecruiter && hasMediumOrHighConfidence && hasReasoning;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return confidence between 0.0 and 1.0', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 0, max: 60 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            return inference.confidence >= 0.0 && inference.confidence <= 1.0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return either ATS or RECRUITER type', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 0, max: 60 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            return (
              inference.type === ResumeCheckerType.ATS ||
              inference.type === ResumeCheckerType.RECRUITER
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include timing information in reasoning', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 0, max: 30 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            const mentionsDays = inference.reasoning.includes(`${daysUntilRejection} day`);
            const mentionsType = 
              inference.reasoning.toLowerCase().includes('ats') ||
              inference.reasoning.toLowerCase().includes('recruiter');
            
            return mentionsDays && mentionsType;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle same-day rejection (0 days)', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          (bidData) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = new Date(submissionDate);
            
            const inference = service.inferScreeningType(bid, rejectionDate, []);
            
            return (
              inference.type === ResumeCheckerType.ATS &&
              inference.confidence >= 0.9 &&
              inference.reasoning.includes('0 day')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.integer({ min: 0, max: 30 }),
          (bidData, daysUntilRejection) => {
            const submissionDate = new Date('2024-01-01');
            submissionDate.setHours(0, 0, 0, 0);
            
            const bid = createBidWithDate(bidData, submissionDate);
            const rejectionDate = addDays(submissionDate, daysUntilRejection);
            
            const inference1 = service.inferScreeningType(bid, rejectionDate, []);
            const inference2 = service.inferScreeningType(bid, rejectionDate, []);
            
            return (
              inference1.type === inference2.type &&
              inference1.confidence === inference2.confidence &&
              inference1.reasoning === inference2.reasoning
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
