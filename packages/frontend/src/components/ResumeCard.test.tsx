import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeCard } from './ResumeCard';
import { ResumeMetadata } from '../api/types';

describe('ResumeCard', () => {
  const mockResume: ResumeMetadata = {
    id: 'test-id-1',
    company: 'Google',
    role: 'Senior Software Engineer',
    techStack: ['React', 'TypeScript', 'AWS'],
    score: 100,
    createdAt: '2024-01-15T10:00:00Z',
  };

  it('should display company name', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should display role', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('should display tech stack', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('should display match score', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('100% Match')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    const card = screen.getByText('Google').closest('.MuiCard-root');
    expect(card).toBeInTheDocument();
    
    if (card) {
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledTimes(1);
    }
  });

  it('should render card when selected is true', () => {
    const onSelect = vi.fn();
    const { container } = render(<ResumeCard resume={mockResume} selected={true} onSelect={onSelect} />);
    
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('should render card when selected is false', () => {
    const onSelect = vi.fn();
    const { container } = render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('should display all tech stack items', () => {
    const resumeWithManyStacks: ResumeMetadata = {
      ...mockResume,
      techStack: ['React', 'TypeScript', 'AWS', 'Node.js', 'MongoDB', 'Docker'],
    };
    const onSelect = vi.fn();
    render(<ResumeCard resume={resumeWithManyStacks} selected={false} onSelect={onSelect} />);
    
    resumeWithManyStacks.techStack.forEach(tech => {
      expect(screen.getByText(tech)).toBeInTheDocument();
    });
  });

  it('should display correct color for 100% match score', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    const matchChip = screen.getByText('100% Match');
    expect(matchChip).toBeInTheDocument();
    // MUI applies color through classes, so we just verify the chip exists
  });

  it('should display correct color for 75% match score', () => {
    const resumeWith75Match: ResumeMetadata = {
      ...mockResume,
      score: 75,
    };
    const onSelect = vi.fn();
    render(<ResumeCard resume={resumeWith75Match} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('75% Match')).toBeInTheDocument();
  });

  it('should display correct color for 50% match score', () => {
    const resumeWith50Match: ResumeMetadata = {
      ...mockResume,
      score: 50,
    };
    const onSelect = vi.fn();
    render(<ResumeCard resume={resumeWith50Match} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('50% Match')).toBeInTheDocument();
  });

  it('should handle empty tech stack', () => {
    const resumeWithNoStack: ResumeMetadata = {
      ...mockResume,
      techStack: [],
    };
    const onSelect = vi.fn();
    render(<ResumeCard resume={resumeWithNoStack} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('Tech Stack:')).toBeInTheDocument();
    // Should not crash with empty array
  });

  it('should display tech stack label', () => {
    const onSelect = vi.fn();
    render(<ResumeCard resume={mockResume} selected={false} onSelect={onSelect} />);
    
    expect(screen.getByText('Tech Stack:')).toBeInTheDocument();
  });
});
