/**
 * Unit Tests for Bid Aggregate
 * 
 * These tests verify specific examples and edge cases for bid state transitions
 * and business logic.
 */

import { Bid, BidStatus, ResumeCheckerType, CreateBidData } from './Bid';

describe('Bid Unit Tests', () => {
  // Helper function to create valid bid data
  const createValidBidData = (): CreateBidData => ({
    link: 'https://example.com/job/123',
    company: 'Tech Corp',
    client: 'Tech Corp',
    role: 'Software Engineer',
    mainStacks: ['TypeScript', 'React', 'Node.js'],
    jobDescriptionPath: 'Tech_Corp_Software_Engineer/JD.txt',
    resumePath: 'Tech_Corp_Software_Engineer/resume.pdf'
  });

  describe('Bid Creation', () => {
    it('should create a bid with all required fields', () => {
      const bidData = createValidBidData();
      const bid = Bid.create(bidData);

      expect(bid.id).toBeDefined();
      expect(bid.link).toBe(bidData.link);
      expect(bid.company).toBe(bidData.company);
      expect(bid.client).toBe(bidData.client);
      expect(bid.role).toBe(bidData.role);
      expect(bid.mainStacks).toEqual(bidData.mainStacks);
      expect(bid.jobDescriptionPath).toBe(bidData.jobDescriptionPath);
      expect(bid.resumePath).toBe(bidData.resumePath);
    });

    it('should set date to today', () => {
      const bid = Bid.create(createValidBidData());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bidDate = new Date(bid.date);
      bidDate.setHours(0, 0, 0, 0);

      expect(bidDate.getTime()).toBe(today.getTime());
    });

    it('should initialize with default values', () => {
      const bid = Bid.create(createValidBidData());

      expect(bid.bidStatus).toBe(BidStatus.NEW);
      expect(bid.interviewWinning).toBe(false);
      expect(bid.bidDetail).toBe('');
      expect(bid.resumeChecker).toBeNull();
    });

    it('should support originalBidId for rebids', () => {
      const bidData = { ...createValidBidData(), originalBidId: 'bid-123' };
      const bid = Bid.create(bidData);

      expect(bid.originalBidId).toBe('bid-123');
    });
  });

  describe('State Transitions - Valid Paths', () => {
    describe('NEW → SUBMITTED → REJECTED', () => {
      it('should allow transition from NEW to SUBMITTED', () => {
        const bid = Bid.create(createValidBidData());
        
        bid.markAsSubmitted();
        
        expect(bid.bidStatus).toBe(BidStatus.SUBMITTED);
      });

      it('should allow transition from SUBMITTED to REJECTED', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        
        bid.markAsRejected();
        
        expect(bid.bidStatus).toBe(BidStatus.REJECTED);
        expect(bid.interviewWinning).toBe(false);
      });

      it('should allow rebidding after rejection without interview', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markAsRejected();
        
        expect(bid.canRebid()).toBe(true);
      });
    });

    describe('NEW → SUBMITTED → INTERVIEW_STAGE → CLOSED', () => {
      it('should allow transition from SUBMITTED to INTERVIEW_STAGE', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        
        bid.markInterviewStarted();
        
        expect(bid.bidStatus).toBe(BidStatus.INTERVIEW_STAGE);
        expect(bid.interviewWinning).toBe(true);
      });

      it('should allow transition from INTERVIEW_STAGE to CLOSED', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markInterviewStarted();
        
        bid.markAsClosed();
        
        expect(bid.bidStatus).toBe(BidStatus.CLOSED);
        expect(bid.interviewWinning).toBe(true);
      });

      it('should forbid rebidding after interview started', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markInterviewStarted();
        
        expect(bid.canRebid()).toBe(false);
      });
    });

    it('should allow transition from REJECTED to CLOSED', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markAsRejected();
      
      bid.markAsClosed();
      
      expect(bid.bidStatus).toBe(BidStatus.CLOSED);
    });
  });

  describe('State Transitions - Invalid Paths', () => {
    it('should prevent transition from INTERVIEW_STAGE to REJECTED', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markInterviewStarted();
      
      expect(() => bid.markAsRejected()).toThrow(
        'Cannot reject bid after interview stage has started'
      );
    });

    it('should prevent marking as submitted from non-NEW status', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      
      expect(() => bid.markAsSubmitted()).toThrow(
        'Cannot mark as submitted from status SUBMITTED'
      );
    });

    it('should prevent starting interview on rejected bid', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markAsRejected();
      
      expect(() => bid.markInterviewStarted()).toThrow(
        'Cannot start interview for rejected bid'
      );
    });

    it('should prevent starting interview on closed bid', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markAsClosed();
      
      expect(() => bid.markInterviewStarted()).toThrow(
        'Cannot start interview for closed bid'
      );
    });

    it('should prevent closing bid from NEW status', () => {
      const bid = Bid.create(createValidBidData());
      
      expect(() => bid.markAsClosed()).toThrow(
        'Cannot close bid that has not been submitted'
      );
    });

    it('should prevent rejecting already closed bid', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markAsClosed();
      
      expect(() => bid.markAsRejected()).toThrow(
        'Cannot reject bid that is already closed'
      );
    });
  });

  describe('Invariant: interviewWinning cannot be unset', () => {
    it('should keep interviewWinning true after being set', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markInterviewStarted();
      
      expect(bid.interviewWinning).toBe(true);
      
      // Even after closing, interviewWinning remains true
      bid.markAsClosed();
      expect(bid.interviewWinning).toBe(true);
    });

    it('should not allow rebidding once interviewWinning is true', () => {
      const bid = Bid.create(createValidBidData());
      bid.markAsSubmitted();
      bid.markInterviewStarted();
      bid.markAsClosed();
      
      expect(bid.interviewWinning).toBe(true);
      expect(bid.canRebid()).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    describe('attachWarning', () => {
      it('should attach warning to empty bidDetail', () => {
        const bid = Bid.create(createValidBidData());
        
        bid.attachWarning('Previous failure at this company');
        
        expect(bid.bidDetail).toBe('Previous failure at this company');
      });

      it('should append warning to existing bidDetail', () => {
        const bid = Bid.create(createValidBidData());
        bid.attachWarning('First warning');
        
        bid.attachWarning('Second warning');
        
        expect(bid.bidDetail).toBe('First warning\nSecond warning');
      });
    });

    describe('setResumeChecker', () => {
      it('should set resume checker to ATS', () => {
        const bid = Bid.create(createValidBidData());
        
        bid.setResumeChecker(ResumeCheckerType.ATS);
        
        expect(bid.resumeChecker).toBe(ResumeCheckerType.ATS);
      });

      it('should set resume checker to RECRUITER', () => {
        const bid = Bid.create(createValidBidData());
        
        bid.setResumeChecker(ResumeCheckerType.RECRUITER);
        
        expect(bid.resumeChecker).toBe(ResumeCheckerType.RECRUITER);
      });

      it('should allow updating resume checker', () => {
        const bid = Bid.create(createValidBidData());
        bid.setResumeChecker(ResumeCheckerType.ATS);
        
        bid.setResumeChecker(ResumeCheckerType.RECRUITER);
        
        expect(bid.resumeChecker).toBe(ResumeCheckerType.RECRUITER);
      });
    });

    describe('isInterviewStarted', () => {
      it('should return false initially', () => {
        const bid = Bid.create(createValidBidData());
        
        expect(bid.isInterviewStarted()).toBe(false);
      });

      it('should return true after interview started', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markInterviewStarted();
        
        expect(bid.isInterviewStarted()).toBe(true);
      });
    });

    describe('canRebid', () => {
      it('should return false for NEW bid', () => {
        const bid = Bid.create(createValidBidData());
        
        expect(bid.canRebid()).toBe(false);
      });

      it('should return false for SUBMITTED bid', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        
        expect(bid.canRebid()).toBe(false);
      });

      it('should return true for REJECTED bid without interview', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markAsRejected();
        
        expect(bid.canRebid()).toBe(true);
      });

      it('should return false for INTERVIEW_STAGE bid', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markInterviewStarted();
        
        expect(bid.canRebid()).toBe(false);
      });

      it('should return false for CLOSED bid', () => {
        const bid = Bid.create(createValidBidData());
        bid.markAsSubmitted();
        bid.markAsClosed();
        
        expect(bid.canRebid()).toBe(false);
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize bid to JSON', () => {
      const bidData = createValidBidData();
      const bid = Bid.create(bidData);
      
      const json = bid.toJSON();
      
      expect(json.id).toBe(bid.id);
      expect(json.link).toBe(bidData.link);
      expect(json.company).toBe(bidData.company);
      expect(json.bidStatus).toBe(BidStatus.NEW);
      expect(json.interviewWinning).toBe(false);
    });
  });
});
