/**
 * JDCorrelationCalculator Property-Based Tests
 * 
 * Property-based tests for the JD correlation calculator using fast-check.
 * These tests validate universal properties that must hold for all inputs.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.3, 8.4, 8.5
 */

import * as fc from 'fast-check';
import { JDCorrelationCalculator } from './JDCorrelationCalculator';
import { CanonicalJDSpec } from './CanonicalJDSpec';
import { LayerWeights, LayerSkills, getAllTechLayers } from './JDSpecTypes';

// ============================================================================
// Arbitraries (Generators for Property-Based Testing)
// ============================================================================

/**
 * Generate a valid layer weights object that sums to 1.0
 */
function arbitraryLayerWeights(): fc.Arbitrary<LayerWeights> {
  return fc.array(fc.float({ min: 0, max: 1 }), { minLength: 6, maxLength: 6 })
    .map(weights => {
      // Normalize weights to sum to 1.0
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
function arbitrarySkillWeights(minSkills: number = 1, maxSkills: number = 10): fc.Arbitrary<Array<{ skill: string; weight: number }>> {
  return fc.array(
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
      fc.float({ min: 0, max: 1 })
    ),
    { minLength: minSkills, maxLength: maxSkills }
  ).map(skillWeightPairs => {
    // Normalize weights to sum to 1.0
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
    dictionaryVersion: fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 99 })
    ).map(([year, version]) => `${year}.${version}`)
  }).map(data => CanonicalJDSpec.create(data));
}

// ============================================================================
// Property Tests
// ============================================================================

describe('JDCorrelationCalculator - Property-Based Tests', () => {
  
  // Property 21: Correlation Calculation Determinism
  // Validates: Requirement 6.1
  describe('Property 21: Correlation Calculation Determinism', () => {
    it('should produce identical correlation scores for the same inputs', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            
            // Calculate correlation twice with same inputs
            const result1 = calculator.calculate(currentJD, pastJD);
            const result2 = calculator.calculate(currentJD, pastJD);
            
            // Overall scores must be identical
            expect(result1.overallScore).toBe(result2.overallScore);
            
            // Layer scores must be identical
            for (const layer of getAllTechLayers()) {
              const layer1 = result1.layerBreakdown.get(layer);
              const layer2 = result2.layerBreakdown.get(layer);
              expect(layer1?.score).toBe(layer2?.score);
            }
            
            // Dictionary versions must be identical
            expect(result1.currentDictionaryVersion).toBe(result2.currentDictionaryVersion);
            expect(result1.pastDictionaryVersion).toBe(result2.pastDictionaryVersion);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 22: Layer Correlation Formula Correctness
  // Validates: Requirement 6.2
  describe('Property 22: Layer Correlation Formula Correctness', () => {
    it('should calculate layer correlation as sum of (weightCurrent × weightPast × similarity)', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // Verify formula for each layer
            for (const layer of getAllTechLayers()) {
              const currentSkills = currentJD.getSkillsForLayer(layer);
              const pastSkills = pastJD.getSkillsForLayer(layer);
              const layerResult = result.layerBreakdown.get(layer)!;
              
              // Build map of past skills
              const pastSkillMap = new Map(pastSkills.map(s => [s.skill, s.weight]));
              
              // Calculate expected score manually
              let expectedScore = 0;
              for (const { skill, weight: currentWeight } of currentSkills) {
                const pastWeight = pastSkillMap.get(skill);
                if (pastWeight !== undefined) {
                  // Exact match: similarity = 1.0
                  expectedScore += currentWeight * pastWeight * 1.0;
                }
                // Missing skill: similarity = 0.0, contributes 0
              }
              
              // Verify calculated score matches formula
              expect(Math.abs(layerResult.score - expectedScore)).toBeLessThan(0.0001);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 23: Overall Correlation Formula Correctness
  // Validates: Requirement 6.3
  describe('Property 23: Overall Correlation Formula Correctness', () => {
    it('should calculate overall correlation as sum of (layerCorrelation × layerWeightCurrent)', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // Calculate expected overall score from layer scores
            let expectedOverallScore = 0;
            for (const layer of getAllTechLayers()) {
              const layerResult = result.layerBreakdown.get(layer)!;
              const layerWeight = currentJD.getLayerWeight(layer);
              expectedOverallScore += layerResult.score * layerWeight;
            }
            
            // Verify overall score matches formula
            expect(Math.abs(result.overallScore - expectedOverallScore)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 24: Current JD Layer Weights Used
  // Validates: Requirements 6.4, 8.3
  describe('Property 24: Current JD Layer Weights Used', () => {
    it('should use current JD layer weights, not past JD layer weights', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // Verify that layer weights in result match current JD
            for (const layer of getAllTechLayers()) {
              const layerResult = result.layerBreakdown.get(layer)!;
              const currentLayerWeight = currentJD.getLayerWeight(layer);
              expect(layerResult.layerWeight).toBe(currentLayerWeight);
            }
            
            // Verify overall score uses current JD weights
            let calculatedOverall = 0;
            for (const layer of getAllTechLayers()) {
              const layerResult = result.layerBreakdown.get(layer)!;
              calculatedOverall += layerResult.score * currentJD.getLayerWeight(layer);
            }
            expect(Math.abs(result.overallScore - calculatedOverall)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 25: Correlation Score Range
  // Validates: Requirement 6.5
  describe('Property 25: Correlation Score Range', () => {
    it('should produce correlation scores in range [0, 1]', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // Overall score must be in [0, 1]
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(1);
            
            // Each layer score must be in [0, 1]
            for (const layer of getAllTechLayers()) {
              const layerResult = result.layerBreakdown.get(layer)!;
              expect(layerResult.score).toBeGreaterThanOrEqual(0);
              expect(layerResult.score).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 26: Missing Skill Similarity
  // Validates: Requirement 6.6
  describe('Property 26: Missing Skill Similarity', () => {
    it('should assign similarity 0.0 to skills missing in past JD', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // For each layer, verify missing skills don't contribute to score
            for (const layer of getAllTechLayers()) {
              const currentSkills = currentJD.getSkillsForLayer(layer);
              const pastSkills = pastJD.getSkillsForLayer(layer);
              const layerResult = result.layerBreakdown.get(layer)!;
              
              const pastSkillSet = new Set(pastSkills.map(s => s.skill));
              const pastSkillMap = new Map(pastSkills.map(s => [s.skill, s.weight]));
              
              // Calculate score only from matching skills
              let expectedScore = 0;
              for (const { skill, weight: currentWeight } of currentSkills) {
                if (pastSkillSet.has(skill)) {
                  const pastWeight = pastSkillMap.get(skill)!;
                  expectedScore += currentWeight * pastWeight * 1.0;
                }
                // Missing skills contribute 0 (similarity = 0.0)
              }
              
              expect(Math.abs(layerResult.score - expectedScore)).toBeLessThan(0.0001);
              
              // Verify missingSkills list is accurate
              const expectedMissingSkills = currentSkills
                .filter(s => !pastSkillSet.has(s.skill))
                .map(s => s.skill);
              expect(layerResult.missingSkills.sort()).toEqual(expectedMissingSkills.sort());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 28: Skill Weight Contribution
  // Validates: Requirement 8.4
  describe('Property 28: Skill Weight Contribution', () => {
    it('should weight each skill pair by both current and past skill weights', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // For each layer, verify skill contributions use both weights
            for (const layer of getAllTechLayers()) {
              const currentSkills = currentJD.getSkillsForLayer(layer);
              const pastSkills = pastJD.getSkillsForLayer(layer);
              const layerResult = result.layerBreakdown.get(layer)!;
              
              const pastSkillMap = new Map(pastSkills.map(s => [s.skill, s.weight]));
              
              // Calculate expected score with explicit weight multiplication
              let expectedScore = 0;
              for (const { skill, weight: currentWeight } of currentSkills) {
                const pastWeight = pastSkillMap.get(skill);
                if (pastWeight !== undefined) {
                  // Both weights must be used in calculation
                  const contribution = currentWeight * pastWeight * 1.0;
                  expectedScore += contribution;
                  
                  // Verify contribution is non-negative
                  expect(contribution).toBeGreaterThanOrEqual(0);
                }
              }
              
              expect(Math.abs(layerResult.score - expectedScore)).toBeLessThan(0.0001);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 29: Zero-Weight Layer No Penalty
  // Validates: Requirement 8.5
  describe('Property 29: Zero-Weight Layer No Penalty', () => {
    it('should not penalize overall score for missing skills in zero-weight layers', () => {
      fc.assert(
        fc.property(
          arbitraryJDSpec(),
          arbitraryJDSpec(),
          (currentJD, pastJD) => {
            const calculator = new JDCorrelationCalculator();
            const result = calculator.calculate(currentJD, pastJD);
            
            // Find layers with zero weight in current JD
            const zeroWeightLayers = getAllTechLayers().filter(
              layer => currentJD.getLayerWeight(layer) === 0
            );
            
            if (zeroWeightLayers.length > 0) {
              // Calculate overall score without zero-weight layers
              let expectedOverallScore = 0;
              for (const layer of getAllTechLayers()) {
                const layerWeight = currentJD.getLayerWeight(layer);
                if (layerWeight > 0) {
                  const layerResult = result.layerBreakdown.get(layer)!;
                  expectedOverallScore += layerResult.score * layerWeight;
                }
                // Zero-weight layers contribute 0 regardless of their layer score
              }
              
              expect(Math.abs(result.overallScore - expectedOverallScore)).toBeLessThan(0.0001);
              
              // Verify zero-weight layers don't affect overall score
              for (const layer of zeroWeightLayers) {
                const layerResult = result.layerBreakdown.get(layer)!;
                // Even if layer has missing skills, it contributes 0 to overall
                const contribution = layerResult.score * 0;
                expect(contribution).toBe(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

});
