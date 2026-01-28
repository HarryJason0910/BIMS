import { Interview, InterviewBase, InterviewType } from '../domain/Interview';
import { InterviewEligibilityPolicy, EligibilityResult } from '../domain/InterviewEligibilityPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { IInterviewRepository } from './IInterviewRepository';
import { IBidRepository } from './IBidRepository';

/**
 * Request interface for scheduling an interview
 */
export interface ScheduleInterviewRequest {
  base: InterviewBase;
  bidId?: string; // Required if base is BID
  company: string;
  client: string;
  role: string;
  jobDescription: string;
  resume: string;
  interviewType: string;
  recruiter: string;
  attendees: string[];
  detail?: string; // Optional - can be added later when completing the interview
  baseInterviewId?: string; // Optional - ID of the interview this is scheduled from (for "Schedule Next" feature)
  date?: string; // Optional - interview date in ISO format, defaults to today if not provided
}

/**
 * Response interface for interview scheduling
 */
export interface ScheduleInterviewResponse {
  interviewId: string;
  eligibilityResult: EligibilityResult;
}

/**
 * Use case for scheduling an interview with eligibility validation.
 * 
 * Flow:
 * 1. Validate required fields
 * 2. If base is BID, fetch bid and populate fields from it
 * 3. Check interview eligibility using policy and company history
 * 4. If not eligible, throw error with explanation
 * 5. Create new Interview aggregate with today's date
 * 6. Save interview to repository
 * 7. If base is BID and interview type is "HR", update bid (interviewWinning = true, status = INTERVIEW_STAGE)
 * 8. Return interview ID and eligibility result
 */
export class ScheduleInterviewUseCase {
  constructor(
    private interviewRepository: IInterviewRepository,
    private bidRepository: IBidRepository,
    private eligibilityPolicy: InterviewEligibilityPolicy,
    private companyHistory: CompanyHistory
  ) {}

  async execute(request: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
    // 1. Validate required fields
    this.validateRequest(request);

    let company = request.company;
    let client = request.client;
    let role = request.role;
    let jobDescription = request.jobDescription;
    let resume = request.resume;
    let bidId: string | null = null;

    // 2. If base is BID, fetch bid and populate fields from it
    if (request.base === InterviewBase.BID) {
      if (!request.bidId) {
        throw new Error('bidId is required when base is BID');
      }

      const bid = await this.bidRepository.findById(request.bidId);
      if (!bid) {
        throw new Error(`Bid with ID ${request.bidId} not found`);
      }

      // Populate fields from bid
      company = bid.company;
      client = bid.client;
      role = bid.role;
      // TODO: Read file contents from bid.jobDescriptionPath and bid.resumePath
      // For now, using empty strings as placeholders
      jobDescription = '';
      resume = '';
      bidId = bid.id;
      
      // IDEMPOTENCY CHECK: Check if interview already exists for this bid + type
      // This prevents duplicate interviews from double-clicks
      if (bidId) {
        const existingInterviews = await this.interviewRepository.findByBidId(bidId);
        const duplicateInterview = existingInterviews.find(
          interview => interview.interviewType === request.interviewType && 
                      interview.status === 'SCHEDULED'
        );
        
        if (duplicateInterview) {
          // Return existing interview instead of creating duplicate
          return {
            interviewId: duplicateInterview.id,
            eligibilityResult: {
              allowed: true,
              reason: 'Interview already scheduled (duplicate request prevented)'
            }
          };
        }
      }
    }

    // 3. Check interview eligibility using policy and company history
    const eligibilityResult = this.eligibilityPolicy.checkEligibility(
      company,
      role,
      request.recruiter,
      request.attendees,
      this.companyHistory
    );

    // 4. If not eligible, throw error with explanation
    if (!eligibilityResult.allowed) {
      throw new Error(`Interview not allowed: ${eligibilityResult.reason}`);
    }

    // 5. Create new Interview aggregate with provided date or today's date
    const interview = Interview.create({
      base: request.base,
      company,
      client,
      role,
      jobDescription,
      resume,
      interviewType: request.interviewType as InterviewType,
      recruiter: request.recruiter,
      attendees: request.attendees,
      detail: request.detail || '', // Optional - defaults to empty string
      bidId: bidId || undefined,
      date: request.date ? new Date(request.date) : undefined, // Use provided date or default to today
    });

    // 6. Save interview to repository
    await this.interviewRepository.save(interview);

    // 7. If base is BID and interview type is "HR", update bid
    if (request.base === InterviewBase.BID && request.interviewType.toUpperCase() === 'HR' && bidId) {
      const bid = await this.bidRepository.findById(bidId);
      if (bid) {
        bid.markInterviewStarted();
        await this.bidRepository.update(bid);
      }
    }

    // 8. If this is a "Schedule Next" interview, mark the base interview as scheduled next
    if (request.baseInterviewId) {
      const baseInterview = await this.interviewRepository.findById(request.baseInterviewId);
      if (baseInterview) {
        baseInterview.markAsScheduledNext();
        await this.interviewRepository.update(baseInterview);
      }
    }

    // 9. Return interview ID and eligibility result
    return {
      interviewId: interview.id,
      eligibilityResult,
    };
  }

  private validateRequest(request: ScheduleInterviewRequest): void {
    if (!request.base) {
      throw new Error('base is required');
    }

    if (!request.recruiter || request.recruiter.trim() === '') {
      throw new Error('recruiter is required');
    }

    if (!Array.isArray(request.attendees)) {
      throw new Error('attendees must be an array');
    }

    // For non-HR interviews, attendees are required
    if (request.interviewType.toUpperCase() !== 'HR' && request.attendees.length === 0) {
      throw new Error('attendees are required for non-HR interviews');
    }

    if (!request.interviewType || request.interviewType.trim() === '') {
      throw new Error('interviewType is required');
    }

    // If base is LINKEDIN_CHAT, validate manual fields
    if (request.base === InterviewBase.LINKEDIN_CHAT) {
      if (!request.company || request.company.trim() === '') {
        throw new Error('company is required when base is LINKEDIN_CHAT');
      }
      if (!request.client || request.client.trim() === '') {
        throw new Error('client is required when base is LINKEDIN_CHAT');
      }
      if (!request.role || request.role.trim() === '') {
        throw new Error('role is required when base is LINKEDIN_CHAT');
      }
    }
  }
}
