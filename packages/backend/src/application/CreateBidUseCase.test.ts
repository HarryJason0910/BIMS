import { CreateBidUseCase, CreateBidRequest } from './CreateBidUseCase';
import { IBidRepository } from './IBidRepository';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Bid, BidStatus } from '../domain/Bid';

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
        ...request,
        company: 'DifferentCorp',
        role: 'Different Role',
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
        ...request,
        link: 'https://different.com/job/456',
      });
      mockBidRepository.findAll.mockResolvedValue([existingBid]);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Duplicate bid detected');
      expect(mockBidRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error and NOT save when both link and company-role match', async () => {
      // Arrange
      const request = createValidRequest();
      const existingBid = Bid.create(request);
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
      const existingBid = Bid.create(request);
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
});
