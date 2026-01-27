/**
 * Interview Eligibility Policy - Job Bid and Interview Management System
 * 
 * Domain policy that validates if a candidate can interview at a company based on:
 * 1. Previous interview failures at the company and role
 * 2. Whether the recruiter is new (not in previous recruiters list)
 * 3. Whether all attendees are new (none in previous attendees list)
 * 
 * This is a pure domain policy with no infrastructure dependencies.
 */

/**
 * Minimal interface for CompanyHistory needed by the eligibility policy
 * The full CompanyHistory implementation will be in Task 6
 */
export interface CompanyHistoryLike {
  recordFailure(company: string, role: string, recruiter: string, attendees: string[], interviewId: string): void;
  hasFailures(company: string, role: string): boolean;
  getAllRecruiters(company: string, role: string): string[];
  getAllAttendees(company: string, role: string): string[];
}

/**
 * Result of eligibility check
 */
export interface EligibilityResult {
  allowed: boolean;
  reason: string;
}

/**
 * Interview Eligibility Policy
 * 
 * Validates if a candidate can interview at a company based on previous failures.
 * 
 * Rules:
 * 1. If no previous failures at company+role → allowed
 * 2. If previous failures exist:
 *    - If recruiter is new (not in previous recruiters) → allowed
 *    - If ALL attendees are new (none in previous attendees) → allowed
 *    - Otherwise (same recruiter AND overlapping attendees) → forbidden
 */
export class InterviewEligibilityPolicy {
  /**
   * Check if a candidate is eligible to interview at a company
   * 
   * @param company - Company name
   * @param role - Job role
   * @param recruiter - Recruiter name for this interview
   * @param attendees - Array of attendee names for this interview
   * @param history - Company history object
   * @returns Eligibility result with allowed flag and explanation
   */
  checkEligibility(
    company: string,
    role: string,
    recruiter: string,
    attendees: string[],
    history: CompanyHistoryLike
  ): EligibilityResult {
    // Check if there are any previous failures at this company and role
    if (!history.hasFailures(company, role)) {
      return {
        allowed: true,
        reason: 'No previous failures at this company and role'
      };
    }

    // Get previous recruiters and attendees from history
    const previousRecruiters = history.getAllRecruiters(company, role);
    const previousAttendees = history.getAllAttendees(company, role);

    // Check if recruiter is new (not in previous recruiters list)
    const recruiterIsNew = !previousRecruiters.includes(recruiter);
    
    if (recruiterIsNew) {
      const previousRecruitersStr = previousRecruiters.join(', ');
      return {
        allowed: true,
        reason: `New recruiter (previous: ${previousRecruitersStr})`
      };
    }

    // Check if ALL attendees are new (none in previous attendees list)
    const allAttendeesAreNew = attendees.every(
      attendee => !previousAttendees.includes(attendee)
    );

    if (allAttendeesAreNew) {
      const previousAttendeesStr = previousAttendees.join(', ');
      return {
        allowed: true,
        reason: `All new attendees (previous: ${previousAttendeesStr})`
      };
    }

    // Same recruiter AND overlapping attendees → forbidden
    const overlappingAttendees = attendees.filter(
      attendee => previousAttendees.includes(attendee)
    );
    const overlappingAttendeesStr = overlappingAttendees.join(', ');

    return {
      allowed: false,
      reason: `Same recruiter (${recruiter}) and overlapping attendee${overlappingAttendees.length > 1 ? 's' : ''} (${overlappingAttendeesStr})`
    };
  }
}
