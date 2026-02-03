import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BidList } from './BidList';
import { BidStatus } from '../api/types';
import * as apiModule from '../api';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    getBids: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BidList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(apiModule.apiClient.getBids).mockImplementation(() => new Promise(() => {}));

    render(<BidList />, { wrapper: createWrapper() });
    // Component shows CircularProgress without text, so check for progressbar role
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when no bids', async () => {
    vi.mocked(apiModule.apiClient.getBids).mockResolvedValue([]);

    render(<BidList />, { wrapper: createWrapper() });
    expect(await screen.findByText(/no bids found/i)).toBeInTheDocument();
  });

  it('should render bid list with data', async () => {
    const mockBids = [
      {
        id: '1',
        link: 'https://example.com/job1',
        company: 'Test Company',
        client: 'Test Client',
        role: 'Software Engineer',
        mainStacks: ['React', 'TypeScript'],
        jobDescriptionPath: 'Test_Company_Software_Engineer/JD.txt',
        resumePath: 'Test_Company_Software_Engineer/resume.pdf',
        date: '2024-01-01',
        status: BidStatus.NEW,
        interviewWinning: false
      }
    ];
    vi.mocked(apiModule.apiClient.getBids).mockResolvedValue(mockBids);

    render(<BidList />, { wrapper: createWrapper() });
    
    expect(await screen.findByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });
});
