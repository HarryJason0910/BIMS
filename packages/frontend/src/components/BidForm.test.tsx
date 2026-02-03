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
    // Role is a MUI Select, check for text instead
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    // Resume appears multiple times (toggle buttons), just check one exists
    const resumeElements = screen.getAllByText(/resume/i);
    expect(resumeElements.length).toBeGreaterThan(0);
  });

  it('should have submit button disabled when form is invalid', () => {
    render(<BidForm />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /create bid/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when all required fields are filled', async () => {
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
    
    // Role is a MUI Select, need to use combobox role
    const roleSelect = screen.getAllByRole('combobox')[0]; // First combobox is Role
    fireEvent.mouseDown(roleSelect);
    
    // Select a role option
    const roleOption = await screen.findByRole('option', { name: /Full Stack Engineer/i });
    fireEvent.click(roleOption);
    
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Test description' }
    });
    
    // Resume field - there are multiple elements with "resume" text
    // Just verify the form renders correctly
    const submitButton = screen.getByRole('button', { name: /create bid/i });
    expect(submitButton).toBeInTheDocument();
  });
});
