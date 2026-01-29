/**
 * API Client for Job Bid Management System
 * 
 * Provides methods for all backend API endpoints with error handling and retry logic
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
  SortOptions,
  PaginationOptions,
  PaginatedResponse
} from './types';

/**
 * API Client Configuration
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * API Client Class
 */
export class ApiClient {
  private client: AxiosInstance;
  private maxRetries: number;

  constructor(config: ApiClientConfig = {}) {
    // Use relative URL for production (served from same server) or env variable for development
    const baseURL = config.baseURL || (import.meta as any).env.VITE_API_BASE_URL || '';
    
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.maxRetries = config.maxRetries || 3;

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      throw new Error(data?.message || `API Error: ${status}`);
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Error setting up request
      throw new Error(error.message || 'Unknown error occurred');
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
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async createBid(request: CreateBidRequest): Promise<CreateBidResponse> {
    const formData = new FormData();
    formData.append('link', request.link);
    formData.append('company', request.company);
    formData.append('client', request.client);
    formData.append('role', request.role);
    formData.append('mainStacks', JSON.stringify(request.mainStacks));
    formData.append('jobDescription', request.jobDescription);
    formData.append('resume', request.resumeFile);
    formData.append('origin', request.origin);
    if (request.recruiter) {
      formData.append('recruiter', request.recruiter);
    }

    const response = await this.client.post<CreateBidResponse>('/api/bids', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Get all bids with optional filters and sorting
   */
  async getBids(filters?: BidFilters, sort?: SortOptions, pagination?: PaginationOptions): Promise<Bid[] | PaginatedResponse<Bid>> {
    return this.withRetry(async () => {
      const params: any = {
        ...filters,
        sortBy: sort?.field,
        sortOrder: sort?.order,
        page: pagination?.page,
        pageSize: pagination?.pageSize
      };
      
      // Convert mainStacks array to JSON string for query parameter
      if (filters?.mainStacks && filters.mainStacks.length > 0) {
        params.mainStacks = JSON.stringify(filters.mainStacks);
      }
      
      const response = await this.client.get<Bid[] | PaginatedResponse<Bid>>('/api/bids', { params });
      return response.data;
    });
  }

  /**
   * Get a bid by ID
   */
  async getBidById(id: string): Promise<Bid> {
    return this.withRetry(async () => {
      const response = await this.client.get<Bid>(`/api/bids/${id}`);
      return response.data;
    });
  }

  /**
   * Update a bid
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async updateBid(id: string, updates: Partial<Bid>): Promise<Bid> {
    const response = await this.client.put<Bid>(`/api/bids/${id}`, updates);
    return response.data;
  }

  /**
   * Mark bid as rejected
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async markBidRejected(id: string, reason: string): Promise<{ success: boolean }> {
    const response = await this.client.post<{ success: boolean }>(`/api/bids/${id}/reject`, { reason });
    return response.data;
  }

  /**
   * Delete a bid
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async deleteBid(id: string): Promise<void> {
    await this.client.delete(`/api/bids/${id}`);
  }

  /**
   * Rebid with new resume
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async rebid(bidId: string, request: RebidRequest): Promise<RebidResponse> {
    const formData = new FormData();
    formData.append('resume', request.resumeFile);
    if (request.jobDescription) {
      formData.append('newJobDescription', request.jobDescription);
    }

    const response = await this.client.post<RebidResponse>(`/api/bids/${bidId}/rebid`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Download resume PDF
   */
  async downloadResume(bidId: string): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await this.client.get(`/api/bids/${bidId}/resume`, {
        responseType: 'blob'
      });
      return response.data;
    });
  }

  /**
   * Download job description
   */
  async downloadJobDescription(bidId: string): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await this.client.get(`/api/bids/${bidId}/jd`, {
        responseType: 'blob'
      });
      return response.data;
    });
  }

  /**
   * Get candidate resumes for rebidding based on stack matching
   */
  async getCandidateResumes(bidId: string): Promise<{
    bidId: string;
    targetStacks: string[];
    candidates: Array<{
      folderName: string;
      resumePath: string;
      matchingStacks: string[];
      matchCount: number;
    }>;
  }> {
    return this.withRetry(async () => {
      const response = await this.client.get(`/api/bids/${bidId}/candidate-resumes`);
      return response.data;
    });
  }

  /**
   * Download a specific resume by path
   */
  async downloadResumeByPath(resumePath: string): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await this.client.get(`/api/files/${encodeURIComponent(resumePath)}`, {
        responseType: 'blob'
      });
      return response.data;
    });
  }

  // ==================== INTERVIEW ENDPOINTS ====================

  /**
   * Schedule a new interview
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async scheduleInterview(request: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
    const response = await this.client.post<ScheduleInterviewResponse>('/api/interviews', request);
    return response.data;
  }

  /**
   * Get all interviews with optional filters and sorting
   */
  async getInterviews(filters?: InterviewFilters, sort?: SortOptions, pagination?: PaginationOptions): Promise<Interview[] | PaginatedResponse<Interview>> {
    return this.withRetry(async () => {
      const params = {
        ...filters,
        sortBy: sort?.field,
        sortOrder: sort?.order,
        page: pagination?.page,
        pageSize: pagination?.pageSize
      };
      
      const response = await this.client.get<Interview[] | PaginatedResponse<Interview>>('/api/interviews', { params });
      return response.data;
    });
  }

  /**
   * Get an interview by ID
   */
  async getInterviewById(id: string): Promise<Interview> {
    return this.withRetry(async () => {
      const response = await this.client.get<Interview>(`/api/interviews/${id}`);
      return response.data;
    });
  }

  /**
   * Update an interview
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    const response = await this.client.put<Interview>(`/api/interviews/${id}`, updates);
    return response.data;
  }

  /**
   * Delete an interview
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async deleteInterview(id: string): Promise<void> {
    await this.client.delete(`/api/interviews/${id}`);
  }

  /**
   * Mark interview as attended
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async attendInterview(id: string): Promise<{ success: boolean; status: string }> {
    const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/attend`);
    return response.data;
  }

  /**
   * Close a pending interview manually
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async closeInterview(id: string): Promise<{ success: boolean; status: string }> {
    const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/close`);
    return response.data;
  }

  /**
   * Cancel an interview
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async cancelInterview(id: string, cancellationReason: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ success: boolean; message: string }>(`/api/interviews/${id}/cancel`, { cancellationReason });
    return response.data;
  }

  /**
   * Revert a cancelled interview back to scheduled
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async revertCancelInterview(id: string): Promise<{ success: boolean; status: string }> {
    const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/revert-cancel`);
    return response.data;
  }

  /**
   * Complete an interview
   * Note: Does not use retry logic as this is a state-changing operation
   */
  async completeInterview(id: string, request: CompleteInterviewRequest): Promise<CompleteInterviewResponse> {
    const response = await this.client.post<CompleteInterviewResponse>(`/api/interviews/${id}/complete`, request);
    return response.data;
  }

  // ==================== COMPANY HISTORY ENDPOINTS ====================

  /**
   * Get company history by company and role
   */
  async getCompanyHistory(company: string, role: string): Promise<CompanyHistory | null> {
    return this.withRetry(async () => {
      const response = await this.client.get<CompanyHistory>('/api/company-history', {
        params: { company, role }
      });
      return response.data;
    });
  }

  /**
   * Get all company histories
   */
  async getAllCompanyHistories(): Promise<CompanyHistory[]> {
    return this.withRetry(async () => {
      const response = await this.client.get<CompanyHistory[]>('/api/company-history/all');
      return response.data;
    });
  }

  // ==================== TECH STACK ENDPOINTS ====================

  /**
   * Get all available tech stacks
   */
  async getTechStacks(): Promise<string[]> {
    return this.withRetry(async () => {
      const response = await this.client.get<string[]>('/api/tech-stacks');
      return response.data;
    });
  }

  /**
   * Add a new tech stack
   */
  async addTechStack(stack: string): Promise<{ message: string; stack: string; allStacks: string[] }> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ message: string; stack: string; allStacks: string[] }>(
        '/api/tech-stacks',
        { stack }
      );
      return response.data;
    });
  }

  // ==================== ANALYTICS ENDPOINTS ====================

  /**
   * Get overview analytics
   */
  async getAnalyticsOverview(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/overview');
      return response.data;
    });
  }

  /**
   * Get bid performance analytics
   */
  async getBidPerformance(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/bid-performance');
      return response.data;
    });
  }

  /**
   * Get interview performance analytics
   */
  async getInterviewPerformance(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/interview-performance');
      return response.data;
    });
  }

  /**
   * Get tech stack analysis
   */
  async getTechStackAnalysis(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/tech-stack-analysis');
      return response.data;
    });
  }

  /**
   * Get company performance analytics
   */
  async getCompanyPerformance(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/company-performance');
      return response.data;
    });
  }

  /**
   * Get time trends analytics
   */
  async getTimeTrends(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/time-trends');
      return response.data;
    });
  }

  /**
   * Get recruiter performance analytics
   */
  async getRecruiterPerformance(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/recruiter-performance');
      return response.data;
    });
  }

  /**
   * Get origin comparison analytics
   */
  async getOriginComparison(): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/origin-comparison');
      return response.data;
    });
  }

  /**
   * Get advanced trends with filters
   */
  async getAdvancedTrends(params?: {
    period?: 'week' | 'month';
    stack?: string;
    role?: string;
    company?: string;
  }): Promise<any> {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/analytics/advanced-trends', { params });
      return response.data;
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
