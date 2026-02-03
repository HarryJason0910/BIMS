/**
 * Tests for SkillReviewQueue component
 * 
 * Part of: enhanced-skill-matching feature
 * Task: 24.6 Write component tests for new UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillReviewQueue } from './SkillReviewQueue';
import { apiClient } from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    getReviewQueue: vi.fn(),
    approveSkill: vi.fn(),
    rejectSkill: vi.fn()
  }
}));

describe('SkillReviewQueue', () => {
  const mockQueueItems = [
    {
      name: 'NextJS',
      frequency: 5,
      firstSeen: '2024-01-10T08:00:00Z',
      lastSeen: '2024-01-15T14:30:00Z',
      sources: ['JD-123', 'JD-456']
    },
    {
      name: 'Prisma',
      frequency: 3,
      firstSeen: '2024-01-12T10:00:00Z',
      lastSeen: '2024-01-14T16:00:00Z',
      sources: ['JD-789']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.getReviewQueue as any).mockResolvedValue({ items: mockQueueItems });
  });

  it('should render header and subtitle', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('Skill Review Queue')).toBeInTheDocument();
      expect(screen.getByText(/Review and approve unknown skills/i)).toBeInTheDocument();
    });
  });

  it('should load and display queue items', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('NextJS')).toBeInTheDocument();
      expect(screen.getByText('Prisma')).toBeInTheDocument();
    });
  });

  it('should display skill frequency', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText(/Used 5 times/i)).toBeInTheDocument();
      expect(screen.getByText(/Used 3 times/i)).toBeInTheDocument();
    });
  });

  it('should display first and last seen dates', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/First seen:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Last seen:/i).length).toBeGreaterThan(0);
    });
  });

  it('should display skill sources', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('JD-123')).toBeInTheDocument();
      expect(screen.getByText('JD-456')).toBeInTheDocument();
      expect(screen.getByText('JD-789')).toBeInTheDocument();
    });
  });

  it('should have sort by dropdown', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toBeInTheDocument();
    });
  });

  it('should sort by frequency by default', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const items = screen.getAllByRole('heading', { level: 3 });
      // NextJS (frequency 5) should appear before Prisma (frequency 3)
      expect(items[0]).toHaveTextContent('NextJS');
      expect(items[1]).toHaveTextContent('Prisma');
    });
  });

  it('should sort by name when selected', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const sortSelect = screen.getByRole('combobox');
      fireEvent.change(sortSelect, { target: { value: 'name' } });
    });
    
    await waitFor(() => {
      const items = screen.getAllByRole('heading', { level: 3 });
      // NextJS should appear before Prisma alphabetically
      expect(items[0]).toHaveTextContent('NextJS');
    });
  });

  it('should show approve and reject buttons for each item', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
      
      expect(approveButtons.length).toBe(2);
      expect(rejectButtons.length).toBe(2);
    });
  });

  it('should show approval form when approve button is clicked', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      fireEvent.click(approveButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Approve "NextJS"/i)).toBeInTheDocument();
      expect(screen.getByText(/As Canonical Skill/i)).toBeInTheDocument();
      expect(screen.getByText(/As Variation/i)).toBeInTheDocument();
    });
  });

  it('should show rejection form when reject button is clicked', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
      fireEvent.click(rejectButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Reject "NextJS"/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Why is this skill being rejected/i)).toBeInTheDocument();
    });
  });

  it('should show category dropdown when approving as canonical', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      fireEvent.click(approveButtons[0]);
    });
    
    await waitFor(() => {
      const categorySelects = document.querySelectorAll('.form-select');
      expect(categorySelects.length).toBeGreaterThan(0);
    });
  });

  it('should show canonical name input when approving as variation', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      fireEvent.click(approveButtons[0]);
    });
    
    // Select "As Variation" radio button
    const variationRadio = screen.getByLabelText(/As Variation/i);
    fireEvent.click(variationRadio);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., React/i)).toBeInTheDocument();
    });
  });

  it('should call approveSkill API when approving as canonical', async () => {
    (apiClient.approveSkill as any).mockResolvedValue({ message: 'Success' });
    
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      fireEvent.click(approveButtons[0]);
    });
    
    // Select category using querySelector since label isn't properly associated
    const categorySelect = document.querySelector('.form-select') as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'frontend' } });
    
    // Submit - use the CSS class to find the submit button
    const submitButton = document.querySelector('.btn-submit') as HTMLButtonElement;
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.approveSkill).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call approveSkill API when approving as variation', async () => {
    (apiClient.approveSkill as any).mockResolvedValue({ message: 'Success' });
    
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
      fireEvent.click(approveButtons[0]);
    });
    
    // Select "As Variation"
    const variationRadio = screen.getByLabelText(/As Variation/i);
    fireEvent.click(variationRadio);
    
    // Enter canonical name
    const canonicalInput = screen.getByPlaceholderText(/e.g., React/i);
    fireEvent.change(canonicalInput, { target: { value: 'Next.js' } });
    
    // Submit - use the CSS class to find the submit button
    const submitButton = document.querySelector('.btn-submit') as HTMLButtonElement;
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.approveSkill).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call rejectSkill API when rejecting', async () => {
    (apiClient.rejectSkill as any).mockResolvedValue({ message: 'Success' });
    
    render(<SkillReviewQueue />);
    
    // Click the first reject button
    await waitFor(() => {
      const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
      fireEvent.click(rejectButtons[0]);
    });
    
    // Wait for the rejection form to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Why is this skill being rejected/i)).toBeInTheDocument();
    });
    
    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/Why is this skill being rejected/i);
    fireEvent.change(reasonInput, { target: { value: 'Not a valid skill' } });
    
    // Submit - find the submit button by its class since it has the same text as other buttons
    const submitButton = document.querySelector('.btn-submit-reject') as HTMLButtonElement;
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.rejectSkill).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show empty state when no items in queue', async () => {
    (apiClient.getReviewQueue as any).mockResolvedValue({ items: [] });
    
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText(/No skills pending review/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching', () => {
    (apiClient.getReviewQueue as any).mockImplementation(() => new Promise(() => {}));
    
    render(<SkillReviewQueue />);
    
    expect(screen.getByText(/Loading review queue/i)).toBeInTheDocument();
  });

  it('should show error state when API fails', async () => {
    (apiClient.getReviewQueue as any).mockRejectedValue(new Error('API Error'));
    
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });
  });

  it('should have refresh button', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('should reload queue when refresh button is clicked', async () => {
    render(<SkillReviewQueue />);
    
    await waitFor(() => {
      expect(apiClient.getReviewQueue).toHaveBeenCalledTimes(1);
    });
    
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(apiClient.getReviewQueue).toHaveBeenCalledTimes(2);
    });
  });
});
