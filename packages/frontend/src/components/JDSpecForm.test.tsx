/**
 * Tests for JDSpecForm component
 * 
 * Part of: enhanced-skill-matching feature
 * Task: 24.6 Write component tests for new UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JDSpecForm } from './JDSpecForm';
import { LayerWeights, LayerSkills } from '../api/types';

describe('JDSpecForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with role input', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText(/e.g., Full Stack Engineer/i)).toBeInTheDocument();
  });

  it('should render all 6 tech layers in layer weights section', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('cloud')).toBeInTheDocument();
    expect(screen.getByText('devops')).toBeInTheDocument();
    expect(screen.getByText('others')).toBeInTheDocument();
  });

  it('should show layer weight sum validation', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Default weights should sum to 1.0
    const sumDisplay = screen.getByText(/Sum: 1.000/i);
    expect(sumDisplay).toHaveClass('valid');
  });

  it('should allow changing layer weights', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    const frontendInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(frontendInput, { target: { value: '0.5' } });
    
    expect(frontendInput).toHaveValue(0.5);
  });

  it('should show invalid state when layer weights do not sum to 1.0', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    const frontendInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(frontendInput, { target: { value: '0.9' } });
    
    // Sum should now be > 1.0
    const sumDisplays = screen.getAllByText(/Sum:/);
    const layerWeightSum = sumDisplays[0];
    expect(layerWeightSum).toHaveClass('invalid');
  });

  it('should render layer tabs for skills management', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    const frontendTab = screen.getByRole('button', { name: /frontend \(0\)/i });
    expect(frontendTab).toBeInTheDocument();
  });

  it('should allow adding skills to a layer', async () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Click frontend tab
    const frontendTab = screen.getByRole('button', { name: /frontend \(0\)/i });
    fireEvent.click(frontendTab);
    
    // Add a skill
    const skillNameInput = screen.getByPlaceholderText(/Skill name/i);
    const skillWeightInput = screen.getByPlaceholderText(/Weight/i);
    const addButton = screen.getByRole('button', { name: /Add Skill/i });
    
    fireEvent.change(skillNameInput, { target: { value: 'React' } });
    fireEvent.change(skillWeightInput, { target: { value: '0.5' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
  });

  it('should show skill weight sum for active layer', async () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Click frontend tab
    const frontendTab = screen.getByRole('button', { name: /frontend \(0\)/i });
    fireEvent.click(frontendTab);
    
    // Add a skill
    const skillNameInput = screen.getByPlaceholderText(/Skill name/i);
    const skillWeightInput = screen.getByPlaceholderText(/Weight/i);
    const addButton = screen.getByRole('button', { name: /Add Skill/i });
    
    fireEvent.change(skillNameInput, { target: { value: 'React' } });
    fireEvent.change(skillWeightInput, { target: { value: '0.5' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const sumDisplays = screen.getAllByText(/Sum:/);
      expect(sumDisplays.length).toBeGreaterThan(0);
    });
  });

  it('should allow removing skills from a layer', async () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Click frontend tab and add a skill
    const frontendTab = screen.getByRole('button', { name: /frontend \(0\)/i });
    fireEvent.click(frontendTab);
    
    const skillNameInput = screen.getByPlaceholderText(/Skill name/i);
    const skillWeightInput = screen.getByPlaceholderText(/Weight/i);
    const addButton = screen.getByRole('button', { name: /Add Skill/i });
    
    fireEvent.change(skillNameInput, { target: { value: 'React' } });
    fireEvent.change(skillWeightInput, { target: { value: '1.0' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    // Remove the skill
    const removeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  it('should call onSubmit with correct data when form is valid', async () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Fill in role
    const roleInput = screen.getByPlaceholderText(/e.g., Full Stack Engineer/i);
    fireEvent.change(roleInput, { target: { value: 'Full Stack Engineer' } });
    
    // Set layer weights - only frontend to 1.0, others to 0
    const inputs = document.querySelectorAll('.layer-weight-item input');
    fireEvent.change(inputs[0], { target: { value: '1.0' } }); // frontend
    fireEvent.change(inputs[1], { target: { value: '0' } }); // backend
    fireEvent.change(inputs[2], { target: { value: '0' } }); // database
    fireEvent.change(inputs[3], { target: { value: '0' } }); // cloud
    fireEvent.change(inputs[4], { target: { value: '0' } }); // devops
    fireEvent.change(inputs[5], { target: { value: '0' } }); // others
    
    // Add a skill to frontend layer
    const frontendTab = screen.getByRole('button', { name: /frontend \(0\)/i });
    fireEvent.click(frontendTab);
    
    const skillNameInput = screen.getByPlaceholderText(/Skill name/i);
    const skillWeightInput = screen.getByPlaceholderText(/Weight/i);
    const addSkillButton = screen.getByRole('button', { name: /Add Skill/i });
    
    fireEvent.change(skillNameInput, { target: { value: 'React' } });
    fireEvent.change(skillWeightInput, { target: { value: '1.0' } });
    fireEvent.click(addSkillButton);
    
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create JD Specification/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'Full Stack Engineer',
          layerWeights: expect.any(Object),
          skills: expect.any(Object)
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data when provided', () => {
    const initialData = {
      role: 'Backend Engineer',
      layerWeights: {
        frontend: 0.1,
        backend: 0.5,
        database: 0.2,
        cloud: 0.1,
        devops: 0.05,
        others: 0.05
      } as LayerWeights,
      skills: {
        frontend: [],
        backend: [{ skill: 'Node.js', weight: 1.0 }],
        database: [],
        cloud: [],
        devops: [],
        others: []
      } as LayerSkills
    };
    
    render(<JDSpecForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    const roleInput = screen.getByPlaceholderText(/e.g., Full Stack Engineer/i);
    expect(roleInput).toHaveValue('Backend Engineer');
  });

  it('should prevent submission when role is empty', () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /Create JD Specification/i });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should prevent submission when layer weights do not sum to 1.0', async () => {
    render(<JDSpecForm onSubmit={mockOnSubmit} />);
    
    // Fill in role
    const roleInput = screen.getByPlaceholderText(/e.g., Full Stack Engineer/i);
    fireEvent.change(roleInput, { target: { value: 'Engineer' } });
    
    // Change a weight to make sum invalid
    const frontendInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(frontendInput, { target: { value: '0.9' } });
    
    // Try to submit
    const submitButton = screen.getByRole('button', { name: /Create JD Specification/i });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
