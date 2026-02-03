import { Bid, BidOrigin, ResumeCheckerType } from '../domain/Bid';
import { DuplicationDetectionPolicy, DuplicationWarning } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { IBidRepository } from './IBidRepository';
import { IResumeRepository } from './IResumeRepository';
import { LayerWeights, LayerSkills, isValidLayerWeights } from '../domain/JDSpecTypes';

/**
 * Request interface for creating a new bid
 */
export interface CreateBidRequest {
  id?: string; // Optional - if provided, will be used instead of auto-generating
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[] | LayerSkills; // Support both legacy (string[]) and new (LayerSkills) formats
  layerWeights?: LayerWeights; // Optional - if not provided, will be derived from role
  jobDescriptionPath: string;
  resumePath?: string; // Optional when resumeId is provided
  resumeId?: string; // Optional - ID of selected resume from history
  origin: BidOrigin;
  recruiter?: string;
  resumeChecker?: ResumeCheckerType;
  jdSpecId?: string; // Optional - JD specification ID for enhanced skill matching
}

/**
 * Response interface for bid creation
 */
export interface CreateBidResponse {
  bidId: string;
  warnings: DuplicationWarning[];
  companyWarning: string | null;
}

/**
 * Use case for creating a new bid with duplication detection and company history warnings.
 * 
 * Flow:
 * 1. Validate required fields
 * 2. Validate resume (either uploaded or selected from history)
 * 3. Fetch all existing bids from repository
 * 4. Run duplication detection policy
 * 4.1. If duplications detected, throw error and do NOT save
 * 5. Check company history for warnings
 * 6. Create new Bid aggregate with today's date
 * 7. Attach company warning to bidDetail if exists
 * 8. Save bid to repository
 * 9. Return bid ID and warnings
 */
export class CreateBidUseCase {
  constructor(
    private bidRepository: IBidRepository,
    private duplicationPolicy: DuplicationDetectionPolicy,
    private companyHistory: CompanyHistory,
    private resumeRepository?: IResumeRepository
  ) {}

  async execute(request: CreateBidRequest): Promise<CreateBidResponse> {
    // 1. Validate required fields
    this.validateRequest(request);

    // 2. Validate resume (either uploaded or selected from history)
    const resumePath = await this.validateAndGetResumePath(request);

    // 3. Fetch all existing bids from repository
    const existingBids = await this.bidRepository.findAll();

    // 4. Run duplication detection policy
    // Create a complete request object with resumePath for duplication check
    const requestWithResumePath = {
      ...request,
      resumePath: resumePath,
    };
    const warnings = this.duplicationPolicy.checkDuplication(requestWithResumePath, existingBids);

    // 4.1. If duplications detected, throw error and do NOT save
    if (warnings.length > 0) {
      const errorMessage = warnings.map(w => w.message).join('; ');
      throw new Error(`Duplicate bid detected: ${errorMessage}`);
    }

    // 5. Check company history for warnings
    let companyWarning: string | null = null;
    if (this.companyHistory.hasFailures(request.company, request.role)) {
      companyWarning = this.companyHistory.getWarningMessage(request.company, request.role);
    }

    // 6. Create new Bid aggregate with today's date
    const bid = Bid.create({
      id: request.id, // Pass the pre-generated ID if provided
      link: request.link,
      company: request.company,
      client: request.client,
      role: request.role,
      mainStacks: request.mainStacks,
      layerWeights: request.layerWeights, // Pass layer weights (optional)
      jobDescriptionPath: request.jobDescriptionPath,
      resumePath: resumePath,
      origin: request.origin,
      recruiter: request.recruiter,
      jdSpecId: request.jdSpecId, // Store JD spec ID for enhanced skill matching
    });

    // 6.1. Set resume checker if provided
    if (request.resumeChecker) {
      bid.setResumeChecker(request.resumeChecker);
    }

    // 7. Attach company warning to bidDetail if exists
    if (companyWarning) {
      bid.attachWarning(companyWarning);
    }

    // 8. Save bid to repository
    await this.bidRepository.save(bid);

    // 9. Return bid ID and warnings
    return {
      bidId: bid.id,
      warnings,
      companyWarning,
    };
  }

  private validateRequest(request: CreateBidRequest): void {
    const requiredFields: (keyof CreateBidRequest)[] = [
      'link',
      'company',
      'client',
      'role',
      'mainStacks',
      'jobDescriptionPath',
      'origin',
    ];

    for (const field of requiredFields) {
      if (!request[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate that either resumePath or resumeId is provided
    if (!request.resumePath && !request.resumeId) {
      throw new Error('Either resumePath or resumeId must be provided');
    }

    // Validate that both resumePath and resumeId are not provided simultaneously
    if (request.resumePath && request.resumeId) {
      throw new Error('Cannot provide both resumePath and resumeId');
    }

    // Validate mainStacks based on format
    if (Array.isArray(request.mainStacks)) {
      // Legacy format: string[]
      if (request.mainStacks.length === 0) {
        throw new Error('mainStacks cannot be empty');
      }
    } else {
      // New format: LayerSkills - validate structure
      this.validateLayerSkills(request.mainStacks);
    }

    // Validate layerWeights if provided
    if (request.layerWeights) {
      if (!isValidLayerWeights(request.layerWeights)) {
        throw new Error('Layer weights must sum to 1.0 (±0.001 tolerance)');
      }
    }

    // Validate string fields are not empty strings
    const stringFields = ['link', 'company', 'client', 'role', 'jobDescriptionPath'];

    for (const field of stringFields) {
      if (typeof request[field as keyof CreateBidRequest] === 'string' && (request[field as keyof CreateBidRequest] as string).trim() === '') {
        throw new Error(`Field ${field} cannot be empty`);
      }
    }

    // Validate resumePath is not empty if provided
    if (request.resumePath && request.resumePath.trim() === '') {
      throw new Error('Field resumePath cannot be empty');
    }

    // Validate resumeId is not empty if provided
    if (request.resumeId && request.resumeId.trim() === '') {
      throw new Error('Field resumeId cannot be empty');
    }

    // Validate recruiter is provided when origin is LINKEDIN
    if (request.origin === BidOrigin.LINKEDIN && (!request.recruiter || request.recruiter.trim() === '')) {
      throw new Error('Recruiter name is required when origin is LINKEDIN');
    }
  }

  /**
   * Validate LayerSkills structure
   * - Must have all 6 required keys
   * - Each key must map to an array of SkillWeight objects
   * - Skill weights within each layer must sum to 1.0 (±0.001 tolerance) or layer is empty
   */
  private validateLayerSkills(layerSkills: LayerSkills): void {
    const requiredLayers = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    
    // Check all required keys exist
    for (const layer of requiredLayers) {
      if (!(layer in layerSkills)) {
        throw new Error(`LayerSkills must have '${layer}' key`);
      }
      
      const skills = layerSkills[layer as keyof LayerSkills];
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

  /**
   * Validates resume and returns the resume path to use for the bid.
   * 
   * If resumeId is provided:
   * - Validates that the resume exists in the repository
   * - Validates that the resume file still exists on disk
   * - Returns the file path from the resume metadata
   * 
   * If resumePath is provided:
   * - Returns the provided path (for uploaded files)
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  private async validateAndGetResumePath(request: CreateBidRequest): Promise<string> {
    // If resumeId is provided, validate and get path from repository
    if (request.resumeId) {
      if (!this.resumeRepository) {
        throw new Error('Resume repository not available for resume selection');
      }

      // Get all resume metadata to find the selected resume
      const allMetadata = await this.resumeRepository.getAllResumeMetadata();
      const selectedResume = allMetadata.find(m => m.getId() === request.resumeId);

      if (!selectedResume) {
        throw new Error('Selected resume no longer exists');
      }

      // Validate that the resume file still exists
      const filePath = selectedResume.getFilePath();
      const exists = await this.resumeRepository.fileExists(filePath);

      if (!exists) {
        throw new Error('Resume file not found');
      }

      return filePath;
    }

    // If resumePath is provided, return it (for uploaded files)
    return request.resumePath!;
  }
}
