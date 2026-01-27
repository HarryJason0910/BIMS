/**
 * Unit tests for InterviewEligibilityPolicy
 */

import { InterviewEligibilityPolicy, CompanyHistoryLike } from './InterviewEligibilityPolicy';

/**
 * Simple mock implementation of CompanyHistory for unit testing
 */
function createMockHistory(
  hasFailuresResult: boolean = false,
  recruiters: string[] = [],
  attendees: string[] = []
): CompanyHistoryLike {
  return {
    recordFailure: () => {}, // No-op for unit tests
    hasFailures: () => hasFailuresResult,
    getAllRecruiters: () => recruiters,
    getAllAttendees: () => attendees,
  };
}

describe('InterviewEligibilityPolicy', () => {
  let policy: InterviewEligibilityPolicy;

  beforeEach(() => {
    policy = new InterviewEligibilityPolicy();
  });

  describe('checkEligibility', () => {
    it('should allow interview when no previous failures exist', () => {
      const history = createMockHistory(false);
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter',
        ['Jane Interviewer', 'Bob Manager'],
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('No previous failures at this company and role');
    });

    it('should allow interview when recruiter is new', () => {
      const history = createMockHistory(
        true,
        ['Alice Recruiter'], // Previous recruiters
        ['Jane Interviewer', 'Bob Manager'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // New recruiter
        ['Jane Interviewer'], // Same attendee
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('New recruiter');
      expect(result.reason).toContain('Alice Recruiter');
    });

    it('should allow interview when all attendees are new', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Jane Interviewer', 'Bob Manager'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Alice Engineer', 'Charlie Director'], // All new attendees
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('All new attendees');
      expect(result.reason).toContain('Jane Interviewer');
      expect(result.reason).toContain('Bob Manager');
    });

    it('should forbid interview when same recruiter and one overlapping attendee', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Jane Interviewer', 'Bob Manager'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Jane Interviewer', 'Alice Engineer'], // One overlapping attendee
        history
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Same recruiter');
      expect(result.reason).toContain('John Recruiter');
      expect(result.reason).toContain('overlapping attendee');
      expect(result.reason).toContain('Jane Interviewer');
    });

    it('should forbid interview when same recruiter and all overlapping attendees', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Jane Interviewer', 'Bob Manager'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Jane Interviewer', 'Bob Manager'], // All overlapping attendees
        history
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Same recruiter');
      expect(result.reason).toContain('John Recruiter');
      expect(result.reason).toContain('overlapping attendees'); // Plural
      expect(result.reason).toContain('Jane Interviewer');
      expect(result.reason).toContain('Bob Manager');
    });

    it('should allow interview when new recruiter even with overlapping attendees', () => {
      const history = createMockHistory(
        true,
        ['Alice Recruiter'], // Previous recruiters
        ['Jane Interviewer', 'Bob Manager'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // New recruiter
        ['Jane Interviewer', 'Bob Manager'], // Same attendees
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('New recruiter');
    });

    it('should handle multiple previous recruiters', () => {
      const history = createMockHistory(
        true,
        ['Alice Recruiter', 'Bob Recruiter', 'Charlie Recruiter'], // Multiple previous recruiters
        ['Jane Interviewer'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'David Recruiter', // New recruiter
        ['Jane Interviewer'], // Same attendee
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('New recruiter');
      expect(result.reason).toContain('Alice Recruiter');
      expect(result.reason).toContain('Bob Recruiter');
      expect(result.reason).toContain('Charlie Recruiter');
    });

    it('should handle multiple previous attendees', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Alice', 'Bob', 'Charlie', 'David', 'Eve'] // Multiple previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Frank', 'Grace'], // All new attendees
        history
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('All new attendees');
    });

    it('should forbid when same recruiter and partial overlap in attendees', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Alice', 'Bob', 'Charlie'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Bob', 'David', 'Eve'], // One overlapping (Bob), two new
        history
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Same recruiter');
      expect(result.reason).toContain('overlapping attendee');
      expect(result.reason).toContain('Bob');
    });

    it('should handle single attendee overlap correctly', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        ['Jane Interviewer'] // Single previous attendee
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Jane Interviewer'], // Same single attendee
        history
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('overlapping attendee'); // Singular
      expect(result.reason).not.toContain('overlapping attendees'); // Not plural
    });

    it('should handle empty previous recruiters list (edge case)', () => {
      const history = createMockHistory(
        true,
        [], // No previous recruiters (shouldn't happen in practice)
        ['Jane Interviewer'] // Previous attendees
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter',
        ['Jane Interviewer'],
        history
      );

      // With no previous recruiters, any recruiter is "new"
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('New recruiter');
    });

    it('should handle empty previous attendees list (edge case)', () => {
      const history = createMockHistory(
        true,
        ['John Recruiter'], // Previous recruiters
        [] // No previous attendees (shouldn't happen in practice)
      );
      
      const result = policy.checkEligibility(
        'TechCorp',
        'Software Engineer',
        'John Recruiter', // Same recruiter
        ['Jane Interviewer'],
        history
      );

      // With no previous attendees, all attendees are "new"
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('All new attendees');
    });
  });
});
