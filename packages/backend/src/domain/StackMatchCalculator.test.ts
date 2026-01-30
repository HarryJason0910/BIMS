/**
 * Unit tests for StackMatchCalculator
 * 
 * Tests the tech stack matching algorithm with specific examples and edge cases.
 * Property-based tests are in separate files (task 2.2, 2.3).
 */

import { StackMatchCalculator } from './StackMatchCalculator';
import { TechStackValue } from './TechStackValue';
import { ResumeMetadata } from './ResumeMetadata';

describe('StackMatchCalculator', () => {
  let calculator: StackMatchCalculator;

  beforeEach(() => {
    calculator = new StackMatchCalculator();
  });

  describe('calculateScore', () => {
    it('should return 100 for exact match', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const resumeStack = new TechStackValue(['React', 'TypeScript', 'AWS']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(100);
    });

    it('should return 100 for superset (resume has all target techs plus more)', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript']);
      const resumeStack = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(100);
    });

    it('should return 0 for no match', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const resumeStack = new TechStackValue(['Java', 'Spring', 'Microservices']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(0);
    });

    it('should return proportional score for partial match (50% overlap)', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);
      const resumeStack = new TechStackValue(['React', 'TypeScript']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      // 2 out of 4 = 50%
      expect(score).toBe(50);
    });

    it('should return proportional score for partial match (75% overlap)', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);
      const resumeStack = new TechStackValue(['React', 'TypeScript', 'AWS']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      // 3 out of 4 = 75%
      expect(score).toBe(75);
    });

    it('should return at least 50 for any partial match', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda', 'DynamoDB']);
      const resumeStack = new TechStackValue(['React']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      // 1 out of 5 = 20%, but minimum is 50
      expect(score).toBe(50);
    });

    it('should be case-insensitive', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const resumeStack = new TechStackValue(['react', 'typescript', 'aws']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(100);
    });

    it('should handle mixed case variations', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript']);
      const resumeStack = new TechStackValue(['REACT', 'typescript']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(100);
    });

    it('should return 0 for empty target stack', () => {
      const targetStack = new TechStackValue([]);
      const resumeStack = new TechStackValue(['React', 'TypeScript', 'AWS']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(0);
    });

    it('should return 0 when resume stack is empty', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const resumeStack = new TechStackValue([]);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(0);
    });

    it('should handle single technology stacks', () => {
      const targetStack = new TechStackValue(['React']);
      const resumeStack = new TechStackValue(['React']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      expect(score).toBe(100);
    });

    it('should cap partial match score at 99', () => {
      // This test ensures that even with rounding, we never exceed 99 for partial matches
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      const resumeStack = new TechStackValue(['React', 'TypeScript']);

      const score = calculator.calculateScore(targetStack, resumeStack);

      // 2 out of 3 = 66.67%, should be 66 and definitely not 100
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('sortByScore', () => {
    it('should sort resumes by score in descending order', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS']);
      
      const resume1 = new ResumeMetadata(
        '1',
        'Company A',
        'Role A',
        new TechStackValue(['React', 'TypeScript', 'AWS']), // 100% match
        '/path/1',
        new Date('2024-01-01')
      );
      
      const resume2 = new ResumeMetadata(
        '2',
        'Company B',
        'Role B',
        new TechStackValue(['React', 'TypeScript']), // 66% match
        '/path/2',
        new Date('2024-01-02')
      );
      
      const resume3 = new ResumeMetadata(
        '3',
        'Company C',
        'Role C',
        new TechStackValue(['Java', 'Spring']), // 0% match
        '/path/3',
        new Date('2024-01-03')
      );

      const sorted = calculator.sortByScore([resume3, resume1, resume2], targetStack);

      expect(sorted[0].metadata.getId()).toBe('1');
      expect(sorted[0].score).toBe(100);
      expect(sorted[1].metadata.getId()).toBe('2');
      expect(sorted[1].score).toBe(66);
      expect(sorted[2].metadata.getId()).toBe('3');
      expect(sorted[2].score).toBe(0);
    });

    it('should sort by creation date (descending) when scores are equal', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript']);
      
      const resume1 = new ResumeMetadata(
        '1',
        'Company A',
        'Role A',
        new TechStackValue(['React', 'TypeScript']),
        '/path/1',
        new Date('2024-01-01') // Older
      );
      
      const resume2 = new ResumeMetadata(
        '2',
        'Company B',
        'Role B',
        new TechStackValue(['React', 'TypeScript']),
        '/path/2',
        new Date('2024-01-03') // Newest
      );
      
      const resume3 = new ResumeMetadata(
        '3',
        'Company C',
        'Role C',
        new TechStackValue(['React', 'TypeScript']),
        '/path/3',
        new Date('2024-01-02') // Middle
      );

      const sorted = calculator.sortByScore([resume1, resume2, resume3], targetStack);

      // All have same score (100), so should be sorted by date descending
      expect(sorted[0].metadata.getId()).toBe('2'); // Newest
      expect(sorted[1].metadata.getId()).toBe('3'); // Middle
      expect(sorted[2].metadata.getId()).toBe('1'); // Oldest
      
      // Verify all have same score
      expect(sorted[0].score).toBe(100);
      expect(sorted[1].score).toBe(100);
      expect(sorted[2].score).toBe(100);
    });

    it('should handle empty resume array', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript']);
      
      const sorted = calculator.sortByScore([], targetStack);

      expect(sorted).toEqual([]);
    });

    it('should handle single resume', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript']);
      
      const resume = new ResumeMetadata(
        '1',
        'Company A',
        'Role A',
        new TechStackValue(['React', 'TypeScript']),
        '/path/1',
        new Date('2024-01-01')
      );

      const sorted = calculator.sortByScore([resume], targetStack);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].metadata.getId()).toBe('1');
      expect(sorted[0].score).toBe(100);
    });

    it('should maintain stable sort for complex scenarios', () => {
      const targetStack = new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']);
      
      // Create resumes with different scores and dates
      const resumes = [
        new ResumeMetadata('1', 'A', 'R', new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']), '/1', new Date('2024-01-01')), // 100
        new ResumeMetadata('2', 'B', 'R', new TechStackValue(['React', 'TypeScript', 'AWS']), '/2', new Date('2024-01-05')), // 75
        new ResumeMetadata('3', 'C', 'R', new TechStackValue(['React', 'TypeScript', 'AWS', 'Lambda']), '/3', new Date('2024-01-03')), // 100
        new ResumeMetadata('4', 'D', 'R', new TechStackValue(['React']), '/4', new Date('2024-01-02')), // 50
        new ResumeMetadata('5', 'E', 'R', new TechStackValue(['React', 'TypeScript', 'AWS']), '/5', new Date('2024-01-04')), // 75
      ];

      const sorted = calculator.sortByScore(resumes, targetStack);

      // Expected order:
      // 1. ID '3' - score 100, date 2024-01-03 (newer)
      // 2. ID '1' - score 100, date 2024-01-01 (older)
      // 3. ID '2' - score 75, date 2024-01-05 (newer)
      // 4. ID '5' - score 75, date 2024-01-04 (older)
      // 5. ID '4' - score 50, date 2024-01-02
      
      expect(sorted[0].metadata.getId()).toBe('3');
      expect(sorted[0].score).toBe(100);
      expect(sorted[1].metadata.getId()).toBe('1');
      expect(sorted[1].score).toBe(100);
      expect(sorted[2].metadata.getId()).toBe('2');
      expect(sorted[2].score).toBe(75);
      expect(sorted[3].metadata.getId()).toBe('5');
      expect(sorted[3].score).toBe(75);
      expect(sorted[4].metadata.getId()).toBe('4');
      expect(sorted[4].score).toBe(50);
    });
  });
});
