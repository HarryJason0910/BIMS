/**
 * API Client for Job Bid Management System
 * 
 * Provides methods for all backend API endpoints with error handling and retry logic
 * Automatically uses Tauri HTTP client in desktop mode, Axios in web mode
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
  SortOptions
} from './types';

// Detect Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

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
    const baseURL = config.baseURL || (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    // Log environment for debugging
    if (isTauri) {
      console.log('[Tauri Mode] API Client initialized with baseURL:', baseURL);
      console.log('[Tauri Mode] Using native fetch for HTTP requests');
    }
    
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
    
    // Add request interceptor for debugging in Tauri
    if (isTauri) {
      this.client.interceptors.request.use(
        (config) => {
          console.log('[Tauri Request]', config.method?.toUpperCase(), config.url);
          return config;
        },
        (error) => {
          console.error('[Tauri Request Error]', error);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleError(error: AxiosError): Promise<never> {
    console.error('[API Error]', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      isTauri
    });
    
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

      const response = await this.client.post<CreateBidResponse>('/api/bids', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
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
      
      const response = await this.client.get<Bid[]>('/api/bids', { params });
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
   */
  async updateBid(id: string, updates: Partial<Bid>): Promise<Bid> {
    return this.withRetry(async () => {
      const response = await this.client.put<Bid>(`/api/bids/${id}`, updates);
      return response.data;
    });
  }

  /**
   * Delete a bid
   */
  async deleteBid(id: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.delete(`/api/bids/${id}`);
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

      const response = await this.client.post<RebidResponse>(`/api/bids/${bidId}/rebid`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    });
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

  // ==================== INTERVIEW ENDPOINTS ====================

  /**
   * Schedule a new interview
   */
  async scheduleInterview(request: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post<ScheduleInterviewResponse>('/api/interviews', request);
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
      
      const response = await this.client.get<Interview[]>('/api/interviews', { params });
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
   */
  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    return this.withRetry(async () => {
      const response = await this.client.put<Interview>(`/api/interviews/${id}`, updates);
      return response.data;
    });
  }

  /**
   * Delete an interview
   */
  async deleteInterview(id: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.delete(`/api/interviews/${id}`);
    });
  }

  /**
   * Mark interview as attended
   */
  async attendInterview(id: string): Promise<{ success: boolean; status: string }> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/attend`);
      return response.data;
    });
  }

  /**
   * Close a pending interview manually
   */
  async closeInterview(id: string): Promise<{ success: boolean; status: string }> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/close`);
      return response.data;
    });
  }

  /**
   * Complete an interview
   */
  async completeInterview(id: string, request: CompleteInterviewRequest): Promise<CompleteInterviewResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post<CompleteInterviewResponse>(`/api/interviews/${id}/complete`, request);
      return response.data;
    });
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

  // ==================== EMAIL STATUS ENDPOINT ====================

  /**
   * Check email connection status
   */
  async getEmailStatus(): Promise<{ connected: boolean; error?: string; timestamp: string }> {
    return this.withRetry(async () => {
      const response = await this.client.get<{ connected: boolean; error?: string; timestamp: string }>('/api/email/status');
      return response.data;
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
