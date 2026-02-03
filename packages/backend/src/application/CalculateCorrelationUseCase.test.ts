/**
 * Unit tests for CalculateCorrelationUseCase
 * 
 * Tests specific examples and edge cases for the CalculateCorrelationUseCase.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 6.7, 7.6, 7.7
 */

import { CalculateCorrelationUseCase, CalculateCorrelationInput } from './CalculateCorrelationUseCase';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { IJDSpecRepository } from './IJDSpecRepository';

// ============================================================================
// Mock Repository
// ============================================================================

class MockJDSpecRepository implements IJDSpecRepository {
  private specs: Map<string, CanonicalJDSpec> = new Map();

  async save(spec: CanonicalJDSpec): Promise<void> {
    this.specs.set(spec.getId(), spec);
  }

  async findById(id: string): Promise<CanonicalJDSpec | null> {
    return this.specs.get(id) || null;
  }

  async findAll(): Promise<CanonicalJDSpec[]> {
    return Array.from(this.specs.values());
  }

  async update(spec: CanonicalJDSpec): Promise<void> {
    this.specs.set(spec.getId(), spec);
  }

  async delete(id: string): Promise<void> {
    this.specs.delete(id);
  }

  // Helper for tests
  addSpec(spec: CanonicalJDSpec): void {
    this.specs.set(spec.getId(), spec);
  }
}

// ============================================================================
// Unit Tests
// ============================================================================

describe('CalculateCorrelationUseCase - Unit Tests', () => {
  
  describe('Successful correlation calculation', () => {
    it('should calculate correlation between two identical JD specs', async () => {
      // Create identical JD specs with skills in all layers
      const jdData = {
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 1/6,
          backend: 1/6,
          database: 1/6,
          cloud: 1/6,
          devops: 1/6,
          others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };
      
      const currentJD = CanonicalJDSpec.create(jdData);
      const pastJD = CanonicalJDSpec.create(jdData);
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Identical JDs should have correlation = 1.0
      expect(result.correlation.overallScore).toBeCloseTo(1.0, 3);
      
      // Verify: All layers should have perfect correlation
      expect(result.correlation.layerBreakdown.get('frontend')!.score).toBeCloseTo(1.0, 3);
      expect(result.correlation.layerBreakdown.get('backend')!.score).toBeCloseTo(1.0, 3);
      expect(result.correlation.layerBreakdown.get('database')!.score).toBeCloseTo(1.0, 3);
      
      // Verify: All skills should be matching, none missing
      expect(result.correlation.layerBreakdown.get('frontend')!.matchingSkills).toContain('react');
      expect(result.correlation.layerBreakdown.get('frontend')!.missingSkills).toEqual([]);
    });

    it('should calculate correlation between completely different JD specs', async () => {
      // Create completely different JD specs
      const currentJD = CanonicalJDSpec.create({
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
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
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Backend Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'vue', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: No matching skills should result in correlation = 0.0
      expect(result.correlation.overallScore).toBeCloseTo(0.0, 3);
      
      // Verify: Frontend layer should have no matching skills
      expect(result.correlation.layerBreakdown.get('frontend')!.matchingSkills).toEqual([]);
      expect(result.correlation.layerBreakdown.get('frontend')!.missingSkills).toContain('react');
    });

    it('should calculate correlation with partial overlap', async () => {
      // Create JD specs with partial overlap
      const currentJD = CanonicalJDSpec.create({
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.5, backend: 0.5, database: 0,
          cloud: 0, devops: 0, others: 0
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.6 },
            { skill: 'typescript', weight: 0.4 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 0.5, backend: 0.5, database: 0,
          cloud: 0, devops: 0, others: 0
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.7 },
            { skill: 'vue', weight: 0.3 }
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Correlation should be between 0 and 1
      expect(result.correlation.overallScore).toBeGreaterThan(0);
      expect(result.correlation.overallScore).toBeLessThan(1);
      
      // Verify: Frontend layer should have 'react' matching, 'typescript' missing
      const frontendResult = result.correlation.layerBreakdown.get('frontend')!;
      expect(frontendResult.matchingSkills).toContain('react');
      expect(frontendResult.missingSkills).toContain('typescript');
      
      // Verify: Backend layer should have 'nodejs' missing
      const backendResult = result.correlation.layerBreakdown.get('backend')!;
      expect(backendResult.missingSkills).toContain('nodejs');
    });
  });

  describe('JD not found errors', () => {
    it('should throw error when current JD is not found', async () => {
      const pastJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: 'non-existent-id',
        pastJDId: pastJD.getId()
      };
      
      // Execute & Verify
      await expect(useCase.execute(input)).rejects.toThrow('Current JD specification not found');
    });

    it('should throw error when past JD is not found', async () => {
      const currentJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: 'non-existent-id'
      };
      
      // Execute & Verify
      await expect(useCase.execute(input)).rejects.toThrow('Past JD specification not found');
    });
  });

  describe('Correlation breakdown structure', () => {
    it('should include all required fields in correlation result', async () => {
      const currentJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2024.2'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Result has all required fields
      expect(result.correlation).toBeDefined();
      expect(result.correlation.overallScore).toBeDefined();
      expect(result.correlation.layerBreakdown).toBeDefined();
      expect(result.correlation.currentDictionaryVersion).toBe('2024.1');
      expect(result.correlation.pastDictionaryVersion).toBe('2024.2');
      
      // Verify: Layer breakdown has all six layers
      expect(result.correlation.layerBreakdown.size).toBe(6);
      
      // Verify: Each layer has required fields
      const frontendResult = result.correlation.layerBreakdown.get('frontend')!;
      expect(frontendResult.score).toBeDefined();
      expect(frontendResult.matchingSkills).toBeDefined();
      expect(frontendResult.missingSkills).toBeDefined();
      expect(frontendResult.layerWeight).toBeDefined();
      
      expect(Array.isArray(frontendResult.matchingSkills)).toBe(true);
      expect(Array.isArray(frontendResult.missingSkills)).toBe(true);
    });

    it('should correctly identify matching and missing skills in breakdown', async () => {
      const currentJD = CanonicalJDSpec.create({
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.4, backend: 0.4, database: 0.2,
          cloud: 0, devops: 0, others: 0
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.5 },
            { skill: 'typescript', weight: 0.5 }
          ],
          backend: [
            { skill: 'nodejs', weight: 0.6 },
            { skill: 'express', weight: 0.4 }
          ],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Backend Developer',
        layerWeights: {
          frontend: 0.4, backend: 0.4, database: 0.2,
          cloud: 0, devops: 0, others: 0
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'mongodb', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Frontend layer
      const frontendResult = result.correlation.layerBreakdown.get('frontend')!;
      expect(frontendResult.matchingSkills).toContain('react');
      expect(frontendResult.missingSkills).toContain('typescript');
      
      // Verify: Backend layer
      const backendResult = result.correlation.layerBreakdown.get('backend')!;
      expect(backendResult.matchingSkills).toContain('nodejs');
      expect(backendResult.missingSkills).toContain('express');
      
      // Verify: Database layer
      const databaseResult = result.correlation.layerBreakdown.get('database')!;
      expect(databaseResult.matchingSkills).toEqual([]);
      expect(databaseResult.missingSkills).toContain('postgresql');
    });
  });

  describe('Dictionary version tracking', () => {
    it('should track different dictionary versions correctly', async () => {
      const currentJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2025.1'
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [], database: [], cloud: [], devops: [], others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Setup
      const repository = new MockJDSpecRepository();
      repository.addSpec(currentJD);
      repository.addSpec(pastJD);
      
      const useCase = new CalculateCorrelationUseCase(repository);
      
      const input: CalculateCorrelationInput = {
        currentJDId: currentJD.getId(),
        pastJDId: pastJD.getId()
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Dictionary versions are tracked correctly
      expect(result.correlation.currentDictionaryVersion).toBe('2025.1');
      expect(result.correlation.pastDictionaryVersion).toBe('2024.1');
    });
  });
});
