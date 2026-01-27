import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InterviewForm } from './InterviewForm';
import * as apiModule from '../api';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    scheduleInterview: vi.fn(),
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

describe('InterviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.apiClient.getBids).mockResolvedValue([]);
  });

  it('should render form fields', () => {
    render(<InterviewForm />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/interview base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recruiter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interview type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interview date/i)).toBeInTheDocument();
  });

  it('should have submit button disabled when form is invalid', () => {
    render(<InterviewForm />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /schedule interview/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show LinkedIn chat fields when base is changed', () => {
    render(<InterviewForm />, { wrapper: createWrapper() });
    
    const baseSelect = screen.getByLabelText(/interview base/i);
    fireEvent.change(baseSelect, { target: { value: 'LINKEDIN_CHAT' } });
    
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });
});
