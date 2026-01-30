/**
 * Bid Aggregate - Job Bid and Interview Management System
 * 
 * Represents a job application with its complete lifecycle from submission through
 * interview or rejection. This is a pure domain model with no infrastructure dependencies.
 */

/**
 * Enum representing the status of a bid throughout its lifecycle
 */
export enum BidStatus {
  NEW = "NEW",
  SUBMITTED = "SUBMITTED",
  REJECTED = "REJECTED",
  INTERVIEW_STAGE = "INTERVIEW_STAGE",
  INTERVIEW_FAILED = "INTERVIEW_FAILED",
  CLOSED = "CLOSED"
}

/**
 * Enum representing the type of resume checker (ATS or human recruiter)
 */
export enum ResumeCheckerType {
  ATS = "ATS",
  RECRUITER = "RECRUITER"
}

/**
 * Enum representing the origin of a bid
 */
export enum BidOrigin {
  LINKEDIN = "LINKEDIN",
  BID = "BID"
}

/**
 * Enum representing the reason for bid rejection
 */
export enum RejectionReason {
  ROLE_CLOSED = "Role Closed",
  UNSATISFIED_RESUME = "Unsatisfied Resume",
  AUTO_REJECTED = "Auto-Rejected (2 weeks)"
}

/**
 * Data required to create a new Bid
 */
export interface CreateBidData {
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescriptionPath: string;
  resumePath: string;
  origin: BidOrigin;
  recruiter?: string; // Required when origin is LINKEDIN
  originalBidId?: string; // For rebids
}

/**
 * Bid Aggregate Root
 * 
 * Enforces business rules:
 * - Once interviewWinning is true, it cannot be set back to false
 * - Cannot transition to REJECTED after INTERVIEW_STAGE
 * - Required fields must not be empty
 */
export class Bid {
  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly link: string,
    public readonly company: string,
    public readonly client: string,
    public readonly role: string,
    public readonly mainStacks: string[],
    public readonly jobDescriptionPath: string,
    public readonly resumePath: string,
    public readonly origin: BidOrigin,
    public readonly recruiter: string | null,
    private _bidStatus: BidStatus,
    private _interviewWinning: boolean,
    private _bidDetail: string,
    private _resumeChecker: ResumeCheckerType | null,
    private _rejectionReason: RejectionReason | null = null,
    public readonly originalBidId: string | null = null,
    private _hasBeenRebid: boolean = false
  ) {}

  /**
   * Static factory method to create a new Bid
   * Automatically sets date to today and initializes default values
   */
  static create(data: CreateBidData): Bid {
    // Validate required fields
    if (!data.link || data.link.trim() === '') {
      throw new Error('Bid link is required');
    }
    if (!data.company || data.company.trim() === '') {
      throw new Error('Bid company is required');
    }
    if (!data.client || data.client.trim() === '') {
      throw new Error('Bid client is required');
    }
    if (!data.role || data.role.trim() === '') {
      throw new Error('Bid role is required');
    }
    if (!data.mainStacks || data.mainStacks.length === 0) {
      throw new Error('Bid mainStacks is required');
    }
    if (!data.jobDescriptionPath || data.jobDescriptionPath.trim() === '') {
      throw new Error('Bid jobDescriptionPath is required');
    }
    if (!data.resumePath || data.resumePath.trim() === '') {
      throw new Error('Bid resumePath is required');
    }
    if (!data.origin) {
      throw new Error('Bid origin is required');
    }
    // Validate recruiter is provided when origin is LINKEDIN
    if (data.origin === BidOrigin.LINKEDIN && (!data.recruiter || data.recruiter.trim() === '')) {
      throw new Error('Recruiter name is required when origin is LINKEDIN');
    }

    // Generate unique ID (in production, this would use a proper ID generator)
    const id = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Set date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Bid(
      id,
      today,
      data.link,
      data.company,
      data.client,
      data.role,
      data.mainStacks,
      data.jobDescriptionPath,
      data.resumePath,
      data.origin,
      data.recruiter || null,
      BidStatus.NEW,           // Default status
      false,                    // Default interviewWinning
      '',                       // Default bidDetail
      null,                     // Default resumeChecker
      null,                     // Default rejectionReason
      data.originalBidId || null, // originalBidId
      false                     // Default hasBeenRebid
    );
  }

  // Getters for private fields
  get bidStatus(): BidStatus {
    return this._bidStatus;
  }

  get interviewWinning(): boolean {
    return this._interviewWinning;
  }

  get bidDetail(): string {
    return this._bidDetail;
  }

  get resumeChecker(): ResumeCheckerType | null {
    return this._resumeChecker;
  }

  get rejectionReason(): RejectionReason | null {
    return this._rejectionReason;
  }

  get hasBeenRebid(): boolean {
    return this._hasBeenRebid;
  }

  /**
   * Mark this bid as having been rebid
   * Once set, this cannot be unset
   */
  markAsRebid(): void {
    this._hasBeenRebid = true;
  }

  /**
   * Transition bid to SUBMITTED status
   */
  markAsSubmitted(): void {
    if (this._bidStatus !== BidStatus.NEW) {
      throw new Error(`Cannot mark as submitted from status ${this._bidStatus}`);
    }
    this._bidStatus = BidStatus.SUBMITTED;
  }

  /**
   * Transition bid to REJECTED status
   * Cannot reject after interview stage has started
   */
  markAsRejected(reason: RejectionReason): void {
    if (this._bidStatus === BidStatus.INTERVIEW_STAGE) {
      throw new Error('Cannot reject bid after interview stage has started');
    }
    if (this._bidStatus === BidStatus.CLOSED) {
      throw new Error('Cannot reject bid that is already closed');
    }
    this._bidStatus = BidStatus.REJECTED;
    this._rejectionReason = reason;
  }

  /**
   * Restore bid from REJECTED status back to SUBMITTED
   * Used for exceptional cases where auto-rejection needs to be reversed
   */
  restoreFromRejection(): void {
    if (this._bidStatus !== BidStatus.REJECTED) {
      throw new Error('Can only restore bids that are in REJECTED status');
    }
    if (this._interviewWinning) {
      throw new Error('Cannot restore bid that has reached interview stage');
    }
    this._bidStatus = BidStatus.SUBMITTED;
    this._rejectionReason = null;
  }

  /**
   * Check if bid should be auto-rejected (2 weeks old and still in NEW or SUBMITTED status)
   */
  shouldAutoReject(): boolean {
    if (this._bidStatus !== BidStatus.NEW && this._bidStatus !== BidStatus.SUBMITTED) {
      return false;
    }
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);
    
    return this.date < twoWeeksAgo;
  }

  /**
   * Mark that interview has started (HR interview scheduled)
   * Sets interviewWinning to true and updates status to INTERVIEW_STAGE
   * Once set, interviewWinning cannot be unset (invariant)
   */
  markInterviewStarted(): void {
    if (this._bidStatus === BidStatus.REJECTED) {
      throw new Error('Cannot start interview for rejected bid');
    }
    if (this._bidStatus === BidStatus.CLOSED) {
      throw new Error('Cannot start interview for closed bid');
    }
    
    this._interviewWinning = true;
    this._bidStatus = BidStatus.INTERVIEW_STAGE;
  }

  /**
   * Transition bid to CLOSED status
   * Typically called when interview process is complete
   */
  markAsClosed(): void {
    if (this._bidStatus === BidStatus.NEW) {
      throw new Error('Cannot close bid that has not been submitted');
    }
    this._bidStatus = BidStatus.CLOSED;
  }

  /**
   * Mark bid as interview failed
   * Can only be called when bid is in INTERVIEW_STAGE
   */
  markInterviewFailed(): void {
    if (this._bidStatus !== BidStatus.INTERVIEW_STAGE) {
      throw new Error('Can only mark interview as failed when bid is in INTERVIEW_STAGE');
    }
    this._bidStatus = BidStatus.INTERVIEW_FAILED;
  }

  /**
   * Attach a warning message to bidDetail
   * Used for company history warnings
   */
  attachWarning(warning: string): void {
    if (this._bidDetail) {
      this._bidDetail += '\n' + warning;
    } else {
      this._bidDetail = warning;
    }
  }

  /**
   * Set the resume checker type (ATS or RECRUITER)
   * Based on inference from rejection timing or manual selection
   * Can be set to null to clear the value
   */
  setResumeChecker(type: ResumeCheckerType | null): void {
    this._resumeChecker = type;
  }

  /**
   * Check if rebidding is allowed
   * Rebidding is only allowed if:
   * - Bid status is REJECTED
   * - interviewWinning is false (never reached interview stage)
   * - Rejection reason is UNSATISFIED_RESUME
   */
  canRebid(): boolean {
    return this._bidStatus === BidStatus.REJECTED && 
           !this._interviewWinning &&
           this._rejectionReason === RejectionReason.UNSATISFIED_RESUME;
  }

  /**
   * Check if interview has started
   * Returns the value of interviewWinning
   */
  isInterviewStarted(): boolean {
    return this._interviewWinning;
  }

  /**
   * Create a copy of the bid with updated fields
   * Used for testing and serialization
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      link: this.link,
      company: this.company,
      client: this.client,
      role: this.role,
      mainStacks: this.mainStacks,
      jobDescriptionPath: this.jobDescriptionPath,
      resumePath: this.resumePath,
      origin: this.origin,
      recruiter: this.recruiter,
      bidStatus: this._bidStatus,
      interviewWinning: this._interviewWinning,
      bidDetail: this._bidDetail,
      resumeChecker: this._resumeChecker,
      rejectionReason: this._rejectionReason,
      originalBidId: this.originalBidId,
      hasBeenRebid: this._hasBeenRebid
    };
  }
}
