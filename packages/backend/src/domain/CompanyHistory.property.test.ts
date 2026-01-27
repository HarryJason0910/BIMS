/**
 * Property-Based Tests for CompanyHistory
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { CompanyHistory } from './CompanyHistory';

describe('CompanyHistory Property-Based Tests', () => {
  // Arbitraries (generators) for test data
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);
  const nonEmptyArrayArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 5 });
  const interviewIdArb = fc.uuid();

  describe('Property 18: Complete Failure Recording in Company History', () => {
    // Feature: job-bid-management-system, Property 18: Complete Failure Recording in Company History
    // **Validates: Requirements 9.1, 9.2, 9.3**

    it('should record all failure information (company, role, recruiter, attendees, interviewId)', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          interviewIdArb,    // interviewId
          (company, role, recruiter, attendees, interviewId) => {
            const history = new CompanyHistory();
            
            history.recordFailure(company, role, recruiter, attendees, interviewId);
            
            // Verify failure was recorded
            const recorded = history.hasFailures(company, role);
            
            // Verify recruiter was recorded
            const recordedRecruiters = history.getAllRecruiters(company, role);
            const hasRecruiter = recordedRecruiters.includes(recruiter);
            
            // Verify all attendees were recorded
            const recordedAttendees = history.getAllAttendees(company, role);
            const allAttendeesRecorded = attendees.every(a => recordedAttendees.includes(a));
            
            // Verify history entry exists
            const historyEntry = history.getHistory(company, role);
            const hasHistoryEntry = historyEntry !== null;
            
            // Verify interview ID is in the history
            const hasInterviewId = historyEntry?.failures.some(f => f.interviewId === interviewId) ?? false;
            
            return (
              recorded &&
              hasRecruiter &&
              allAttendeesRecorded &&
              hasHistoryEntry &&
              hasInterviewId
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all attendees in the failure record', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          interviewIdArb,    // interviewId
          (company, role, recruiter, attendees, interviewId) => {
            const history = new CompanyHistory();
            
            history.recordFailure(company, role, recruiter, attendees, interviewId);
            
            const historyEntry = history.getHistory(company, role);
            const failureRecord = historyEntry?.failures[0];
            
            // Check that all attendees are present in the failure record
            const allAttendeesPresent = attendees.every(
              a => failureRecord?.attendees.includes(a) ?? false
            );
            
            // Check that no extra attendees were added
            const noExtraAttendees = failureRecord?.attendees.every(
              a => attendees.includes(a)
            ) ?? false;
            
            return allAttendeesPresent && noExtraAttendees;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record multiple failures for the same company and role', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          fc.array(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple failures
          (company, role, failures) => {
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                company,
                role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            const historyEntry = history.getHistory(company, role);
            
            // Should have recorded all failures
            const hasCorrectCount = historyEntry?.failures.length === failures.length;
            
            // All interview IDs should be present
            const allIdsPresent = failures.every(f =>
              historyEntry?.failures.some(recorded => recorded.interviewId === f.interviewId) ?? false
            );
            
            return hasCorrectCount && allIdsPresent;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accumulate unique recruiters across multiple failures', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          fc.array(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple failures
          (company, role, failures) => {
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                company,
                role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            const recordedRecruiters = history.getAllRecruiters(company, role);
            
            // Get unique recruiters from input
            const uniqueRecruiters = new Set(failures.map(f => f.recruiter));
            
            // All unique recruiters should be present
            const allRecruitersPresent = Array.from(uniqueRecruiters).every(
              r => recordedRecruiters.includes(r)
            );
            
            // No extra recruiters should be present
            const noExtraRecruiters = recordedRecruiters.every(
              r => uniqueRecruiters.has(r)
            );
            
            return allRecruitersPresent && noExtraRecruiters;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accumulate unique attendees across multiple failures', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          fc.array(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple failures
          (company, role, failures) => {
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                company,
                role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            const recordedAttendees = history.getAllAttendees(company, role);
            
            // Get unique attendees from input
            const allAttendees = [];
            for (const failure of failures) {
              allAttendees.push(...failure.attendees);
            }
            const uniqueAttendees = new Set(allAttendees);
            
            // All unique attendees should be present
            const allAttendeesPresent = Array.from(uniqueAttendees).every(
              a => recordedAttendees.includes(a)
            );
            
            // No extra attendees should be present
            const noExtraAttendees = recordedAttendees.every(
              a => uniqueAttendees.has(a)
            );
            
            return allAttendeesPresent && noExtraAttendees;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record failure date for each failure', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          interviewIdArb,    // interviewId
          (company, role, recruiter, attendees, interviewId) => {
            const beforeRecording = new Date();
            
            const history = new CompanyHistory();
            history.recordFailure(company, role, recruiter, attendees, interviewId);
            
            const afterRecording = new Date();
            
            const historyEntry = history.getHistory(company, role);
            const failureRecord = historyEntry?.failures[0];
            
            // Date should be set and within reasonable bounds
            const hasDate = failureRecord?.date instanceof Date;
            const dateInRange = failureRecord?.date &&
              failureRecord.date >= beforeRecording &&
              failureRecord.date <= afterRecording;
            
            return hasDate && dateInRange;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain separate histories for different company-role combinations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              company: nonEmptyStringArb,
              role: nonEmptyStringArb,
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple different company-role combinations
          (failures) => {
            // Ensure we have at least 2 different company-role combinations
            const uniqueCombos = new Set(failures.map(f => `${f.company}:${f.role}`));
            fc.pre(uniqueCombos.size >= 2);
            
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                failure.company,
                failure.role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            // Check that each company-role combination has its own history
            const allCorrect = failures.every(failure => {
              const historyEntry = history.getHistory(failure.company, failure.role);
              return historyEntry !== null &&
                historyEntry.company === failure.company &&
                historyEntry.role === failure.role;
            });
            
            return allCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Company History Query by Company and Role', () => {
    // Feature: job-bid-management-system, Property 19: Company History Query by Company and Role
    // **Validates: Requirements 9.4**

    it('should return all failure records for exact company and role match', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          fc.array(
            fc.record({
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 1, maxLength: 5 }
          ), // failures for this company-role
          (company, role, failures) => {
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                company,
                role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            const historyEntry = history.getHistory(company, role);
            
            // Should return all failures
            const hasCorrectCount = historyEntry?.failures.length === failures.length;
            
            // All interview IDs should match
            const allIdsMatch = failures.every(f =>
              historyEntry?.failures.some(recorded => recorded.interviewId === f.interviewId) ?? false
            );
            
            return hasCorrectCount && allIdsMatch;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should perform case-insensitive matching for company and role', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          interviewIdArb,    // interviewId
          fc.constantFrom('lower', 'upper', 'mixed'), // case variation
          (company, role, recruiter, attendees, interviewId, caseVariation) => {
            const history = new CompanyHistory();
            
            // Record with original case
            history.recordFailure(company, role, recruiter, attendees, interviewId);
            
            // Query with different case
            let queryCompany = company;
            let queryRole = role;
            
            if (caseVariation === 'lower') {
              queryCompany = company.toLowerCase();
              queryRole = role.toLowerCase();
            } else if (caseVariation === 'upper') {
              queryCompany = company.toUpperCase();
              queryRole = role.toUpperCase();
            } else {
              // Mixed case - alternate upper/lower for each character
              queryCompany = company.split('').map((c, i) => 
                i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
              ).join('');
              queryRole = role.split('').map((c, i) => 
                i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
              ).join('');
            }
            
            // Should find the history regardless of case
            const historyEntry = history.getHistory(queryCompany, queryRole);
            const found = historyEntry !== null;
            
            // Should also work with hasFailures
            const hasFailures = history.hasFailures(queryCompany, queryRole);
            
            // Should also work with getAllRecruiters
            const recruiters = history.getAllRecruiters(queryCompany, queryRole);
            const hasRecruiter = recruiters.includes(recruiter);
            
            // Should also work with getAllAttendees
            const recordedAttendees = history.getAllAttendees(queryCompany, queryRole);
            const allAttendeesFound = attendees.every(a => recordedAttendees.includes(a));
            
            return found && hasFailures && hasRecruiter && allAttendeesFound;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for company-role combinations with no failures', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company with failures
          nonEmptyStringArb, // role with failures
          nonEmptyStringArb, // company without failures
          nonEmptyStringArb, // role without failures
          nonEmptyStringArb, // recruiter
          nonEmptyArrayArb,  // attendees
          interviewIdArb,    // interviewId
          (companyWithFailures, roleWithFailures, companyWithoutFailures, roleWithoutFailures, recruiter, attendees, interviewId) => {
            // Ensure the two company-role combinations are different
            const key1 = `${companyWithFailures.toLowerCase()}:${roleWithFailures.toLowerCase()}`;
            const key2 = `${companyWithoutFailures.toLowerCase()}:${roleWithoutFailures.toLowerCase()}`;
            fc.pre(key1 !== key2);
            
            const history = new CompanyHistory();
            
            // Record failure for first company-role
            history.recordFailure(companyWithFailures, roleWithFailures, recruiter, attendees, interviewId);
            
            // Query for second company-role (no failures)
            const historyEntry = history.getHistory(companyWithoutFailures, roleWithoutFailures);
            
            return historyEntry === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty arrays for getAllRecruiters and getAllAttendees when no failures exist', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          (company, role) => {
            const history = new CompanyHistory();
            
            // No failures recorded
            const recruiters = history.getAllRecruiters(company, role);
            const attendees = history.getAllAttendees(company, role);
            
            return (
              Array.isArray(recruiters) &&
              recruiters.length === 0 &&
              Array.isArray(attendees) &&
              attendees.length === 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for hasFailures when no failures exist', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb, // company
          nonEmptyStringArb, // role
          (company, role) => {
            const history = new CompanyHistory();
            
            // No failures recorded
            const hasFailures = history.hasFailures(company, role);
            
            return hasFailures === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should isolate failures by company-role combination', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              company: nonEmptyStringArb,
              role: nonEmptyStringArb,
              recruiter: nonEmptyStringArb,
              attendees: nonEmptyArrayArb,
              interviewId: interviewIdArb
            }),
            { minLength: 2, maxLength: 5 }
          ), // multiple failures
          (failures) => {
            // Ensure we have at least 2 different company-role combinations
            const uniqueCombos = new Set(
              failures.map(f => `${f.company.toLowerCase()}:${f.role.toLowerCase()}`)
            );
            fc.pre(uniqueCombos.size >= 2);
            
            const history = new CompanyHistory();
            
            // Record all failures
            for (const failure of failures) {
              history.recordFailure(
                failure.company,
                failure.role,
                failure.recruiter,
                failure.attendees,
                failure.interviewId
              );
            }
            
            // For each unique company-role combination, verify isolation
            // Group failures by their normalized company-role key
            const failuresByCombo = new Map();
            for (const failure of failures) {
              const key = `${failure.company.toLowerCase()}:${failure.role.toLowerCase()}`;
              if (!failuresByCombo.has(key)) {
                failuresByCombo.set(key, []);
              }
              failuresByCombo.get(key).push(failure);
            }
            
            // Verify each group is isolated
            const allIsolated = Array.from(failuresByCombo.entries()).every(([_key, expectedFailures]) => {
              // Use the first failure's company and role to query (case doesn't matter due to normalization)
              const firstFailure = expectedFailures[0];
              const historyEntry = history.getHistory(firstFailure.company, firstFailure.role);
              
              // Check that only expected failures are present
              const hasCorrectCount = historyEntry?.failures.length === expectedFailures.length;
              
              const allIdsMatch = expectedFailures.every((f: { interviewId: string }) =>
                historyEntry?.failures.some(recorded => recorded.interviewId === f.interviewId) ?? false
              );
              
              return hasCorrectCount && allIdsMatch;
            });
            
            return allIsolated;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
