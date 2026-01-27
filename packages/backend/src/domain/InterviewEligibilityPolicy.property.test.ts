/**
 * Property-Based Tests for InterviewEligibilityPolicy
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { 
  InterviewEligibilityPolicy 
} from './InterviewEligibilityPolicy';
import { createMockCompanyHistory } from './__mocks__/MockCompanyHistory';

describe('InterviewEligibilityPolicy Property-Based Tests', () => {
  let policy: InterviewEligibilityPolicy;

  beforeEach(() => {
    policy = new InterviewEligibilityPolicy();
  });

  // Arbitraries (generators) for test data
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);
  const nonEmptyArrayArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 5 });

  describe('Property 17: Interview Eligibility with New Recruiter or Attendees', () => {
    // Feature: job-bid-management-system, Property 17: Interview Eligibility with New Recruiter or Attendees
    // **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

    it('should allow interview when no previous failures exist', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          (company, role, recruiter, attendees) => {
            const history = createMockCompanyHistory();
            // No failures recorded
            
            const result = policy.checkEligibility(company, role, recruiter, attendees, history);
            
            return (
              result.allowed === true &&
              result.reason === 'No previous failures at this company and role'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow interview when recruiter is new', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // previousRecruiter
          nonEmptyStringArb, // newRecruiter
          nonEmptyArrayArb,  // previousAttendees
          nonEmptyArrayArb,  // newAttendees
          (company, role, previousRecruiter, newRecruiter, previousAttendees, newAttendees) => {
            // Ensure recruiters are different
            fc.pre(previousRecruiter !== newRecruiter);
            
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, previousRecruiter, previousAttendees, 'interview-1');
            
            const result = policy.checkEligibility(company, role, newRecruiter, newAttendees, history);
            
            return (
              result.allowed === true &&
              result.reason.includes('New recruiter') &&
              result.reason.includes(previousRecruiter)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow interview when all attendees are new', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter (same)
          nonEmptyArrayArb,  // previousAttendees
          nonEmptyArrayArb,  // newAttendees
          (company, role, recruiter, previousAttendees, newAttendees) => {
            // Ensure no overlap in attendees
            const hasOverlap = newAttendees.some(a => previousAttendees.includes(a));
            fc.pre(!hasOverlap);
            
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, recruiter, previousAttendees, 'interview-1');
            
            const result = policy.checkEligibility(company, role, recruiter, newAttendees, history);
            
            return (
              result.allowed === true &&
              result.reason.includes('All new attendees')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should forbid interview when same recruiter and overlapping attendees', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter (same)
          nonEmptyArrayArb,  // previousAttendees
          fc.integer({ min: 0, max: 4 }), // index to pick overlapping attendee
          (company, role, recruiter, previousAttendees, overlapIndex) => {
            // Create new attendees that include at least one from previous
            const overlappingAttendee = previousAttendees[overlapIndex % previousAttendees.length];
            const newAttendees = [overlappingAttendee];
            
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, recruiter, previousAttendees, 'interview-1');
            
            const result = policy.checkEligibility(company, role, recruiter, newAttendees, history);
            
            return (
              result.allowed === false &&
              result.reason.includes('Same recruiter') &&
              result.reason.includes(recruiter) &&
              result.reason.includes('overlapping attendee') &&
              result.reason.includes(overlappingAttendee)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine eligibility based on recruiter and attendee overlap', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // previousRecruiter
          nonEmptyArrayArb,  // previousAttendees
          nonEmptyStringArb, // newRecruiter
          nonEmptyArrayArb,  // newAttendees
          (company, role, previousRecruiter, previousAttendees, newRecruiter, newAttendees) => {
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, previousRecruiter, previousAttendees, 'interview-1');
            
            const result = policy.checkEligibility(company, role, newRecruiter, newAttendees, history);
            
            // Determine expected result
            const recruiterIsNew = newRecruiter !== previousRecruiter;
            const allAttendeesAreNew = newAttendees.every(
              attendee => !previousAttendees.includes(attendee)
            );
            
            const expectedAllowed = recruiterIsNew || allAttendeesAreNew;
            
            return result.allowed === expectedAllowed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple previous failures with accumulated recruiters and attendees', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          fc.array(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple previous failures
          nonEmptyStringArb, // newRecruiter
          nonEmptyArrayArb,  // newAttendees
          (company, role, previousFailures, newRecruiter, newAttendees) => {
            const history = createMockCompanyHistory();
            
            // Record multiple failures
            for (const failure of previousFailures) {
              history.recordFailure(company, role, failure.recruiter, failure.attendees, `interview-${previousFailures.indexOf(failure)}`);
            }
            
            const result = policy.checkEligibility(company, role, newRecruiter, newAttendees, history);
            
            // Determine expected result
            const allPreviousRecruiters = history.getAllRecruiters(company, role);
            const allPreviousAttendees = history.getAllAttendees(company, role);
            
            const recruiterIsNew = !allPreviousRecruiters.includes(newRecruiter);
            const allAttendeesAreNew = newAttendees.every(
              attendee => !allPreviousAttendees.includes(attendee)
            );
            
            const expectedAllowed = recruiterIsNew || allAttendeesAreNew;
            
            return result.allowed === expectedAllowed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a result with allowed boolean and reason string', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          fc.option(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb
            }),
            { nil: undefined }
          ), // optional previous failure
          (company, role, recruiter, attendees, previousFailure) => {
            const history = createMockCompanyHistory();
            
            if (previousFailure) {
              history.recordFailure(company, role, previousFailure.recruiter, previousFailure.attendees, 'interview-1');
            }
            
            const result = policy.checkEligibility(company, role, recruiter, attendees, history);
            
            return (
              typeof result.allowed === 'boolean' &&
              typeof result.reason === 'string' &&
              result.reason.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should forbid when same recruiter and at least one overlapping attendee', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter (same)
          nonEmptyArrayArb,  // previousAttendees
          nonEmptyStringArb, // additionalNewAttendee
          fc.integer({ min: 0, max: 4 }), // index to pick overlapping attendee
          (company, role, recruiter, previousAttendees, additionalNewAttendee, overlapIndex) => {
            // Ensure additional attendee is not in previous
            fc.pre(!previousAttendees.includes(additionalNewAttendee));
            
            // Create new attendees with mix of old and new
            const overlappingAttendee = previousAttendees[overlapIndex % previousAttendees.length];
            const newAttendees = [overlappingAttendee, additionalNewAttendee];
            
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, recruiter, previousAttendees, 'interview-1');
            
            const result = policy.checkEligibility(company, role, recruiter, newAttendees, history);
            
            // Should be forbidden because same recruiter and at least one overlapping attendee
            return result.allowed === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow when new recruiter even with overlapping attendees', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // previousRecruiter
          nonEmptyStringArb, // newRecruiter
          nonEmptyArrayArb,  // attendees (same for both)
          (company, role, previousRecruiter, newRecruiter, attendees) => {
            // Ensure recruiters are different
            fc.pre(previousRecruiter !== newRecruiter);
            
            const history = createMockCompanyHistory();
            history.recordFailure(company, role, previousRecruiter, attendees, 'interview-1');
            
            // Use same attendees but different recruiter
            const result = policy.checkEligibility(company, role, newRecruiter, attendees, history);
            
            // Should be allowed because recruiter is new
            return result.allowed === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
