/**
 * Unit tests for CalculateBidMatchRateUseCase
 */

import { CalculateBidMatchRateUseCase } from './CalculateBidMatchRateUseCase';
import { WeightedMatchRateCalculator } from '../domain/WeightedMatchRateCalculator';
import { Bid, BidOrigin } from '../domain/Bid';
import { LayerSkills } from '../domain/JDSpecTypes';
import { IBidRepository } from './IBidRepository';

describe('CalculateBidMatchRateUseCase', () => {
  let useCase: CalculateBidMatchRateUseCase;
  let mockBidRepository: jest.Mocked<IBidRepository>;
  let calculator: WeightedMatchRateCalculator;

  beforeEach(() => {
    mockBidRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
      findByCompany: jest.fn(),
      findByDateRange: jest.fn(),
      findOldSubmittedBids: jest.fn(),
      findByOrigin: jest.fn()
    } as jest.Mocked<IBidRepository>;

    calculator = new WeightedMatchRateCalculator();
    useCase = new CalculateBidMatchRateUseCase(mockBidRepository, calculator);
  });

  const createTestBid = (id: string, company: string, role: string, skills: LayerSkills): Bid => {
    return Bid.create({
      id,
      link: `https://example.com/${id}`,
      company,
      client: 'Client A',
      role,
      mainStacks: skills,
      jobDescriptionPath: `/path/to/${id}.pdf`,
      resumePath: '/path/to/resume.pdf',
      origin: BidOrigin.BID
    });
  };

  describe('execute', () => {
    it('should calculate match rates for all other bids', async () => {
      const currentSkills: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.5 }
        ],
        backend: [{ skill: 'python', weight: 1.0 }],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const matchedSkills1: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.7 },
          { skill: 'vue', weight: 0.3 }
        ],
        backend: [{ skill: 'python', weight: 1.0 }],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const matchedSkills2: LayerSkills = {
        frontend: [{ skill: 'angular', weight: 1.0 }],
        backend: [{ skill: 'java', weight: 1.0 }],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', currentSkills);
      const matchedBid1 = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', matchedSkills1);
      const matchedBid2 = createTestBid('bid3', 'Company C', 'Senior Frontend Developer', matchedSkills2);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, matchedBid1, matchedBid2]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(2);
      expect(results[0].bidId).toBe('bid2'); // Higher match rate
      expect(results[1].bidId).toBe('bid3'); // Lower match rate
      expect(results[0].matchRate).toBeGreaterThan(results[1].matchRate);
    });

    it('should sort results by match rate descending', async () => {
      const currentSkills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const perfectMatch: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const partialMatch: LayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'vue', weight: 0.5 }
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const noMatch: LayerSkills = {
        frontend: [{ skill: 'angular', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', currentSkills);
      const bid2 = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', perfectMatch);
      const bid3 = createTestBid('bid3', 'Company C', 'Senior Frontend Developer', partialMatch);
      const bid4 = createTestBid('bid4', 'Company D', 'Senior Frontend Developer', noMatch);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, bid2, bid3, bid4]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(3);
      expect(results[0].bidId).toBe('bid2'); // Perfect match
      expect(results[1].bidId).toBe('bid3'); // Partial match
      expect(results[2].bidId).toBe('bid4'); // No match
      expect(results[0].matchRate).toBeCloseTo(1.0, 2);
      expect(results[2].matchRate).toBe(0.0);
    });

    it('should include layer breakdown in results', async () => {
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
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', currentSkills);
      const matchedBid = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', matchedSkills);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, matchedBid]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(1);
      expect(results[0].layerBreakdown).toBeDefined();
      expect(results[0].layerBreakdown.frontend).toBeDefined();
      expect(results[0].layerBreakdown.frontend.matchingSkills).toContain('react');
      expect(results[0].layerBreakdown.frontend.missingSkills).toContain('typescript');
      expect(results[0].layerBreakdown.frontend.layerWeight).toBe(0.70); // Frontend Developer weight
    });

    it('should return match rate as percentage', async () => {
      const skills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', skills);
      const matchedBid = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', skills);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, matchedBid]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(1);
      expect(results[0].matchRate).toBeCloseTo(1.0, 2);
      expect(results[0].matchRatePercentage).toBeCloseTo(100, 1);
    });

    it('should throw error if current bid not found', async () => {
      mockBidRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent')).rejects.toThrow('Bid not found: nonexistent');
    });

    it('should throw error if current bid uses legacy format', async () => {
      const legacyBid = Bid.create({
        id: 'bid1',
        link: 'https://example.com/job',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Backend Engineer',
        mainStacks: ['react', 'python'], // Legacy format
        jobDescriptionPath: '/path/to/jd.pdf',
        resumePath: '/path/to/resume.pdf',
        origin: BidOrigin.BID
      });

      mockBidRepository.findById.mockResolvedValue(legacyBid);

      await expect(useCase.execute('bid1')).rejects.toThrow(
        'Current bid must use LayerSkills format for match rate calculation'
      );
    });

    it('should exclude current bid from results', async () => {
      const skills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', skills);
      const otherBid = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', skills);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, otherBid]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(1);
      expect(results[0].bidId).toBe('bid2');
      expect(results.find(r => r.bidId === 'bid1')).toBeUndefined();
    });

    it('should exclude legacy format bids from comparison', async () => {
      const newFormatSkills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', newFormatSkills);
      const newFormatBid = createTestBid('bid2', 'Company B', 'Senior Frontend Developer', newFormatSkills);
      
      const legacyBid = Bid.create({
        id: 'bid3',
        link: 'https://example.com/job3',
        company: 'Company C',
        client: 'Client C',
        role: 'Senior Backend Engineer',
        mainStacks: ['react', 'python'], // Legacy format
        jobDescriptionPath: '/path/to/jd3.pdf',
        resumePath: '/path/to/resume.pdf',
        origin: BidOrigin.BID
      });

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid, newFormatBid, legacyBid]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(1);
      expect(results[0].bidId).toBe('bid2');
      expect(results.find(r => r.bidId === 'bid3')).toBeUndefined();
    });

    it('should return empty array if no other bids exist', async () => {
      const skills: LayerSkills = {
        frontend: [{ skill: 'react', weight: 1.0 }],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      const currentBid = createTestBid('bid1', 'Company A', 'Senior Frontend Developer', skills);

      mockBidRepository.findById.mockResolvedValue(currentBid);
      mockBidRepository.findAll.mockResolvedValue([currentBid]);

      const results = await useCase.execute('bid1');

      expect(results).toHaveLength(0);
    });
  });
});
