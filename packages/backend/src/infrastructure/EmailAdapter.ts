/**
 * Email Adapter - Microsoft Graph API Integration
 * 
 * Handles authentication and email fetching from Microsoft Outlook via Graph API.
 * Implements retry logic and error handling for API rate limits.
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { EmailEvent } from '../domain/EmailClassifier';
import { ProcessEmailUseCase } from '../application/ProcessEmailUseCase';

/**
 * Configuration for EmailAdapter
 */
export interface EmailAdapterConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  userEmail: string;
  keywords?: string[];
  pollingIntervalMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Email Adapter for Microsoft Graph API
 * 
 * Responsibilities:
 * - Authenticate with Microsoft Graph API using OAuth client credentials
 * - Fetch new emails from inbox
 * - Filter emails by keywords
 * - Convert Graph API email format to EmailEvent
 * - Handle API rate limits with retry logic
 */
export class EmailAdapter {
  private client: Client | null = null;
  private readonly config: Required<EmailAdapterConfig>;
  private lastFetchDate: Date;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private processEmailUseCase: ProcessEmailUseCase | null = null;

  constructor(config: EmailAdapterConfig) {
    this.config = {
      ...config,
      keywords: config.keywords || ['job', 'interview', 'application', 'position', 'role'],
      pollingIntervalMs: config.pollingIntervalMs || 300000, // 5 minutes default
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000
    };
    
    // Start from current time to avoid processing old emails on first run
    this.lastFetchDate = new Date();
  }

  /**
   * Authenticate with Microsoft Graph API using client credentials flow
   */
  async authenticate(): Promise<void> {
    try {
      const credential = new ClientSecretCredential(
        this.config.tenantId,
        this.config.clientId,
        this.config.clientSecret
      );

      this.client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const token = await credential.getToken('https://graph.microsoft.com/.default');
            return token?.token || '';
          }
        }
      });

      // Test authentication by making a simple request
      await this.client.api('/me').get();
      
      console.log('Successfully authenticated with Microsoft Graph API');
    } catch (error) {
      console.error('Failed to authenticate with Microsoft Graph API:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch new emails from inbox since last fetch
   * Returns emails that match configured keywords
   */
  async fetchNewEmails(): Promise<EmailEvent[]> {
    if (!this.client) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const emails = await this.fetchEmailsWithRetry();
      const filteredEmails = this.filterEmailsByKeywords(emails);
      
      // Update last fetch date to now
      this.lastFetchDate = new Date();
      
      return filteredEmails;
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      throw error;
    }
  }

  /**
   * Fetch emails with retry logic for rate limits
   */
  private async fetchEmailsWithRetry(): Promise<EmailEvent[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.fetchEmailsFromGraph();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if it's a rate limit error (429)
        const isRateLimit = error instanceof Error && 
          (error.message.includes('429') || error.message.includes('rate limit'));
        
        if (isRateLimit && attempt < this.config.maxRetries - 1) {
          // Exponential backoff
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);
          await this.sleep(delay);
          continue;
        }
        
        // If not rate limit or last attempt, throw
        if (attempt === this.config.maxRetries - 1) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch emails after retries');
  }

  /**
   * Fetch emails from Microsoft Graph API
   */
  private async fetchEmailsFromGraph(): Promise<EmailEvent[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    // Build filter for emails received after last fetch
    const filterDate = this.lastFetchDate.toISOString();
    const filter = `receivedDateTime ge ${filterDate}`;
    
    // Fetch emails from inbox
    const response = await this.client
      .api(`/users/${this.config.userEmail}/messages`)
      .filter(filter)
      .select('id,subject,body,from,receivedDateTime')
      .orderby('receivedDateTime desc')
      .top(50) // Limit to 50 most recent emails
      .get();

    const messages = response.value || [];
    
    // Convert to EmailEvent format
    return messages.map((message: any) => this.convertToEmailEvent(message));
  }

  /**
   * Convert Microsoft Graph message to EmailEvent
   */
  private convertToEmailEvent(message: any): EmailEvent {
    return {
      id: message.id,
      subject: message.subject || '',
      body: message.body?.content || '',
      sender: message.from?.emailAddress?.address || '',
      receivedDate: new Date(message.receivedDateTime)
    };
  }

  /**
   * Filter emails by configured keywords
   */
  private filterEmailsByKeywords(emails: EmailEvent[]): EmailEvent[] {
    if (!this.config.keywords || this.config.keywords.length === 0) {
      return emails;
    }

    return emails.filter(email => {
      const combinedText = `${email.subject} ${email.body}`.toLowerCase();
      return this.config.keywords!.some(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current polling interval
   */
  getPollingInterval(): number {
    return this.config.pollingIntervalMs;
  }

  /**
   * Reset last fetch date (useful for testing)
   */
  resetLastFetchDate(date?: Date): void {
    this.lastFetchDate = date || new Date();
  }

  /**
   * Set the ProcessEmailUseCase for handling emails
   */
  setProcessEmailUseCase(useCase: ProcessEmailUseCase): void {
    this.processEmailUseCase = useCase;
  }

  /**
   * Start polling for new emails at configured interval
   */
  async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.log('Email polling is already running');
      return;
    }

    if (!this.processEmailUseCase) {
      throw new Error('ProcessEmailUseCase not set. Call setProcessEmailUseCase() first.');
    }

    console.log(`Starting email polling with interval: ${this.config.pollingIntervalMs}ms`);
    this.isPolling = true;

    // Perform initial fetch
    await this.pollAndProcessEmails();

    // Set up recurring polling
    this.pollingTimer = setInterval(async () => {
      await this.pollAndProcessEmails();
    }, this.config.pollingIntervalMs);
  }

  /**
   * Stop polling for emails
   */
  stopPolling(): void {
    if (!this.isPolling) {
      console.log('Email polling is not running');
      return;
    }

    console.log('Stopping email polling');
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    this.isPolling = false;
  }

  /**
   * Check if polling is active
   */
  isPollingActive(): boolean {
    return this.isPolling;
  }

  /**
   * Poll for new emails and process them
   */
  private async pollAndProcessEmails(): Promise<void> {
    try {
      console.log('Polling for new emails...');
      
      const emails = await this.fetchNewEmails();
      
      if (emails.length === 0) {
        console.log('No new emails found');
        return;
      }

      console.log(`Found ${emails.length} new email(s), processing...`);

      // Process each email
      for (const email of emails) {
        try {
          const result = await this.processEmailUseCase!.execute(email);
          console.log(`Processed email ${email.id}:`, result.action);
        } catch (error) {
          // Log error but continue processing other emails
          console.error(`Error processing email ${email.id}:`, error);
        }
      }

      console.log('Email polling cycle completed');
    } catch (error) {
      // Log error but don't stop polling
      console.error('Error during email polling:', error);
    }
  }
}
