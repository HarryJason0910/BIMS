import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InterviewList } from './InterviewList';
import { InterviewStatus, InterviewBase } from '../api/types';
import * as apiModule from '../api';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    getInterviews: vi.fn()
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

describe('InterviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(apiModule.apiClient.getInterviews).mockImplementation(() => new Promise(() => {}));

    render(<InterviewList />, { wrapper: createWrapper() });
    // Component shows CircularProgress without text, so check for progressbar role
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when no interviews', async () => {
    vi.mocked(apiModule.apiClient.getInterviews).mockResolvedValue([]);

    render(<InterviewList />, { wrapper: createWrapper() });
    expect(await screen.findByText(/no interviews found/i)).toBeInTheDocument();
  });

  it('should render interview list with data', async () => {
    const mockInterviews = [
      {
        id: '1',
        base: InterviewBase.BID,
        bidId: 'bid-1',
        company: 'Test Company',
        client: 'Test Client',
        role: 'Software Engineer',
        recruiter: 'John Doe',
        attendees: ['Jane Smith'],
        interviewType: 'Technical',
        date: '2024-01-15',
        status: InterviewStatus.SCHEDULED,
        detail: 'First round technical interview'
      }
    ];
    vi.mocked(apiModule.apiClient.getInterviews).mockResolvedValue(mockInterviews);

    render(<InterviewList />, { wrapper: createWrapper() });
    
    expect(await screen.findByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
