/**
 * Property-Based Tests for Email Classifier
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { EmailClassifier, EmailEvent, EmailEventType } from './EmailClassifier';

describe('EmailClassifier Property-Based Tests', () => {
  const classifier = new EmailClassifier();

  const emailArb = fc.record({
    id: fc.uuid(),
    subject: fc.string({ minLength: 5, maxLength: 100 }),
    body: fc.string({ minLength: 10, maxLength: 500 }),
    sender: fc.emailAddress(),
    receivedDate: fc.date()
  });

  describe('Property 22: Email Information Extraction', () => {
    it('should always return a valid classification type', () => {
      fc.assert(
        fc.property(
          emailArb,
          (email) => {
            const classification = classifier.classify(email);
            
            const validTypes = [
              EmailEventType.BID_REJECTION,
              EmailEventType.INTERVIEW_SCHEDULED,
              EmailEventType.INTERVIEW_COMPLETED,
              EmailEventType.UNKNOWN
            ];
            
            return validTypes.includes(classification.type);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return confidence between 0.0 and 1.0', () => {
      fc.assert(
        fc.property(
          emailArb,
          (email) => {
            const classification = classifier.classify(email);
            
            return (
              classification.confidence >= 0.0 &&
              classification.confidence <= 1.0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify emails with rejection keywords as BID_REJECTION', () => {
      fc.assert(
        fc.property(
          emailArb,
          fc.constantFrom('unfortunately', 'not selected', 'rejected', 'regret to inform'),
          (email, keyword) => {
            const modifiedEmail: EmailEvent = {
              ...email,
              body: `${email.body} We ${keyword} your application.`
            };
            
            const classification = classifier.classify(modifiedEmail);
            
            return classification.type === EmailEventType.BID_REJECTION;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify emails with interview keywords as INTERVIEW_SCHEDULED', () => {
      fc.assert(
        fc.property(
          emailArb,
          fc.constantFrom('interview', 'schedule', 'meeting', 'would like to speak'),
          (email, keyword) => {
            const modifiedEmail: EmailEvent = {
              ...email,
              body: `${email.body} We would like to ${keyword} with you.`
            };
            
            const classification = classifier.classify(modifiedEmail);
            
            return classification.type === EmailEventType.INTERVIEW_SCHEDULED;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract company from sender domain', () => {
      fc.assert(
        fc.property(
          emailArb,
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-z]+$/.test(s)),
          (email, companyName) => {
            const modifiedEmail: EmailEvent = {
              ...email,
              sender: `recruiter@${companyName}.com`
            };
            
            const company = classifier.extractCompany(modifiedEmail);
            
            return company !== undefined && company.toLowerCase() === companyName.toLowerCase();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic for the same email', () => {
      fc.assert(
        fc.property(
          emailArb,
          (email) => {
            const classification1 = classifier.classify(email);
            const classification2 = classifier.classify(email);
            
            return (
              classification1.type === classification2.type &&
              classification1.confidence === classification2.confidence &&
              classification1.company === classification2.company &&
              classification1.role === classification2.role
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return UNKNOWN for emails without recognizable keywords', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            subject: fc.constant('Random subject'),
            body: fc.constant('This is a random email body without any specific keywords.'),
            sender: fc.emailAddress(),
            receivedDate: fc.date()
          }),
          (email) => {
            const classification = classifier.classify(email);
            
            return classification.type === EmailEventType.UNKNOWN;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have higher confidence with more keyword matches', () => {
      fc.assert(
        fc.property(
          emailArb,
          (email) => {
            // Email with one rejection keyword
            const email1: EmailEvent = {
              ...email,
              body: 'Unfortunately, we cannot proceed.'
            };
            
            // Email with multiple rejection keywords
            const email2: EmailEvent = {
              ...email,
              body: 'Unfortunately, we regret to inform you that you were not selected and we decided to pursue other candidates.'
            };
            
            const classification1 = classifier.classify(email1);
            const classification2 = classifier.classify(email2);
            
            // More keywords should result in equal or higher confidence
            return classification2.confidence >= classification1.confidence;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
