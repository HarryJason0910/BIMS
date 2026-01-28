/**
 * Interview Aggregate - Job Bid and Interview Management System
 * 
 * Represents an interview session with eligibility validation based on company history.
 * This is a pure domain model with no infrastructure dependencies.
 */

/**
 * Enum representing the source of an interview
 */
export enum InterviewBase {
  BID = "BID",
  LINKEDIN_CHAT = "LINKEDIN_CHAT"
}

/**
 * Enum representing the type of interview
 */
export enum InterviewType {
  HR = "HR",
  TECH_INTERVIEW_1 = "TECH_INTERVIEW_1",
  TECH_INTERVIEW_2 = "TECH_INTERVIEW_2",
  TECH_INTERVIEW_3 = "TECH_INTERVIEW_3",
  FINAL_INTERVIEW = "FINAL_INTERVIEW",
  CLIENT_INTERVIEW = "CLIENT_INTERVIEW"
}

/**
 * Enum representing the status of an interview
 */
export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  ATTENDED = "ATTENDED",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  CLOSED = "CLOSED",
  COMPLETED_SUCCESS = "COMPLETED_SUCCESS",
  COMPLETED_FAILURE = "COMPLETED_FAILURE",
  CANCELLED = "CANCELLED"
}

/**
 * Data required to create a new Interview
 */
export interface CreateInterviewData {
  base: InterviewBase;
  company: string;
  client: string;
  role: string;
  jobDescription: string;
  resume: string;
  interviewType: InterviewType;
  recruiter: string;
  attendees: string[];
  detail: string;
  bidId?: string; // Required if base is BID
}

/**
 * Information about a failed interview
 */
export interface FailureInfo {
  company: string;
  role: string;
  recruiter: string;
  attendees: string[];
}

/**
 * Interview Aggregate Root
 * 
 * Enforces business rules:
 * - Cannot transition from COMPLETED_SUCCESS or COMPLETED_FAILURE to SCHEDULED
 * - Required fields must not be empty
 * - If base is BID, bidId must be set
 */
export class Interview {
  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly base: InterviewBase,
    public readonly company: string,
    public readonly client: string,
    public readonly role: string,
    public readonly jobDescription: string,
    public readonly resume: string,
    public readonly interviewType: InterviewType,
    public readonly recruiter: string,
    public readonly attendees: string[],
    private _status: InterviewStatus,
    private _detail: string,
    public readonly bidId: string | null
  ) {}

  /**
   * Static factory method to create a new Interview
   * Automatically sets date to today and initializes status to SCHEDULED
   */
  static create(data: CreateInterviewData): Interview {
    // Validate required fields
    if (!data.base) {
      throw new Error('Interview base is required');
    }
    
    // Validate base enum value
    if (data.base !== InterviewBase.BID && data.base !== InterviewBase.LINKEDIN_CHAT) {
      throw new Error('Interview base must be either BID or LINKEDIN_CHAT');
    }
    
    // If base is BID, bidId must be provided
    if (data.base === InterviewBase.BID && !data.bidId) {
      throw new Error('Interview bidId is required when base is BID');
    }
    
    if (!data.company || data.company.trim() === '') {
      throw new Error('Interview company is required');
    }
    if (!data.client || data.client.trim() === '') {
      throw new Error('Interview client is required');
    }
    if (!data.role || data.role.trim() === '') {
      throw new Error('Interview role is required');
    }
    if (!data.interviewType) {
      throw new Error('Interview interviewType is required');
    }
    if (!data.recruiter || data.recruiter.trim() === '') {
      throw new Error('Interview recruiter is required');
    }
    if (!data.attendees || data.attendees.length === 0) {
      throw new Error('Interview attendees is required');
    }
    if (!data.detail || data.detail.trim() === '') {
      throw new Error('Interview detail is required');
    }

    // Generate unique ID (in production, this would use a proper ID generator)
    const id = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Set date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Interview(
      id,
      today,
      data.base,
      data.company,
      data.client,
      data.role,
      data.jobDescription,
      data.resume,
      data.interviewType,
      data.recruiter,
      data.attendees,
      InterviewStatus.SCHEDULED, // Default status
      data.detail,
      data.bidId || null
    );
  }

  // Getters for private fields
  get status(): InterviewStatus {
    return this._status;
  }

  get detail(): string {
    return this._detail;
  }

  /**
   * Mark interview as attended
   * Can only be called when status is SCHEDULED
   */
  markAsAttended(): void {
    if (this._status !== InterviewStatus.SCHEDULED) {
      throw new Error('Can only mark SCHEDULED interviews as attended');
    }
    
    this._status = InterviewStatus.ATTENDED;
  }

  /**
   * Mark interview as pending (waiting for result)
   * Can only be called when status is ATTENDED
   */
  markAsPending(): void {
    if (this._status !== InterviewStatus.ATTENDED) {
      throw new Error('Can only mark ATTENDED interviews as pending');
    }
    
    this._status = InterviewStatus.PENDING;
  }

  /**
   * Mark interview as expired (date has passed without attendance)
   * Can only be called when status is SCHEDULED
   */
  markAsExpired(): void {
    if (this._status !== InterviewStatus.SCHEDULED) {
      throw new Error('Can only mark SCHEDULED interviews as expired');
    }
    
    this._status = InterviewStatus.EXPIRED;
  }

  /**
   * Check if interview date has passed
   */
  isDatePassed(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.date < today;
  }

  /**
   * Mark interview as completed with success or failure outcome
   * Cannot transition from completed states back to scheduled
   */
  markAsCompleted(success: boolean): void {
    if (this._status === InterviewStatus.COMPLETED_SUCCESS) {
      throw new Error('Interview is already marked as completed successfully');
    }
    if (this._status === InterviewStatus.COMPLETED_FAILURE) {
      throw new Error('Interview is already marked as completed with failure');
    }
    if (this._status === InterviewStatus.CANCELLED) {
      throw new Error('Cannot complete a cancelled interview');
    }
    if (this._status === InterviewStatus.EXPIRED) {
      throw new Error('Cannot complete an expired interview');
    }
    
    this._status = success 
      ? InterviewStatus.COMPLETED_SUCCESS 
      : InterviewStatus.COMPLETED_FAILURE;
  }

  /**
   * Mark interview as closed (manually closed from pending state)
   * Can only be called when status is PENDING
   */
  markAsClosed(): void {
    if (this._status !== InterviewStatus.PENDING) {
      throw new Error('Can only close PENDING interviews');
    }
    
    this._status = InterviewStatus.COMPLETED_FAILURE;
  }

  /**
   * Mark interview as cancelled
   * Cannot cancel an already completed interview
   */
  markAsCancelled(): void {
    if (this._status === InterviewStatus.COMPLETED_SUCCESS) {
      throw new Error('Cannot cancel an interview that was completed successfully');
    }
    if (this._status === InterviewStatus.COMPLETED_FAILURE) {
      throw new Error('Cannot cancel an interview that was completed with failure');
    }
    if (this._status === InterviewStatus.CANCELLED) {
      throw new Error('Interview is already cancelled');
    }
    
    this._status = InterviewStatus.CANCELLED;
  }

  /**
   * Check if interview failed
   * Returns true if status is COMPLETED_FAILURE
   */
  isFailed(): boolean {
    return this._status === InterviewStatus.COMPLETED_FAILURE;
  }

  /**
   * Get failure information for recording in company history
   * Returns company, role, recruiter, and attendees
   */
  getFailureInfo(): FailureInfo {
    return {
      company: this.company,
      role: this.role,
      recruiter: this.recruiter,
      attendees: [...this.attendees] // Return a copy to prevent mutation
    };
  }

  /**
   * Update the detail field
   * Used when completing an interview with additional notes
   */
  updateDetail(detail: string): void {
    if (!detail || detail.trim() === '') {
      throw new Error('Detail cannot be empty');
    }
    this._detail = detail;
  }

  /**
   * Create a JSON representation of the interview
   * Used for testing and serialization
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      base: this.base,
      company: this.company,
      client: this.client,
      role: this.role,
      jobDescription: this.jobDescription,
      resume: this.resume,
      interviewType: this.interviewType,
      recruiter: this.recruiter,
      attendees: this.attendees,
      status: this._status,
      detail: this._detail,
      bidId: this.bidId
    };
  }
}
