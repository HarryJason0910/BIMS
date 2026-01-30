/**
 * Property-Based Tests for Bid Aggregate
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { Bid, BidStatus, BidOrigin, RejectionReason } from './Bid';

describe('Bid Property-Based Tests', () => {
  // Arbitraries (generators) for test data
  // Generate non-empty strings that are not just whitespace
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
    jobDescriptionPath: nonEmptyStringArb,
    resumePath: nonEmptyStringArb,
    origin: fc.constant(BidOrigin.BID)
  });

  describe('Property 1: Bid Creation Date Initialization', () => {
    // Feature: job-bid-management-system, Property 1: Bid Creation Date Initialization
    // **Validates: Requirements 1.1**
    
    it('should set date to today for any valid bid creation request', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const bid = Bid.create(bidData);
          const bidDate = new Date(bid.date);
          bidDate.setHours(0, 0, 0, 0);
          
          return bidDate.getTime() === today.getTime();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Bid Required Fields Validation', () => {
    // Feature: job-bid-management-system, Property 2: Bid Required Fields Validation
    // **Validates: Requirements 1.2**
    
    it('should reject bid creation when link is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: fc.constant(''),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('link');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when company is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: fc.constant(''),
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('company');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when client is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: fc.constant(''),
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('client');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when role is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: fc.constant(''),
            mainStacks: nonEmptyArrayArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('role');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when mainStacks is empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: fc.constant([]),
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('mainStacks');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when jobDescriptionPath is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: fc.constant(''),
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('jobDescriptionPath');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when resumePath is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: fc.constant(''),
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('resumePath');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Bid Default Field Initialization', () => {
    // Feature: job-bid-management-system, Property 3: Bid Default Field Initialization
    // **Validates: Requirements 1.4**
    
    it('should initialize bidStatus to NEW, interviewWinning to false, bidDetail to empty, and resumeChecker to null', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          return (
            bid.bidStatus === BidStatus.NEW &&
            bid.interviewWinning === false &&
            bid.bidDetail === '' &&
            bid.resumeChecker === null
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Rebidding Eligibility', () => {
    // Feature: job-bid-management-system, Property 11: Rebidding Eligibility
    // **Validates: Requirements 5.1, 5.2, 5.3**
    
    it('should allow rebidding if and only if status is REJECTED and interviewWinning is false', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.constantFrom(...Object.values(BidStatus)),
          fc.boolean(),
          (bidData, targetStatus, shouldStartInterview) => {
            const bid = Bid.create(bidData);
            
            // Transition to target status
            try {
              if (targetStatus === BidStatus.SUBMITTED) {
                bid.markAsSubmitted();
              } else if (targetStatus === BidStatus.REJECTED) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                bid.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
              } else if (targetStatus === BidStatus.INTERVIEW_STAGE) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                bid.markInterviewStarted();
              } else if (targetStatus === BidStatus.CLOSED) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                if (shouldStartInterview) {
                  bid.markInterviewStarted();
                }
                bid.markAsClosed();
              }
            } catch (error) {
              // Some transitions are invalid, skip this test case
              return true;
            }
            
            const canRebid = bid.canRebid();
            const expectedCanRebid = 
              bid.bidStatus === BidStatus.REJECTED && 
              bid.interviewWinning === false;
            
            return canRebid === expectedCanRebid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should forbid rebidding when interviewWinning is true', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // Start interview (sets interviewWinning to true)
          bid.markAsSubmitted();
          bid.markInterviewStarted();
          
          // Even if we could reject (which we can't), rebidding should be forbidden
          return !bid.canRebid() && bid.interviewWinning === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow rebidding only after rejection without interview', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // Reject without starting interview
          bid.markAsSubmitted();
          bid.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
          
          return bid.canRebid() && 
                 bid.bidStatus === BidStatus.REJECTED && 
                 !bid.interviewWinning;
        }),
        { numRuns: 100 }
      );
    });
  });
});
