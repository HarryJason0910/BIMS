import { RebidWithNewResumeUseCase, RebidRequest } from './RebidWithNewResumeUseCase';
import { IBidRepository } from './IBidRepository';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Bid, BidStatus, BidOrigin, RejectionReason } from '../domain/Bid';

describe('RebidWithNewResumeUseCase', () => {
  let useCase: RebidWithNewResumeUseCase;
  let mockBidRepository: jest.Mocked<IBidRepository>;
  let duplicationPolicy: DuplicationDetectionPolicy;
  let companyHistory: CompanyHistory;

  beforeEach(() => {
    // Create mock repository
    mockBidRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findByLink: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    duplicationPolicy = new DuplicationDetectionPolicy();
    companyHistory = new CompanyHistory();

    useCase = new RebidWithNewResumeUseCase(mockBidRepository, duplicationPolicy, companyHistory);
  });

  const createOriginalBid = (): Bid => {
    return Bid.create({
      link: 'https://example.com/job/123',
      company: 'TechCorp',
      client: 'ClientCo',
      role: 'Software Engineer',
      mainStacks: ['TypeScript', 'React'],
      jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
      resumePath: 'TechCorp_Software_Engineer/resume_v1.pdf',
      origin: BidOrigin.BID,
    });
  };

  describe('successful rebid after rejection without interview', () => {
    it('should allow rebid when original bid was rejected and interviewWinning is false', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markAsRejected(RejectionReason.NO_RESPONSE);
      
      mockBidRepository.findById.mockResolvedValue(originalBid);
      mockBidRepository.findAll.mockResolvedValue([originalBid]);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(true);
      expect(response.newBidId).toBeDefined();
      expect(response.newBidId).not.toBe(originalBid.id);
      expect(response.reason).toContain('allowed');
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid).toBeInstanceOf(Bid);
      expect(savedBid.resumePath).toBe('TechCorp_Software_Engineer/resume_v2.pdf');
      expect(savedBid.company).toBe(originalBid.company);
      expect(savedBid.role).toBe(originalBid.role);
      expect(savedBid.link).toBe(originalBid.link);
      expect(savedBid.originalBidId).toBe(originalBid.id);
    });

    it('should use new job description when provided', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markAsRejected(RejectionReason.NO_RESPONSE);
      
      mockBidRepository.findById.mockResolvedValue(originalBid);
      mockBidRepository.findAll.mockResolvedValue([originalBid]);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
        newJobDescriptionPath: 'TechCorp_Software_Engineer/JD_updated.txt',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(true);
      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.jobDescriptionPath).toBe('TechCorp_Software_Engineer/JD_updated.txt');
    });

    it('should keep original job description when not provided', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markAsRejected(RejectionReason.NO_RESPONSE);
      
      mockBidRepository.findById.mockResolvedValue(originalBid);
      mockBidRepository.findAll.mockResolvedValue([originalBid]);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(true);
      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.jobDescriptionPath).toBe(originalBid.jobDescriptionPath);
    });
  });

  describe('rebid rejection when interviewWinning is true', () => {
    it('should reject rebid when original bid reached interview stage', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markInterviewStarted();
      
      mockBidRepository.findById.mockResolvedValue(originalBid);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(false);
      expect(response.newBidId).toBe('');
      expect(response.reason).toContain('Cannot rebid');
      expect(response.reason).toContain('interview stage');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should reject rebid when bid status is INTERVIEW_STAGE', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markInterviewStarted();
      
      mockBidRepository.findById.mockResolvedValue(originalBid);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(false);
      expect(originalBid.bidStatus).toBe(BidStatus.INTERVIEW_STAGE);
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when original bid is not found', async () => {
      // Arrange
      mockBidRepository.findById.mockResolvedValue(null);

      const request: RebidRequest = {
        originalBidId: 'non-existent-id',
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Original bid with ID non-existent-id not found');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('company history warnings', () => {
    it('should attach company history warning when previous failures exist', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markAsRejected(RejectionReason.NO_RESPONSE);
      
      mockBidRepository.findById.mockResolvedValue(originalBid);
      mockBidRepository.findAll.mockResolvedValue([originalBid]);

      // Record a failure in company history
      companyHistory.recordFailure(
        originalBid.company,
        originalBid.role,
        'John Recruiter',
        ['Jane Interviewer'],
        'interview-123'
      );

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(true);
      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.bidDetail).toContain(originalBid.company);
    });
  });

  describe('duplication detection', () => {
    it('should run duplication detection but still allow rebid', async () => {
      // Arrange
      const originalBid = createOriginalBid();
      originalBid.markAsRejected(RejectionReason.NO_RESPONSE);
      
      const existingBid = Bid.create({
        link: originalBid.link,
        company: originalBid.company,
        client: originalBid.client,
        role: originalBid.role,
        mainStacks: originalBid.mainStacks,
        jobDescriptionPath: originalBid.jobDescriptionPath,
        resumePath: 'TechCorp_Software_Engineer/different_resume.pdf',
        origin: BidOrigin.BID,
      });

      mockBidRepository.findById.mockResolvedValue(originalBid);
      mockBidRepository.findAll.mockResolvedValue([originalBid, existingBid]);

      const request: RebidRequest = {
        originalBidId: originalBid.id,
        newResumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.allowed).toBe(true);
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
