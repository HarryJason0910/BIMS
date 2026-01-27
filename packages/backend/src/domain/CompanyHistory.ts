/**
 * Company History - Job Bid and Interview Management System
 * 
 * Domain model that tracks interview failures per company and role.
 * Records recruiters and attendees involved in failed interviews to support
 * interview eligibility validation.
 * 
 * This is a pure domain model with no infrastructure dependencies.
 */

/**
 * Record of a single interview failure
 */
export interface FailureRecord {
  interviewId: string;
  date: Date;
  recruiter: string;
  attendees: string[];
}

/**
 * History of failures for a specific company and role combination
 */
export interface CompanyRoleHistory {
  company: string;
  role: string;
  failures: FailureRecord[];
}

/**
 * Company History
 * 
 * Tracks interview failures per company and role, maintaining lists of
 * recruiters and attendees involved in failed interviews.
 * 
 * Key features:
 * - Case-insensitive company and role matching
 * - Accumulates recruiters and attendees across multiple failures
 * - Provides query methods for eligibility checking
 * - Generates warning messages for bid creation
 */
export class CompanyHistory {
  private histories: Map<string, CompanyRoleHistory>;

  constructor() {
    this.histories = new Map();
  }

  /**
   * Generate normalized key for company and role
   * Uses lowercase for case-insensitive matching
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns Normalized key in format "company:role"
   */
  private getKey(company: string, role: string): string {
    return `${company.toLowerCase()}:${role.toLowerCase()}`;
  }

  /**
   * Record a failed interview in the history
   * 
   * @param company - Company name
   * @param role - Job role
   * @param recruiter - Recruiter name
   * @param attendees - Array of attendee names
   * @param interviewId - Interview identifier
   */
  recordFailure(
    company: string,
    role: string,
    recruiter: string,
    attendees: string[],
    interviewId: string
  ): void {
    const key = this.getKey(company, role);
    const existing = this.histories.get(key);

    const failureRecord: FailureRecord = {
      interviewId,
      date: new Date(),
      recruiter,
      attendees: [...attendees]
    };

    if (existing) {
      // Add to existing history
      existing.failures.push(failureRecord);
    } else {
      // Create new history entry
      this.histories.set(key, {
        company,
        role,
        failures: [failureRecord]
      });
    }
  }

  /**
   * Get complete history for a company and role
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns Company role history or null if no failures exist
   */
  getHistory(company: string, role: string): CompanyRoleHistory | null {
    const key = this.getKey(company, role);
    const history = this.histories.get(key);
    
    if (!history) {
      return null;
    }

    // Return a deep copy to prevent external modification
    return {
      company: history.company,
      role: history.role,
      failures: history.failures.map(f => ({
        interviewId: f.interviewId,
        date: new Date(f.date),
        recruiter: f.recruiter,
        attendees: [...f.attendees]
      }))
    };
  }

  /**
   * Get all unique recruiters involved in failures for a company and role
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns Array of unique recruiter names
   */
  getAllRecruiters(company: string, role: string): string[] {
    const key = this.getKey(company, role);
    const history = this.histories.get(key);
    
    if (!history) {
      return [];
    }

    // Collect unique recruiters
    const recruiters = new Set<string>();
    for (const failure of history.failures) {
      recruiters.add(failure.recruiter);
    }

    return Array.from(recruiters);
  }

  /**
   * Get all unique attendees involved in failures for a company and role
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns Array of unique attendee names
   */
  getAllAttendees(company: string, role: string): string[] {
    const key = this.getKey(company, role);
    const history = this.histories.get(key);
    
    if (!history) {
      return [];
    }

    // Collect unique attendees
    const attendees = new Set<string>();
    for (const failure of history.failures) {
      for (const attendee of failure.attendees) {
        attendees.add(attendee);
      }
    }

    return Array.from(attendees);
  }

  /**
   * Check if there are any failures for a company and role
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns True if failures exist, false otherwise
   */
  hasFailures(company: string, role: string): boolean {
    const key = this.getKey(company, role);
    return this.histories.has(key);
  }

  /**
   * Generate a warning message for bid creation
   * 
   * @param company - Company name
   * @param role - Job role
   * @returns Warning message describing previous failures, or empty string if no failures
   */
  getWarningMessage(company: string, role: string): string {
    const key = this.getKey(company, role);
    const history = this.histories.get(key);
    
    if (!history) {
      return '';
    }

    const failureCount = history.failures.length;
    const recruiters = this.getAllRecruiters(company, role);
    const attendees = this.getAllAttendees(company, role);

    const failureWord = failureCount === 1 ? 'failure' : 'failures';
    const recruiterList = recruiters.join(', ');
    const attendeeList = attendees.join(', ');

    return `Warning: ${failureCount} previous interview ${failureWord} at ${company} for ${role}. ` +
           `Previous recruiters: ${recruiterList}. Previous attendees: ${attendeeList}.`;
  }
}
