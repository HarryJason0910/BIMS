import request from 'supertest';
import express, { Express } from 'express';
import { InterviewController } from './InterviewController';
import { InMemoryInterviewRepository } from './InMemoryInterviewRepository';
import { InMemoryBidRepository } from './InMemoryBidRepository';
import { InMemoryCompanyHistoryRepository } from './InMemoryCompanyHistoryRepository';
import { ScheduleInterviewUseCase } from '../application/ScheduleInterviewUseCase';
import { CompleteInterviewUseCase } from '../application/CompleteInterviewUseCase';
import { InterviewEligibilityPolicy } from '../domain/InterviewEligibilityPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Interview, InterviewBase } from '../domain/Interview';
import { Bid } from '../domain/Bid';

describe('InterviewController Integration Tests', () => {
  let app: Express;
  let interviewRepository: InMemoryInterviewRepository;
  let bidRepository: InMemoryBidRepository;
  let companyHistoryRepository: InMemoryCompanyHistoryRepository;

  beforeEach(() => {
    // Initialize dependencies
    interviewRepository = new InMemoryInterviewRepository();
    bidRepository = new InMemoryBidRepository();
    companyHistoryRepository = new InMemoryCompanyHistoryRepository();
    const eligibilityPolicy = new InterviewEligibilityPolicy();
    const companyHistory = new CompanyHistory();

    const scheduleInterviewUseCase = new ScheduleInterviewUseCase(
      interviewRepository,
      bidRepository,
      eligibilityPolicy,
      companyHistory
    );

    const completeInterviewUseCase = new CompleteInterviewUseCase(
      interviewRepository,
      bidRepository,
      companyHistory,
      companyHistoryRepository
    );

    const interviewController = new InterviewController(
      scheduleInterviewUseCase,
      completeInterviewUseCase,
      interviewRepository
    );

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/interviews', interviewController.getRouter());
  });

  describe('POST /api/interviews', () => {
    it('should schedule an interview from LinkedIn chat', async () => {
      const interviewData = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith', 'Bob Johnson'],
        detail: 'Initial screening',
      };

      const response = await request(app).post('/api/interviews').send(interviewData).expect(201);

      expect(response.body).toHaveProperty('interviewId');
      expect(response.body.eligibilityResult.allowed).toBe(true);
    });

    it('should schedule an interview from bid', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
      });
      await bidRepository.save(bid);

      const interviewData = {
        base: InterviewBase.BID,
        bidId: bid.id,
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Initial screening',
      };

      const response = await request(app).post('/api/interviews').send(interviewData).expect(201);

      expect(response.body).toHaveProperty('interviewId');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
      };

      await request(app).post('/api/interviews').send(invalidData).expect(400);
    });

    it('should return 400 for invalid base value', async () => {
      const invalidData = {
        base: 'INVALID',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Test',
      };

      const response = await request(app).post('/api/interviews').send(invalidData).expect(400);
      expect(response.body.message).toContain('base must be either');
    });
  });

  describe('GET /api/interviews', () => {
    it('should return all interviews', async () => {
      const interview1 = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Interview 1',
      });

      await interviewRepository.save(interview1);

      const response = await request(app).get('/api/interviews').expect(200);
      expect(response.body).toHaveLength(1);
    });

    it('should filter interviews by company', async () => {
      const interview1 = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Interview 1',
      });

      const interview2 = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        jobDescription: 'Job 2',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'Bob Johnson',
        attendees: ['Alice Brown'],
        detail: 'Interview 2',
      });

      await interviewRepository.save(interview1);
      await interviewRepository.save(interview2);

      const response = await request(app).get('/api/interviews?company=TechCorp').expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].company).toBe('TechCorp');
    });
  });

  describe('GET /api/interviews/:id', () => {
    it('should return an interview by id', async () => {
      const interview = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Interview 1',
      });

      await interviewRepository.save(interview);

      const response = await request(app).get(`/api/interviews/${interview.id}`).expect(200);
      expect(response.body.id).toBe(interview.id);
    });

    it('should return 404 for non-existent interview', async () => {
      await request(app).get('/api/interviews/non-existent-id').expect(404);
    });
  });

  describe('POST /api/interviews/:id/complete', () => {
    it('should complete an interview successfully', async () => {
      const interview = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Interview 1',
      });

      await interviewRepository.save(interview);

      const completeData = {
        success: true,
        detail: 'Great interview!',
      };

      const response = await request(app)
        .post(`/api/interviews/${interview.id}/complete`)
        .send(completeData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/interviews/:id', () => {
    it('should delete an interview', async () => {
      const interview = Interview.create({
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
        interviewType: 'HR',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        detail: 'Interview 1',
      });

      await interviewRepository.save(interview);

      await request(app).delete(`/api/interviews/${interview.id}`).expect(204);

      const deletedInterview = await interviewRepository.findById(interview.id);
      expect(deletedInterview).toBeNull();
    });
  });
});
