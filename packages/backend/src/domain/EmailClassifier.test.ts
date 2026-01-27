/**
 * Unit Tests for Email Classifier
 * 
 * These tests verify specific edge cases and scenarios for the Email Classifier.
 */

import { EmailClassifier, EmailEvent, EmailEventType } from './EmailClassifier';

describe('EmailClassifier Unit Tests', () => {
  const classifier = new EmailClassifier();

  describe('Rejection Email Classification', () => {
    it('should classify rejection email correctly', () => {
      const email: EmailEvent = {
        id: '1',
        subject: 'Application Status Update',
        body: 'Unfortunately, we have decided to move forward with other candidates.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.BID_REJECTION);
      expect(classification.confidence).toBeGreaterThan(0);
    });

    it('should detect "not selected" keyword', () => {
      const email: EmailEvent = {
        id: '2',
        subject: 'Your Application',
        body: 'Thank you for your interest. You were not selected for this position.',
        sender: 'recruiting@company.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.BID_REJECTION);
    });

    it('should detect "regret to inform" keyword', () => {
      const email: EmailEvent = {
        id: '3',
        subject: 'Application Update',
        body: 'We regret to inform you that we will not be proceeding with your application.',
        sender: 'jobs@startup.io',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.BID_REJECTION);
    });
  });

  describe('Interview Scheduling Email Classification', () => {
    it('should classify interview scheduling email correctly', () => {
      const email: EmailEvent = {
        id: '4',
        subject: 'Interview Invitation',
        body: 'We would like to schedule an interview with you next week.',
        sender: 'recruiter@bigtech.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.INTERVIEW_SCHEDULED);
      expect(classification.confidence).toBeGreaterThan(0);
    });

    it('should detect "calendar invite" keyword', () => {
      const email: EmailEvent = {
        id: '5',
        subject: 'Meeting Request',
        body: 'Please find the calendar invite for our discussion.',
        sender: 'hr@company.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.INTERVIEW_SCHEDULED);
    });
  });

  describe('Interview Completion Email Classification', () => {
    it('should classify interview completion email correctly', () => {
      const email: EmailEvent = {
        id: '6',
        subject: 'Next Steps',
        body: 'Thank you for interviewing with us. We will provide feedback soon.',
        sender: 'hiring@tech.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.INTERVIEW_COMPLETED);
      expect(classification.confidence).toBeGreaterThan(0);
    });
  });

  describe('Unknown Email Classification', () => {
    it('should classify unknown email correctly', () => {
      const email: EmailEvent = {
        id: '7',
        subject: 'Newsletter',
        body: 'Check out our latest blog posts and updates.',
        sender: 'marketing@company.com',
        receivedDate: new Date()
      };

      const classification = classifier.classify(email);

      expect(classification.type).toBe(EmailEventType.UNKNOWN);
      expect(classification.confidence).toBe(0);
    });
  });

  describe('Company Extraction', () => {
    it('should extract company from sender domain', () => {
      const email: EmailEvent = {
        id: '8',
        subject: 'Test',
        body: 'Test body',
        sender: 'recruiter@google.com',
        receivedDate: new Date()
      };

      const company = classifier.extractCompany(email);

      expect(company).toBe('Google');
    });

    it('should extract company from body with "at" pattern', () => {
      const email: EmailEvent = {
        id: '9',
        subject: 'Test',
        body: 'We are hiring at Microsoft for a new position.',
        sender: 'noreply@jobs.com',
        receivedDate: new Date()
      };

      const company = classifier.extractCompany(email);

      expect(company).toBeDefined();
    });

    it('should return undefined if company cannot be extracted', () => {
      const email: EmailEvent = {
        id: '10',
        subject: 'Test',
        body: 'Generic email body',
        sender: 'test@localhost',
        receivedDate: new Date()
      };

      const company = classifier.extractCompany(email);

      expect(company).toBeUndefined();
    });
  });

  describe('Role Extraction', () => {
    it('should extract role from subject with "position" pattern', () => {
      const email: EmailEvent = {
        id: '11',
        subject: 'Application for the Software Engineer position',
        body: 'Thank you for applying.',
        sender: 'hr@company.com',
        receivedDate: new Date()
      };

      const role = classifier.extractRole(email);

      expect(role).toBe('Software Engineer');
    });

    it('should extract role from body with "role" pattern', () => {
      const email: EmailEvent = {
        id: '12',
        subject: 'Application Update',
        body: 'Thank you for your interest in the Senior Developer role at our company.',
        sender: 'jobs@tech.com',
        receivedDate: new Date()
      };

      const role = classifier.extractRole(email);

      expect(role).toBe('Senior Developer');
    });

    it('should extract role from body with "as" pattern', () => {
      const email: EmailEvent = {
        id: '13',
        subject: 'Job Opportunity',
        body: 'We have an opening as a Product Manager.',
        sender: 'recruiting@startup.io',
        receivedDate: new Date()
      };

      const role = classifier.extractRole(email);

      expect(role).toBe('Product Manager');
    });

    it('should return undefined if role cannot be extracted', () => {
      const email: EmailEvent = {
        id: '14',
        subject: 'General Update',
        body: 'This is a general email.',
        sender: 'info@company.com',
        receivedDate: new Date()
      };

      const role = classifier.extractRole(email);

      expect(role).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    it('isRejection should return true for rejection text', () => {
      const text = 'unfortunately we cannot proceed';
      expect(classifier.isRejection(text)).toBe(true);
    });

    it('isRejection should return false for non-rejection text', () => {
      const text = 'we are excited to move forward';
      expect(classifier.isRejection(text)).toBe(false);
    });

    it('isInterviewScheduled should return true for interview text', () => {
      const text = 'we would like to schedule an interview';
      expect(classifier.isInterviewScheduled(text)).toBe(true);
    });

    it('isInterviewScheduled should return false for non-interview text', () => {
      const text = 'thank you for your application';
      expect(classifier.isInterviewScheduled(text)).toBe(false);
    });

    it('isInterviewCompleted should return true for completion text', () => {
      const text = 'thank you for interviewing with us';
      expect(classifier.isInterviewCompleted(text)).toBe(true);
    });

    it('isInterviewCompleted should return false for non-completion text', () => {
      const text = 'we are reviewing applications';
      expect(classifier.isInterviewCompleted(text)).toBe(false);
    });
  });
});
