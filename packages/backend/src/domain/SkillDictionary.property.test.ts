/**
 * SkillDictionary - Property-Based Tests
 * 
 * Tests universal correctness properties for the SkillDictionary aggregate root.
 * Uses fast-check for property-based testing with 100+ iterations per property.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { SkillDictionary } from './SkillDictionary';
import { TechLayer } from './JDSpecTypes';

// ============================================================================
// Arbitraries (Generators for property-based testing)
// ============================================================================

/**
 * Generate a valid TechLayer
 */
const arbitraryTechLayer = (): fc.Arbitrary<TechLayer> => {
  return fc.constantFrom<TechLayer>(
    'frontend',
    'backend',
    'database',
    'cloud',
    'devops',
    'others'
  );
};

/**
 * Generate a valid skill name (non-empty, max 100 chars)
 */
const arbitrarySkillName = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
};

/**
 * Generate a valid dictionary version (YYYY.N format)
 */
const arbitraryDictionaryVersion = (): fc.Arbitrary<string> => {
  return fc.tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 100 })
  ).map(([year, n]) => `${year}.${n}`);
};

// ============================================================================
// Property Tests
// ============================================================================

describe('SkillDictionary - Property-Based Tests', () => {
  
  // Feature: enhanced-skill-matching, Property 6: Canonical Skill Completeness
  // Validates: Requirement 2.2
  describe('Property 6: Canonical Skill Completeness', () => {
    it('should ensure all canonical skills have non-empty name, valid category, and creation timestamp', () => {
      fc.assert(
        fc.property(
          arbitraryDictionaryVersion(),
          fc.array(
            fc.record({
              name: arbitrarySkillName(),
              category: arbitraryTechLayer()
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (version, skillsData) => {
            const dictionary = SkillDictionary.create(version);
            
            // Add all skills
            for (const { name, category } of skillsData) {
              try {
                dictionary.addCanonicalSkill(name, category);
              } catch (e) {
                // Skip duplicates (normalized names might collide)
                continue;
              }
            }
            
            // Verify all skills in dictionary have required properties
            const allSkills = dictionary.getAllSkills();
            
            for (const skill of allSkills) {
              // Non-empty name
              expect(skill.name).toBeTruthy();
              expect(skill.name.trim().length).toBeGreaterThan(0);
              
              // Valid category (one of the six layers)
              expect(['frontend', 'backend', 'database', 'cloud', 'devops', 'others'])
                .toContain(skill.category);
              
              // Creation timestamp exists and is valid
              expect(skill.createdAt).toBeInstanceOf(Date);
              expect(skill.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 7: Skill Variation Uniqueness
  // Validates: Requirement 2.3
  describe('Property 7: Skill Variation Uniqueness', () => {
    it('should ensure each variation maps to exactly one canonical skill', () => {
      fc.assert(
        fc.property(
          arbitraryDictionaryVersion(),
          arbitrarySkillName(),
          arbitraryTechLayer(),
          fc.array(arbitrarySkillName(), { minLength: 1, maxLength: 20 }),
          (version, canonicalName, category, variations) => {
            const dictionary = SkillDictionary.create(version);
            
            // Add canonical skill
            dictionary.addCanonicalSkill(canonicalName, category);
            
            // Add variations
            const addedVariations = new Set<string>();
            for (const variation of variations) {
              const normalized = variation.toLowerCase().trim();
              
              // Skip if it's the same as canonical or already added
              if (normalized === canonicalName.toLowerCase().trim() || addedVariations.has(normalized)) {
                continue;
              }
              
              try {
                dictionary.addSkillVariation(variation, canonicalName);
                addedVariations.add(normalized);
              } catch (e) {
                // Skip if variation conflicts with existing canonical
                continue;
              }
            }
            
            // Verify each variation maps to exactly one canonical skill
            for (const variation of addedVariations) {
              const mapped = dictionary.mapToCanonical(variation);
              expect(mapped).toBe(canonicalName.toLowerCase().trim());
            }
            
            // Verify adding the same variation again doesn't create duplicates
            for (const variation of addedVariations) {
              const mapped1 = dictionary.mapToCanonical(variation);
              const mapped2 = dictionary.mapToCanonical(variation);
              expect(mapped1).toBe(mapped2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 8: Canonical Skill Deletion Cascade
  // Validates: Requirement 2.5
  describe('Property 8: Canonical Skill Deletion Cascade', () => {
    it('should remove all variations when canonical skill is deleted', () => {
      fc.assert(
        fc.property(
          arbitraryDictionaryVersion(),
          arbitrarySkillName(),
          arbitraryTechLayer(),
          fc.array(arbitrarySkillName(), { minLength: 1, maxLength: 20 }),
          (version, canonicalName, category, variations) => {
            const dictionary = SkillDictionary.create(version);
            
            // Add canonical skill
            dictionary.addCanonicalSkill(canonicalName, category);
            
            // Add variations
            const addedVariations: string[] = [];
            for (const variation of variations) {
              const normalized = variation.toLowerCase().trim();
              
              // Skip if it's the same as canonical or already added
              if (normalized === canonicalName.toLowerCase().trim() || addedVariations.includes(normalized)) {
                continue;
              }
              
              try {
                dictionary.addSkillVariation(variation, canonicalName);
                addedVariations.push(normalized);
              } catch (e) {
                // Skip if variation conflicts
                continue;
              }
            }
            
            // Verify variations exist before deletion
            for (const variation of addedVariations) {
              expect(dictionary.hasSkill(variation)).toBe(true);
            }
            
            // Delete canonical skill
            dictionary.removeCanonicalSkill(canonicalName);
            
            // Verify canonical skill is gone
            expect(dictionary.getCanonicalSkill(canonicalName)).toBeNull();
            
            // Verify all variations are also gone
            for (const variation of addedVariations) {
              expect(dictionary.hasSkill(variation)).toBe(false);
              expect(dictionary.mapToCanonical(variation)).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 9: Dictionary Version Format
  // Validates: Requirement 3.1
  describe('Property 9: Dictionary Version Format', () => {
    it('should enforce YYYY.N version format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 1000 }),
          (year, n) => {
            const version = `${year}.${n}`;
            
            // Should create successfully with valid format
            const dictionary = SkillDictionary.create(version);
            expect(dictionary.getVersion()).toBe(version);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid version formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter(s => !/^\d{4}\.\d+$/.test(s)), // Invalid format
            fc.constant('2024'),                               // Missing .N
            fc.constant('24.1'),                               // Year too short
            fc.constant('2024.'),                              // Missing N
            fc.constant('.1'),                                 // Missing year
            fc.constant('2024.1.2')                            // Too many parts
          ),
          (invalidVersion) => {
            expect(() => {
              SkillDictionary.create(invalidVersion);
            }).toThrow(/Invalid dictionary version format/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 10: Dictionary Version Monotonicity
  // Validates: Requirement 3.2
  describe('Property 10: Dictionary Version Monotonicity', () => {
    it('should increment version monotonically', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2029 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (year, n, incrementCount) => {
            const initialVersion = `${year}.${n}`;
            let dictionary = SkillDictionary.create(initialVersion);
            
            const versions: string[] = [dictionary.getVersion()];
            
            // Perform multiple increments
            for (let i = 0; i < incrementCount; i++) {
              dictionary = dictionary.withIncrementedVersion();
              versions.push(dictionary.getVersion());
            }
            
            // Verify versions are monotonically increasing
            for (let i = 1; i < versions.length; i++) {
              const [prevYear, prevN] = versions[i - 1].split('.').map(Number);
              const [currYear, currN] = versions[i].split('.').map(Number);
              
              // Either year increased, or same year with N increased
              const isMonotonic = currYear > prevYear || (currYear === prevYear && currN > prevN);
              expect(isMonotonic).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 13: Skill Mapping Determinism
  // Validates: Requirement 4.7
  describe('Property 13: Skill Mapping Determinism', () => {
    it('should always return the same canonical skill for a given name', () => {
      fc.assert(
        fc.property(
          arbitraryDictionaryVersion(),
          fc.array(
            fc.record({
              canonical: arbitrarySkillName(),
              category: arbitraryTechLayer(),
              variations: fc.array(arbitrarySkillName(), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 2, max: 10 }),
          (version, skillsData, lookupCount) => {
            const dictionary = SkillDictionary.create(version);
            
            // Add skills and variations
            for (const { canonical, category, variations } of skillsData) {
              try {
                dictionary.addCanonicalSkill(canonical, category);
                
                for (const variation of variations) {
                  try {
                    dictionary.addSkillVariation(variation, canonical);
                  } catch (e) {
                    // Skip conflicts
                  }
                }
              } catch (e) {
                // Skip duplicates
                continue;
              }
            }
            
            // Test determinism: multiple lookups should return same result
            const allSkills = dictionary.getAllSkills();
            for (const skill of allSkills) {
              const results: (string | null)[] = [];
              
              for (let i = 0; i < lookupCount; i++) {
                results.push(dictionary.mapToCanonical(skill.name));
              }
              
              // All results should be identical
              const firstResult = results[0];
              for (const result of results) {
                expect(result).toBe(firstResult);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
