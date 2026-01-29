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
  mainStacks?: string[]; // Filter by stacks - bid must include ALL specified stacks
}

/**
 * Sort options for querying bids
 */
export interface BidSortOptions {
  field: 'date' | 'company' | 'role' | 'bidStatus';
  order: 'asc' | 'desc';
}

/**
 * Pagination options for querying bids
 */
export interface BidPaginationOptions {
  page: number;      // Page number (1-indexed)
  pageSize: number;  // Number of items per page
}

/**
 * Paginated result for bids
 */
export interface PaginatedBids {
  items: Bid[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
   * Find all bids with optional filtering, sorting, and pagination
   */
  findAllPaginated(filters?: BidFilterOptions, sort?: BidSortOptions, pagination?: BidPaginationOptions): Promise<PaginatedBids>;

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
