import { CompanyHistory, CompanyRoleHistory } from '../domain/CompanyHistory';

/**
 * Repository interface for CompanyHistory.
 * Placed in application layer following dependency inversion principle.
 */
export interface ICompanyHistoryRepository {
  /**
   * Save company history (create or update)
   */
  save(history: CompanyHistory): Promise<void>;

  /**
   * Find company history by company and role (case-insensitive)
   */
  findByCompanyAndRole(company: string, role: string): Promise<CompanyRoleHistory | null>;

  /**
   * Find all company histories
   */
  findAll(): Promise<CompanyHistory>;
}
