import { Bid } from '../domain/Bid';

/**
 * Filter options for querying bids
 */
export interface BidFilterOptions {
  company?: string;
  role?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Sort options for querying bids
 */
export interface BidSortOptions {
  field: 'date' | 'company' | 'role' | 'bidStatus';
  order: 'asc' | 'desc';
}

/**
 * Repository interface for Bid aggregate.
 * Placed in application layer following dependency inversion principle.
 */
export interface IBidRepository {
  /**
   * Save a new bid or update an existing bid
   */
  save(bid: Bid): Promise<void>;

  /**
   * Find a bid by its unique identifier
   */
  findById(id: string): Promise<Bid | null>;

  /**
   * Find all bids with optional filtering and sorting
   */
  findAll(filters?: BidFilterOptions, sort?: BidSortOptions): Promise<Bid[]>;

  /**
   * Find bids by company and role (case-insensitive)
   */
  findByCompanyAndRole(company: string, role: string): Promise<Bid[]>;

  /**
   * Find a bid by its link
   */
  findByLink(link: string): Promise<Bid | null>;

  /**
   * Update an existing bid
   */
  update(bid: Bid): Promise<void>;

  /**
   * Delete a bid by its unique identifier
   */
  delete(id: string): Promise<void>;
}
