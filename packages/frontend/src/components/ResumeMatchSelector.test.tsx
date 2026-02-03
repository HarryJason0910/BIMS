import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeMatchSelector } from './ResumeMatchSelector';
import { apiClient } from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    calculateResumeMatchRates: vi.fn(),
  }
}));

describe('ResumeMatchSelector', () => {
  const mockMatchRates = [
    {
      resumeId: 'resume-1',
      matchRate: 85.5,
      correlation: {
        overallScore: 0.855,
        dictionaryVersion: '2024.1',
        layerBreakdown: [
          {
            layer: 'frontend',
            score: 0.9,
            weight: 0.4,
            matchingSkills: ['React', 'TypeScript'],
            missingSkills: ['Vue']
          },
          {
            layer: 'backend',
            score: 0.8,
            weight: 0.3,
            matchingSkills: ['Node.js'],
            missingSkills: ['Python']
          }
        ]
      }
    },
    {
      resumeId: 'resume-2',
      matchRate: 65.0,
      correlation: {
        overallScore: 0.65,
        dictionaryVersion: '2024.1',
        layerBreakdown: [
          {
            layer: 'frontend',
            score: 0.7,
            weight: 0.4,
            matchingSkills: ['React'],
            missingSkills: ['TypeScript', 'Vue']
          }
        ]
      }
    }
  ];

  const mockOnResumeSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.calculateResumeMatchRates as any).mockResolvedValue({
      matchRates: mockMatchRates
    });
  });

  it('should show disabled state when no JD selected', () => {
    render(
      <ResumeMatchSelector
        currentJDId=""
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    expect(screen.getByText(/select a jd specification/i)).toBeInTheDocument();
  });

  it('should show disabled state when disabled prop is true', () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
        disabled={true}
      />
    );
    
    expect(screen.getByText(/select a jd specification/i)).toBeInTheDocument();
  });

  it('should show loading state while fetching match rates', () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    expect(screen.getByText(/calculating match rates/i)).toBeInTheDocument();
  });

  it('should load and display match rates', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/matching resumes \(2\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('65.0%')).toBeInTheDocument();
    expect(apiClient.calculateResumeMatchRates).toHaveBeenCalledWith('jd-1');
  });

  it('should display match quality indicators', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const resumeItems = screen.getAllByRole('button', { name: /▶/i }).map(btn => btn.closest('.resume-item'));
    expect(resumeItems[0]).toHaveClass('excellent');
    expect(resumeItems[1]).toHaveClass('good');
  });

  it('should sort resumes by match rate descending by default', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const percentages = screen.getAllByText(/\d+\.\d+%/);
    expect(percentages[0]).toHaveTextContent('85.5%');
    expect(percentages[1]).toHaveTextContent('65.0%');
  });

  it('should toggle sort order when sort button clicked', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const sortButton = screen.getByRole('button', { name: /match rate ↓/i });
    fireEvent.click(sortButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /match rate ↑/i })).toBeInTheDocument();
    });
    
    const percentages = screen.getAllByText(/\d+\.\d+%/);
    expect(percentages[0]).toHaveTextContent('65.0%');
    expect(percentages[1]).toHaveTextContent('85.5%');
  });

  it('should call onResumeSelected when resume is clicked', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const resumeHeaders = screen.getAllByText(/resume resume-/i);
    fireEvent.click(resumeHeaders[0]);
    
    expect(mockOnResumeSelected).toHaveBeenCalledWith('resume-1');
  });

  it('should highlight selected resume', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const resumeHeaders = screen.getAllByText(/resume resume-/i);
    fireEvent.click(resumeHeaders[0]);
    
    const resumeItem = resumeHeaders[0].closest('.resume-item');
    expect(resumeItem).toHaveClass('selected');
  });

  it('should expand layer breakdown when expand button clicked', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Layer Breakdown')).toBeInTheDocument();
    });
  });

  it('should display layer breakdown details', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
    });
    
    expect(screen.getByText('90.0%')).toBeInTheDocument(); // frontend score
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // backend score
  });

  it('should display matching skills in layer breakdown', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getAllByText('Matching Skills:').length).toBeGreaterThan(0);
    });
    
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
  });

  it('should display missing skills in layer breakdown', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getAllByText('Missing Skills:').length).toBeGreaterThan(0);
    });
    
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('should display dictionary version in breakdown', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/dictionary version: 2024\.1/i)).toBeInTheDocument();
    });
  });

  it('should collapse layer breakdown when expand button clicked again', async () => {
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    const expandButtons = screen.getAllByRole('button', { name: /▶/i });
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Layer Breakdown')).toBeInTheDocument();
    });
    
    const collapseButton = screen.getByRole('button', { name: /▼/i });
    fireEvent.click(collapseButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Layer Breakdown')).not.toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    (apiClient.calculateResumeMatchRates as any).mockRejectedValue(new Error('Network error'));
    
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    (apiClient.calculateResumeMatchRates as any).mockRejectedValue(new Error('Network error'));
    
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('should retry loading when retry button clicked', async () => {
    (apiClient.calculateResumeMatchRates as any).mockRejectedValueOnce(new Error('Network error'));
    (apiClient.calculateResumeMatchRates as any).mockResolvedValueOnce({ matchRates: mockMatchRates });
    
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
  });

  it('should show empty state when no resumes found', async () => {
    (apiClient.calculateResumeMatchRates as any).mockResolvedValue({ matchRates: [] });
    
    render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no resumes found/i)).toBeInTheDocument();
    });
  });

  it('should reload match rates when JD ID changes', async () => {
    const { rerender } = render(
      <ResumeMatchSelector
        currentJDId="jd-1"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(apiClient.calculateResumeMatchRates).toHaveBeenCalledWith('jd-1');
    });
    
    rerender(
      <ResumeMatchSelector
        currentJDId="jd-2"
        onResumeSelected={mockOnResumeSelected}
      />
    );
    
    await waitFor(() => {
      expect(apiClient.calculateResumeMatchRates).toHaveBeenCalledWith('jd-2');
    });
  });
});
