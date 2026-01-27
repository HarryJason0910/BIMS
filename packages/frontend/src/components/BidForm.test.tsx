import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BidForm } from './BidForm';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    createBid: vi.fn()
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

describe('BidForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<BidForm />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/job link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resume/i)).toBeInTheDocument();
  });

  it('should have submit button disabled when form is invalid', () => {
    render(<BidForm />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /create bid/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when all required fields are filled', () => {
    render(<BidForm />, { wrapper: createWrapper() });
    
    fireEvent.change(screen.getByLabelText(/job link/i), {
      target: { value: 'https://example.com/job' }
    });
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText(/client/i), {
      target: { value: 'Test Client' }
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: 'Software Engineer' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText(/resume/i), {
      target: { value: 'Test resume' }
    });
    
    const submitButton = screen.getByRole('button', { name: /create bid/i });
    expect(submitButton).not.toBeDisabled();
  });
});
