/**
 * Property-based tests for CalculateCorrelationUseCase
 * 
 * Tests universal correctness properties using fast-check library.
 * Each property is tested with 100+ iterations to ensure robustness.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { CalculateCorrelationUseCase, CalculateCorrelationInput } from './CalculateCorrelationUseCase';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { IJDSpecRepository } from './IJDSpecRepository';
import { LayerWeights, LayerSkills, getAllTechLayers } from '../domain/JDSpecTypes';

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
// Arbitraries (Generators)
// ============================================================================

/**
 * Generate a valid layer weights object that sums to 1.0
 */
function arbitraryLayerWeights(): fc.Arbitrary<LayerWeights> {
  return fc.array(fc.float({ min: 0, max: 1, noNaN: true }), { minLength: 6, maxLength: 6 })
    .map(weights => {
      const sum = weights.reduce((a, b) => a + b, 0);
      const normalized = sum > 0 ? weights.map(w => w / sum) : [1/6, 1/6, 1/6, 1/6, 1/6, 1/6];
      
      return {
        frontend: normalized[0],
        backend: normalized[1],
        database: normalized[2],
        cloud: normalized[3],
        devops: normalized[4],
        others: normalized[5]
      };
    });
}

/**
 * Generate skill weights for a layer that sum to 1.0
 */
function arbitrarySkillWeights(minSkills: number = 1, maxSkills: number = 5): fc.Arbitrary<Array<{ skill: string; weight: number }>> {
  return fc.array(
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
      fc.float({ min: 0, max: 1, noNaN: true })
    ),
    { minLength: minSkills, maxLength: maxSkills }
  ).map(skillWeightPairs => {
    const sum = skillWeightPairs.reduce((acc, [, weight]) => acc + weight, 0);
    const normalized = sum > 0 
      ? skillWeightPairs.map(([skill, weight]) => ({ skill, weight: weight / sum }))
      : skillWeightPairs.map(([skill]) => ({ skill, weight: 1 / skillWeightPairs.length }));
    
    return normalized;
  });
}

/**
 * Generate layer skills for all six layers
 */
function arbitraryLayerSkills(): fc.Arbitrary<LayerSkills> {
  return fc.record({
    frontend: arbitrarySkillWeights(),
    backend: arbitrarySkillWeights(),
    database: arbitrarySkillWeights(),
    cloud: arbitrarySkillWeights(),
    devops: arbitrarySkillWeights(),
    others: arbitrarySkillWeights()
  });
}

/**
 * Generate a valid CanonicalJDSpec
 */
function arbitraryJDSpec(): fc.Arbitrary<CanonicalJDSpec> {
  return fc.record({
    role: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    layerWeights: arbitraryLayerWeights(),
    skills: arbitraryLayerSkills(),
    dictionaryVersion: fc.constantFrom('2024.1', '2024.2', '2025.1')
  }).map(data => CanonicalJDSpec.create(data));
}

// ============================================================================
// Property Tests
// ============================================================================

describe('CalculateCorrelationUseCase - Property Tests', () => {
  
  /**
   * Property 27: Correlation Dictionary Version Tracking
   * 
   * For any correlation calculation, the result must include both the current JD's 
   * dictionary version and the past JD's dictionary version.
   * 
   * Validates: Requirement 6.7
   */
  describe('Property 27: Correlation Dictionary Version Tracking', () => {
    it('should include both current and past dictionary versions in result', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          async (currentJD, pastJD) => {
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
            
            // Verify: Result must include both dictionary versions
            expect(result.correlation.currentDictionaryVersion).toBe(currentJD.getDictionaryVersion());
            expect(result.correlation.pastDictionaryVersion).toBe(pastJD.getDictionaryVersion());
            
            // Verify: Dictionary versions are non-empty strings
            expect(result.correlation.currentDictionaryVersion).toBeTruthy();
            expect(result.correlation.pastDictionaryVersion).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track dictionary versions even when they differ', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('2024.1', '2024.2', '2025.1'),
          fc.constantFrom('2024.1', '2024.2', '2025.1'),
          async (currentVersion, pastVersion) => {
            // Create JD specs with different dictionary versions
            const currentJD = CanonicalJDSpec.create({
              role: 'Current Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: [{ skill: 'react', weight: 1.0 }],
                backend: [], database: [], cloud: [], devops: [], others: []
              },
              dictionaryVersion: currentVersion
            });
            
            const pastJD = CanonicalJDSpec.create({
              role: 'Past Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: [{ skill: 'react', weight: 1.0 }],
                backend: [], database: [], cloud: [], devops: [], others: []
              },
              dictionaryVersion: pastVersion
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
            
            // Verify: Versions are tracked correctly
            expect(result.correlation.currentDictionaryVersion).toBe(currentVersion);
            expect(result.correlation.pastDictionaryVersion).toBe(pastVersion);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 34: Correlation Explainability - Layer Breakdown
   * 
   * For any correlation calculation, the result must include a breakdown showing 
   * each layer's contribution to the overall score.
   * 
   * Validates: Requirement 7.6
   */
  describe('Property 34: Correlation Explainability - Layer Breakdown', () => {
    it('should include layer breakdown for all six layers', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          async (currentJD, pastJD) => {
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
            
            // Verify: All six layers must be present in breakdown
            const layers = getAllTechLayers();
            expect(result.correlation.layerBreakdown.size).toBe(6);
            
            for (const layer of layers) {
              const layerResult = result.correlation.layerBreakdown.get(layer);
              expect(layerResult).toBeDefined();
              
              // Each layer result must have required fields
              expect(layerResult!.score).toBeGreaterThanOrEqual(0);
              expect(layerResult!.score).toBeLessThanOrEqual(1);
              expect(layerResult!.layerWeight).toBe(currentJD.getLayerWeight(layer));
              expect(Array.isArray(layerResult!.matchingSkills)).toBe(true);
              expect(Array.isArray(layerResult!.missingSkills)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show each layer contribution to overall score', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          async (currentJD, pastJD) => {
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
            
            // Verify: Overall score equals sum of layer contributions
            let calculatedOverall = 0;
            for (const layer of getAllTechLayers()) {
              const layerResult = result.correlation.layerBreakdown.get(layer)!;
              const contribution = layerResult.score * layerResult.layerWeight;
              calculatedOverall += contribution;
              
              // Each contribution must be non-negative
              expect(contribution).toBeGreaterThanOrEqual(0);
            }
            
            // Overall score must match sum of contributions
            expect(Math.abs(result.correlation.overallScore - calculatedOverall)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 35: Correlation Explainability - Skill Details
   * 
   * For any correlation calculation and any layer, the result must include which 
   * skills matched and which skills are missing in that layer.
   * 
   * Validates: Requirement 7.7
   */
  describe('Property 35: Correlation Explainability - Skill Details', () => {
    it('should identify matching and missing skills for each layer', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          async (currentJD, pastJD) => {
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
            
            // Verify: For each layer, matching and missing skills are correctly identified
            for (const layer of getAllTechLayers()) {
              const currentSkills = currentJD.getSkillsForLayer(layer);
              const pastSkills = pastJD.getSkillsForLayer(layer);
              const layerResult = result.correlation.layerBreakdown.get(layer)!;
              
              const pastSkillSet = new Set(pastSkills.map(s => s.skill));
              
              // Build expected matching and missing skills
              const expectedMatching: string[] = [];
              const expectedMissing: string[] = [];
              
              for (const { skill } of currentSkills) {
                if (pastSkillSet.has(skill)) {
                  expectedMatching.push(skill);
                } else {
                  expectedMissing.push(skill);
                }
              }
              
              // Verify matching skills
              expect(layerResult.matchingSkills.sort()).toEqual(expectedMatching.sort());
              
              // Verify missing skills
              expect(layerResult.missingSkills.sort()).toEqual(expectedMissing.sort());
              
              // Verify no overlap between matching and missing
              const matchingSet = new Set(layerResult.matchingSkills);
              const missingSet = new Set(layerResult.missingSkills);
              for (const skill of layerResult.matchingSkills) {
                expect(missingSet.has(skill)).toBe(false);
              }
              for (const skill of layerResult.missingSkills) {
                expect(matchingSet.has(skill)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle layers with no skills correctly', async () => {
      // Create JD specs with some empty layers
      const currentJD = CanonicalJDSpec.create({
        role: 'Current Role',
        layerWeights: {
          frontend: 0.5, backend: 0.5, database: 0,
          cloud: 0, devops: 0, others: 0
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const pastJD = CanonicalJDSpec.create({
        role: 'Past Role',
        layerWeights: {
          frontend: 0.5, backend: 0.5, database: 0,
          cloud: 0, devops: 0, others: 0
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
      
      // Verify: Empty layers should have empty skill lists
      const databaseResult = result.correlation.layerBreakdown.get('database')!;
      expect(databaseResult.matchingSkills).toEqual([]);
      expect(databaseResult.missingSkills).toEqual([]);
      
      // Verify: Frontend has missing skill (react not in past)
      const frontendResult = result.correlation.layerBreakdown.get('frontend')!;
      expect(frontendResult.missingSkills).toContain('react');
      
      // Verify: Backend has missing skill (nodejs not in past)
      const backendResult = result.correlation.layerBreakdown.get('backend')!;
      expect(backendResult.missingSkills).toContain('nodejs');
    });
  });
});
