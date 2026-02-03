import { CreateBidUseCase, CreateBidRequest } from './CreateBidUseCase';
import { IBidRepository } from './IBidRepository';
import { IResumeRepository } from './IResumeRepository';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Bid, BidStatus, BidOrigin } from '../domain/Bid';

describe('CreateBidUseCase', () => {
  let useCase: CreateBidUseCase;
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

    useCase = new CreateBidUseCase(mockBidRepository, duplicationPolicy, companyHistory);
  });

  const createValidRequest = (): CreateBidRequest => ({
    link: 'https://example.com/job/123',
    company: 'TechCorp',
    client: 'ClientCo',
    role: 'Software Engineer',
    mainStacks: ['TypeScript', 'React'],
    jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
    resumePath: 'TechCorp_Software_Engineer/resume.pdf',
    origin: BidOrigin.LINKEDIN,
    recruiter: 'John Doe',
  });

  describe('successful bid creation without warnings', () => {
    it('should create a bid when all fields are valid and no duplicates exist', async () => {
      // Arrange
      const request = createValidRequest();
      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.bidId).toBeDefined();
      expect(response.warnings).toEqual([]);
      expect(response.companyWarning).toBeNull();
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);
      
      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid).toBeInstanceOf(Bid);
      expect(savedBid.company).toBe(request.company);
      expect(savedBid.role).toBe(request.role);
      expect(savedBid.bidStatus).toBe(BidStatus.NEW);
      expect(savedBid.interviewWinning).toBe(false);
    });
  });

  describe('bid creation with duplication prevention', () => {
    it('should throw error and NOT save when link matches existing bid', async () => {
      // Arrange
      const request = createValidRequest();
      const existingBid = Bid.create({
        link: request.link,
        company: 'DifferentCorp',
        client: request.client,
        role: 'Different Role',
        mainStacks: request.mainStacks,
        jobDescriptionPath: request.jobDescriptionPath,
        resumePath: request.resumePath!,
        origin: request.origin,
        recruiter: request.recruiter,
      });
      mockBidRepository.findAll.mockResolvedValue([existingBid]);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Duplicate bid detected');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error and NOT save when company and role match', async () => {
      // Arrange
      const request = createValidRequest();
      const existingBid = Bid.create({
        link: 'https://different.com/job/456',
        company: request.company,
        client: request.client,
        role: request.role,
        mainStacks: request.mainStacks,
        jobDescriptionPath: request.jobDescriptionPath,
        resumePath: request.resumePath!,
        origin: request.origin,
        recruiter: request.recruiter,
      });
      mockBidRepository.findAll.mockResolvedValue([existingBid]);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Duplicate bid detected');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error and NOT save when both link and company-role match', async () => {
      // Arrange
      const request = createValidRequest();
      const existingBid = Bid.create({
        link: request.link,
        company: request.company,
        client: request.client,
        role: request.role,
        mainStacks: request.mainStacks,
        jobDescriptionPath: request.jobDescriptionPath,
        resumePath: request.resumePath!,
        origin: request.origin,
        recruiter: request.recruiter,
      });
      mockBidRepository.findAll.mockResolvedValue([existingBid]);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Duplicate bid detected');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('bid creation with company history warnings', () => {
    it('should attach company history warning when previous failures exist', async () => {
      // Arrange
      const request = createValidRequest();
      mockBidRepository.findAll.mockResolvedValue([]);

      // Record a failure in company history
      companyHistory.recordFailure(
        request.company,
        request.role,
        'John Recruiter',
        ['Jane Interviewer'],
        'interview-123'
      );

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.companyWarning).not.toBeNull();
      expect(response.companyWarning).toContain(request.company);
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.bidDetail).toContain(request.company);
    });

    it('should not attach warning when no previous failures exist', async () => {
      // Arrange
      const request = createValidRequest();
      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.companyWarning).toBeNull();
      
      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.bidDetail).toBe('');
    });
  });

  describe('validation error handling', () => {
    it('should throw error when link is missing', async () => {
      // Arrange
      const request = createValidRequest();
      delete (request as any).link;

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Missing required field: link');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when company is missing', async () => {
      // Arrange
      const request = createValidRequest();
      delete (request as any).company;

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Missing required field: company');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when role is missing', async () => {
      // Arrange
      const request = createValidRequest();
      delete (request as any).role;

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Missing required field: role');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when mainStacks is empty array', async () => {
      // Arrange
      const request = createValidRequest();
      request.mainStacks = [];

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('mainStacks cannot be empty');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when string field is empty', async () => {
      // Arrange
      const request = createValidRequest();
      request.company = '   ';

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Field company cannot be empty');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('combined scenarios', () => {
    it('should throw error when duplication exists even if company history warning exists', async () => {
      // Arrange
      const request = createValidRequest();
      const existingBid = Bid.create({
        link: request.link,
        company: request.company,
        client: request.client,
        role: request.role,
        mainStacks: request.mainStacks,
        jobDescriptionPath: request.jobDescriptionPath,
        resumePath: request.resumePath!,
        origin: request.origin,
        recruiter: request.recruiter,
      });
      mockBidRepository.findAll.mockResolvedValue([existingBid]);

      // Record a failure in company history
      companyHistory.recordFailure(
        request.company,
        request.role,
        'John Recruiter',
        ['Jane Interviewer'],
        'interview-123'
      );

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Duplicate bid detected');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('JD specification association', () => {
    it('should store jdSpecId when provided', async () => {
      // Arrange
      const request = createValidRequest();
      request.jdSpecId = 'jd-spec-123';
      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.bidId).toBeDefined();
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.jdSpecId).toBe('jd-spec-123');
    });

    it('should create bid without jdSpecId when not provided', async () => {
      // Arrange
      const request = createValidRequest();
      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.bidId).toBeDefined();
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.jdSpecId).toBeNull();
    });
  });

  describe('resume selection from history', () => {
    let mockResumeRepository: jest.Mocked<IResumeRepository>;
    let useCaseWithResumeRepo: CreateBidUseCase;

    beforeEach(() => {
      // Create mock resume repository
      mockResumeRepository = {
        getAllResumeMetadata: jest.fn(),
        getResumeFile: jest.fn(),
        fileExists: jest.fn(),
        findByJDSpecId: jest.fn(),
      };

      useCaseWithResumeRepo = new CreateBidUseCase(
        mockBidRepository,
        duplicationPolicy,
        companyHistory,
        mockResumeRepository
      );
    });

    it('should create bid with selected resume when resumeId is provided', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumeId: 'resume-id-123',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      const mockMetadata = {
        getId: () => 'resume-id-123',
        getFilePath: () => '/uploads/Google_Engineer_React,TypeScript/resume.pdf',
        getCompany: () => 'Google',
        getRole: () => 'Engineer',
        getTechStack: () => ({ getTechnologies: () => ['React', 'TypeScript'] }),
        getCreatedAt: () => new Date(),
      };

      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([mockMetadata as any]);
      mockResumeRepository.fileExists.mockResolvedValue(true);
      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCaseWithResumeRepo.execute(request);

      // Assert
      expect(response.bidId).toBeDefined();
      expect(mockResumeRepository.getAllResumeMetadata).toHaveBeenCalled();
      expect(mockResumeRepository.fileExists).toHaveBeenCalledWith('/uploads/Google_Engineer_React,TypeScript/resume.pdf');
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.resumePath).toBe('/uploads/Google_Engineer_React,TypeScript/resume.pdf');
    });

    it('should throw error when resumeId does not exist in repository', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumeId: 'non-existent-id',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);

      // Act & Assert
      await expect(useCaseWithResumeRepo.execute(request)).rejects.toThrow('Selected resume no longer exists');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when resume file does not exist on disk', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumeId: 'resume-id-123',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      const mockMetadata = {
        getId: () => 'resume-id-123',
        getFilePath: () => '/uploads/Google_Engineer_React,TypeScript/resume.pdf',
        getCompany: () => 'Google',
        getRole: () => 'Engineer',
        getTechStack: () => ({ getTechnologies: () => ['React', 'TypeScript'] }),
        getCreatedAt: () => new Date(),
      };

      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([mockMetadata as any]);
      mockResumeRepository.fileExists.mockResolvedValue(false);

      // Act & Assert
      await expect(useCaseWithResumeRepo.execute(request)).rejects.toThrow('Resume file not found');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when resumeId is provided but resume repository is not available', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumeId: 'resume-id-123',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      mockBidRepository.findAll.mockResolvedValue([]);

      // Act & Assert - using useCase without resume repository
      await expect(useCase.execute(request)).rejects.toThrow('Resume repository not available for resume selection');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when both resumePath and resumeId are provided', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        resumeId: 'resume-id-123',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      // Act & Assert
      await expect(useCaseWithResumeRepo.execute(request)).rejects.toThrow('Cannot provide both resumePath and resumeId');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when neither resumePath nor resumeId are provided', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      // Act & Assert
      await expect(useCaseWithResumeRepo.execute(request)).rejects.toThrow('Either resumePath or resumeId must be provided');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when resumeId is empty string', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumeId: '   ',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      // Act & Assert
      await expect(useCaseWithResumeRepo.execute(request)).rejects.toThrow('Field resumeId cannot be empty');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should maintain backward compatibility with resumePath only', async () => {
      // Arrange
      const request: CreateBidRequest = {
        link: 'https://example.com/job/123',
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.LINKEDIN,
        recruiter: 'John Doe',
      };

      mockBidRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await useCaseWithResumeRepo.execute(request);

      // Assert
      expect(response.bidId).toBeDefined();
      expect(mockResumeRepository.getAllResumeMetadata).not.toHaveBeenCalled();
      expect(mockResumeRepository.fileExists).not.toHaveBeenCalled();
      expect(mockBidRepository.save).toHaveBeenCalledTimes(1);

      const savedBid = mockBidRepository.save.mock.calls[0][0];
      expect(savedBid.resumePath).toBe('TechCorp_Software_Engineer/resume.pdf');
    });
  });
});