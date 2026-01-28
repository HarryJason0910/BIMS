/**
 * Tauri-specific API Client
 * Uses Tauri's HTTP client instead of Axios for desktop app compatibility
 */

import { fetch, Body, ResponseType } from '@tauri-apps/api/http';
import {
  Bid,
  CreateBidRequest,
  CreateBidResponse,
  RebidRequest,
  RebidResponse,
  BidFilters,
  Interview,
  ScheduleInterviewRequest,
  ScheduleInterviewResponse,
  CompleteInterviewRequest,
  CompleteInterviewResponse,
  InterviewFilters,
  CompanyHistory,
  SortOptions
} from './types';

/**
 * Tauri API Client Configuration
 */
export interface TauriApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Tauri API Client Class
 */
export class TauriApiClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: TauriApiClientConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Build full URL
   */
  private buildURL(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    if (error.status) {
      throw new Error(`API Error: ${error.status}`);
    } else {
      throw new Error('No response from server. Please check your connection.');
    }
  }

  /**
   * Retry wrapper for API calls
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('API Error: 4')) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  // ==================== BID ENDPOINTS ====================

  /**
   * Create a new bid
   */
  async createBid(request: CreateBidRequest): Promise<CreateBidResponse> {
    return this.withRetry(async () => {
      const formData = new FormData();
      formData.append('link', request.link);
      formData.append('company', request.company);
      formData.append('client', request.client);
      formData.append('role', request.role);
      formData.append('mainStacks', JSON.stringify(request.mainStacks));
      formData.append('jobDescription', request.jobDescription);
      formData.append('resume', request.resumeFile);

      const response = await fetch(this.buildURL('/api/bids'), {
        method: 'POST',
        body: Body.form(formData),
        timeout: this.timeout,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data as CreateBidResponse;
    });
  }

  /**
   * Get all bids with optional filters and sorting
   */
  async getBids(filters?: BidFilters, sort?: SortOptions): Promise<Bid[]> {
    return this.withRetry(async () => {
      const params = {
        ...filters,
        sortBy: sort?.field,
        sortOrder: sort?.order
      };
      
      const response = await fetch<Bid[]>(this.buildURL('/api/bids', params), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Get a bid by ID
   */
  async getBidById(id: string): Promise<Bid> {
    return this.withRetry(async () => {
      const response = await fetch<Bid>(this.buildURL(`/api/bids/${id}`), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Update a bid
   */
  async updateBid(id: string, updates: Partial<Bid>): Promise<Bid> {
    return this.withRetry(async () => {
      const response = await fetch<Bid>(this.buildURL(`/api/bids/${id}`), {
        method: 'PUT',
        body: Body.json(updates),
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Delete a bid
   */
  async deleteBid(id: string): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(this.buildURL(`/api/bids/${id}`), {
        method: 'DELETE',
        timeout: this.timeout,
      });

      if (!response.ok) {
        this.handleError(response);
      }
    });
  }

  /**
   * Rebid with new resume
   */
  async rebid(bidId: string, request: RebidRequest): Promise<RebidResponse> {
    return this.withRetry(async () => {
      const formData = new FormData();
      formData.append('resume', request.resumeFile);
      if (request.jobDescription) {
        formData.append('newJobDescription', request.jobDescription);
      }

      const response = await fetch<RebidResponse>(this.buildURL(`/api/bids/${bidId}/rebid`), {
        method: 'POST',
        body: Body.form(formData),
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Download resume PDF
   */
  async downloadResume(bidId: string): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await fetch<number[]>(this.buildURL(`/api/bids/${bidId}/resume`), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.Binary,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return new Blob([new Uint8Array(response.data)]);
    });
  }

  /**
   * Download job description
   */
  async downloadJobDescription(bidId: string): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await fetch<number[]>(this.buildURL(`/api/bids/${bidId}/jd`), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.Binary,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return new Blob([new Uint8Array(response.data)]);
    });
  }

  // ==================== INTERVIEW ENDPOINTS ====================

  /**
   * Schedule a new interview
   */
  async scheduleInterview(request: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
    return this.withRetry(async () => {
      const response = await fetch<ScheduleInterviewResponse>(this.buildURL('/api/interviews'), {
        method: 'POST',
        body: Body.json(request),
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Get all interviews with optional filters and sorting
   */
  async getInterviews(filters?: InterviewFilters, sort?: SortOptions): Promise<Interview[]> {
    return this.withRetry(async () => {
      const params = {
        ...filters,
        sortBy: sort?.field,
        sortOrder: sort?.order
      };
      
      const response = await fetch<Interview[]>(this.buildURL('/api/interviews', params), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Get an interview by ID
   */
  async getInterviewById(id: string): Promise<Interview> {
    return this.withRetry(async () => {
      const response = await fetch<Interview>(this.buildURL(`/api/interviews/${id}`), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Update an interview
   */
  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    return this.withRetry(async () => {
      const response = await fetch<Interview>(this.buildURL(`/api/interviews/${id}`), {
        method: 'PUT',
        body: Body.json(updates),
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Delete an interview
   */
  async deleteInterview(id: string): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(this.buildURL(`/api/interviews/${id}`), {
        method: 'DELETE',
        timeout: this.timeout,
      });

      if (!response.ok) {
        this.handleError(response);
      }
    });
  }

  /**
   * Mark interview as attended
   */
  async attendInterview(id: string): Promise<{ success: boolean; status: string }> {
    return this.withRetry(async () => {
      const response = await fetch<{ success: boolean; status: string }>(
        this.buildURL(`/api/interviews/${id}/attend`),
        {
          method: 'POST',
          timeout: this.timeout,
          responseType: ResponseType.JSON,
        }
      );

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Close a pending interview manually
   */
  async closeInterview(id: string): Promise<{ success: boolean; status: string }> {
    return this.withRetry(async () => {
      const response = await fetch<{ success: boolean; status: string }>(
        this.buildURL(`/api/interviews/${id}/close`),
        {
          method: 'POST',
          timeout: this.timeout,
          responseType: ResponseType.JSON,
        }
      );

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Complete an interview
   */
  async completeInterview(id: string, request: CompleteInterviewRequest): Promise<CompleteInterviewResponse> {
    return this.withRetry(async () => {
      const response = await fetch<CompleteInterviewResponse>(
        this.buildURL(`/api/interviews/${id}/complete`),
        {
          method: 'POST',
          body: Body.json(request),
          timeout: this.timeout,
          responseType: ResponseType.JSON,
        }
      );

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  // ==================== COMPANY HISTORY ENDPOINTS ====================

  /**
   * Get company history by company and role
   */
  async getCompanyHistory(company: string, role: string): Promise<CompanyHistory | null> {
    return this.withRetry(async () => {
      const response = await fetch<CompanyHistory>(
        this.buildURL('/api/company-history', { company, role }),
        {
          method: 'GET',
          timeout: this.timeout,
          responseType: ResponseType.JSON,
        }
      );

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  /**
   * Get all company histories
   */
  async getAllCompanyHistories(): Promise<CompanyHistory[]> {
    return this.withRetry(async () => {
      const response = await fetch<CompanyHistory[]>(this.buildURL('/api/company-history/all'), {
        method: 'GET',
        timeout: this.timeout,
        responseType: ResponseType.JSON,
      });

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }

  // ==================== EMAIL STATUS ENDPOINT ====================

  /**
   * Check email connection status
   */
  async getEmailStatus(): Promise<{ connected: boolean; error?: string; timestamp: string }> {
    return this.withRetry(async () => {
      const response = await fetch<{ connected: boolean; error?: string; timestamp: string }>(
        this.buildURL('/api/email/status'),
        {
          method: 'GET',
          timeout: this.timeout,
          responseType: ResponseType.JSON,
        }
      );

      if (!response.ok) {
        this.handleError(response);
      }

      return response.data;
    });
  }
}
