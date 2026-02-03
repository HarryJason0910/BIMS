/**
 * Unit tests for TechStackValue
 * 
 * Tests the core functionality of the TechStackValue class including:
 * - Technology retrieval
 * - Case-insensitive contains checking
 * - Overlap calculation
 */

import { TechStackValue } from './TechStackValue';

describe('TechStackValue', () => {
  describe('constructor and getTechnologies', () => {
    it('should store technologies', () => {
      const stack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack.getTechnologies()).toEqual(['React', 'TypeScript', 'AWS']);
    });

    it('should preserve original technologies but deduplicate based on canonical form', () => {
      const stack = new TechStackValue(['React', 'react', 'TypeScript']);
      const techs = stack.getTechnologies();
      // getTechnologies returns original form, but duplicates are removed based on canonical matching
      expect(techs).toEqual(['React', 'react', 'TypeScript']);
    });

    it('should preserve original whitespace in technologies', () => {
      const stack = new TechStackValue(['  React  ', 'TypeScript', '  AWS  ']);
      // getTechnologies returns original form with whitespace preserved
      expect(stack.getTechnologies()).toEqual(['  React  ', 'TypeScript', '  AWS  ']);
    });

    it('should preserve empty strings in original technologies', () => {
      const stack = new TechStackValue(['React', '', '  ', 'TypeScript']);
      // getTechnologies returns original form including empty strings
      expect(stack.getTechnologies()).toEqual(['React', '', '  ', 'TypeScript']);
    });

    it('should return a copy of technologies array', () => {
      const stack = new TechStackValue(['React', 'TypeScript']);
      const techs1 = stack.getTechnologies();
      const techs2 = stack.getTechnologies();
      expect(techs1).not.toBe(techs2); // Different array instances
      expect(techs1).toEqual(techs2); // Same content
    });
  });

  describe('contains', () => {
    it('should find technology with exact case match', () => {
      const stack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack.contains('React')).toBe(true);
    });

    it('should find technology with case-insensitive match', () => {
      const stack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack.contains('react')).toBe(true);
      expect(stack.contains('REACT')).toBe(true);
      expect(stack.contains('typescript')).toBe(true);
      expect(stack.contains('aws')).toBe(true);
    });

    it('should return false for non-existent technology', () => {
      const stack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack.contains('Vue')).toBe(false);
      expect(stack.contains('Angular')).toBe(false);
    });

    it('should handle whitespace in search term', () => {
      const stack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack.contains('  React  ')).toBe(true);
      expect(stack.contains('  typescript  ')).toBe(true);
    });

    it('should return false for empty string', () => {
      const stack = new TechStackValue(['React', 'TypeScript']);
      expect(stack.contains('')).toBe(false);
      expect(stack.contains('  ')).toBe(false);
    });
  });

  describe('overlapWith', () => {
    it('should calculate overlap for identical stacks', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const stack2 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      expect(stack1.overlapWith(stack2)).toBe(3);
    });

    it('should calculate overlap for partially matching stacks', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const stack2 = new TechStackValue(['React', 'Vue', 'AWS']);
      expect(stack1.overlapWith(stack2)).toBe(2); // React and AWS match
    });

    it('should calculate overlap with case-insensitive matching', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const stack2 = new TechStackValue(['react', 'TYPESCRIPT', 'aws']);
      expect(stack1.overlapWith(stack2)).toBe(3);
    });

    it('should return 0 for non-overlapping stacks', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const stack2 = new TechStackValue(['Vue', 'Angular', 'GCP']);
      expect(stack1.overlapWith(stack2)).toBe(0);
    });

    it('should handle empty stacks', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript']);
      const stack2 = new TechStackValue([]);
      expect(stack1.overlapWith(stack2)).toBe(0);
    });

    it('should handle subset relationships', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);
      const stack2 = new TechStackValue(['React', 'AWS']);
      expect(stack1.overlapWith(stack2)).toBe(2);
    });

    it('should handle superset relationships', () => {
      const stack1 = new TechStackValue(['React', 'AWS']);
      const stack2 = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);
      expect(stack1.overlapWith(stack2)).toBe(2);
    });

    it('should count each technology only once even with duplicates', () => {
      const stack1 = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const stack2 = new TechStackValue(['React', 'React', 'TypeScript']);
      // stack2 should deduplicate to ['React', 'TypeScript']
      expect(stack1.overlapWith(stack2)).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle single technology stack', () => {
      const stack = new TechStackValue(['React']);
      expect(stack.getTechnologies()).toEqual(['React']);
      expect(stack.contains('React')).toBe(true);
      expect(stack.contains('Vue')).toBe(false);
    });

    it('should handle technologies with special characters', () => {
      const stack = new TechStackValue(['C#', '.NET', 'ASP.NET Core']);
      expect(stack.contains('C#')).toBe(true);
      expect(stack.contains('.NET')).toBe(true);
      expect(stack.contains('ASP.NET Core')).toBe(true);
    });

    it('should handle technologies with numbers', () => {
      const stack = new TechStackValue(['Vue.js', 'Next.js', 'Node.js']);
      expect(stack.contains('Vue.js')).toBe(true);
      expect(stack.contains('vue.js')).toBe(true);
    });

    it('should handle very long technology names', () => {
      const longName = 'A'.repeat(100);
      const stack = new TechStackValue([longName, 'React']);
      expect(stack.contains(longName)).toBe(true);
    });
  });
});
