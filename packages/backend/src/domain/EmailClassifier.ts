/**
 * Email Classifier
 * 
 * Classifies emails based on content and extracts relevant information.
 */

export enum EmailEventType {
  BID_REJECTION = 'BID_REJECTION',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  UNKNOWN = 'UNKNOWN'
}

export interface EmailEvent {
  id: string;
  subject: string;
  body: string;
  sender: string;
  receivedDate: Date;
}

export interface EmailClassification {
  type: EmailEventType;
  company?: string;
  role?: string;
  confidence: number;
}

export class EmailClassifier {
  private readonly rejectionKeywords = [
    'unfortunately',
    'not selected',
    'not moving forward',
    'decided to pursue',
    'other candidates',
    'not be moving forward',
    'will not be proceeding',
    'regret to inform',
    'unable to offer',
    'position has been filled',
    'not a match',
    'declined',
    'rejected'
  ];

  private readonly interviewScheduledKeywords = [
    'interview',
    'schedule',
    'meeting',
    'call',
    'discuss',
    'next steps',
    'would like to speak',
    'available for',
    'calendar invite',
    'zoom',
    'teams meeting'
  ];

  private readonly interviewCompletedKeywords = [
    'thank you for',
    'following up',
    'next round',
    'final round',
    'offer',
    'feedback',
    'decision',
    'update on your application'
  ];

  /**
   * Classify an email based on its content
   */
  classify(email: EmailEvent): EmailClassification {
    const lowerSubject = email.subject.toLowerCase();
    const lowerBody = email.body.toLowerCase();
    const combinedText = `${lowerSubject} ${lowerBody}`;

    // Check for rejection first (highest priority)
    if (this.isRejection(combinedText)) {
      return {
        type: EmailEventType.BID_REJECTION,
        company: this.extractCompany(email),
        role: this.extractRole(email),
        confidence: this.calculateConfidence(combinedText, this.rejectionKeywords)
      };
    }

    // Check for interview completed (before scheduled to avoid confusion)
    if (this.isInterviewCompleted(combinedText)) {
      return {
        type: EmailEventType.INTERVIEW_COMPLETED,
        company: this.extractCompany(email),
        role: this.extractRole(email),
        confidence: this.calculateConfidence(combinedText, this.interviewCompletedKeywords)
      };
    }

    // Check for interview scheduled
    if (this.isInterviewScheduled(combinedText)) {
      return {
        type: EmailEventType.INTERVIEW_SCHEDULED,
        company: this.extractCompany(email),
        role: this.extractRole(email),
        confidence: this.calculateConfidence(combinedText, this.interviewScheduledKeywords)
      };
    }

    // Unknown email type
    return {
      type: EmailEventType.UNKNOWN,
      confidence: 0
    };
  }

  /**
   * Check if email is a rejection
   */
  isRejection(text: string): boolean {
    return this.containsKeywords(text, this.rejectionKeywords);
  }

  /**
   * Check if email is about interview scheduling
   */
  isInterviewScheduled(text: string): boolean {
    return this.containsKeywords(text, this.interviewScheduledKeywords);
  }

  /**
   * Check if email is about interview completion
   */
  isInterviewCompleted(text: string): boolean {
    return this.containsKeywords(text, this.interviewCompletedKeywords);
  }

  /**
   * Extract company name from email
   */
  extractCompany(email: EmailEvent): string | undefined {
    // Try to extract from sender domain
    const domainMatch = email.sender.match(/@([^.]+)\./);
    if (domainMatch) {
      const domain = domainMatch[1];
      // Capitalize first letter
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    // Try to extract from body using common patterns
    const bodyPatterns = [
      /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /with ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /from ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
    ];

    for (const pattern of bodyPatterns) {
      const match = email.body.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract role/position from email
   */
  extractRole(email: EmailEvent): string | undefined {
    // Common patterns for role extraction
    const patterns = [
      /for the ([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}) position/i,
      /(?:the |your |a |an )([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}) role/i,
      /as (?:a |an )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i,
      /position of ([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i
    ];

    // Try subject first
    for (const pattern of patterns) {
      const match = email.subject.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Try body
    for (const pattern of patterns) {
      const match = email.body.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Check if text contains any of the keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Calculate confidence score based on keyword matches
   */
  private calculateConfidence(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    const confidence = Math.min(matches / 3, 1.0); // Max confidence at 3+ matches
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }
}
