import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeSelector } from './ResumeSelector';
import { apiClient } from '../api/client';
import { ResumeMetadata } from '../api/types';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn()
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
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should display list of matching resumes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockResumes);

    render(
      <ResumeSelector
        techStack={['React', 'TypeScript']}
        onResumeSelected={mockOnResumeSelected}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select from 2 matching resumes')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('should display empty state when no resumes match', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    render(
      <ResumeSelector
        techStack={['React', 'TypeScript']}
        onResumeSelected={mockOnResumeSelected}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No matching resumes found/)).toBeInTheDocument();
    });
  });

  it('should call onResumeSelected when a resume is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockResumes);

    render(
      <ResumeSelector
        techStack={['React', 'TypeScript']}
        onResumeSelected={mockOnResumeSelected}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const googleCard = screen.getByText('Google').closest('.MuiCard-root');
    if (googleCard) {
      fireEvent.click(googleCard);
      expect(mockOnResumeSelected).toHaveBeenCalledWith('resume-1');
    }
  });

  it('should display error message when API call fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    render(
      <ResumeSelector
        techStack={['React', 'TypeScript']}
        onResumeSelected={mockOnResumeSelected}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load matching resumes/)).toBeInTheDocument();
    });
  });
});
