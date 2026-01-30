import request from 'supertest';
import express, { Express } from 'express';
import { BidController } from './BidController';
import { InMemoryBidRepository } from './InMemoryBidRepository';
import { InMemoryInterviewRepository } from './InMemoryInterviewRepository';
import { CreateBidUseCase } from '../application/CreateBidUseCase';
import { RebidWithNewResumeUseCase } from '../application/RebidWithNewResumeUseCase';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { FileStorageService } from './FileStorageService';
import { Bid, BidStatus, BidOrigin, RejectionReason } from '../domain/Bid';

describe('BidController Integration Tests', () => {
  let app: Express;
  let bidRepository: InMemoryBidRepository;
  let interviewRepository: InMemoryInterviewRepository;
  let createBidUseCase: CreateBidUseCase;
  let rebidUseCase: RebidWithNewResumeUseCase;
  let fileStorageService: FileStorageService;
  let bidController: BidController;

  beforeEach(() => {
    // Initialize dependencies
    bidRepository = new InMemoryBidRepository();
    interviewRepository = new InMemoryInterviewRepository();
    const duplicationPolicy = new DuplicationDetectionPolicy();
    const companyHistory = new CompanyHistory();
    fileStorageService = new FileStorageService('./test-uploads');

    createBidUseCase = new CreateBidUseCase(bidRepository, duplicationPolicy, companyHistory);
    rebidUseCase = new RebidWithNewResumeUseCase(
      bidRepository,
      interviewRepository,
      duplicationPolicy,
      companyHistory
    );

    bidController = new BidController(createBidUseCase, rebidUseCase, bidRepository, fileStorageService);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/bids', bidController.getRouter());
    
    // Add error handling middleware for tests
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(500).json({ error: err.message });
    });
  });

  afterEach(() => {
    // Clean up test uploads directory
    const fs = require('fs');
    const testUploadsDir = './test-uploads';
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  describe('POST /api/bids', () => {
    it('should create a new bid with valid data', async () => {
      const response = await request(app)
        .post('/api/bids')
        .field('link', 'https://example.com/job/123')
        .field('company', 'TechCorp')
        .field('client', 'TechCorp')
        .field('role', 'Software Engineer')
        .field('mainStacks', JSON.stringify(['TypeScript', 'Node.js']))
        .field('jobDescription', 'Build amazing software')
        .field('origin', BidOrigin.BID)
        .attach('resume', Buffer.from('fake pdf content'), 'resume.pdf')
        .expect(201);

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
      const response = await request(app)
        .post('/api/bids')
        .field('link', 'https://example.com/job/123')
        .field('company', 'TechCorp')
        .field('client', 'TechCorp')
        .field('role', 'Software Engineer')
        .field('mainStacks', 'TypeScript') // Invalid: string instead of array
        .field('jobDescription', 'Build amazing software')
        .field('origin', BidOrigin.BID)
        .attach('resume', Buffer.from('fake pdf content'), 'resume.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('mainStacks must be a valid JSON array');
    });

    it('should reject duplicate bids with error', async () => {
      // Create first bid
      await request(app)
        .post('/api/bids')
        .field('link', 'https://example.com/job/123')
        .field('company', 'TechCorp')
        .field('client', 'TechCorp')
        .field('role', 'Software Engineer')
        .field('mainStacks', JSON.stringify(['TypeScript', 'Node.js']))
        .field('jobDescription', 'Build amazing software')
        .field('origin', BidOrigin.BID)
        .attach('resume', Buffer.from('fake pdf content'), 'resume.pdf')
        .expect(201);

      // Attempt to create duplicate bid - should fail
      const response = await request(app)
        .post('/api/bids')
        .field('link', 'https://example.com/job/123')
        .field('company', 'TechCorp')
        .field('client', 'TechCorp')
        .field('role', 'Software Engineer')
        .field('mainStacks', JSON.stringify(['TypeScript', 'Node.js']))
        .field('jobDescription', 'Build amazing software')
        .field('origin', BidOrigin.BID)
        .attach('resume', Buffer.from('fake pdf content'), 'resume.pdf')
        .expect(500);

      expect(response.body.error).toContain('Duplicate bid detected');
      expect(response.body.error).toContain('Duplicate link detected');
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescriptionPath: 'Job 2',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescriptionPath: 'Job 2',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      bid1.markAsRejected(RejectionReason.ROLE_CLOSED);

      const bid2 = Bid.create({
        link: 'https://example.com/job/2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescriptionPath: 'Job 2',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      await bidRepository.save(bid1);
      await bidRepository.save(bid2);

      const response = await request(app)
        .get(`/api/bids?status=${BidStatus.REJECTED}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(BidStatus.REJECTED);
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      bid.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
      await bidRepository.save(bid);

      const response = await request(app)
        .post(`/api/bids/${bid.id}/rebid`)
        .field('newJobDescription', 'Updated job description')
        .attach('resume', Buffer.from('fake pdf content v2'), 'resume_v2.pdf');

      // Log error if not 201
      if (response.status !== 201) {
        console.log('Rebid error response:', response.body);
      }

      expect(response.status).toBe(201);
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
      });

      // Mark interview started (sets interviewWinning to true)
      bid.markInterviewStarted();
      await bidRepository.save(bid);

      const response = await request(app)
        .post(`/api/bids/${bid.id}/rebid`)
        .attach('resume', Buffer.from('fake pdf content v2'), 'resume_v2.pdf')
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
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
        jobDescriptionPath: 'Job 1',
        resumePath: 'resume_v1.pdf',
        origin: BidOrigin.BID,
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
