import { Bid } from '../domain/Bid';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { IBidRepository } from './IBidRepository';
import { IInterviewRepository } from './IInterviewRepository';

/**
 * Request interface for rebidding with a new resume
 */
export interface RebidRequest {
  originalBidId: string;
  newResumePath: string;
  newJobDescriptionPath?: string; // Optional if job description changed
}

/**
 * Response interface for rebid operation
 */
export interface RebidResponse {
  newBidId: string;
  allowed: boolean;
  reason: string;
}

/**
 * Use case for rebidding on a job with a new resume after rejection.
 * 
 * Flow:
 * 1. Fetch original bid from repository
 * 2. Check if rebidding is allowed based on:
 *    - Bid rejection reason (UNSATISFIED_RESUME)
 *    - Interview failure reason (if interview was conducted)
 * 3. If not allowed, return error with reason
 * 4. Create new bid with same company, role, link but new resume
 * 5. Link new bid to original bid (store originalBidId reference)
 * 6. Run duplication detection (will show warnings but allow)
 * 7. Check company history for warnings
 * 8. Save new bid to repository
 * 9. Return new bid ID
 */
export class RebidWithNewResumeUseCase {
  constructor(
    private bidRepository: IBidRepository,
    private interviewRepository: IInterviewRepository,
    private duplicationPolicy: DuplicationDetectionPolicy,
    private companyHistory: CompanyHistory
  ) {}

  async execute(request: RebidRequest): Promise<RebidResponse> {
    // 1. Fetch original bid from repository
    const originalBid = await this.bidRepository.findById(request.originalBidId);
    
    if (!originalBid) {
      throw new Error(`Original bid with ID ${request.originalBidId} not found`);
    }

    // 2. Check if rebidding is allowed based on bid rejection reason
    let rebidAllowed = false;
    let reason = '';

    // Check if bid was rejected with UNSATISFIED_RESUME
    if (originalBid.canRebid()) {
      rebidAllowed = true;
      reason = 'Rebid allowed - bid was rejected due to unsatisfied resume';
    } else if (originalBid.isInterviewStarted()) {
      // If interview was started, check interview failure reasons
      const interviews = await this.interviewRepository.findAll();
      const bidInterviews = interviews.filter(i => i.bidId === originalBid.id);
      
      // Check if any failed interview allows rebid
      for (const interview of bidInterviews) {
        if (interview.canRebidAfterFailure()) {
          rebidAllowed = true;
          reason = `Rebid allowed - interview failed with rebiddable reason`;
          break;
        }
      }
      
      if (!rebidAllowed) {
        reason = 'Cannot rebid - interview failed with non-rebiddable reason (e.g., HR interview failed due to Bilingual or Not Remote)';
      }
    } else {
      reason = 'Cannot rebid - bid was rejected due to role closure';
    }

    // 3. If not allowed, return error with reason
    if (!rebidAllowed) {
      return {
        newBidId: '',
        allowed: false,
        reason,
      };
    }

    // 4. Create new bid with same company, role, link but new resume
    const newBid = Bid.create({
      link: originalBid.link,
      company: originalBid.company,
      client: originalBid.client,
      role: originalBid.role,
      mainStacks: originalBid.mainStacks,
      jobDescriptionPath: request.newJobDescriptionPath || originalBid.jobDescriptionPath,
      resumePath: request.newResumePath,
      origin: originalBid.origin,
      recruiter: originalBid.recruiter || undefined,
      originalBidId: originalBid.id, // 5. Link new bid to original bid
    });

    // 6. Run duplication detection (will show warnings but allow)
    const existingBids = await this.bidRepository.findAll();
    this.duplicationPolicy.checkDuplication(
      {
        link: newBid.link,
        company: newBid.company,
        client: newBid.client,
        role: newBid.role,
        mainStacks: newBid.mainStacks,
        jobDescriptionPath: newBid.jobDescriptionPath,
        resumePath: newBid.resumePath,
        origin: newBid.origin,
        recruiter: newBid.recruiter || undefined,
      },
      existingBids
    );

    // 7. Check company history for warnings
    if (this.companyHistory.hasFailures(newBid.company, newBid.role)) {
      const companyWarning = this.companyHistory.getWarningMessage(newBid.company, newBid.role);
      newBid.attachWarning(companyWarning);
    }

    // 8. Save new bid to repository
    await this.bidRepository.save(newBid);

    // 9. Mark original bid as having been rebid
    originalBid.markAsRebid();
    await this.bidRepository.update(originalBid);

    // 10. Return new bid ID
    return {
      newBidId: newBid.id,
      allowed: true,
      reason,
    };
  }
}
