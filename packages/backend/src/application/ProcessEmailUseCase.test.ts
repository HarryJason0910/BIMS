/**
 * Unit Tests for ProcessEmailUseCase
 * 
 * Tests:
 * - Rejection email processing
 * - Interview scheduling email processing
 * - Interview completion email processing
 * - Unknown email handling
 * - Idempotency with same email ID
 */

import { ProcessEmailUseCase } from './ProcessEmailUseCase';
import { IBidRepository } from './IBidRepository';
import { IInterviewRepository } from './IInterviewRepository';
import { IProcessedEmailRepository } from './IProcessedEmailRepository';
import { EmailClassifier, EmailEvent, EmailEventType } from '../domain/EmailClassifier';
import { ResumeCheckerService } from '../domain/ResumeCheckerService';
import { Bid, BidStatus, ResumeCheckerType } from '../domain/Bid';
import { Interview, InterviewStatus } from '../domain/Interview';

// Mock repositories
class MockBidRepository implements IBidRepository {
  private bids: Bid[] = [];

  async save(bid: Bid): Promise<void> {
    this.bids.push(bid);
  }

  async findById(id: string): Promise<Bid | null> {
    return this.bids.find(b => b.id === id) || null;
  }

  async findAll(): Promise<Bid[]> {
    return this.bids;
  }

  async findByCompanyAndRole(company: string, role: string): Promise<Bid[]> {
    return this.bids.filter(
      b => b.company.toLowerCase() === company.toLowerCase() &&
           b.role.toLowerCase() === role.toLowerCase()
    );
  }

  async findByLink(link: string): Promise<Bid | null> {
    return this.bids.find(b => b.link === link) || null;
  }

  async update(bid: Bid): Promise<void> {
    const index = this.bids.findIndex(b => b.id === bid.id);
    if (index !== -1) {
      this.bids[index] = bid;
    }
  }

  async delete(id: string): Promise<void> {
    this.bids = this.bids.filter(b => b.id !== id);
  }

  // Helper for testing
  addBid(bid: Bid): void {
    this.bids.push(bid);
  }
}

class MockInterviewRepository implements IInterviewRepository {
  private interviews: Interview[] = [];

  async save(interview: Interview): Promise<void> {
    this.interviews.push(interview);
  }

  async findById(id: string): Promise<Interview | null> {
    return this.interviews.find(i => i.id === id) || null;
  }

  async findAll(): Promise<Interview[]> {
    return this.interviews;
  }

  async findByCompanyAndRole(company: string, role: string): Promise<Interview[]> {
    return this.interviews.filter(
      i => i.company.toLowerCase() === company.toLowerCase() &&
           i.role.toLowerCase() === role.toLowerCase()
    );
  }

  async findByBidId(bidId: string): Promise<Interview[]> {
    return this.interviews.filter(i => i.bidId === bidId);
  }

  async update(interview: Interview): Promise<void> {
    const index = this.interviews.findIndex(i => i.id === interview.id);
    if (index !== -1) {
      this.interviews[index] = interview;
    }
  }

  async delete(id: string): Promise<void> {
    this.interviews = this.interviews.filter(i => i.id !== id);
  }

  // Helper for testing
  addInterview(interview: Interview): void {
    this.interviews.push(interview);
  }
}

class MockProcessedEmailRepository implements IProcessedEmailRepository {
  private processedEmails: Set<string> = new Set();

  async markAsProcessed(emailId: string): Promise<void> {
    this.processedEmails.add(emailId);
  }

  async isProcessed(emailId: string): Promise<boolean> {
    return this.processedEmails.has(emailId);
  }
}

describe('ProcessEmailUseCase', () => {
  let useCase: ProcessEmailUseCase;
  let bidRepository: MockBidRepository;
  let interviewRepository: MockInterviewRepository;
  let processedEmailRepository: MockProcessedEmailRepository;
  let emailClassifier: EmailClassifier;
  let resumeCheckerService: ResumeCheckerService;

  beforeEach(() => {
    bidRepository = new MockBidRepository();
    interviewRepository = new MockInterviewRepository();
    processedEmailRepository = new MockProcessedEmailRepository();
    emailClassifier = new EmailClassifier();
    resumeCheckerService = new ResumeCheckerService();

    useCase = new ProcessEmailUseCase(
      bidRepository,
      interviewRepository,
      processedEmailRepository,
      emailClassifier,
      resumeCheckerService
    );
  });

  describe('Rejection Email Processing', () => {
    it('should mark bid as rejected and infer resume checker type', async () => {
      // Create a bid
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'Node.js'],
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf'
      });
      bid.markAsSubmitted();
      bidRepository.addBid(bid);

      // Create rejection email
      const email: EmailEvent = {
        id: 'email-1',
        subject: 'Application Update',
        body: 'Unfortunately, we have decided to move forward with other candidates for the Software Engineer position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date(bid.date.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days later
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.BID_REJECTION);
      expect(result.classification.company).toBe('Techcorp');
      expect(result.classification.role).toBe('Software Engineer');
      expect(result.updatedEntityId).toBe(bid.id);

      // Verify bid was updated
      const updatedBid = await bidRepository.findById(bid.id);
      expect(updatedBid).not.toBeNull();
      expect(updatedBid!.bidStatus).toBe(BidStatus.REJECTED);
      expect(updatedBid!.resumeChecker).toBe(ResumeCheckerType.ATS);

      // Verify email was marked as processed
      const isProcessed = await processedEmailRepository.isProcessed(email.id);
      expect(isProcessed).toBe(true);
    });

    it('should handle rejection email when no matching bid found', async () => {
      // Create rejection email with no matching bid
      const email: EmailEvent = {
        id: 'email-2',
        subject: 'Application Update',
        body: 'Unfortunately, we have decided to move forward with other candidates for the Data Scientist position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.BID_REJECTION);
      expect(result.action).toContain('No matching non-rejected bid found');
      expect(result.updatedEntityId).toBeUndefined();
    });

    it('should not reject already rejected bids', async () => {
      // Create a rejected bid
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf'
      });
      bid.markAsSubmitted();
      bid.markAsRejected();
      bidRepository.addBid(bid);

      // Create another active bid
      const activeBid = Bid.create({
        link: 'https://example.com/job2',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Great job',
        resume: 'resume-v2.pdf'
      });
      activeBid.markAsSubmitted();
      bidRepository.addBid(activeBid);

      // Create rejection email
      const email: EmailEvent = {
        id: 'email-3',
        subject: 'Application Update - Software Engineer',
        body: 'Unfortunately, we have decided to move forward with other candidates for the Software Engineer position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify the active bid was rejected, not the already rejected one
      expect(result.updatedEntityId).toBe(activeBid.id);
      const updatedBid = await bidRepository.findById(activeBid.id);
      expect(updatedBid!.bidStatus).toBe(BidStatus.REJECTED);
    });
  });

  describe('Interview Scheduling Email Processing', () => {
    it('should set interviewWinning to true when interview is scheduled', async () => {
      // Create a bid
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf'
      });
      bid.markAsSubmitted();
      bidRepository.addBid(bid);

      // Create interview scheduling email
      const email: EmailEvent = {
        id: 'email-4',
        subject: 'Interview Invitation',
        body: 'We would like to schedule an interview for the Software Engineer position. Are you available next week?',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.INTERVIEW_SCHEDULED);
      expect(result.updatedEntityId).toBe(bid.id);

      // Verify bid was updated
      const updatedBid = await bidRepository.findById(bid.id);
      expect(updatedBid).not.toBeNull();
      expect(updatedBid!.interviewWinning).toBe(true);
      expect(updatedBid!.bidStatus).toBe(BidStatus.INTERVIEW_STAGE);
    });

    it('should handle interview scheduling when no matching bid found', async () => {
      // Create interview scheduling email with no matching bid
      const email: EmailEvent = {
        id: 'email-5',
        subject: 'Interview Invitation',
        body: 'We would like to schedule an interview for the Data Scientist position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.INTERVIEW_SCHEDULED);
      expect(result.action).toContain('No matching active bid found');
      expect(result.updatedEntityId).toBeUndefined();
    });

    it('should not update already interview-winning bids', async () => {
      // Create a bid that already has interview started
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf'
      });
      bid.markAsSubmitted();
      bid.markInterviewStarted();
      bidRepository.addBid(bid);

      // Create interview scheduling email
      const email: EmailEvent = {
        id: 'email-6',
        subject: 'Interview Invitation',
        body: 'We would like to schedule an interview for the Software Engineer position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result - should still process but not change anything
      expect(result.processed).toBe(true);
      expect(result.updatedEntityId).toBe(bid.id);

      // Verify bid status unchanged
      const updatedBid = await bidRepository.findById(bid.id);
      expect(updatedBid!.interviewWinning).toBe(true);
      expect(updatedBid!.bidStatus).toBe(BidStatus.INTERVIEW_STAGE);
    });
  });

  describe('Interview Completion Email Processing', () => {
    it('should mark interview as completed', async () => {
      // Create an interview
      const interview = Interview.create({
        base: 'LINKEDIN_CHAT' as any,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'First round'
      });
      interviewRepository.addInterview(interview);

      // Create interview completion email
      const email: EmailEvent = {
        id: 'email-7',
        subject: 'Thank you for interviewing',
        body: 'Thank you for interviewing with us for the Software Engineer position. We will be in touch with next steps.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.INTERVIEW_COMPLETED);
      expect(result.updatedEntityId).toBe(interview.id);

      // Verify interview was updated
      const updatedInterview = await interviewRepository.findById(interview.id);
      expect(updatedInterview).not.toBeNull();
      expect(updatedInterview!.status).toBe(InterviewStatus.COMPLETED_SUCCESS);
    });

    it('should handle interview completion when no matching interview found', async () => {
      // Create interview completion email with no matching interview
      const email: EmailEvent = {
        id: 'email-8',
        subject: 'Thank you for interviewing',
        body: 'Thank you for interviewing with us for the Data Scientist position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.INTERVIEW_COMPLETED);
      expect(result.action).toContain('No matching scheduled interview found');
      expect(result.updatedEntityId).toBeUndefined();
    });
  });

  describe('Unknown Email Handling', () => {
    it('should handle unknown email types', async () => {
      // Create an email that doesn't match any pattern
      const email: EmailEvent = {
        id: 'email-9',
        subject: 'Newsletter',
        body: 'Check out our latest blog posts!',
        sender: 'marketing@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.UNKNOWN);
      expect(result.action).toContain('Email type unknown');
      expect(result.updatedEntityId).toBeUndefined();

      // Verify email was still marked as processed
      const isProcessed = await processedEmailRepository.isProcessed(email.id);
      expect(isProcessed).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should not process the same email twice', async () => {
      // Create a bid
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Great job',
        resume: 'resume-v1.pdf'
      });
      bid.markAsSubmitted();
      bidRepository.addBid(bid);

      // Create rejection email
      const email: EmailEvent = {
        id: 'email-10',
        subject: 'Application Update - Software Engineer',
        body: 'Unfortunately, we have decided to move forward with other candidates for the Software Engineer position.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email first time
      const result1 = await useCase.execute(email);
      expect(result1.processed).toBe(true);
      expect(result1.updatedEntityId).toBe(bid.id);

      // Verify bid was rejected
      const updatedBid1 = await bidRepository.findById(bid.id);
      expect(updatedBid1!.bidStatus).toBe(BidStatus.REJECTED);

      // Process same email again
      const result2 = await useCase.execute(email);

      // Verify it was skipped
      expect(result2.processed).toBe(false);
      expect(result2.action).toContain('already processed');
      expect(result2.updatedEntityId).toBeUndefined();

      // Verify bid status unchanged
      const updatedBid2 = await bidRepository.findById(bid.id);
      expect(updatedBid2!.bidStatus).toBe(BidStatus.REJECTED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle email with missing company information', async () => {
      // Create an email without clear company information
      const email: EmailEvent = {
        id: 'email-11',
        subject: 'Application Update',
        body: 'Unfortunately, we have decided to move forward with other candidates.',
        sender: 'noreply@example.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result - should process but not match any bid
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.BID_REJECTION);
    });

    it('should handle email with missing role information', async () => {
      // Create an email without clear role information
      const email: EmailEvent = {
        id: 'email-12',
        subject: 'Application Update',
        body: 'Unfortunately, we have decided to move forward with other candidates at TechCorp.',
        sender: 'hr@techcorp.com',
        receivedDate: new Date()
      };

      // Process email
      const result = await useCase.execute(email);

      // Verify result - should process but not match any bid
      expect(result.processed).toBe(true);
      expect(result.classification.type).toBe(EmailEventType.BID_REJECTION);
    });
  });
});
