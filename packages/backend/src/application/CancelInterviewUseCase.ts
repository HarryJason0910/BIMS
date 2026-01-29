/**
 * Cancel Interview Use Case
 * 
 * Handles interview cancellation with different reasons:
 * - ROLE_CLOSED: Treat like failure - mark bid as INTERVIEW_FAILED, record in company history
 * - RESCHEDULED: Keep bid in INTERVIEW_STAGE for rescheduling
 */

import { IInterviewRepository } from './IInterviewRepository';
import { IBidRepository } from './IBidRepository';
import { ICompanyHistoryRepository } from './ICompanyHistoryRepository';
import { CompanyHistory } from '../domain/CompanyHistory';
import { CancellationReason } from '../domain/Interview';
import { BidStatus } from '../domain/Bid';

export interface CancelInterviewRequest {
  interviewId: string;
  cancellationReason: CancellationReason;
}

export interface CancelInterviewResponse {
  success: boolean;
  message: string;
}

export class CancelInterviewUseCase {
  constructor(
    private interviewRepository: IInterviewRepository,
    private bidRepository: IBidRepository,
    private companyHistory: CompanyHistory,
    private historyRepository: ICompanyHistoryRepository
  ) {}

  async execute(request: CancelInterviewRequest): Promise<CancelInterviewResponse> {
    const { interviewId, cancellationReason } = request;

    // Find the interview
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new Error(`Interview with id ${interviewId} not found`);
    }

    // Mark interview as cancelled with reason
    interview.markAsCancelled(cancellationReason);
    await this.interviewRepository.update(interview);

    // Handle based on cancellation reason
    if (cancellationReason === CancellationReason.ROLE_CLOSED) {
      // Treat like failure: mark bid as INTERVIEW_FAILED and record in company history
      if (interview.bidId) {
        const bid = await this.bidRepository.findById(interview.bidId);
        if (bid) {
          // Only mark as INTERVIEW_FAILED if bid is in INTERVIEW_STAGE
          if (bid.bidStatus === BidStatus.INTERVIEW_STAGE) {
            bid.markInterviewFailed();
            await this.bidRepository.update(bid);
          }
        }
      }

      // Record in company history
      const failureInfo = interview.getFailureInfo();
      this.companyHistory.recordFailure(
        failureInfo.company,
        failureInfo.role,
        failureInfo.recruiter,
        failureInfo.attendees,
        interview.id
      );
      await this.historyRepository.save(this.companyHistory);

      return {
        success: true,
        message: 'Interview cancelled due to role closure. Bid marked as failed and recorded in company history.'
      };
    } else if (cancellationReason === CancellationReason.RESCHEDULED) {
      // Keep bid in INTERVIEW_STAGE - no additional action needed
      return {
        success: true,
        message: 'Interview cancelled for rescheduling. Bid remains in interview stage.'
      };
    }

    return {
      success: true,
      message: 'Interview cancelled successfully.'
    };
  }
}
