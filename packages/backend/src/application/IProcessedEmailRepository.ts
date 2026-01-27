/**
 * Repository interface for tracking processed emails.
 * Ensures idempotency in email processing.
 * Placed in application layer following dependency inversion principle.
 */
export interface IProcessedEmailRepository {
  /**
   * Mark an email as processed
   */
  markAsProcessed(emailId: string): Promise<void>;

  /**
   * Check if an email has been processed
   */
  isProcessed(emailId: string): Promise<boolean>;
}
