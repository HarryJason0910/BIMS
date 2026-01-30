/**
 * Unit Tests for Resume Checker Service
 * 
 * These tests verify specific edge cases and scenarios for the Resume Checker Service.
 */

import { ResumeCheckerService } from './ResumeCheckerService';
import { Bid, ResumeCheckerType, CreateBidData, BidOrigin } from './Bid';

describe('ResumeCheckerService Unit Tests', () => {
  const service = new ResumeCheckerService();

  // Helper function to create a bid with a specific submission date
  function createBidWithDate(submissionDate: Date): Bid {
    const bidData: CreateBidData = {
      link: 'https://example.com/job/123',
      company: 'Test Company',
      client: 'Test Client',
      role: 'Software Engineer',
      mainStacks: ['TypeScript', 'Node.js'],
      jobDescriptionPath: 'Test job description',
      resumePath: 'Test resume',
      origin: BidOrigin.BID
    };
    
    const bid = Bid.create(bidData);
    
    // Override the date using Object.defineProperty to simulate different submission dates
    Object.defineProperty(bid, 'date', {
      value: submissionDate,
      writable: false,
      configurable: true
    });
    
    return bid;
  }

  // Helper function to add days to a date
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  describe('Edge Case: Rejection within 1 day', () => {
    it('should infer ATS with high confidence for same-day rejection', () => {
      const submissionDate = new Date('2024-01-01');
      submissionDate.setHours(0, 0, 0, 0);
      
      const bid = createBidWithDate(submissionDate);
      const rejectionDate = new Date(submissionDate); // Same day
      
      const inference = service.inferScreeningType(bid, rejectionDate, []);
      
      expect(inference.type).toBe(ResumeCheckerType.ATS);
      expect(inference.confidence).toBeGreaterThanOrEqual(0.8);
      expect(inference.confidence).toBeLessThanOrEqual(1.0);
      expect(inference.reasoning).toContain('0 day');
      expect(inference.reasoning.toLowerCase()).toContain('ats');
    });

    it('should infer ATS with high confidence for 1-day rejection', () => {
      const submissionDate = new Date('2024-01-01');
      submissionDate.setHours(0, 0, 0, 0);
      
      const bid = createBidWithDate(submissionDate);
      const rejectionDate = addDays(submissionDate, 1);
      
      const inference = service.inferScreeningType(bid, rejectionDate, []);
      
      expect(inference.type).toBe(ResumeCheckerType.ATS);
      expect(inference.confidence).toBeGreaterThanOrEqual(0.8);
      expect(inference.confidence).toBeLessThanOrEqual(1.0);
      expect(inference.reasoning).toContain('1 day');
      expect(inference.reasoning.toLowerCase()).toContain('ats');
    });
  });

  describe('Edge Case: Rejection after 10 days', () => {
    it('should infer RECRUITER with high confidence for 10-day rejection', () => {
      const submissionDate = new Date('2024-01-01');
      submissionDate.setHours(0, 0, 0, 0);
      
      const bid = createBidWithDate(submissionDate);
      const rejectionDate = addDays(submissionDate, 10);
      
      const inference = service.inferScreeningType(bid, rejectionDate, []);
      
      expect(inference.type).toBe(ResumeCheckerType.RECRUITER);
      expect(inference.confidence).toBeGreaterThanOrEqual(0.8);
      expect(inference.confidence).toBeLessThanOrEqual(1.0);
      expect(inference.reasoning).toContain('10 day');
      expect(inference.reasoning.toLowerCase()).toContain('recruiter');
    });
  });

  describe('Edge Case: Rejection at 3-4 day boundary', () => {
    it('should handle 3-day rejection gracefully (ATS)', () => {
      const submissionDate = new Date('2024-01-01');
      submissionDate.setHours(0, 0, 0, 0);
      
      const bid = createBidWithDate(submissionDate);
      const rejectionDate = addDays(submissionDate, 3);
      
      const inference = service.inferScreeningType(bid, rejectionDate, []);
      
      expect(inference.type).toBe(ResumeCheckerType.ATS);
      expect(inference.confidence).toBeGreaterThanOrEqual(0.5);
      expect(inference.confidence).toBeLessThanOrEqual(1.0);
      expect(inference.reasoning).toContain('3 day');
    });

    it('should handle 4-day rejection gracefully (RECRUITER)', () => {
      const submissionDate = new Date('2024-01-01');
      submissionDate.setHours(0, 0, 0, 0);
      
      const bid = createBidWithDate(submissionDate);
      const rejectionDate = addDays(submissionDate, 4);
      
      const inference = service.inferScreeningType(bid, rejectionDate, []);
      
      expect(inference.type).toBe(ResumeCheckerType.RECRUITER);
      expect(inference.confidence).toBeGreaterThanOrEqual(0.5);
      expect(inference.confidence).toBeLessThanOrEqual(1.0);
      expect(inference.reasoning).toContain('4 day');
    });
  });
});
