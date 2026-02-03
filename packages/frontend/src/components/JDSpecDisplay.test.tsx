/**
 * Tests for JDSpecDisplay component
 * 
 * Part of: enhanced-skill-matching feature
 * Task: 24.6 Write component tests for new UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JDSpecDisplay } from './JDSpecDisplay';
import { CanonicalJDSpec } from '../api/types';

describe('JDSpecDisplay', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockJDSpec: CanonicalJDSpec = {
    id: 'jd-123',
    role: 'Full Stack Engineer',
    layerWeights: {
      frontend: 0.3,
      backend: 0.3,
      database: 0.2,
      cloud: 0.1,
      devops: 0.05,
      others: 0.05
    },
    skills: {
      frontend: [
        { skill: 'React', weight: 0.6 },
        { skill: 'TypeScript', weight: 0.4 }
      ],
      backend: [
        { skill: 'Node.js', weight: 0.7 },
        { skill: 'Express', weight: 0.3 }
      ],
      database: [
        { skill: 'PostgreSQL', weight: 1.0 }
      ],
      cloud: [],
      devops: [],
      others: []
    },
    dictionaryVersion: '2024.1',
    createdAt: '2024-01-15T10:30:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render JD specification role', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument();
  });

  it('should render dictionary version', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    expect(screen.getByText(/Dictionary Version: 2024.1/i)).toBeInTheDocument();
  });

  it('should render creation date', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
  });

  it('should render all layer weights', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('cloud')).toBeInTheDocument();
    expect(screen.getByText('devops')).toBeInTheDocument();
    expect(screen.getByText('others')).toBeInTheDocument();
  });

  it('should display layer weights as percentages', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // "30.0%" appears twice (frontend and backend), "5.0%" appears twice (devops and others)
    expect(screen.getAllByText('30.0%').length).toBe(2); // frontend and backend
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // database
    expect(screen.getByText('10.0%')).toBeInTheDocument(); // cloud
    expect(screen.getAllByText('5.0%').length).toBe(2); // devops and others
  });

  it('should display skill counts for each layer', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // "(2 skills)" appears twice (frontend and backend), so use getAllByText
    expect(screen.getAllByText('(2 skills)').length).toBe(2); // frontend and backend
    expect(screen.getByText('(1 skills)')).toBeInTheDocument(); // database
    expect(screen.getAllByText('(0 skills)').length).toBeGreaterThan(0); // cloud/devops/others
  });

  it('should show expand button for layers with skills', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    const expandButtons = screen.getAllByText('▶');
    expect(expandButtons.length).toBeGreaterThan(0);
  });

  it('should expand layer to show skills when expand button is clicked', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // Initially, skills should not be visible
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    
    // Click first expand button (frontend layer)
    const expandButtons = screen.getAllByText('▶');
    fireEvent.click(expandButtons[0]);
    
    // Skills should now be visible
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('should collapse layer when expand button is clicked again', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // Expand
    const expandButtons = screen.getAllByText('▶');
    fireEvent.click(expandButtons[0]);
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    
    // Collapse
    const collapseButton = screen.getByText('▼');
    fireEvent.click(collapseButton);
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('should display skill weights as percentages when expanded', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // Expand frontend layer
    const expandButtons = screen.getAllByText('▶');
    fireEvent.click(expandButtons[0]);
    
    // Check skill weights
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // React
    expect(screen.getByText('40.0%')).toBeInTheDocument(); // TypeScript
  });

  it('should sort skills by weight in descending order when expanded', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // Expand frontend layer
    const expandButtons = screen.getAllByText('▶');
    fireEvent.click(expandButtons[0]);
    
    const skillElements = screen.getAllByText(/React|TypeScript/);
    // React (0.6) should appear before TypeScript (0.4)
    expect(skillElements[0]).toHaveTextContent('React');
  });

  it('should render edit button when onEdit is provided', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} onEdit={mockOnEdit} />);
    
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  it('should render delete button when onDelete is provided', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} onDelete={mockOnDelete} />);
    
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('should not render action buttons when callbacks are not provided', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('should handle layers with no skills gracefully', () => {
    render(<JDSpecDisplay jdSpec={mockJDSpec} />);
    
    // Cloud layer has 0 skills, should not have expand button
    const cloudRow = screen.getByText('cloud').closest('.layer-weight-row');
    expect(cloudRow).toBeInTheDocument();
    
    // Should show (0 skills)
    expect(screen.getAllByText('(0 skills)').length).toBeGreaterThan(0);
  });
});
