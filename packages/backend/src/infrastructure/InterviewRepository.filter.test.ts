/**
 * Unit tests for Interview Repository Filtering and Sorting
 * Tests filtering by company, role, status, date range and sorting functionality
 */

import { InMemoryInterviewRepository } from './InMemoryInterviewRepository';
import { Interview, InterviewBase, InterviewStatus } from '../domain/Interview';

describe('InterviewRepository - Filtering and Sorting', () => {
  let repository: InMemoryInterviewRepository;

  beforeEach(() => {
    repository = new InMemoryInterviewRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  // Helper function to create test interviews
  const createTestInterview = (overrides: Partial<any> = {}) => {
    return Interview.create({
      base: overrides.base || InterviewBase.LINKEDIN_CHAT,
      company: overrides.company || 'TechCorp',
      client: overrides.client || 'ClientCorp',
      role: overrides.role || 'Software Engineer',
      jobDescription: overrides.jobDescription || 'Job description',
      resume: overrides.resume || 'Resume v1',
      interviewType: overrides.interviewType || 'HR',
      recruiter: overrides.recruiter || 'John Doe',
      attendees: overrides.attendees || ['Jane Smith'],
      detail: overrides.detail || 'Interview details',
      bidId: overrides.bidId,
    });
  };

  describe('Filtering by company', () => {
    it('should filter interviews by company name (case-insensitive)', async () => {
      const interview1 = createTestInterview({ company: 'TechCorp' });
      const interview2 = createTestInterview({ company: 'DataCorp' });
      const interview3 = createTestInterview({ company: 'TechStart' });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll({ company: 'tech' });

      expect(results).toHaveLength(2);
      expect(results.map(i => i.company)).toContain('TechCorp');
      expect(results.map(i => i.company)).toContain('TechStart');
    });

    it('should return empty array when no interviews match company filter', async () => {
      const interview = createTestInterview({ company: 'TechCorp' });
      await repository.save(interview);

      const results = await repository.findAll({ company: 'NonExistent' });

      expect(results).toHaveLength(0);
    });
  });

  describe('Filtering by role', () => {
    it('should filter interviews by role (case-insensitive)', async () => {
      const interview1 = createTestInterview({ role: 'Software Engineer' });
      const interview2 = createTestInterview({ role: 'Senior Engineer' });
      const interview3 = createTestInterview({ role: 'Product Manager' });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll({ role: 'engineer' });

      expect(results).toHaveLength(2);
      expect(results.map(i => i.role)).toContain('Software Engineer');
      expect(results.map(i => i.role)).toContain('Senior Engineer');
    });
  });

  describe('Filtering by status', () => {
    it('should filter interviews by status', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();
      const interview3 = createTestInterview();

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      // Mark one as completed
      interview2.markAsCompleted(true);
      await repository.update(interview2);

      const results = await repository.findAll({ status: InterviewStatus.COMPLETED_SUCCESS });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(InterviewStatus.COMPLETED_SUCCESS);
    });

    it('should filter interviews by SCHEDULED status', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();
      const interview3 = createTestInterview();

      interview2.markAsCompleted(false);

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll({ status: InterviewStatus.SCHEDULED });

      expect(results).toHaveLength(2);
      expect(results.every(i => i.status === InterviewStatus.SCHEDULED)).toBe(true);
    });
  });

  describe('Filtering by date range', () => {
    it('should filter interviews by dateFrom', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();

      await repository.save(interview1);
      await repository.save(interview2);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await repository.findAll({ dateFrom: tomorrow });

      expect(results).toHaveLength(0);
    });

    it('should filter interviews by dateTo', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();

      await repository.save(interview1);
      await repository.save(interview2);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const results = await repository.findAll({ dateTo: yesterday });

      expect(results).toHaveLength(0);
    });

    it('should filter interviews within date range', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();

      await repository.save(interview1);
      await repository.save(interview2);

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
      const interview1 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Software Engineer'
      });
      const interview2 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Product Manager'
      });
      const interview3 = createTestInterview({ 
        company: 'DataCorp', 
        role: 'Software Engineer'
      });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll({ 
        company: 'TechCorp', 
        role: 'Software' 
      });

      expect(results).toHaveLength(1);
      expect(results[0].company).toBe('TechCorp');
      expect(results[0].role).toBe('Software Engineer');
    });

    it('should filter by company, role, and status', async () => {
      const interview1 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Software Engineer'
      });
      const interview2 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Software Engineer'
      });
      const interview3 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Product Manager'
      });

      interview2.markAsCompleted(true);

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll({ 
        company: 'TechCorp', 
        role: 'Software',
        status: InterviewStatus.SCHEDULED
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(InterviewStatus.SCHEDULED);
    });
  });

  describe('Sorting', () => {
    it('should sort interviews by company ascending', async () => {
      const interview1 = createTestInterview({ company: 'Zebra Corp' });
      const interview2 = createTestInterview({ company: 'Alpha Corp' });
      const interview3 = createTestInterview({ company: 'Beta Corp' });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(undefined, { field: 'company', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].company).toBe('Alpha Corp');
      expect(results[1].company).toBe('Beta Corp');
      expect(results[2].company).toBe('Zebra Corp');
    });

    it('should sort interviews by company descending', async () => {
      const interview1 = createTestInterview({ company: 'Zebra Corp' });
      const interview2 = createTestInterview({ company: 'Alpha Corp' });
      const interview3 = createTestInterview({ company: 'Beta Corp' });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(undefined, { field: 'company', order: 'desc' });

      expect(results).toHaveLength(3);
      expect(results[0].company).toBe('Zebra Corp');
      expect(results[1].company).toBe('Beta Corp');
      expect(results[2].company).toBe('Alpha Corp');
    });

    it('should sort interviews by role', async () => {
      const interview1 = createTestInterview({ role: 'Senior Engineer' });
      const interview2 = createTestInterview({ role: 'Junior Engineer' });
      const interview3 = createTestInterview({ role: 'Mid Engineer' });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(undefined, { field: 'role', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].role).toBe('Junior Engineer');
      expect(results[1].role).toBe('Mid Engineer');
      expect(results[2].role).toBe('Senior Engineer');
    });

    it('should sort interviews by status', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();
      const interview3 = createTestInterview();

      interview1.markAsCompleted(true);
      interview2.markAsCompleted(false);

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(undefined, { field: 'status', order: 'asc' });

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe(InterviewStatus.COMPLETED_FAILURE);
      expect(results[1].status).toBe(InterviewStatus.COMPLETED_SUCCESS);
      expect(results[2].status).toBe(InterviewStatus.SCHEDULED);
    });
  });

  describe('Filtering and Sorting combined', () => {
    it('should filter and sort interviews', async () => {
      const interview1 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Senior Engineer'
      });
      const interview2 = createTestInterview({ 
        company: 'TechCorp', 
        role: 'Junior Engineer'
      });
      const interview3 = createTestInterview({ 
        company: 'DataCorp', 
        role: 'Mid Engineer'
      });

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(
        { company: 'TechCorp' },
        { field: 'role', order: 'asc' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].role).toBe('Junior Engineer');
      expect(results[1].role).toBe('Senior Engineer');
    });

    it('should filter by status and sort by company', async () => {
      const interview1 = createTestInterview({ company: 'Zebra Corp' });
      const interview2 = createTestInterview({ company: 'Alpha Corp' });
      const interview3 = createTestInterview({ company: 'Beta Corp' });

      interview2.markAsCompleted(true);

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll(
        { status: InterviewStatus.SCHEDULED },
        { field: 'company', order: 'asc' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].company).toBe('Beta Corp');
      expect(results[1].company).toBe('Zebra Corp');
    });
  });

  describe('No filters or sorting', () => {
    it('should return all interviews when no filters or sorting provided', async () => {
      const interview1 = createTestInterview();
      const interview2 = createTestInterview();
      const interview3 = createTestInterview();

      await repository.save(interview1);
      await repository.save(interview2);
      await repository.save(interview3);

      const results = await repository.findAll();

      expect(results).toHaveLength(3);
    });
  });
});
