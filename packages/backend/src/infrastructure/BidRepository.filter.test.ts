/**
 * Unit tests for Bid Repository Filtering and Sorting
 * Tests filtering by company, role, status, date range and sorting functionality
 */

import { InMemoryBidRepository } from './InMemoryBidRepository';
import { Bid, BidStatus, BidOrigin, RejectionReason } from '../domain/Bid';

describe('BidRepository - Filtering and Sorting', () => {
  let repository: InMemoryBidRepository;

  beforeEach(() => {
    repository = new InMemoryBidRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  // Helper function to create test bids
  const createTestBid = (overrides: Partial<any> = {}) => {
    return Bid.create({
      link: overrides.link || 'https://example.com/job',
      company: overrides.company || 'TechCorp',
      client: overrides.client || 'ClientCorp',
      role: overrides.role || 'Software Engineer',
      mainStacks: overrides.mainStacks || ['TypeScript', 'React'],
      jobDescriptionPath: overrides.jobDescriptionPath || 'TechCorp_Software_Engineer/JD.txt',
      resumePath: overrides.resumePath || 'TechCorp_Software_Engineer/resume.pdf',
      origin: overrides.origin || BidOrigin.BID
    });
  };

  describe('Filtering by company', () => {
    it('should filter bids by company name (case-insensitive)', async () => {
      const bid1 = createTestBid({ company: 'TechCorp', link: 'https://example.com/1' });
      const bid2 = createTestBid({ company: 'DataCorp', link: 'https://example.com/2' });
      const bid3 = createTestBid({ company: 'TechStart', link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll({ company: 'tech' });

      expect(results).toHaveLength(2);
      expect(results.map(b => b.company)).toContain('TechCorp');
      expect(results.map(b => b.company)).toContain('TechStart');
    });

    it('should return empty array when no bids match company filter', async () => {
      const bid = createTestBid({ company: 'TechCorp' });
      await repository.save(bid);

      const results = await repository.findAll({ company: 'NonExistent' });

      expect(results).toHaveLength(0);
    });
  });

  describe('Filtering by role', () => {
    it('should filter bids by role (case-insensitive)', async () => {
      const bid1 = createTestBid({ role: 'Software Engineer', link: 'https://example.com/1' });
      const bid2 = createTestBid({ role: 'Senior Engineer', link: 'https://example.com/2' });
      const bid3 = createTestBid({ role: 'Product Manager', link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll({ role: 'engineer' });

      expect(results).toHaveLength(2);
      expect(results.map(b => b.role)).toContain('Software Engineer');
      expect(results.map(b => b.role)).toContain('Senior Engineer');
    });
  });

  describe('Filtering by status', () => {
    it('should filter bids by status', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });
      const bid3 = createTestBid({ link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      // Mark one as rejected
      bid2.markAsSubmitted();
      bid2.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
      await repository.update(bid2);

      const results = await repository.findAll({ status: BidStatus.REJECTED });

      expect(results).toHaveLength(1);
      expect(results[0].bidStatus).toBe(BidStatus.REJECTED);
    });
  });

  describe('Filtering by date range', () => {
    it('should filter bids by dateFrom', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });

      await repository.save(bid1);
      await repository.save(bid2);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await repository.findAll({ dateFrom: tomorrow });

      expect(results).toHaveLength(0);
    });

    it('should filter bids by dateTo', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });

      await repository.save(bid1);
      await repository.save(bid2);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const results = await repository.findAll({ dateTo: yesterday });

      expect(results).toHaveLength(0);
    });

    it('should filter bids within date range', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });

      await repository.save(bid1);
      await repository.save(bid2);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await repository.findAll({ dateFrom: yesterday, dateTo: tomorrow });

      expect(results).toHaveLength(2);
    });
  });

  describe('Multiple filters', () => {
    it('should apply multiple filters with AND logic', async () => {
      const bid1 = createTestBid({ 
        company: 'TechCorp', 
        role: 'Software Engineer',
        link: 'https://example.com/1' 
      });
      const bid2 = createTestBid({ 
        company: 'TechCorp', 
        role: 'Product Manager',
        link: 'https://example.com/2' 
      });
      const bid3 = createTestBid({ 
        company: 'DataCorp', 
        role: 'Software Engineer',
        link: 'https://example.com/3' 
      });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll({ 
        company: 'TechCorp', 
        role: 'Software' 
      });

      expect(results).toHaveLength(1);
      expect(results[0].company).toBe('TechCorp');
      expect(results[0].role).toBe('Software Engineer');
    });
  });

  describe('Sorting', () => {
    it('should sort bids by company ascending', async () => {
      const bid1 = createTestBid({ company: 'Zebra Corp', link: 'https://example.com/1' });
      const bid2 = createTestBid({ company: 'Alpha Corp', link: 'https://example.com/2' });
      const bid3 = createTestBid({ company: 'Beta Corp', link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll(undefined, { field: 'company', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].company).toBe('Alpha Corp');
      expect(results[1].company).toBe('Beta Corp');
      expect(results[2].company).toBe('Zebra Corp');
    });

    it('should sort bids by company descending', async () => {
      const bid1 = createTestBid({ company: 'Zebra Corp', link: 'https://example.com/1' });
      const bid2 = createTestBid({ company: 'Alpha Corp', link: 'https://example.com/2' });
      const bid3 = createTestBid({ company: 'Beta Corp', link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll(undefined, { field: 'company', order: 'desc' });

      expect(results).toHaveLength(3);
      expect(results[0].company).toBe('Zebra Corp');
      expect(results[1].company).toBe('Beta Corp');
      expect(results[2].company).toBe('Alpha Corp');
    });

    it('should sort bids by role', async () => {
      const bid1 = createTestBid({ role: 'Senior Engineer', link: 'https://example.com/1' });
      const bid2 = createTestBid({ role: 'Junior Engineer', link: 'https://example.com/2' });
      const bid3 = createTestBid({ role: 'Mid Engineer', link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll(undefined, { field: 'role', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].role).toBe('Junior Engineer');
      expect(results[1].role).toBe('Mid Engineer');
      expect(results[2].role).toBe('Senior Engineer');
    });

    it('should sort bids by status', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });
      const bid3 = createTestBid({ link: 'https://example.com/3' });

      bid1.markAsSubmitted();
      bid2.markAsSubmitted();
      bid2.markAsRejected(RejectionReason.UNSATISFIED_RESUME);

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll(undefined, { field: 'bidStatus', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].bidStatus).toBe(BidStatus.NEW);
      expect(results[1].bidStatus).toBe(BidStatus.REJECTED);
      expect(results[2].bidStatus).toBe(BidStatus.SUBMITTED);
    });
  });

  describe('Filtering and Sorting combined', () => {
    it('should filter and sort bids', async () => {
      const bid1 = createTestBid({ 
        company: 'TechCorp', 
        role: 'Senior Engineer',
        link: 'https://example.com/1' 
      });
      const bid2 = createTestBid({ 
        company: 'TechCorp', 
        role: 'Junior Engineer',
        link: 'https://example.com/2' 
      });
      const bid3 = createTestBid({ 
        company: 'DataCorp', 
        role: 'Mid Engineer',
        link: 'https://example.com/3' 
      });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll(
        { company: 'TechCorp' },
        { field: 'role', order: 'asc' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].role).toBe('Junior Engineer');
      expect(results[1].role).toBe('Senior Engineer');
    });
  });

  describe('No filters or sorting', () => {
    it('should return all bids when no filters or sorting provided', async () => {
      const bid1 = createTestBid({ link: 'https://example.com/1' });
      const bid2 = createTestBid({ link: 'https://example.com/2' });
      const bid3 = createTestBid({ link: 'https://example.com/3' });

      await repository.save(bid1);
      await repository.save(bid2);
      await repository.save(bid3);

      const results = await repository.findAll();

      expect(results).toHaveLength(3);
    });
  });
});
