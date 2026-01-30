import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ResumeSelector } from './ResumeSelector';
import { apiClient } from '../api/client';
import { ResumeMetadata } from '../api/types';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    client: {
      get: vi.fn()
    }
  }
}));

describe('ResumeSelector', () => {
  const mockOnResumeSelected = vi.fn();
  
  const mockResumes: ResumeMetadata[] = [
    {
      id: 'resume-1',
      company: 'Google',
      role: 'Senior Engineer',
      techStack: ['React', 'TypeScript', 'AWS'],
      score: 100,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'resume-2',
      company: 'Amazon',
      role: 'Software Developer',
      techStack: ['React', 'Node.js'],
      score: 75,
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 'resume-3',
      company: 'Microsoft',
      role: 'Frontend Engineer',
      techStack: ['React', 'Redux'],
      score: 50,
      createdAt: '2024-01-05T10:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Disabled State', () => {
    it('should display prompt message when disabled', () => {
      render(
        <ResumeSelector
          techStack={[]}
          onResumeSelected={mockOnResumeSelected}
          disabled={true}
        />
      );

      expect(screen.getByText('Enter tech stack to see matching resumes')).toBeInTheDocument();
    });

    it('should not fetch resumes when disabled', async () => {
      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={true}
        />
      );

      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(apiClient.client.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching resumes', async () => {
      // Mock API call that takes time to resolve
      vi.mocked(apiClient.client.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockResumes }), 1000))
      );

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Loading matching resumes...')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no resumes match', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: [] });

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/No matching resumes found/)).toBeInTheDocument();
        expect(screen.getByText(/Upload a new resume to continue/)).toBeInTheDocument();
      });
    });

    it('should display empty state when tech stack is empty', () => {
      render(
        <ResumeSelector
          techStack={[]}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Should not show loading or make API call
      expect(screen.queryByText('Loading matching resumes...')).not.toBeInTheDocument();
      expect(apiClient.client.get).not.toHaveBeenCalled();
    });
  });

  describe('Resume List Rendering', () => {
    it('should display list of matching resumes', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Select from 3 matching resumes')).toBeInTheDocument();
        expect(screen.getByText('Google')).toBeInTheDocument();
        expect(screen.getByText('Amazon')).toBeInTheDocument();
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });
    });

    it('should display singular form when only one resume matches', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: [mockResumes[0]] });

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript', 'AWS']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Select from 1 matching resume')).toBeInTheDocument();
      });
    });
  });

  describe('Selection Handling', () => {
    it('should call onResumeSelected when a resume is clicked', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      // Click on the first resume card
      const googleCard = screen.getByText('Google').closest('.MuiCard-root');
      if (googleCard) {
        fireEvent.click(googleCard);
      }

      expect(mockOnResumeSelected).toHaveBeenCalledWith('resume-1');
    });

    it('should highlight selected resume', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      const { rerender } = render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      // Click on the first resume
      const googleCard = screen.getByText('Google').closest('.MuiCard-root');
      if (googleCard) {
        fireEvent.click(googleCard);
      }

      // The ResumeCard component should show selected state
      // (This is tested in ResumeCard.test.tsx)
      expect(mockOnResumeSelected).toHaveBeenCalledWith('resume-1');
    });
  });

  describe('Debouncing', () => {
    it('should debounce API calls by 500ms', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      const { rerender } = render(
        <ResumeSelector
          techStack={['React']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Change tech stack multiple times rapidly
      rerender(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      rerender(
        <ResumeSelector
          techStack={['React', 'TypeScript', 'AWS']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Should not have called API yet
      expect(apiClient.client.get).not.toHaveBeenCalled();

      // Advance by 500ms
      vi.advanceTimersByTime(500);

      // Should have called API only once with the final tech stack
      await waitFor(() => {
        expect(apiClient.client.get).toHaveBeenCalledTimes(1);
        expect(apiClient.client.get).toHaveBeenCalledWith(
          '/api/resumes/metadata?techStack=React,TypeScript,AWS'
        );
      });
    });

    it('should cancel previous debounced call when tech stack changes', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      const { rerender } = render(
        <ResumeSelector
          techStack={['React']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance by 300ms (not enough to trigger)
      vi.advanceTimersByTime(300);

      // Change tech stack
      rerender(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance by another 300ms (total 600ms from first render, but only 300ms from second)
      vi.advanceTimersByTime(300);

      // Should not have called API yet
      expect(apiClient.client.get).not.toHaveBeenCalled();

      // Advance by 200ms more (500ms from second render)
      vi.advanceTimersByTime(200);

      // Should have called API only once with the second tech stack
      await waitFor(() => {
        expect(apiClient.client.get).toHaveBeenCalledTimes(1);
        expect(apiClient.client.get).toHaveBeenCalledWith(
          '/api/resumes/metadata?techStack=React,TypeScript'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      vi.mocked(apiClient.client.get).mockRejectedValue(new Error('Network error'));

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load matching resumes/)).toBeInTheDocument();
      });
    });

    it('should clear error when tech stack changes and new fetch succeeds', async () => {
      // First call fails
      vi.mocked(apiClient.client.get).mockRejectedValueOnce(new Error('Network error'));

      const { rerender } = render(
        <ResumeSelector
          techStack={['React']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load matching resumes/)).toBeInTheDocument();
      });

      // Second call succeeds
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      rerender(
        <ResumeSelector
          techStack={['React', 'TypeScript']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.queryByText(/Failed to load matching resumes/)).not.toBeInTheDocument();
        expect(screen.getByText('Google')).toBeInTheDocument();
      });
    });
  });

  describe('API Call Format', () => {
    it('should format tech stack as comma-separated query parameter', async () => {
      vi.mocked(apiClient.client.get).mockResolvedValue({ data: mockResumes });

      render(
        <ResumeSelector
          techStack={['React', 'TypeScript', 'AWS', 'Lambda']}
          onResumeSelected={mockOnResumeSelected}
          disabled={false}
        />
      );

      // Advance past debounce delay
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(apiClient.client.get).toHaveBeenCalledWith(
          '/api/resumes/metadata?techStack=React,TypeScript,AWS,Lambda'
        );
      });
    });
  });
});
