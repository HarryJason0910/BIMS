/**
 * Mock implementation of CompanyHistory for testing
 * (Full implementation will be in Task 6)
 */

import { CompanyHistoryLike } from '../InterviewEligibilityPolicy';

export function createMockCompanyHistory(): CompanyHistoryLike {
  const failures = new Map<string, { recruiters: string[]; attendees: string[] }>();

  const getKey = (company: string, role: string): string => {
    return `${company.toLowerCase()}:${role.toLowerCase()}`;
  };

  return {
    recordFailure(company: string, role: string, recruiter: string, attendees: string[], _interviewId: string): void {
      const key = getKey(company, role);
      const existing = failures.get(key);
      
      if (existing) {
        // Add recruiter if not already present
        if (!existing.recruiters.includes(recruiter)) {
          existing.recruiters.push(recruiter);
        }
        // Add attendees if not already present
        for (const attendee of attendees) {
          if (!existing.attendees.includes(attendee)) {
            existing.attendees.push(attendee);
          }
        }
      } else {
        failures.set(key, {
          recruiters: [recruiter],
          attendees: [...attendees]
        });
      }
    },

    hasFailures(company: string, role: string): boolean {
      const key = getKey(company, role);
      return failures.has(key);
    },

    getAllRecruiters(company: string, role: string): string[] {
      const key = getKey(company, role);
      const failure = failures.get(key);
      return failure ? [...failure.recruiters] : [];
    },

    getAllAttendees(company: string, role: string): string[] {
      const key = getKey(company, role);
      const failure = failures.get(key);
      return failure ? [...failure.attendees] : [];
    }
  };
}
