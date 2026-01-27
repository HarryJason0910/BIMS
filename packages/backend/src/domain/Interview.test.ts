/**
 * Unit Tests for Interview Aggregate
 * 
 * These tests verify specific examples and edge cases for interview state transitions
 * and business logic.
 */

import { Interview, InterviewBase, InterviewStatus, CreateInterviewData } from './Interview';

describe('Interview Unit Tests', () => {
  // Helper function to create valid interview data
  const createValidInterviewData = (base: InterviewBase = InterviewBase.LINKEDIN_CHAT): CreateInterviewData => ({
    base,
    company: 'Tech Corp',
    client: 'Tech Corp',
    role: 'Software Engineer',
    jobDescription: 'We are looking for a software engineer...',
    resume: 'resume-v1.pdf',
    interviewType: 'Technical',
    recruiter: 'John Doe',
    attendees: ['Jane Smith', 'Bob Johnson'],
    detail: 'First round technical interview',
    bidId: base === InterviewBase.BID ? 'bid-123' : undefined
  });

  describe('Interview Creation', () => {
    it('should create an interview with all required fields', () => {
      const interviewData = createValidInterviewData();
      const interview = Interview.create(interviewData);

      expect(interview.id).toBeDefined();
      expect(interview.base).toBe(interviewData.base);
      expect(interview.company).toBe(interviewData.company);
      expect(interview.client).toBe(interviewData.client);
      expect(interview.role).toBe(interviewData.role);
      expect(interview.jobDescription).toBe(interviewData.jobDescription);
      expect(interview.resume).toBe(interviewData.resume);
      expect(interview.interviewType).toBe(interviewData.interviewType);
      expect(interview.recruiter).toBe(interviewData.recruiter);
      expect(interview.attendees).toEqual(interviewData.attendees);
      expect(interview.detail).toBe(interviewData.detail);
    });

    it('should set date to today', () => {
      const interview = Interview.create(createValidInterviewData());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const interviewDate = new Date(interview.date);
      interviewDate.setHours(0, 0, 0, 0);

      expect(interviewDate.getTime()).toBe(today.getTime());
    });

    it('should initialize with SCHEDULED status', () => {
      const interview = Interview.create(createValidInterviewData());

      expect(interview.status).toBe(InterviewStatus.SCHEDULED);
    });

    it('should create interview from BID with bidId', () => {
      const interviewData = createValidInterviewData(InterviewBase.BID);
      const interview = Interview.create(interviewData);

      expect(interview.base).toBe(InterviewBase.BID);
      expect(interview.bidId).toBe('bid-123');
    });

    it('should create interview from LINKEDIN_CHAT without bidId', () => {
      const interviewData = createValidInterviewData(InterviewBase.LINKEDIN_CHAT);
      const interview = Interview.create(interviewData);

      expect(interview.base).toBe(InterviewBase.LINKEDIN_CHAT);
      expect(interview.bidId).toBeNull();
    });

    it('should throw error when bidId is missing for BID base', () => {
      const interviewData = {
        ...createValidInterviewData(InterviewBase.BID),
        bidId: undefined
      };

      expect(() => Interview.create(interviewData)).toThrow(
        'Interview bidId is required when base is BID'
      );
    });
  });

  describe('State Transitions - Valid Paths', () => {
    describe('SCHEDULED → COMPLETED_SUCCESS', () => {
      it('should allow transition from SCHEDULED to COMPLETED_SUCCESS', () => {
        const interview = Interview.create(createValidInterviewData());
        
        interview.markAsCompleted(true);
        
        expect(interview.status).toBe(InterviewStatus.COMPLETED_SUCCESS);
      });

      it('should not be marked as failed after successful completion', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCompleted(true);
        
        expect(interview.isFailed()).toBe(false);
      });
    });

    describe('SCHEDULED → COMPLETED_FAILURE', () => {
      it('should allow transition from SCHEDULED to COMPLETED_FAILURE', () => {
        const interview = Interview.create(createValidInterviewData());
        
        interview.markAsCompleted(false);
        
        expect(interview.status).toBe(InterviewStatus.COMPLETED_FAILURE);
      });

      it('should be marked as failed after failure completion', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCompleted(false);
        
        expect(interview.isFailed()).toBe(true);
      });

      it('should provide failure info after failure', () => {
        const interviewData = createValidInterviewData();
        const interview = Interview.create(interviewData);
        interview.markAsCompleted(false);
        
        const failureInfo = interview.getFailureInfo();
        
        expect(failureInfo.company).toBe(interviewData.company);
        expect(failureInfo.role).toBe(interviewData.role);
        expect(failureInfo.recruiter).toBe(interviewData.recruiter);
        expect(failureInfo.attendees).toEqual(interviewData.attendees);
      });
    });

    describe('SCHEDULED → CANCELLED', () => {
      it('should allow transition from SCHEDULED to CANCELLED', () => {
        const interview = Interview.create(createValidInterviewData());
        
        interview.markAsCancelled();
        
        expect(interview.status).toBe(InterviewStatus.CANCELLED);
      });

      it('should not be marked as failed after cancellation', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCancelled();
        
        expect(interview.isFailed()).toBe(false);
      });
    });
  });

  describe('State Transitions - Invalid Paths', () => {
    it('should prevent transition from COMPLETED_SUCCESS to SCHEDULED', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCompleted(true);
      
      // There's no method to transition back to SCHEDULED, but we test that
      // the status remains COMPLETED_SUCCESS
      expect(interview.status).toBe(InterviewStatus.COMPLETED_SUCCESS);
    });

    it('should prevent marking as completed again after COMPLETED_SUCCESS', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCompleted(true);
      
      expect(() => interview.markAsCompleted(false)).toThrow(
        'Interview is already marked as completed successfully'
      );
    });

    it('should prevent marking as completed again after COMPLETED_FAILURE', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCompleted(false);
      
      expect(() => interview.markAsCompleted(true)).toThrow(
        'Interview is already marked as completed with failure'
      );
    });

    it('should prevent cancelling after COMPLETED_SUCCESS', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCompleted(true);
      
      expect(() => interview.markAsCancelled()).toThrow(
        'Cannot cancel an interview that was completed successfully'
      );
    });

    it('should prevent cancelling after COMPLETED_FAILURE', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCompleted(false);
      
      expect(() => interview.markAsCancelled()).toThrow(
        'Cannot cancel an interview that was completed with failure'
      );
    });

    it('should prevent cancelling already cancelled interview', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCancelled();
      
      expect(() => interview.markAsCancelled()).toThrow(
        'Interview is already cancelled'
      );
    });

    it('should prevent completing a cancelled interview', () => {
      const interview = Interview.create(createValidInterviewData());
      interview.markAsCancelled();
      
      expect(() => interview.markAsCompleted(true)).toThrow(
        'Cannot complete a cancelled interview'
      );
    });
  });

  describe('Helper Methods', () => {
    describe('isFailed', () => {
      it('should return false for SCHEDULED interview', () => {
        const interview = Interview.create(createValidInterviewData());
        
        expect(interview.isFailed()).toBe(false);
      });

      it('should return false for COMPLETED_SUCCESS interview', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCompleted(true);
        
        expect(interview.isFailed()).toBe(false);
      });

      it('should return true for COMPLETED_FAILURE interview', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCompleted(false);
        
        expect(interview.isFailed()).toBe(true);
      });

      it('should return false for CANCELLED interview', () => {
        const interview = Interview.create(createValidInterviewData());
        interview.markAsCancelled();
        
        expect(interview.isFailed()).toBe(false);
      });
    });

    describe('getFailureInfo', () => {
      it('should return failure info with all required fields', () => {
        const interviewData = createValidInterviewData();
        const interview = Interview.create(interviewData);
        
        const failureInfo = interview.getFailureInfo();
        
        expect(failureInfo.company).toBe(interviewData.company);
        expect(failureInfo.role).toBe(interviewData.role);
        expect(failureInfo.recruiter).toBe(interviewData.recruiter);
        expect(failureInfo.attendees).toEqual(interviewData.attendees);
      });

      it('should return a copy of attendees array', () => {
        const interviewData = createValidInterviewData();
        const interview = Interview.create(interviewData);
        
        const failureInfo = interview.getFailureInfo();
        failureInfo.attendees.push('New Attendee');
        
        // Original attendees should not be modified
        expect(interview.attendees).toEqual(interviewData.attendees);
        expect(interview.attendees).not.toContain('New Attendee');
      });
    });

    describe('updateDetail', () => {
      it('should update detail field', () => {
        const interview = Interview.create(createValidInterviewData());
        
        interview.updateDetail('Updated interview notes');
        
        expect(interview.detail).toBe('Updated interview notes');
      });

      it('should throw error when updating with empty detail', () => {
        const interview = Interview.create(createValidInterviewData());
        
        expect(() => interview.updateDetail('')).toThrow(
          'Detail cannot be empty'
        );
      });

      it('should throw error when updating with whitespace-only detail', () => {
        const interview = Interview.create(createValidInterviewData());
        
        expect(() => interview.updateDetail('   ')).toThrow(
          'Detail cannot be empty'
        );
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize interview to JSON', () => {
      const interviewData = createValidInterviewData();
      const interview = Interview.create(interviewData);
      
      const json = interview.toJSON();
      
      expect(json.id).toBe(interview.id);
      expect(json.base).toBe(interviewData.base);
      expect(json.company).toBe(interviewData.company);
      expect(json.role).toBe(interviewData.role);
      expect(json.status).toBe(InterviewStatus.SCHEDULED);
      expect(json.recruiter).toBe(interviewData.recruiter);
      expect(json.attendees).toEqual(interviewData.attendees);
    });

    it('should include bidId in JSON for BID-based interview', () => {
      const interviewData = createValidInterviewData(InterviewBase.BID);
      const interview = Interview.create(interviewData);
      
      const json = interview.toJSON();
      
      expect(json.bidId).toBe('bid-123');
    });

    it('should have null bidId in JSON for LINKEDIN_CHAT interview', () => {
      const interviewData = createValidInterviewData(InterviewBase.LINKEDIN_CHAT);
      const interview = Interview.create(interviewData);
      
      const json = interview.toJSON();
      
      expect(json.bidId).toBeNull();
    });
  });
});
