/**
 * CanonicalJDSpec Property-Based Tests
 * 
 * Property-based tests for the CanonicalJDSpec aggregate root using fast-check.
 * These tests validate universal correctness properties across all valid inputs.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { CanonicalJDSpec } from './CanonicalJDSpec';
import {
  TechLayer,
  LayerWeights,
  LayerSkills,
  SkillWeight,
  CreateJDSpecData,
  getAllTechLayers
} from './JDSpecTypes';

// ============================================================================
// Arbitraries (Generators for property-based testing)
// ============================================================================

/**
 * Generate a valid canonical skill identifier
 */
const skillIdArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generate a valid dictionary version (YYYY.N format)
 */
const dictionaryVersionArb = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }),
  fc.integer({ min: 1, max: 100 })
).map(([year, n]) => `${year}.${n}`);

/**
 * Generate a valid role name
 */
const roleArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generate an array of SkillWeight objects that sum to 1.0
 */
function skillWeightsArrayArb(minLength: number = 0, maxLength: number = 10): fc.Arbitrary<SkillWeight[]> {
  return fc.tuple(
    fc.integer({ min: minLength, max: maxLength }),
    fc.array(skillIdArb, { minLength: 1, maxLength: 20 })
  ).chain(([count, skillIds]) => {
    if (count === 0) {
      return fc.constant([]);
    }
    
    // Generate weights that sum to 1.0
    return fc.array(fc.double({ min: 0.01, max: 1, noNaN: true }), { minLength: count, maxLength: count })
      .map(weights => {
        const sum = weights.reduce((a, b) => a + b, 0);
        const normalized = weights.map(w => w / sum);
        
        return normalized.map((weight, i) => ({
          skill: skillIds[i % skillIds.length],
          weight
        }));
      });
  });
}

/**
 * Generate valid LayerWeights that sum to 1.0
 */
const layerWeightsArb: fc.Arbitrary<LayerWeights> = fc.array(fc.double({ min: 0.01, max: 1, noNaN: true }), { minLength: 6, maxLength: 6 })
  .map(weights => {
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalized = weights.map(w => w / sum);
    
    return {
      frontend: normalized[0],
      backend: normalized[1],
      database: normalized[2],
      cloud: normalized[3],
      devops: normalized[4],
      others: normalized[5]
    };
  });

/**
 * Generate valid LayerSkills with weights summing to 1.0 per layer
 */
const layerSkillsArb: fc.Arbitrary<LayerSkills> = fc.tuple(
  skillWeightsArrayArb(0, 5),
  skillWeightsArrayArb(0, 5),
  skillWeightsArrayArb(0, 5),
  skillWeightsArrayArb(0, 5),
  skillWeightsArrayArb(0, 5),
  skillWeightsArrayArb(0, 5)
).map(([frontend, backend, database, cloud, devops, others]) => ({
  frontend,
  backend,
  database,
  cloud,
  devops,
  others
}));

/**
 * Generate valid CreateJDSpecData
 */
const createJDSpecDataArb: fc.Arbitrary<CreateJDSpecData> = fc.record({
  role: roleArb,
  layerWeights: layerWeightsArb,
  skills: layerSkillsArb,
  dictionaryVersion: dictionaryVersionArb
});

// ============================================================================
// Property Tests
// ============================================================================

describe('CanonicalJDSpec - Property-Based Tests', () => {
  
  /**
   * Property 1: JD Specification Layer Completeness
   * 
   * For any canonical JD specification, all six layers (frontend, backend, database, 
   * cloud, devops, others) must be present in both layerWeights and skills objects.
   * 
   * Validates: Requirements 1.1, 1.2, 12.2, 12.3
   */
  describe('Property 1: JD Specification Layer Completeness', () => {
    it('should have all six layers in layerWeights and skills', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          const spec = CanonicalJDSpec.create(data);
          const requiredLayers = getAllTechLayers();
          
          // Check layerWeights has all layers
          const layerWeights = spec.getLayerWeights();
          for (const layer of requiredLayers) {
            expect(layer in layerWeights).toBe(true);
            expect(typeof layerWeights[layer]).toBe('number');
          }
          
          // Check skills has all layers
          const allSkills = spec.getAllSkills();
          for (const layer of requiredLayers) {
            expect(layer in allSkills).toBe(true);
            expect(Array.isArray(allSkills[layer])).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
    
    it('should reject JD specs with missing layers in layerWeights', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          // Remove a random layer from layerWeights
          const invalidData = { ...data };
          const layersToRemove: TechLayer[] = ['frontend', 'backend'];
          
          for (const layer of layersToRemove) {
            const dataWithMissingLayer = { ...invalidData };
            delete (dataWithMissingLayer.layerWeights as any)[layer];
            
            expect(() => CanonicalJDSpec.create(dataWithMissingLayer)).toThrow();
          }
        }),
        { numRuns: 50 }
      );
    });
    
    it('should reject JD specs with missing layers in skills', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          // Remove a random layer from skills
          const invalidData = { ...data };
          const layersToRemove: TechLayer[] = ['database', 'cloud'];
          
          for (const layer of layersToRemove) {
            const dataWithMissingLayer = { ...invalidData };
            delete (dataWithMissingLayer.skills as any)[layer];
            
            expect(() => CanonicalJDSpec.create(dataWithMissingLayer)).toThrow();
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Layer Weights Sum to Unity
   * 
   * For any canonical JD specification, the sum of all layer weights must equal 
   * 1.0 within a tolerance of ±0.001.
   * 
   * Validates: Requirements 1.3, 1.7, 8.1, 12.4
   */
  describe('Property 2: Layer Weights Sum to Unity', () => {
    it('should have layer weights that sum to 1.0', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          const spec = CanonicalJDSpec.create(data);
          const layerWeights = spec.getLayerWeights();
          
          const sum = Object.values(layerWeights).reduce((acc, weight) => acc + weight, 0);
          const tolerance = 0.001;
          
          expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });
    
    it('should reject JD specs where layer weights do not sum to 1.0', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          // Create invalid layer weights that don't sum to 1.0
          const invalidData = { ...data };
          invalidData.layerWeights = {
            frontend: 0.5,
            backend: 0.3,
            database: 0.1,
            cloud: 0.05,
            devops: 0.05,
            others: 0.05  // Sum = 1.05, exceeds tolerance
          };
          
          expect(() => CanonicalJDSpec.create(invalidData)).toThrow(/must sum to 1\.0/);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 3: Skill Weights Sum to Unity Per Layer
   * 
   * For any canonical JD specification and any layer, the sum of all skill weights 
   * within that layer must equal 1.0 within a tolerance of ±0.001.
   * 
   * Validates: Requirements 1.4, 1.8, 8.2, 12.5
   */
  describe('Property 3: Skill Weights Sum to Unity Per Layer', () => {
    it('should have skill weights that sum to 1.0 within each layer', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          const spec = CanonicalJDSpec.create(data);
          const tolerance = 0.001;
          
          for (const layer of getAllTechLayers()) {
            const skills = spec.getSkillsForLayer(layer);
            
            // Empty layers are allowed
            if (skills.length === 0) {
              continue;
            }
            
            const sum = skills.reduce((acc, skillWeight) => acc + skillWeight.weight, 0);
            expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(tolerance);
          }
        }),
        { numRuns: 100 }
      );
    });
    
    it('should reject JD specs where skill weights in a layer do not sum to 1.0', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          // Create invalid skill weights that don't sum to 1.0
          const invalidData = { ...data };
          invalidData.skills.frontend = [
            { skill: 'react', weight: 0.5 },
            { skill: 'typescript', weight: 0.3 }
            // Sum = 0.8, does not equal 1.0
          ];
          
          expect(() => CanonicalJDSpec.create(invalidData)).toThrow(/must sum to 1\.0/);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: JD Specification Serialization Round-Trip
   * 
   * For any valid canonical JD specification, serializing to JSON and then 
   * deserializing must produce an equivalent specification with identical layer 
   * weights, skill weights, role, and dictionary version.
   * 
   * Validates: Requirement 1.6
   */
  describe('Property 5: JD Specification Serialization Round-Trip', () => {
    it('should preserve all data through JSON serialization round-trip', () => {
      fc.assert(
        fc.property(createJDSpecDataArb, (data) => {
          const original = CanonicalJDSpec.create(data);
          
          // Serialize to JSON
          const json = original.toJSON();
          
          // Deserialize from JSON
          const restored = CanonicalJDSpec.fromJSON(json);
          
          // Verify all fields match
          expect(restored.getId()).toBe(original.getId());
          expect(restored.getRole()).toBe(original.getRole());
          expect(restored.getDictionaryVersion()).toBe(original.getDictionaryVersion());
          
          // Verify layer weights match
          const originalWeights = original.getLayerWeights();
          const restoredWeights = restored.getLayerWeights();
          for (const layer of getAllTechLayers()) {
            expect(restoredWeights[layer]).toBeCloseTo(originalWeights[layer], 6);
          }
          
          // Verify skills match
          const originalSkills = original.getAllSkills();
          const restoredSkills = restored.getAllSkills();
          for (const layer of getAllTechLayers()) {
            expect(restoredSkills[layer].length).toBe(originalSkills[layer].length);
            
            for (let i = 0; i < originalSkills[layer].length; i++) {
              expect(restoredSkills[layer][i].skill).toBe(originalSkills[layer][i].skill);
              expect(restoredSkills[layer][i].weight).toBeCloseTo(originalSkills[layer][i].weight, 6);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
