import { IProcessedEmailRepository } from '../application/IProcessedEmailRepository';

export class InMemoryProcessedEmailRepository implements IProcessedEmailRepository {
  private processedEmails: Set<string> = new Set();

  async markAsProcessed(emailId: string): Promise<void> {
    this.processedEmails.add(emailId);
  }

  async isProcessed(emailId: string): Promise<boolean> {
    return this.processedEmails.has(emailId);
  }

  // Helper method for testing
  clear(): void {
    this.processedEmails.clear();
  }
}
