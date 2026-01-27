/**
 * Property-Based Tests for Interview Aggregate
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { Interview, InterviewBase } from './Interview';
import { Bid } from './Bid';

describe('Interview Property-Based Tests', () => {
  // Arbitraries (generators) for test data
  // Generate non-empty strings that are not just whitespace
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
  const nonEmptyArrayArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 10 });
  const urlArb = fc.webUrl();

  const createInterviewDataArb = fc.record({
    base: fc.constantFrom(InterviewBase.BID, InterviewBase.LINKEDIN_CHAT),
    company: nonEmptyStringArb,
    client: nonEmptyStringArb,
    role: nonEmptyStringArb,
    jobDescription: nonEmptyStringArb,
    resume: nonEmptyStringArb,
    interviewType: nonEmptyStringArb,
    recruiter: nonEmptyStringArb,
    attendees: nonEmptyArrayArb,
    detail: nonEmptyStringArb,
    bidId: fc.option(nonEmptyStringArb, { nil: undefined })
  }).chain(data => {
    // Ensure bidId is present when base is BID
    if (data.base === InterviewBase.BID && !data.bidId) {
      return fc.constant({ ...data, bidId: `bid-${Date.now()}` });
    }
    return fc.constant(data);
  });

  const createBidDataArb = fc.record({
    link: urlArb,
    company: nonEmptyStringArb,
    client: nonEmptyStringArb,
    role: nonEmptyStringArb,
    mainStacks: nonEmptyArrayArb,
    jobDescription: nonEmptyStringArb,
    resume: nonEmptyStringArb
  });

  describe('Property 13: Interview Creation Date Initialization', () => {
    // Feature: job-bid-management-system, Property 13: Interview Creation Date Initialization
    // **Validates: Requirements 7.1**
    
    it('should set date to today for any valid interview creation request', () => {
      fc.assert(
        fc.property(createInterviewDataArb, (interviewData) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const interview = Interview.create(interviewData);
          const interviewDate = new Date(interview.date);
          interviewDate.setHours(0, 0, 0, 0);
          
          return interviewDate.getTime() === today.getTime();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Interview Base Validation', () => {
    // Feature: job-bid-management-system, Property 14: Interview Base Validation
    // **Validates: Requirements 7.2**
    
    it('should accept only BID or LINKEDIN_CHAT as valid base values', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constantFrom(InterviewBase.BID, InterviewBase.LINKEDIN_CHAT),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb,
            interviewType: nonEmptyStringArb,
            recruiter: nonEmptyStringArb,
            attendees: nonEmptyArrayArb,
            detail: nonEmptyStringArb,
            bidId: nonEmptyStringArb
          }),
          (interviewData) => {
            try {
              const interview = Interview.create(interviewData);
              return interview.base === InterviewBase.BID || 
                     interview.base === InterviewBase.LINKEDIN_CHAT;
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject interview creation with invalid base value', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.string().filter(s => s !== 'BID' && s !== 'LINKEDIN_CHAT'),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb,
            interviewType: nonEmptyStringArb,
            recruiter: nonEmptyStringArb,
            attendees: nonEmptyArrayArb,
            detail: nonEmptyStringArb,
            bidId: nonEmptyStringArb
          }),
          (interviewData) => {
            try {
              // Cast to any to bypass TypeScript type checking for this test
              Interview.create(interviewData as any);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && 
                     (error.message.includes('base') || error.message.includes('BID') || error.message.includes('LINKEDIN_CHAT'));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Interview Field Population from Bid', () => {
    // Feature: job-bid-management-system, Property 15: Interview Field Population from Bid
    // **Validates: Requirements 7.3**
    
    it('should populate interview fields from bid when base is BID', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.record({
            interviewType: nonEmptyStringArb,
            recruiter: nonEmptyStringArb,
            attendees: nonEmptyArrayArb,
            detail: nonEmptyStringArb
          }),
          (bidData, interviewSpecificData) => {
            // Create a bid first
            const bid = Bid.create(bidData);
            
            // Create interview from bid
            const interview = Interview.create({
              base: InterviewBase.BID,
              company: bid.company,
              client: bid.client,
              role: bid.role,
              jobDescription: bid.jobDescription,
              resume: bid.resume,
              interviewType: interviewSpecificData.interviewType,
              recruiter: interviewSpecificData.recruiter,
              attendees: interviewSpecificData.attendees,
              detail: interviewSpecificData.detail,
              bidId: bid.id
            });
            
            // Verify fields are populated from bid
            return (
              interview.company === bid.company &&
              interview.client === bid.client &&
              interview.role === bid.role &&
              interview.jobDescription === bid.jobDescription &&
              interview.resume === bid.resume &&
              interview.bidId === bid.id
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should require bidId when base is BID', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constant(InterviewBase.BID),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb,
            interviewType: nonEmptyStringArb,
            recruiter: nonEmptyStringArb,
            attendees: nonEmptyArrayArb,
            detail: nonEmptyStringArb
            // Note: bidId is intentionally omitted
          }),
          (interviewData) => {
            try {
              Interview.create(interviewData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('bidId');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Interview LinkedIn Base Required Fields', () => {
    // Feature: job-bid-management-system, Property 16: Interview LinkedIn Base Required Fields
    // **Validates: Requirements 7.4**
    
    it('should require manual input for all fields when base is LINKEDIN_CHAT', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constant(InterviewBase.LINKEDIN_CHAT),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            jobDescription: nonEmptyStringArb,
            resume: nonEmptyStringArb,
            interviewType: nonEmptyStringArb,
            recruiter: nonEmptyStringArb,
            attendees: nonEmptyArrayArb,
            detail: nonEmptyStringArb
          }),
          (interviewData) => {
            try {
              const interview = Interview.create(interviewData);
              // All fields should be populated
              return (
                interview.company.trim().length > 0 &&
                interview.client.trim().length > 0 &&
                interview.role.trim().length > 0 &&
                interview.jobDescription.trim().length > 0 &&
                interview.resume.trim().length > 0 &&
                interview.bidId === null // bidId should be null for LinkedIn chat
              );
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject interview creation when required fields are missing for LINKEDIN_CHAT', () => {
      const testMissingField = (fieldName: string) => {
        fc.assert(
          fc.property(
            fc.record({
              base: fc.constant(InterviewBase.LINKEDIN_CHAT),
              company: fieldName === 'company' ? fc.constant('') : nonEmptyStringArb,
              client: fieldName === 'client' ? fc.constant('') : nonEmptyStringArb,
              role: fieldName === 'role' ? fc.constant('') : nonEmptyStringArb,
              jobDescription: fieldName === 'jobDescription' ? fc.constant('') : nonEmptyStringArb,
              resume: fieldName === 'resume' ? fc.constant('') : nonEmptyStringArb,
              interviewType: fieldName === 'interviewType' ? fc.constant('') : nonEmptyStringArb,
              recruiter: fieldName === 'recruiter' ? fc.constant('') : nonEmptyStringArb,
              attendees: fieldName === 'attendees' ? fc.constant([]) : nonEmptyArrayArb,
              detail: fieldName === 'detail' ? fc.constant('') : nonEmptyStringArb
            }),
            (interviewData) => {
              try {
                Interview.create(interviewData);
                return false; // Should have thrown
              } catch (error) {
                return error instanceof Error && error.message.toLowerCase().includes(fieldName.toLowerCase());
              }
            }
          ),
          { numRuns: 100 }
        );
      };

      // Test each required field
      ['company', 'client', 'role', 'jobDescription', 'resume', 'interviewType', 'recruiter', 'attendees', 'detail'].forEach(field => {
        testMissingField(field);
      });
    });
  });
});
