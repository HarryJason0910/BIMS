import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillStatisticsDashboard } from './SkillStatisticsDashboard';
import { apiClient } from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    getSkillStatistics: vi.fn(),
  }
}));

describe('SkillStatisticsDashboard', () => {
  const mockStatistics = [
    {
      skillName: 'React',
      category: 'frontend',
      totalUsage: 25,
      jdCount: 15,
      resumeCount: 10,
      variations: ['reactjs', 'react.js'],
      firstSeen: '2024-01-01T00:00:00.000Z',
      lastSeen: '2024-02-01T00:00:00.000Z'
    },
    {
      skillName: 'Node.js',
      category: 'backend',
      totalUsage: 20,
      jdCount: 12,
      resumeCount: 8,
      variations: ['nodejs', 'node'],
      firstSeen: '2024-01-05T00:00:00.000Z',
      lastSeen: '2024-02-01T00:00:00.000Z'
    },
    {
      skillName: 'TypeScript',
      category: 'frontend',
      totalUsage: 18,
      jdCount: 10,
      resumeCount: 8,
      variations: ['ts'],
      firstSeen: '2024-01-10T00:00:00.000Z',
      lastSeen: '2024-01-30T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.getSkillStatistics as any).mockResolvedValue({
      statistics: mockStatistics
    });
  });

  it('should render loading state initially', () => {
    render(<SkillStatisticsDashboard />);
    expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
  });

  it('should load and display statistics', async () => {
    render(<SkillStatisticsDashboard />);
    
    // Wait for the data to load by checking for one of the skills
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('should display summary cards', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Skills')).toBeInTheDocument();
    });
    
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Total skills
    expect(screen.getAllByText('63').length).toBeGreaterThan(0); // Total usage (25+20+18)
    expect(screen.getAllByText('37').length).toBeGreaterThan(0); // JD mentions (15+12+10)
    expect(screen.getAllByText('26').length).toBeGreaterThan(0); // Resume mentions (10+8+8)
  });

  it('should display top 10 skills chart', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Top 10 Skills')).toBeInTheDocument();
    });
    
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('should display all skills table', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/all skills \(3\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Skill')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('JDs')).toBeInTheDocument();
    expect(screen.getByText('Resumes')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should filter by category', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const selects = document.querySelectorAll('.filter-select');
    const categorySelect = selects[0] as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'frontend' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'frontend' })
      );
    });
  });

  it('should sort by frequency', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const selects = document.querySelectorAll('.filter-select');
    const sortBySelect = selects[1] as HTMLSelectElement;
    fireEvent.change(sortBySelect, { target: { value: 'frequency' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'frequency' })
      );
    });
  });

  it('should sort by name', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const selects = document.querySelectorAll('.filter-select');
    const sortBySelect = selects[1] as HTMLSelectElement;
    fireEvent.change(sortBySelect, { target: { value: 'name' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'name' })
      );
    });
  });

  it('should change sort order', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const selects = document.querySelectorAll('.filter-select');
    const orderSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(orderSelect, { target: { value: 'asc' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 'asc' })
      );
    });
  });

  it('should filter by date range', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const inputs = document.querySelectorAll('.filter-input');
    const dateFromInput = inputs[0] as HTMLInputElement;
    fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });
    
    const dateToInput = inputs[1] as HTMLInputElement;
    fireEvent.change(dateToInput, { target: { value: '2024-01-31' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31'
        })
      );
    });
  });

  it('should refresh statistics when refresh button clicked', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledTimes(2);
    });
  });

  it('should expand variations when expand button clicked', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/variations \(2\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('reactjs')).toBeInTheDocument();
    expect(screen.getByText('react.js')).toBeInTheDocument();
  });

  it('should collapse variations when expand button clicked again', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('reactjs')).toBeInTheDocument();
    });
    
    const collapseButton = screen.getByRole('button', { name: /▼/i });
    fireEvent.click(collapseButton);
    
    await waitFor(() => {
      expect(screen.queryByText('reactjs')).not.toBeInTheDocument();
    });
  });

  it('should display formatted dates', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    // Check that dates are formatted - just verify some dates exist
    const dateElements = document.querySelectorAll('.date-info');
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should display category badges', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const categoryBadges = screen.getAllByText('frontend');
    expect(categoryBadges.length).toBeGreaterThan(0);
    
    const backendBadges = screen.getAllByText('backend');
    expect(backendBadges.length).toBeGreaterThan(0);
  });

  it('should display usage counts in table', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    // Check JD counts - these numbers appear multiple times so use getAllByText
    expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    
    // Check total usage
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    expect(screen.getAllByText('18').length).toBeGreaterThan(0);
  });

  it('should not show expand button for skills without variations', async () => {
    const statsWithoutVariations = [
      {
        ...mockStatistics[0],
        variations: []
      }
    ];
    
    (apiClient.getSkillStatistics as any).mockResolvedValue({
      statistics: statsWithoutVariations
    });
    
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const expandButtons = screen.queryAllByRole('button', { name: /▶/i });
    expect(expandButtons.length).toBe(0);
  });

  it('should display error message on load failure', async () => {
    (apiClient.getSkillStatistics as any).mockRejectedValue(new Error('Network error'));
    
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no statistics available', async () => {
    (apiClient.getSkillStatistics as any).mockResolvedValue({ statistics: [] });
    
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no skill statistics available/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/create jd specifications/i)).toBeInTheDocument();
  });

  it('should apply all filters together', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    const selects = document.querySelectorAll('.filter-select');
    const categorySelect = selects[0] as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'frontend' } });
    
    const sortBySelect = selects[1] as HTMLSelectElement;
    fireEvent.change(sortBySelect, { target: { value: 'name' } });
    
    const orderSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(orderSelect, { target: { value: 'asc' } });
    
    const inputs = document.querySelectorAll('.filter-input');
    const dateFromInput = inputs[0] as HTMLInputElement;
    fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });
    
    await waitFor(() => {
      expect(apiClient.getSkillStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'frontend',
          sortBy: 'name',
          sortOrder: 'asc',
          dateFrom: '2024-01-01'
        })
      );
    });
  });

  it('should disable refresh button while loading', async () => {
    render(<SkillStatisticsDashboard />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    // Initially disabled while loading
    expect(refreshButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    // Enabled after loading
    expect(refreshButton).not.toBeDisabled();
  });

  it('should display skill usage bars in top skills chart', async () => {
    render(<SkillStatisticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Top 10 Skills')).toBeInTheDocument();
    });
    
    const usageBars = document.querySelectorAll('.usage-bar');
    expect(usageBars.length).toBeGreaterThan(0);
  });
});
