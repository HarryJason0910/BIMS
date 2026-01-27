/**
 * Unit tests for CompanyHistory
 */

import { CompanyHistory } from './CompanyHistory';

describe('CompanyHistory', () => {
  let history: CompanyHistory;

  beforeEach(() => {
    history = new CompanyHistory();
  });

  describe('recordFailure', () => {
    it('should record a single failure', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      expect(history.hasFailures('TechCorp', 'Software Engineer')).toBe(true);
      expect(history.getAllRecruiters('TechCorp', 'Software Engineer')).toEqual(['John Recruiter']);
      expect(history.getAllAttendees('TechCorp', 'Software Engineer')).toEqual(['Jane Interviewer']);
    });

    it('should record multiple failures for same company+role', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');

      const historyEntry = history.getHistory('TechCorp', 'Software Engineer');
      
      expect(historyEntry).not.toBeNull();
      expect(historyEntry?.failures.length).toBe(2);
      expect(historyEntry?.failures[0].interviewId).toBe('interview-1');
      expect(historyEntry?.failures[1].interviewId).toBe('interview-2');
    });

    it('should accumulate unique recruiters across multiple failures', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Charlie Director'], 'interview-3');

      const recruiters = history.getAllRecruiters('TechCorp', 'Software Engineer');
      
      expect(recruiters).toHaveLength(2);
      expect(recruiters).toContain('John Recruiter');
      expect(recruiters).toContain('Alice Recruiter');
    });

    it('should accumulate unique attendees across multiple failures', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer', 'Bob Manager'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager', 'Charlie Director'], 'interview-2');

      const attendees = history.getAllAttendees('TechCorp', 'Software Engineer');
      
      expect(attendees).toHaveLength(3);
      expect(attendees).toContain('Jane Interviewer');
      expect(attendees).toContain('Bob Manager');
      expect(attendees).toContain('Charlie Director');
    });

    it('should record failures for different companies separately', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('DataCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');

      expect(history.hasFailures('TechCorp', 'Software Engineer')).toBe(true);
      expect(history.hasFailures('DataCorp', 'Software Engineer')).toBe(true);
      
      const techCorpHistory = history.getHistory('TechCorp', 'Software Engineer');
      const dataCorpHistory = history.getHistory('DataCorp', 'Software Engineer');
      
      expect(techCorpHistory?.failures.length).toBe(1);
      expect(dataCorpHistory?.failures.length).toBe(1);
      expect(techCorpHistory?.failures[0].recruiter).toBe('John Recruiter');
      expect(dataCorpHistory?.failures[0].recruiter).toBe('Alice Recruiter');
    });

    it('should record failures for different roles at same company separately', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Data Scientist', 'Alice Recruiter', ['Bob Manager'], 'interview-2');

      expect(history.hasFailures('TechCorp', 'Software Engineer')).toBe(true);
      expect(history.hasFailures('TechCorp', 'Data Scientist')).toBe(true);
      
      const engineerHistory = history.getHistory('TechCorp', 'Software Engineer');
      const scientistHistory = history.getHistory('TechCorp', 'Data Scientist');
      
      expect(engineerHistory?.failures.length).toBe(1);
      expect(scientistHistory?.failures.length).toBe(1);
      expect(engineerHistory?.failures[0].recruiter).toBe('John Recruiter');
      expect(scientistHistory?.failures[0].recruiter).toBe('Alice Recruiter');
    });
  });

  describe('case-insensitive matching', () => {
    it('should match company names case-insensitively', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      expect(history.hasFailures('techcorp', 'Software Engineer')).toBe(true);
      expect(history.hasFailures('TECHCORP', 'Software Engineer')).toBe(true);
      expect(history.hasFailures('TeCHcOrP', 'Software Engineer')).toBe(true);
    });

    it('should match role names case-insensitively', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      expect(history.hasFailures('TechCorp', 'software engineer')).toBe(true);
      expect(history.hasFailures('TechCorp', 'SOFTWARE ENGINEER')).toBe(true);
      expect(history.hasFailures('TechCorp', 'SoFtWaRe EnGiNeEr')).toBe(true);
    });

    it('should match both company and role case-insensitively', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      const historyEntry = history.getHistory('TECHCORP', 'SOFTWARE ENGINEER');
      
      expect(historyEntry).not.toBeNull();
      expect(historyEntry?.failures.length).toBe(1);
      expect(historyEntry?.failures[0].recruiter).toBe('John Recruiter');
    });

    it('should accumulate failures regardless of case used when recording', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('techcorp', 'software engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');
      history.recordFailure('TECHCORP', 'SOFTWARE ENGINEER', 'Charlie Recruiter', ['David Director'], 'interview-3');

      const historyEntry = history.getHistory('TechCorp', 'Software Engineer');
      
      expect(historyEntry?.failures.length).toBe(3);
      
      const recruiters = history.getAllRecruiters('TechCorp', 'Software Engineer');
      expect(recruiters).toHaveLength(3);
      expect(recruiters).toContain('John Recruiter');
      expect(recruiters).toContain('Alice Recruiter');
      expect(recruiters).toContain('Charlie Recruiter');
    });
  });

  describe('getHistory', () => {
    it('should return null for company+role with no failures', () => {
      const historyEntry = history.getHistory('TechCorp', 'Software Engineer');
      
      expect(historyEntry).toBeNull();
    });

    it('should return complete history for company+role', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer', 'Bob Manager'], 'interview-1');

      const historyEntry = history.getHistory('TechCorp', 'Software Engineer');
      
      expect(historyEntry).not.toBeNull();
      expect(historyEntry?.company).toBe('TechCorp');
      expect(historyEntry?.role).toBe('Software Engineer');
      expect(historyEntry?.failures.length).toBe(1);
      expect(historyEntry?.failures[0].interviewId).toBe('interview-1');
      expect(historyEntry?.failures[0].recruiter).toBe('John Recruiter');
      expect(historyEntry?.failures[0].attendees).toEqual(['Jane Interviewer', 'Bob Manager']);
      expect(historyEntry?.failures[0].date).toBeInstanceOf(Date);
    });

    it('should return a deep copy to prevent external modification', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      const historyEntry1 = history.getHistory('TechCorp', 'Software Engineer');
      const historyEntry2 = history.getHistory('TechCorp', 'Software Engineer');
      
      // Modify the first copy
      historyEntry1?.failures.push({
        interviewId: 'fake-interview',
        date: new Date(),
        recruiter: 'Fake Recruiter',
        attendees: ['Fake Attendee']
      });
      
      // Second copy should be unaffected
      expect(historyEntry2?.failures.length).toBe(1);
      expect(historyEntry2?.failures[0].interviewId).toBe('interview-1');
    });
  });

  describe('getAllRecruiters', () => {
    it('should return empty array for company+role with no failures', () => {
      const recruiters = history.getAllRecruiters('TechCorp', 'Software Engineer');
      
      expect(recruiters).toEqual([]);
    });

    it('should return all unique recruiters', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Charlie Director'], 'interview-3');

      const recruiters = history.getAllRecruiters('TechCorp', 'Software Engineer');
      
      expect(recruiters).toHaveLength(2);
      expect(recruiters).toContain('John Recruiter');
      expect(recruiters).toContain('Alice Recruiter');
    });
  });

  describe('getAllAttendees', () => {
    it('should return empty array for company+role with no failures', () => {
      const attendees = history.getAllAttendees('TechCorp', 'Software Engineer');
      
      expect(attendees).toEqual([]);
    });

    it('should return all unique attendees', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer', 'Bob Manager'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager', 'Charlie Director'], 'interview-2');

      const attendees = history.getAllAttendees('TechCorp', 'Software Engineer');
      
      expect(attendees).toHaveLength(3);
      expect(attendees).toContain('Jane Interviewer');
      expect(attendees).toContain('Bob Manager');
      expect(attendees).toContain('Charlie Director');
    });
  });

  describe('hasFailures', () => {
    it('should return false for company+role with no failures', () => {
      expect(history.hasFailures('TechCorp', 'Software Engineer')).toBe(false);
    });

    it('should return true for company+role with failures', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      expect(history.hasFailures('TechCorp', 'Software Engineer')).toBe(true);
    });
  });

  describe('getWarningMessage', () => {
    it('should return empty string for company+role with no failures', () => {
      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      expect(warning).toBe('');
    });

    it('should generate warning message for single failure', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer', 'Bob Manager'], 'interview-1');

      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      expect(warning).toContain('1 previous interview failure');
      expect(warning).toContain('TechCorp');
      expect(warning).toContain('Software Engineer');
      expect(warning).toContain('John Recruiter');
      expect(warning).toContain('Jane Interviewer');
      expect(warning).toContain('Bob Manager');
    });

    it('should generate warning message for multiple failures', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');
      history.recordFailure('TechCorp', 'Software Engineer', 'Charlie Recruiter', ['David Director'], 'interview-3');

      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      expect(warning).toContain('3 previous interview failures');
      expect(warning).toContain('TechCorp');
      expect(warning).toContain('Software Engineer');
      expect(warning).toContain('John Recruiter');
      expect(warning).toContain('Alice Recruiter');
      expect(warning).toContain('Charlie Recruiter');
      expect(warning).toContain('Jane Interviewer');
      expect(warning).toContain('Bob Manager');
      expect(warning).toContain('David Director');
    });

    it('should use singular "failure" for one failure', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      expect(warning).toMatch(/1 previous interview failure[^s]/);
    });

    it('should use plural "failures" for multiple failures', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'Alice Recruiter', ['Bob Manager'], 'interview-2');

      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      expect(warning).toContain('2 previous interview failures');
    });

    it('should include all unique recruiters and attendees in warning', () => {
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer', 'Bob Manager'], 'interview-1');
      history.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Bob Manager', 'Charlie Director'], 'interview-2');

      const warning = history.getWarningMessage('TechCorp', 'Software Engineer');
      
      // Should have 1 unique recruiter
      expect(warning).toContain('John Recruiter');
      
      // Should have 3 unique attendees
      expect(warning).toContain('Jane Interviewer');
      expect(warning).toContain('Bob Manager');
      expect(warning).toContain('Charlie Director');
    });
  });
});
