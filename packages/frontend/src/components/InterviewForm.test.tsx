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
    
    // MUI Select doesn't properly associate labels, and text appears multiple times
    // Check for combobox roles instead
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0); // At least one combobox (Interview Base)
    expect(screen.getByLabelText(/recruiter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interview date/i)).toBeInTheDocument();
  });

  it('should have submit button disabled when form is invalid', () => {
    render(<InterviewForm />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /schedule interview/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show LinkedIn chat fields when base is changed', async () => {
    render(<InterviewForm />, { wrapper: createWrapper() });
    
    // MUI Select doesn't properly associate labels with combobox role
    // Find all comboboxes and get the first one (Interview Base select)
    const comboboxes = screen.getAllByRole('combobox');
    const baseSelect = comboboxes[0]; // First combobox is Interview Base
    
    // Open the select dropdown
    fireEvent.mouseDown(baseSelect);
    
    // Find and click the LinkedIn Chat option
    const linkedInOption = await screen.findByText('LinkedIn Chat');
    fireEvent.click(linkedInOption);
    
    // Verify LinkedIn chat fields appear
    expect(await screen.findByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
  });
});
