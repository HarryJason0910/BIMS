import request from 'supertest';
import express, { Express } from 'express';
import { BidController } from './BidController';
import { InMemoryBidRepository } from './InMemoryBidRepository';
import { CreateBidUseCase } from '../application/CreateBidUseCase';
import { RebidWithNewResumeUseCase } from '../application/RebidWithNewResumeUseCase';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Bid, BidStatus } from '../domain/Bid';

describe('BidController Integration Tests', () => {
  let app: Express;
  let bidRepository: InMemoryBidRepository;
  let createBidUseCase: CreateBidUseCase;
  let rebidUseCase: RebidWithNewResumeUseCase;
  let bidController: BidController;

  beforeEach(() => {
    // Initialize dependencies
    bidRepository = new InMemoryBidRepository();
    const duplicationPolicy = new DuplicationDetectionPolicy();
    const companyHistory = new CompanyHistory();

    createBidUseCase = new CreateBidUseCase(bidRepository, duplicationPolicy, companyHistory);
    rebidUseCase = new RebidWithNewResumeUseCase(
      bidRepository,
      duplicationPolicy,
      companyHistory
    );

    bidController = new BidController(createBidUseCase, rebidUseCase, bidRepository);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/bids', bidController.getRouter());
  });

  describe('POST /api/bids', () => {
    it('should create a new bid with valid data', async () => {
      const bidData = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'Node.js'],
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
      };

      const response = await request(app).post('/api/bids').send(bidData).expect(201);

      expect(response.body).toHaveProperty('bidId');
      expect(response.body.warnings).toEqual([]);
      expect(response.body.companyWarning).toBeNull();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        // Missing other required fields
      };

      const response = await request(app).post('/api/bids').send(invalidData).expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 if mainStacks is not an array', async () => {
      const invalidData = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: 'TypeScript',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
      };

      const response = await request(app).post('/api/bids').send(invalidData).expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('mainStacks must be an array');
    });

    it('should return duplication warnings for duplicate bids', async () => {
      const bidData = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'Node.js'],
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
      };

      // Create first bid
      await request(app).post('/api/bids').send(bidData).expect(201);

      // Create duplicate bid
      const response = await request(app).post('/api/bids').send(bidData).expect(201);

      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body.warnings[0].type).toBe('LINK_MATCH');
    });
  });

  describe('GET /api/bids', () => {
    it('should return all bids', async () => {
      // Create test bids
      const bid1 = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescription: 'Job 2',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid1);
      await bidRepository.save(bid2);

      const response = await request(app).get('/api/bids').expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter bids by company', async () => {
      const bid1 = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescription: 'Job 2',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid1);
      await bidRepository.save(bid2);

      const response = await request(app).get('/api/bids?company=TechCorp').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].company).toBe('TechCorp');
    });

    it('should filter bids by status', async () => {
      const bid1 = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      bid1.markAsRejected();

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescription: 'Job 2',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid1);
      await bidRepository.save(bid2);

      const response = await request(app)
        .get(`/api/bids?status=${BidStatus.REJECTED}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].bidStatus).toBe(BidStatus.REJECTED);
    });
  });

  describe('GET /api/bids/:id', () => {
    it('should return a bid by id', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid);

      const response = await request(app).get(`/api/bids/${bid.id}`).expect(200);

      expect(response.body.id).toBe(bid.id);
      expect(response.body.company).toBe('TechCorp');
    });

    it('should return 404 for non-existent bid', async () => {
      const response = await request(app).get('/api/bids/non-existent-id').expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('POST /api/bids/:id/rebid', () => {
    it('should allow rebidding after rejection without interview', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      bid.markAsRejected();
      await bidRepository.save(bid);

      const rebidData = {
        newResume: 'resume_v2.pdf',
        newJobDescription: 'Updated job description',
      };

      const response = await request(app)
        .post(`/api/bids/${bid.id}/rebid`)
        .send(rebidData)
        .expect(201);

      expect(response.body.allowed).toBe(true);
      expect(response.body).toHaveProperty('newBidId');
    });

    it('should reject rebidding if interview was won', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      // Mark interview started (sets interviewWinning to true)
      bid.markInterviewStarted();
      await bidRepository.save(bid);

      const rebidData = {
        newResume: 'resume_v2.pdf',
      };

      const response = await request(app)
        .post(`/api/bids/${bid.id}/rebid`)
        .send(rebidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Rebid Not Allowed');
    });

    it('should return 400 for missing newResume', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid);

      const response = await request(app).post(`/api/bids/${bid.id}/rebid`).send({}).expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('DELETE /api/bids/:id', () => {
    it('should delete a bid', async () => {
      const bid = Bid.create({
        link: 'https://example.com/job/1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescription: 'Job 1',
        resume: 'resume_v1.pdf',
      });

      await bidRepository.save(bid);

      await request(app).delete(`/api/bids/${bid.id}`).expect(204);

      const deletedBid = await bidRepository.findById(bid.id);
      expect(deletedBid).toBeNull();
    });

    it('should return 404 when deleting non-existent bid', async () => {
      const response = await request(app).delete('/api/bids/non-existent-id').expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
