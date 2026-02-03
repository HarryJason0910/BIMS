import { CompleteInterviewUseCase, CompleteInterviewRequest } from './CompleteInterviewUseCase';
import { IInterviewRepository } from './IInterviewRepository';
import { IBidRepository } from './IBidRepository';
import { ICompanyHistoryRepository } from './ICompanyHistoryRepository';
import { CompanyHistory } from '../domain/CompanyHistory';
import { Interview, InterviewBase, InterviewStatus, InterviewType } from '../domain/Interview';
import { Bid, BidStatus, BidOrigin } from '../domain/Bid';

describe('CompleteInterviewUseCase', () => {
  let useCase: CompleteInterviewUseCase;
  let mockInterviewRepository: jest.Mocked<IInterviewRepository>;
  let mockBidRepository: jest.Mocked<IBidRepository>;
  let mockHistoryRepository: jest.Mocked<ICompanyHistoryRepository>;
  let companyHistory: CompanyHistory;

  beforeEach(() => {
    // Create mock repositories
    mockInterviewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findByBidId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

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

    mockHistoryRepository = {
      save: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findAll: jest.fn(),
    };

    companyHistory = new CompanyHistory();

    useCase = new CompleteInterviewUseCase(
      mockInterviewRepository,
      mockBidRepository,
      companyHistory,
      mockHistoryRepository
    );
  });

  const createInterview = (bidId?: string): Interview => {
    return Interview.create({
      base: bidId ? InterviewBase.BID : InterviewBase.LINKEDIN_CHAT,
      company: 'TechCorp',
      client: 'ClientCo',
      role: 'Software Engineer',
      jobDescription: 'Build amazing software',
      resume: 'resume_v1.pdf',
      interviewType: InterviewType.TECH_INTERVIEW_1,
      recruiter: 'John Recruiter',
      attendees: ['Jane Interviewer', 'Bob Manager'],
      detail: 'Technical interview',
      bidId,
    });
  };

  const createBid = (): Bid => {
    return Bid.create({
      link: 'https://example.com/job/123',
      company: 'TechCorp',
      client: 'ClientCo',
      role: 'Software Engineer',
      mainStacks: ['TypeScript', 'React'],
      jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
      resumePath: 'TechCorp_Software_Engineer/resume.pdf',
      origin: BidOrigin.BID,
    });
  };

  describe('successful interview completion', () => {
    it('should mark interview as completed successfully', async () => {
      // Arrange
      const interview = createInterview();
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: true,
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.success).toBe(true);
      expect(response.historyUpdated).toBe(false);
      expect(mockInterviewRepository.update).toHaveBeenCalledTimes(1);
      
      const updatedInterview = mockInterviewRepository.update.mock.calls[0][0];
      expect(updatedInterview.status).toBe(InterviewStatus.COMPLETED_SUCCESS);
    });

    it('should update bid status to CLOSED when interview succeeds and has bidId', async () => {
      // Arrange
      const bid = createBid();
      bid.markInterviewStarted();
      
      // Create a CLIENT_INTERVIEW (final stage) instead of TECH_INTERVIEW_1
      const interview = Interview.create({
        base: InterviewBase.BID,
        company: 'TechCorp',
        client: 'ClientCo',
        role: 'Software Engineer',
        jobDescription: 'Build amazing software',
        resume: 'resume_v1.pdf',
        interviewType: InterviewType.CLIENT_INTERVIEW,
        recruiter: 'John Recruiter',
        attendees: ['Jane Interviewer', 'Bob Manager'],
        detail: 'Final client interview',
        bidId: bid.id,
      });
      
      mockInterviewRepository.findById.mockResolvedValue(interview);
      mockBidRepository.findById.mockResolvedValue(bid);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: true,
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockBidRepository.update).toHaveBeenCalledTimes(1);
      const updatedBid = mockBidRepository.update.mock.calls[0][0];
      // Interview succeeded and it's CLIENT_INTERVIEW (final stage), so bid should be CLOSED
      expect(updatedBid.bidStatus).toBe(BidStatus.CLOSED);
    });

    it('should not update bid when interview succeeds but has no bidId', async () => {
      // Arrange
      const interview = createInterview(); // No bidId
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: true,
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockBidRepository.findById).not.toHaveBeenCalled();
      expect(mockBidRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('failed interview completion with company history update', () => {
    it('should record failure in company history when interview fails', async () => {
      // Arrange
      const interview = createInterview();
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: false,
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.success).toBe(true);
      expect(response.historyUpdated).toBe(true);
      expect(mockHistoryRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify company history was updated
      expect(companyHistory.hasFailures('TechCorp', 'Software Engineer')).toBe(true);
      const recruiters = companyHistory.getAllRecruiters('TechCorp', 'Software Engineer');
      expect(recruiters).toContain('John Recruiter');
      const attendees = companyHistory.getAllAttendees('TechCorp', 'Software Engineer');
      expect(attendees).toContain('Jane Interviewer');
      expect(attendees).toContain('Bob Manager');
    });

    it('should mark interview as failed', async () => {
      // Arrange
      const interview = createInterview();
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: false,
      };

      // Act
      await useCase.execute(request);

      // Assert
      const updatedInterview = mockInterviewRepository.update.mock.calls[0][0];
      expect(updatedInterview.status).toBe(InterviewStatus.COMPLETED_FAILURE);
      expect(updatedInterview.isFailed()).toBe(true);
    });

    it('should not update bid when interview fails', async () => {
      // Arrange
      const bid = createBid();
      const interview = createInterview(bid.id);
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: false,
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockBidRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error handling for non-existent interview', () => {
    it('should throw error when interview is not found', async () => {
      // Arrange
      mockInterviewRepository.findById.mockResolvedValue(null);

      const request: CompleteInterviewRequest = {
        interviewId: 'non-existent-id',
        success: true,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Interview with ID non-existent-id not found');
      expect(mockInterviewRepository.update).not.toHaveBeenCalled();
      expect(mockHistoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('detail update', () => {
    it('should accept detail in request', async () => {
      // Arrange
      const interview = createInterview();
      mockInterviewRepository.findById.mockResolvedValue(interview);

      const request: CompleteInterviewRequest = {
        interviewId: interview.id,
        success: true,
        detail: 'Candidate performed excellently',
      };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.success).toBe(true);
      // Note: Detail update is not implemented in Interview class (immutable)
      // This test just verifies the request is accepted
    });
  });
});
