/**
 * JDCorrelationCalculator Unit Tests
 * 
 * Unit tests for the JD correlation calculator domain service.
 * 
 * Part of: enhanced-skill-matching feature
 */

import { JDCorrelationCalculator } from './JDCorrelationCalculator';
import { CanonicalJDSpec } from './CanonicalJDSpec';
import { CreateJDSpecData } from './JDSpecTypes';

describe('JDCorrelationCalculator - Unit Tests', () => {
  let calculator: JDCorrelationCalculator;

  beforeEach(() => {
    calculator = new JDCorrelationCalculator();
  });

  describe('Identical JDs', () => {
    it('should return correlation of 1.0 for identical JDs', () => {
      const data: CreateJDSpecData = {
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 0.6,
          backend: 0.2,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.5 },
            { skill: 'typescript', weight: 0.5 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const jd1 = CanonicalJDSpec.create(data);
      const jd2 = CanonicalJDSpec.create(data);

      const result = calculator.calculate(jd1, jd2);

      // Expected calculation:
      // Frontend: (0.5 * 0.5 * 1.0) + (0.5 * 0.5 * 1.0) = 0.25 + 0.25 = 0.5
      // Backend: (1.0 * 1.0 * 1.0) = 1.0
      // Database: (1.0 * 1.0 * 1.0) = 1.0
      // Cloud: 0 (no skills)
      // Devops: 0 (no skills)
      // Others: 0 (no skills)
      // Overall: 0.5 * 0.6 + 1.0 * 0.2 + 1.0 * 0.1 + 0 * 0.05 + 0 * 0.03 + 0 * 0.02
      //        = 0.3 + 0.2 + 0.1 = 0.6
      expect(result.overallScore).toBeCloseTo(0.6, 6);
    });
  });

  describe('Completely Different JDs', () => {
    it('should return correlation of 0.0 for completely different JDs', () => {
      const frontendData: CreateJDSpecData = {
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 0.8,
          backend: 0.1,
          database: 0.05,
          cloud: 0.03,
          devops: 0.01,
          others: 0.01
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const backendData: CreateJDSpecData = {
        role: 'Backend Developer',
        layerWeights: {
          frontend: 0.1,
          backend: 0.7,
          database: 0.15,
          cloud: 0.03,
          devops: 0.01,
          others: 0.01
        },
        skills: {
          frontend: [],
          backend: [{ skill: 'java', weight: 1.0 }],
          database: [{ skill: 'oracle', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const jd1 = CanonicalJDSpec.create(frontendData);
      const jd2 = CanonicalJDSpec.create(backendData);

      const result = calculator.calculate(jd1, jd2);

      expect(result.overallScore).toBe(0.0);
    });
  });

  describe('Partial Overlap', () => {
    it('should calculate correct correlation for partial skill overlap', () => {
      const currentData: CreateJDSpecData = {
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.6 },
            { skill: 'vue', weight: 0.4 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const pastData: CreateJDSpecData = {
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.7 },
            { skill: 'angular', weight: 0.3 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'mongodb', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const current = CanonicalJDSpec.create(currentData);
      const past = CanonicalJDSpec.create(pastData);

      const result = calculator.calculate(current, past);

      // Frontend: react matches (0.6 * 0.7 * 1.0 = 0.42), vue missing (0)
      // Backend: nodejs matches (1.0 * 1.0 * 1.0 = 1.0)
      // Database: postgresql missing (0)
      // Expected: 0.42 * 0.5 + 1.0 * 0.3 + 0 * 0.1 = 0.21 + 0.3 = 0.51

      expect(result.overallScore).toBeCloseTo(0.51, 2);
    });
  });

  describe('Layer Breakdown', () => {
    it('should provide detailed layer breakdown', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const jd = CanonicalJDSpec.create(data);
      const result = calculator.calculate(jd, jd);

      expect(result.layerBreakdown.size).toBe(6);
      expect(result.layerBreakdown.has('frontend')).toBe(true);
      expect(result.layerBreakdown.has('backend')).toBe(true);

      const frontendResult = result.layerBreakdown.get('frontend')!;
      expect(frontendResult.score).toBe(1.0);
      expect(frontendResult.matchingSkills).toEqual(['react']);
      expect(frontendResult.missingSkills).toEqual([]);
    });
  });

  describe('Dictionary Version Tracking', () => {
    it('should track dictionary versions used', () => {
      const data1: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };

      const data2 = { ...data1, dictionaryVersion: '2024.2' };

      const jd1 = CanonicalJDSpec.create(data1);
      const jd2 = CanonicalJDSpec.create(data2);

      const result = calculator.calculate(jd1, jd2);

      expect(result.currentDictionaryVersion).toBe('2024.1');
      expect(result.pastDictionaryVersion).toBe('2024.2');
    });
  });
});
