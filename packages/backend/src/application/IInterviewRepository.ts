import { Interview } from '../domain/Interview';

/**
 * Filter options for querying interviews
 */
export interface InterviewFilterOptions {
  company?: string;
  role?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Sort options for querying interviews
 */
export interface InterviewSortOptions {
  field: 'date' | 'company' | 'role' | 'status';
  order: 'asc' | 'desc';
}

/**
 * Repository interface for Interview aggregate.
 * Placed in application layer following dependency inversion principle.
 */
export interface IInterviewRepository {
  /**
   * Save a new interview or update an existing interview
   */
  save(interview: Interview): Promise<void>;

  /**
   * Find an interview by its unique identifier
   */
  findById(id: string): Promise<Interview | null>;

  /**
   * Find all interviews with optional filtering and sorting
   */
  findAll(filters?: InterviewFilterOptions, sort?: InterviewSortOptions): Promise<Interview[]>;

  /**
   * Find interviews by company and role (case-insensitive)
   */
  findByCompanyAndRole(company: string, role: string): Promise<Interview[]>;

  /**
   * Find interviews by bid ID
   */
  findByBidId(bidId: string): Promise<Interview[]>;

  /**
   * Update an existing interview
   */
  update(interview: Interview): Promise<void>;

  /**
   * Delete an interview by its unique identifier
   */
  delete(id: string): Promise<void>;
}
