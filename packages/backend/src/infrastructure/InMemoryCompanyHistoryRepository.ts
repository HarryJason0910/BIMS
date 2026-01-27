import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';
import { CompanyHistory, CompanyRoleHistory } from '../domain/CompanyHistory';

export class InMemoryCompanyHistoryRepository implements ICompanyHistoryRepository {
  private history: CompanyHistory = new CompanyHistory();

  async save(history: CompanyHistory): Promise<void> {
    this.history = history;
  }

  async findByCompanyAndRole(company: string, role: string): Promise<CompanyRoleHistory | null> {
    return this.history.getHistory(company, role);
  }

  async findAll(): Promise<CompanyHistory> {
    return this.history;
  }

  // Helper method for testing
  clear(): void {
    this.history = new CompanyHistory();
  }
}
