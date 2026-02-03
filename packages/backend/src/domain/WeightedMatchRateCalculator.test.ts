/**
 * Unit tests for WeightedMatchRateCalculator
 */

import { WeightedMatchRateCalculator } from './WeightedMatchRateCalculator';
import { Bid, BidOrigin } from './Bid';
import { LayerSkills } from './JDSpecTypes';

describe('WeightedMatchRateCalculator', () => {
  let calculator: WeightedMatchRateCalculator;

  beforeEach(() => {
    calculator = new WeightedMatchRateCalculator();
  });

  describe('calculate', () => {
    it('should return 1.0 for perfect match (same skills, same weights)', () => {
      const skills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.3 },
          { skill: 'javascript', weight: 0.2 }
        ],
        backend: [
          { skill: 'python', weight: 0.6 },
          { skill: 'fastapi', weight: 0.4 }
        ],
        database: [{ skill: 'postgresql', weight: 1.0 }],
        cloud: [{ skill: 'aws', weight: 1.0 }],
        devops: [],
        others: []
      };

      const bid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Backend Engineer',
        mainStacks: skills,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Backend Engineer',
        mainStacks: skills,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(bid1, bid2);
      expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
    });

    it('should return 0.0 for disjoint skills', () => {
      const skills1: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const skills2: LayerSkills = {
        frontend: [{ skill: 'vue', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const bid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Frontend Developer',
        mainStacks: skills1,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Frontend Developer',
        mainStacks: skills2,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(bid1, bid2);
      expect(result.overallMatchRate).toBe(0.0);
    });

    it('should calculate partial match with weighted products (example from design doc)', () => {
      // Current JD: React (0.5), TypeScript (0.3), JavaScript (0.2)
      // Matched JD: React (0.7), Vue (0.3)
      // Expected: React matches: 0.5 × 0.7 = 0.35
      
      const currentSkills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.3 },
          { skill: 'javascript', weight: 0.2 }
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const matchedSkills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.7 },
          { skill: 'vue', weight: 0.3 }
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Frontend Developer',
        mainStacks: currentSkills,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const matchedBid = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Frontend Developer',
        mainStacks: matchedSkills,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(currentBid, matchedBid);
      
      // Frontend layer score: 0.5 × 0.7 = 0.35
      // Frontend weight: 0.70 (from Frontend Developer role)
      // Overall: 0.35 × 0.70 = 0.245
      const frontendLayerResult = result.layerBreakdown.get('frontend');
      expect(frontendLayerResult?.score).toBeCloseTo(0.35, 3);
      expect(result.overallMatchRate).toBeCloseTo(0.35 * 0.70, 3);
    });

    it('should be case-insensitive for skill matching', () => {
      const skills1: LayerSkills = {
        frontend: [{ skill: 'React', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const skills2: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const bid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Frontend Developer',
        mainStacks: skills1,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Frontend Developer',
        mainStacks: skills2,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(bid1, bid2);
      expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
    });

    it('should handle empty layers correctly', () => {
      const skills1: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const skills2: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [{ skill: 'python', weight: 1.0 }],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const bid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Frontend Developer',
        mainStacks: skills1,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Frontend Developer',
        mainStacks: skills2,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(bid1, bid2);
      
      // Frontend matches perfectly
      const frontendResult = result.layerBreakdown.get('frontend');
      expect(frontendResult?.score).toBeCloseTo(1.0, 3);
      
      // Backend is empty in bid1, so score is 0
      const backendResult = result.layerBreakdown.get('backend');
      expect(backendResult?.score).toBe(0);
    });

    it('should apply layer weights correctly', () => {
      const skills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [{ skill: 'python', weight: 1.0 }],
        database: [{ skill: 'postgresql', weight: 1.0 }],
        cloud: [],
        devops: [],
        others: []
      };

      const bid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Balanced Full Stack Engineer',
        mainStacks: skills,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Balanced Full Stack Engineer',
        mainStacks: skills,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(bid1, bid2);
      
      // All skills match perfectly, so overall should be 1.0
      expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
      
      // Check layer weights are included in breakdown
      const frontendResult = result.layerBreakdown.get('frontend');
      expect(frontendResult?.layerWeight).toBe(0.35); // Balanced Full Stack
    });

    it('should include matching and missing skills in breakdown', () => {
      const currentSkills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.5 }
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const matchedSkills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 1.0 }
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Frontend Developer',
        mainStacks: currentSkills,
        jobDescriptionPath: '/path/to/jd1.pdf',
        resumePath: '/path/to/resume1.pdf',
        origin: BidOrigin.BID
      });

      const matchedBid = Bid.create({
        link: 'https://example.com/job2',
        company: 'Company B',
        client: 'Client B',
        role: 'Senior Frontend Developer',
        mainStacks: matchedSkills,
        jobDescriptionPath: '/path/to/jd2.pdf',
        resumePath: '/path/to/resume2.pdf',
        origin: BidOrigin.BID
      });

      const result = calculator.calculate(currentBid, matchedBid);
      const frontendResult = result.layerBreakdown.get('frontend');
      
      expect(frontendResult?.matchingSkills).toEqual(['react']);
      expect(frontendResult?.missingSkills).toEqual(['typescript']);
    });
  });
});
