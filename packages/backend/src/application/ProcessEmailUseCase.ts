/**
 * ProcessEmail Use Case - Job Bid and Interview Management System
 * 
 * Processes email events to automatically update bids and interviews.
 * Ensures idempotency by tracking processed emails.
 */

import { IBidRepository } from './IBidRepository';
import { IInterviewRepository } from './IInterviewRepository';
import { IProcessedEmailRepository } from './IProcessedEmailRepository';
import { EmailClassifier, EmailEvent, EmailEventType } from '../domain/EmailClassifier';
import { ResumeCheckerService } from '../domain/ResumeCheckerService';
import { InterviewStatus } from '../domain/Interview';

/**
 * Response from processing an email
 */
export interface ProcessEmailResponse {
  processed: boolean;
  classification: {
    type: EmailEventType;
    company?: string;
    role?: string;
  };
  updatedEntityId?: string;
  action?: string;
}

/**
 * ProcessEmail Use Case
 * 
 * Flow:
 * 1. Check if email already processed (idempotency)
 * 2. If processed, return early
 * 3. Classify email using EmailClassifier
 * 4. Based on classification:
 *    - BID_REJECTION: Find matching bid, mark as rejected, infer resume checker type
 *    - INTERVIEW_SCHEDULED: Find matching bid, set interviewWinning to true, create/update interview
 *    - INTERVIEW_COMPLETED: Find matching interview, mark as completed
 *    - UNKNOWN: Log and skip
 * 5. Save updated entities to repositories
 * 6. Mark email as processed
 * 7. Return result
 */
export class ProcessEmailUseCase {
  constructor(
    private readonly bidRepository: IBidRepository,
    private readonly interviewRepository: IInterviewRepository,
    private readonly processedEmailRepository: IProcessedEmailRepository,
    private readonly emailClassifier: EmailClassifier,
    private readonly resumeCheckerService: ResumeCheckerService
  ) {}

  /**
   * Execute the use case to process an email event
   */
  async execute(event: EmailEvent): Promise<ProcessEmailResponse> {
    // Step 1: Check if email already processed (idempotency)
    const alreadyProcessed = await this.processedEmailRepository.isProcessed(event.id);
    
    if (alreadyProcessed) {
      return {
        processed: false,
        classification: {
          type: EmailEventType.UNKNOWN
        },
        action: 'Email already processed, skipped'
      };
    }

    // Step 2: Classify email
    const classification = this.emailClassifier.classify(event);

    // Step 3: Handle based on classification type
    let response: ProcessEmailResponse;

    switch (classification.type) {
      case EmailEventType.BID_REJECTION:
        response = await this.handleBidRejection(event, classification);
        break;
      
      case EmailEventType.INTERVIEW_SCHEDULED:
        response = await this.handleInterviewScheduled(event, classification);
        break;
      
      case EmailEventType.INTERVIEW_COMPLETED:
        response = await this.handleInterviewCompleted(event, classification);
        break;
      
      case EmailEventType.UNKNOWN:
      default:
        response = {
          processed: true,
          classification: {
            type: EmailEventType.UNKNOWN
          },
          action: 'Email type unknown, no action taken'
        };
        break;
    }

    // Step 4: Mark email as processed
    await this.processedEmailRepository.markAsProcessed(event.id);

    return response;
  }

  /**
   * Handle BID_REJECTION email
   * Find matching bid, mark as rejected, infer resume checker type
   */
  private async handleBidRejection(
    event: EmailEvent,
    classification: ReturnType<typeof EmailClassifier.prototype.classify>
  ): Promise<ProcessEmailResponse> {
    // Find matching bid by company and role
    if (!classification.company || !classification.role) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.BID_REJECTION,
          company: classification.company,
          role: classification.role
        },
        action: 'Cannot match bid: missing company or role information'
      };
    }

    const matchingBids = await this.bidRepository.findByCompanyAndRole(
      classification.company,
      classification.role
    );

    // Find the most recent non-rejected bid
    const targetBid = matchingBids
      .filter(bid => bid.bidStatus !== 'REJECTED')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (!targetBid) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.BID_REJECTION,
          company: classification.company,
          role: classification.role
        },
        action: 'No matching non-rejected bid found'
      };
    }

    // Mark bid as rejected
    targetBid.markAsRejected();

    // Infer resume checker type
    const companyBids = await this.bidRepository.findByCompanyAndRole(
      targetBid.company,
      targetBid.role
    );
    
    const inference = this.resumeCheckerService.inferScreeningType(
      targetBid,
      event.receivedDate,
      companyBids
    );

    targetBid.setResumeChecker(inference.type);

    // Save updated bid
    await this.bidRepository.update(targetBid);

    return {
      processed: true,
      classification: {
        type: EmailEventType.BID_REJECTION,
        company: classification.company,
        role: classification.role
      },
      updatedEntityId: targetBid.id,
      action: `Bid marked as rejected, resume checker set to ${inference.type}`
    };
  }

  /**
   * Handle INTERVIEW_SCHEDULED email
   * Find matching bid, set interviewWinning to true, create/update interview
   */
  private async handleInterviewScheduled(
    _event: EmailEvent,
    classification: ReturnType<typeof EmailClassifier.prototype.classify>
  ): Promise<ProcessEmailResponse> {
    // Find matching bid by company and role
    if (!classification.company || !classification.role) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.INTERVIEW_SCHEDULED,
          company: classification.company,
          role: classification.role
        },
        action: 'Cannot match bid: missing company or role information'
      };
    }

    const matchingBids = await this.bidRepository.findByCompanyAndRole(
      classification.company,
      classification.role
    );

    // Find the most recent non-rejected bid
    const targetBid = matchingBids
      .filter(bid => bid.bidStatus !== 'REJECTED' && bid.bidStatus !== 'CLOSED')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (!targetBid) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.INTERVIEW_SCHEDULED,
          company: classification.company,
          role: classification.role
        },
        action: 'No matching active bid found'
      };
    }

    // Set interviewWinning to true and update status
    if (!targetBid.isInterviewStarted()) {
      targetBid.markInterviewStarted();
      await this.bidRepository.update(targetBid);
    }

    return {
      processed: true,
      classification: {
        type: EmailEventType.INTERVIEW_SCHEDULED,
        company: classification.company,
        role: classification.role
      },
      updatedEntityId: targetBid.id,
      action: 'Bid updated: interviewWinning set to true, status set to INTERVIEW_STAGE'
    };
  }

  /**
   * Handle INTERVIEW_COMPLETED email
   * Find matching interview, mark as completed
   */
  private async handleInterviewCompleted(
    _event: EmailEvent,
    classification: ReturnType<typeof EmailClassifier.prototype.classify>
  ): Promise<ProcessEmailResponse> {
    // Find matching interview by company and role
    if (!classification.company || !classification.role) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.INTERVIEW_COMPLETED,
          company: classification.company,
          role: classification.role
        },
        action: 'Cannot match interview: missing company or role information'
      };
    }

    const matchingInterviews = await this.interviewRepository.findByCompanyAndRole(
      classification.company,
      classification.role
    );

    // Find the most recent scheduled interview
    const targetInterview = matchingInterviews
      .filter(interview => interview.status === InterviewStatus.SCHEDULED)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (!targetInterview) {
      return {
        processed: true,
        classification: {
          type: EmailEventType.INTERVIEW_COMPLETED,
          company: classification.company,
          role: classification.role
        },
        action: 'No matching scheduled interview found'
      };
    }

    // Mark interview as completed (assume success for now)
    // In a real system, we'd analyze the email content to determine success/failure
    targetInterview.markAsCompleted(true);

    // Save updated interview
    await this.interviewRepository.update(targetInterview);

    return {
      processed: true,
      classification: {
        type: EmailEventType.INTERVIEW_COMPLETED,
        company: classification.company,
        role: classification.role
      },
      updatedEntityId: targetInterview.id,
      action: 'Interview marked as completed successfully'
    };
  }
}
