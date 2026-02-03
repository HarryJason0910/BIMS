/**
 * Bid Aggregate - Job Bid and Interview Management System
 * 
 * Represents a job application with its complete lifecycle from submission through
 * interview or rejection. This is a pure domain model with no infrastructure dependencies.
 */

import { LayerWeights, LayerSkills, SkillWeight, TechLayer, isValidLayerWeights } from './JDSpecTypes';
import { RoleService } from './RoleService';

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
  id?: string; // Optional - if not provided, will be auto-generated
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[] | LayerSkills; // Support both legacy (string[]) and new (LayerSkills) formats
  layerWeights?: LayerWeights; // Optional - if not provided, will be derived from role
  jobDescriptionPath: string;
  resumePath: string;
  origin: BidOrigin;
  recruiter?: string; // Required when origin is LINKEDIN
  originalBidId?: string; // For rebids
  jdSpecId?: string; // Optional - JD specification ID for enhanced skill matching
}

/**
 * Bid Aggregate Root
 * 
 * Enforces business rules:
 * - Once interviewWinning is true, it cannot be set back to false
 * - Cannot transition to REJECTED after INTERVIEW_STAGE
 * - Required fields must not be empty
 * - Layer weights must sum to 1.0 (±0.001 tolerance)
 * - Skill weights within each layer must sum to 1.0 (±0.001 tolerance) or layer is empty
 */
export class Bid {
  private constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly link: string,
    public readonly company: string,
    public readonly client: string,
    public readonly role: string,
    public readonly mainStacks: string[] | LayerSkills, // Support both legacy and new formats
    public readonly layerWeights: LayerWeights, // Layer weights for match rate calculation
    public readonly jobDescriptionPath: string,
    public readonly resumePath: string,
    public readonly origin: BidOrigin,
    public readonly recruiter: string | null,
    public readonly jdSpecId: string | null,
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
    if (!data.mainStacks) {
      throw new Error('Bid mainStacks is required');
    }
    
    // Validate mainStacks based on format
    if (Array.isArray(data.mainStacks)) {
      // Legacy format: string[]
      if (data.mainStacks.length === 0) {
        throw new Error('Bid mainStacks is required');
      }
    } else {
      // New format: LayerSkills - validate structure
      this.validateLayerSkills(data.mainStacks);
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

    // Get or validate layer weights
    let layerWeights: LayerWeights;
    if (data.layerWeights) {
      // User provided custom weights - validate them
      if (!isValidLayerWeights(data.layerWeights)) {
        throw new Error('Layer weights must sum to 1.0 (±0.001 tolerance)');
      }
      layerWeights = data.layerWeights;
    } else {
      // Get default weights from role
      const roleService = new RoleService();
      try {
        layerWeights = roleService.getDefaultLayerWeights(data.role);
      } catch (error) {
        // If role is not recognized, use balanced weights
        layerWeights = {
          frontend: 0.25,
          backend: 0.25,
          database: 0.20,
          cloud: 0.15,
          devops: 0.10,
          others: 0.05
        };
      }
    }

    // Generate unique ID (use provided ID or generate new one)
    const id = data.id || `bid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
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
      layerWeights,           // Layer weights
      data.jobDescriptionPath,
      data.resumePath,
      data.origin,
      data.recruiter || null,
      data.jdSpecId || null,  // JD specification ID
      BidStatus.NEW,           // Default status
      false,                    // Default interviewWinning
      '',                       // Default bidDetail
      null,                     // Default resumeChecker
      null,                     // Default rejectionReason
      data.originalBidId || null, // originalBidId
      false                     // Default hasBeenRebid
    );
  }

  /**
   * Validate LayerSkills structure
   * - Must have all 6 required keys
   * - Each key must map to an array of SkillWeight objects
   * - Skill weights within each layer must sum to 1.0 (±0.001 tolerance) or layer is empty
   */
  private static validateLayerSkills(layerSkills: LayerSkills): void {
    const requiredLayers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    
    // Check all required keys exist
    for (const layer of requiredLayers) {
      if (!(layer in layerSkills)) {
        throw new Error(`LayerSkills must have '${layer}' key`);
      }
      
      const skills = layerSkills[layer];
      if (!Array.isArray(skills)) {
        throw new Error(`LayerSkills['${layer}'] must be an array`);
      }
      
      // Validate each skill has required properties
      for (const skill of skills) {
        if (typeof skill.skill !== 'string' || skill.skill.trim() === '') {
          throw new Error(`Each skill in layer '${layer}' must have a non-empty 'skill' property`);
        }
        if (typeof skill.weight !== 'number' || skill.weight < 0 || skill.weight > 1) {
          throw new Error(`Each skill in layer '${layer}' must have a 'weight' between 0 and 1`);
        }
      }
      
      // Validate weights sum to 1.0 (or layer is empty)
      if (skills.length > 0) {
        const sum = skills.reduce((acc, skill) => acc + skill.weight, 0);
        if (Math.abs(sum - 1.0) > 0.001) {
          throw new Error(`Skill weights in layer '${layer}' must sum to 1.0 (±0.001 tolerance), got ${sum}`);
        }
      }
    }
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
   * Get layer weights
   */
  getLayerWeights(): LayerWeights {
    return this.layerWeights;
  }

  /**
   * Get weight for a specific layer
   */
  getLayerWeight(layer: TechLayer): number {
    return this.layerWeights[layer];
  }

  /**
   * Get skills for a specific layer
   * Returns empty array for legacy format or if layer doesn't exist
   */
  getSkillsForLayer(layer: TechLayer): SkillWeight[] {
    if (Array.isArray(this.mainStacks)) {
      // Legacy format - return empty array
      return [];
    }
    return this.mainStacks[layer] || [];
  }

  /**
   * Get all skills as flat array of skill names
   * Works with both legacy (string[]) and new (LayerSkills) formats
   */
  getAllSkills(): string[] {
    if (Array.isArray(this.mainStacks)) {
      // Legacy format
      return this.mainStacks;
    }
    
    // New format - flatten all layers
    const allSkills: string[] = [];
    const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    for (const layer of layers) {
      const layerSkills = this.mainStacks[layer] || [];
      allSkills.push(...layerSkills.map(s => s.skill));
    }
    return allSkills;
  }

  /**
   * Validate skill weights sum to 1.0 per layer
   * Returns true if valid, false otherwise
   * Always returns true for legacy format
   */
  validateSkillWeights(): boolean {
    if (Array.isArray(this.mainStacks)) {
      // Legacy format - always valid
      return true;
    }
    
    const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    for (const layer of layers) {
      const skills = this.mainStacks[layer] || [];
      if (skills.length > 0) {
        const sum = skills.reduce((acc, skill) => acc + skill.weight, 0);
        if (Math.abs(sum - 1.0) > 0.001) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if this bid uses the new LayerSkills format
   */
  isLayerSkillsFormat(): boolean {
    return !Array.isArray(this.mainStacks);
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
      layerWeights: this.layerWeights,
      jobDescriptionPath: this.jobDescriptionPath,
      resumePath: this.resumePath,
      origin: this.origin,
      recruiter: this.recruiter,
      jdSpecId: this.jdSpecId,
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
