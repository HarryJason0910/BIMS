import { ScheduleInterviewUseCase, ScheduleInterviewRequest } from './ScheduleInterviewUseCase';
import { IInterviewRepository } from './IInterviewRepository';
import { IBidRepository } from './IBidRepository';
import { InterviewEligibilityPolicy } from '../domain/InterviewEligibilityPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Interview, InterviewBase, InterviewStatus } from '../domain/Interview';
import { Bid, BidStatus } from '../domain/Bid';

describe('ScheduleInterviewUseCase', () => {
  let useCase: ScheduleInterviewUseCase;
  let mockInterviewRepository: jest.Mocked<IInterviewRepository>;
  let mockBidRepository: jest.Mocked<IBidRepository>;
  let eligibilityPolicy: InterviewEligibilityPolicy;
  let companyHistory: CompanyHistory;

  beforeEach(() => {
    // Create mock repositories
    mockInterviewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findByBidId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockBidRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findByLink: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    eligibilityPolicy = new InterviewEligibilityPolicy();
    companyHistory = new CompanyHistory();

    useCase = new ScheduleInterviewUseCase(
      mockInterviewRepository,
      mockBidRepository,
      eligibilityPolicy,
      companyHistory
    );
  });

  const createValidBid = (): Bid => {
    return Bid.create({
      link: 'https://example.com/job/123',
      company: 'TechCorp',
      client: 'ClientCo',
      role: 'Software Engineer',
      mainStacks: ['TypeScript', 'React'],
      jobDescription: 'Build amazing software',
      resume: 'resume_v1.pdf',
    });
  };

  describe('successful interview scheduling from bid', () => {
    it('should schedule interview when base is BID and eligibility is allowed', async () => {
      // Arrange
      const bid = createValidBid();
      mockBidRepository.findById.mockResolvedValue(bid);

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.BID,
        bidId: bid.id,
        company: '', // Will be populated from bid
        client: '',
        role: '',
        jobDescription: '',
        resume: '',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'First round technical interview',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.interviewId).toBeDefined();
      expect(response.eligibilityResult.allowed).toBe(true);
      expect(mockInterviewRepository.save).toHaveBeenCalledTimes(1);

      const savedInterview = mockInterviewRepository.save.mock.calls[0][0];
      expect(savedInterview).toBeInstanceOf(Interview);
      expect(savedInterview.company).toBe(bid.company);
      expect(savedInterview.role).toBe(bid.role);
      expect(savedInterview.bidId).toBe(bid.id);
      expect(savedInterview.status).toBe(InterviewStatus.SCHEDULED);
    });

    it('should update bid when interview type is HR', async () => {
      // Arrange
      const bid = createValidBid();
      mockBidRepository.findById.mockResolvedValue(bid);

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.BID,
        bidId: bid.id,
        company: '',
        client: '',
        role: '',
        jobDescription: '',
        resume: '',
        interviewType: 'HR',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'HR screening',
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockBidRepository.update).toHaveBeenCalledTimes(1);
      const updatedBid = mockBidRepository.update.mock.calls[0][0];
      expect(updatedBid.interviewWinning).toBe(true);
      expect(updatedBid.bidStatus).toBe(BidStatus.INTERVIEW_STAGE);
    });

    it('should not update bid when interview type is not HR', async () => {
      // Arrange
      const bid = createValidBid();
      mockBidRepository.findById.mockResolvedValue(bid);

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.BID,
        bidId: bid.id,
        company: '',
        client: '',
        role: '',
        jobDescription: '',
        resume: '',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Technical round',
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockBidRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('successful interview scheduling from LinkedIn chat', () => {
    it('should schedule interview when base is LINKEDIN_CHAT', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'LinkedIn chat interview',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.interviewId).toBeDefined();
      expect(response.eligibilityResult.allowed).toBe(true);
      expect(mockInterviewRepository.save).toHaveBeenCalledTimes(1);

      const savedInterview = mockInterviewRepository.save.mock.calls[0][0];
      expect(savedInterview).toBeInstanceOf(Interview);
      expect(savedInterview.company).toBe(request.company);
      expect(savedInterview.role).toBe(request.role);
      expect(savedInterview.bidId).toBeNull();
    });
  });

  describe('interview eligibility check (allowed)', () => {
    it('should allow interview when no previous failures exist', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'First interview',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.eligibilityResult.allowed).toBe(true);
      expect(response.eligibilityResult.reason).toContain('No previous failures');
    });

    it('should allow interview when recruiter is new', async () => {
      // Arrange
      companyHistory.recordFailure('TechCorp', 'Software Engineer', 'Old Recruiter', ['Old Interviewer'], 'interview-1');

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'New Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Interview with new recruiter',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.eligibilityResult.allowed).toBe(true);
      expect(response.eligibilityResult.reason).toContain('New recruiter');
    });
  });

  describe('interview eligibility check (forbidden)', () => {
    it('should throw error when same recruiter and overlapping attendees', async () => {
      // Arrange
      companyHistory.recordFailure('TechCorp', 'Software Engineer', 'John Recruiter', ['Jane Interviewer'], 'interview-1');

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Interview attempt',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Interview not allowed');
      expect(mockInterviewRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validation error handling', () => {
    it('should throw error when base is missing', async () => {
      // Arrange
      const request: any = {
        company: 'TechCorp',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        interviewType: 'Technical',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('base is required');
    });

    it('should throw error when recruiter is missing', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: '',
        attendees: ['Jane Interviewer'],
        detail: 'Interview',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('recruiter is required');
    });

    it('should throw error when attendees is empty', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: [],
        detail: 'Interview',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('attendees is required');
    });

    it('should throw error when bidId is missing for BID base', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.BID,
        company: '',
        client: '',
        role: '',
        jobDescription: '',
        resume: '',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Interview',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('bidId is required when base is BID');
    });

    it('should throw error when bid is not found', async () => {
      // Arrange
      mockBidRepository.findById.mockResolvedValue(null);

      const request: ScheduleInterviewRequest = {
        base: InterviewBase.BID,
        bidId: 'non-existent-id',
        company: '',
        client: '',
        role: '',
        jobDescription: '',
        resume: '',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Interview',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Bid with ID non-existent-id not found');
    });

    it('should throw error when company is missing for LINKEDIN_CHAT', async () => {
      // Arrange
      const request: ScheduleInterviewRequest = {
        base: InterviewBase.LINKEDIN_CHAT,
        company: '',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: 'Technical',
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer'],
        detail: 'Interview',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('company is required when base is LINKEDIN_CHAT');
    });
  });
});
