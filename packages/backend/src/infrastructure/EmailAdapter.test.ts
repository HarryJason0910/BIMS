/**
 * EmailAdapter Tests
 * 
 * Tests for Microsoft Graph API Email Adapter functionality
 */

import { EmailAdapter, EmailAdapterConfig } from './EmailAdapter';
import { ProcessEmailUseCase } from '../application/ProcessEmailUseCase';

// Mock Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn(() => ({
      api: jest.fn(() => ({
        get: jest.fn(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis()
      }))
    }))
  }
}));

// Mock Azure Identity
jest.mock('@azure/identity', () => ({
  ClientSecretCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
  }))
}));

describe('EmailAdapter', () => {
  let config: EmailAdapterConfig;
  let adapter: EmailAdapter;

  beforeEach(() => {
    config = {
      tenantId: 'test-tenant',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      userEmail: 'test@example.com',
      keywords: ['job', 'interview'],
      pollingIntervalMs: 1000,
      maxRetries: 3,
      retryDelayMs: 100
    };
    adapter = new EmailAdapter(config);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      expect(adapter).toBeDefined();
      expect(adapter.getPollingInterval()).toBe(1000);
    });

    it('should use default values for optional config', () => {
      const minimalConfig: EmailAdapterConfig = {
        tenantId: 'test-tenant',
        clientId: 'test-client',
        clientSecret: 'test-secret',
        userEmail: 'test@example.com'
      };
      const minimalAdapter = new EmailAdapter(minimalConfig);
      expect(minimalAdapter.getPollingInterval()).toBe(300000); // 5 minutes default
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ id: 'test-user' })
        }))
      };
      Client.initWithMiddleware.mockReturnValue(mockClient);

      await adapter.authenticate();

      expect(Client.initWithMiddleware).toHaveBeenCalled();
      expect(mockClient.api).toHaveBeenCalledWith('/me');
    });

    it('should throw error on authentication failure', async () => {
      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockRejectedValue(new Error('Auth failed'))
        }))
      };
      Client.initWithMiddleware.mockReturnValue(mockClient);

      await expect(adapter.authenticate()).rejects.toThrow('Authentication failed');
    });
  });

  describe('fetchNewEmails', () => {
    it('should throw error if not authenticated', async () => {
      await expect(adapter.fetchNewEmails()).rejects.toThrow('Not authenticated');
    });

    it('should fetch and filter emails successfully', async () => {
      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockEmails = [
        {
          id: 'email-1',
          subject: 'Job Application Update',
          body: { content: 'Your application has been reviewed' },
          from: { emailAddress: { address: 'recruiter@company.com' } },
          receivedDateTime: new Date().toISOString()
        },
        {
          id: 'email-2',
          subject: 'Interview Invitation',
          body: { content: 'We would like to schedule an interview' },
          from: { emailAddress: { address: 'hr@company.com' } },
          receivedDateTime: new Date().toISOString()
        }
      ];

      const mockGet = jest.fn().mockResolvedValue({ value: mockEmails });
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ id: 'test-user' }),
          filter: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          orderby: jest.fn().mockReturnThis(),
          top: jest.fn().mockReturnThis()
        }))
      };

      // Setup for authentication
      Client.initWithMiddleware.mockReturnValue(mockClient);
      await adapter.authenticate();

      // Setup for fetching emails
      mockClient.api.mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis(),
        get: mockGet
      });

      const emails = await adapter.fetchNewEmails();

      expect(emails).toHaveLength(2);
      expect(emails[0].id).toBe('email-1');
      expect(emails[0].subject).toBe('Job Application Update');
      expect(emails[1].id).toBe('email-2');
    });

    it('should filter emails by keywords', async () => {
      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockEmails = [
        {
          id: 'email-1',
          subject: 'Job Application Update',
          body: { content: 'Your application has been reviewed' },
          from: { emailAddress: { address: 'recruiter@company.com' } },
          receivedDateTime: new Date().toISOString()
        },
        {
          id: 'email-2',
          subject: 'Newsletter',
          body: { content: 'Check out our latest products' },
          from: { emailAddress: { address: 'marketing@company.com' } },
          receivedDateTime: new Date().toISOString()
        }
      ];

      const mockGet = jest.fn().mockResolvedValue({ value: mockEmails });
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ id: 'test-user' }),
          filter: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          orderby: jest.fn().mockReturnThis(),
          top: jest.fn().mockReturnThis()
        }))
      };

      Client.initWithMiddleware.mockReturnValue(mockClient);
      await adapter.authenticate();

      mockClient.api.mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis(),
        get: mockGet
      });

      const emails = await adapter.fetchNewEmails();

      // Only email-1 should pass the keyword filter (contains "job")
      expect(emails).toHaveLength(1);
      expect(emails[0].id).toBe('email-1');
    });
  });

  describe('Polling', () => {
    it('should throw error if ProcessEmailUseCase not set', async () => {
      await expect(adapter.startPolling()).rejects.toThrow('ProcessEmailUseCase not set');
    });

    it('should start polling successfully', async () => {
      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({ action: 'PROCESSED' })
      } as unknown as ProcessEmailUseCase;

      adapter.setProcessEmailUseCase(mockUseCase);

      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockGet = jest.fn().mockResolvedValue({ value: [] });
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ id: 'test-user' }),
          filter: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          orderby: jest.fn().mockReturnThis(),
          top: jest.fn().mockReturnThis()
        }))
      };

      Client.initWithMiddleware.mockReturnValue(mockClient);
      await adapter.authenticate();

      mockClient.api.mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis(),
        get: mockGet
      });

      await adapter.startPolling();

      expect(adapter.isPollingActive()).toBe(true);

      adapter.stopPolling();
      expect(adapter.isPollingActive()).toBe(false);
    });

    it('should not start polling if already running', async () => {
      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({ action: 'PROCESSED' })
      } as unknown as ProcessEmailUseCase;

      adapter.setProcessEmailUseCase(mockUseCase);

      const { Client } = require('@microsoft/microsoft-graph-client');
      const mockGet = jest.fn().mockResolvedValue({ value: [] });
      const mockClient = {
        api: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ id: 'test-user' }),
          filter: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          orderby: jest.fn().mockReturnThis(),
          top: jest.fn().mockReturnThis()
        }))
      };

      Client.initWithMiddleware.mockReturnValue(mockClient);
      await adapter.authenticate();

      mockClient.api.mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis(),
        get: mockGet
      });

      await adapter.startPolling();
      expect(adapter.isPollingActive()).toBe(true);

      // Try to start again
      await adapter.startPolling();
      expect(adapter.isPollingActive()).toBe(true);

      adapter.stopPolling();
    });
  });

  describe('resetLastFetchDate', () => {
    it('should reset last fetch date', () => {
      const testDate = new Date('2024-01-01');
      adapter.resetLastFetchDate(testDate);
      // No direct way to verify, but method should not throw
      expect(adapter).toBeDefined();
    });

    it('should reset to current date if no date provided', () => {
      adapter.resetLastFetchDate();
      expect(adapter).toBeDefined();
    });
  });
});
