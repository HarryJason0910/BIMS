import { Bid } from '../domain/Bid';
import { DuplicationDetectionPolicy, DuplicationWarning } from '../domain/DuplicationDetectionPolicy';
import { CompanyHistory } from '../domain/CompanyHistory';
import { IBidRepository } from './IBidRepository';

/**
 * Request interface for creating a new bid
 */
export interface CreateBidRequest {
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescriptionPath: string;
  resumePath: string;
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
 * 2. Fetch all existing bids from repository
 * 3. Run duplication detection policy
 * 3.1. If duplications detected, throw error and do NOT save
 * 4. Check company history for warnings
 * 5. Create new Bid aggregate with today's date
 * 6. Attach company warning to bidDetail if exists
 * 7. Save bid to repository
 * 8. Return bid ID and warnings
 */
export class CreateBidUseCase {
  constructor(
    private bidRepository: IBidRepository,
    private duplicationPolicy: DuplicationDetectionPolicy,
    private companyHistory: CompanyHistory
  ) {}

  async execute(request: CreateBidRequest): Promise<CreateBidResponse> {
    // 1. Validate required fields
    this.validateRequest(request);

    // 2. Fetch all existing bids from repository
    const existingBids = await this.bidRepository.findAll();

    // 3. Run duplication detection policy
    const warnings = this.duplicationPolicy.checkDuplication(request, existingBids);

    // 3.1. If duplications detected, throw error and do NOT save
    if (warnings.length > 0) {
      const errorMessage = warnings.map(w => w.message).join('; ');
      throw new Error(`Duplicate bid detected: ${errorMessage}`);
    }

    // 4. Check company history for warnings
    let companyWarning: string | null = null;
    if (this.companyHistory.hasFailures(request.company, request.role)) {
      companyWarning = this.companyHistory.getWarningMessage(request.company, request.role);
    }

    // 5. Create new Bid aggregate with today's date
    const bid = Bid.create({
      link: request.link,
      company: request.company,
      client: request.client,
      role: request.role,
      mainStacks: request.mainStacks,
      jobDescriptionPath: request.jobDescriptionPath,
      resumePath: request.resumePath,
    });

    // 6. Attach company warning to bidDetail if exists
    if (companyWarning) {
      bid.attachWarning(companyWarning);
    }

    // 7. Save bid to repository
    await this.bidRepository.save(bid);

    // 8. Return bid ID and warnings
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
      'resumePath',
    ];

    for (const field of requiredFields) {
      if (!request[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate mainStacks is not empty array
    if (Array.isArray(request.mainStacks) && request.mainStacks.length === 0) {
      throw new Error('mainStacks cannot be empty');
    }

    // Validate string fields are not empty strings
    const stringFields: (keyof CreateBidRequest)[] = [
      'link',
      'company',
      'client',
      'role',
      'jobDescriptionPath',
      'resumePath',
    ];

    for (const field of stringFields) {
      if (typeof request[field] === 'string' && (request[field] as string).trim() === '') {
        throw new Error(`Field ${field} cannot be empty`);
      }
    }
  }
}
