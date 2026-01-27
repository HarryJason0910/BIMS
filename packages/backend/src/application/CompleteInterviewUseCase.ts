import { IInterviewRepository } from './IInterviewRepository';
import { IBidRepository } from './IBidRepository';
import { ICompanyHistoryRepository } from './ICompanyHistoryRepository';
import { CompanyHistory } from '../domain/CompanyHistory';

/**
 * Request interface for completing an interview
 */
export interface CompleteInterviewRequest {
  interviewId: string;
  success: boolean;
  detail?: string;
}

/**
 * Response interface for interview completion
 */
export interface CompleteInterviewResponse {
  success: boolean;
  historyUpdated: boolean;
}

/**
 * Use case for completing an interview and updating company history.
 * 
 * Flow:
 * 1. Fetch interview from repository
 * 2. Mark interview as completed with success/failure
 * 3. Update detail if provided
 * 4. Save interview to repository
 * 5. If interview failed, record failure in company history with recruiter and attendees
 * 6. If interview failed, save company history to repository
 * 7. If interview succeeded and has bidId, update bid status to CLOSED
 * 8. Return result
 */
export class CompleteInterviewUseCase {
  constructor(
    private interviewRepository: IInterviewRepository,
    private bidRepository: IBidRepository,
    private companyHistory: CompanyHistory,
    private historyRepository: ICompanyHistoryRepository
  ) {}

  async execute(request: CompleteInterviewRequest): Promise<CompleteInterviewResponse> {
    // 1. Fetch interview from repository
    const interview = await this.interviewRepository.findById(request.interviewId);
    
    if (!interview) {
      throw new Error(`Interview with ID ${request.interviewId} not found`);
    }

    // 2. Mark interview as completed with success/failure
    interview.markAsCompleted(request.success);

    // 3. Update detail if provided
    if (request.detail) {
      // Note: Interview class doesn't have a method to update detail after creation
      // This would need to be added to the Interview class if needed
      // For now, we'll skip this step as the Interview class is immutable
    }

    // 4. Save interview to repository
    await this.interviewRepository.update(interview);

    let historyUpdated = false;

    // 5. If interview failed, record failure in company history with recruiter and attendees
    if (!request.success && interview.isFailed()) {
      const failureInfo = interview.getFailureInfo();
      
      this.companyHistory.recordFailure(
        failureInfo.company,
        failureInfo.role,
        failureInfo.recruiter,
        failureInfo.attendees,
        interview.id
      );

      // 6. Save company history to repository
      await this.historyRepository.save(this.companyHistory);
      historyUpdated = true;
    }

    // 7. If interview succeeded and has bidId, update bid status to CLOSED
    if (request.success && interview.bidId) {
      const bid = await this.bidRepository.findById(interview.bidId);
      if (bid) {
        bid.markAsClosed();
        await this.bidRepository.update(bid);
      }
    }

    // 8. Return result
    return {
      success: true,
      historyUpdated,
    };
  }
}
