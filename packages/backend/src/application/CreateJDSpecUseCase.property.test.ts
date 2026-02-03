/**
 * Property-based tests for CreateJDSpecUseCase
 * 
 * Tests universal correctness properties using fast-check library.
 * Each property is tested with 100+ iterations to ensure robustness.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { CreateJDSpecUseCase, CreateJDSpecInput } from './CreateJDSpecUseCase';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { SkillDictionary } from '../domain/SkillDictionary';
import { SkillReviewQueue } from '../domain/SkillReviewQueue';
import { IJDSpecRepository } from './IJDSpecRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { ISkillReviewQueueRepository } from './ISkillReviewQueueRepository';

// ============================================================================
// Mock Repositories
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
}

class MockSkillDictionaryRepository implements ISkillDictionaryRepository {
  private dictionary: SkillDictionary;

  constructor(dictionary: SkillDictionary) {
    this.dictionary = dictionary;
  }

  async save(dictionary: SkillDictionary): Promise<void> {
    this.dictionary = dictionary;
  }

  async getCurrent(): Promise<SkillDictionary> {
    return this.dictionary;
  }

  async getVersion(version: string): Promise<SkillDictionary | null> {
    return this.dictionary.getVersion() === version ? this.dictionary : null;
  }

  async getAllVersions(): Promise<SkillDictionary[]> {
    return [this.dictionary];
  }
}

class MockSkillReviewQueueRepository implements ISkillReviewQueueRepository {
  private queue: SkillReviewQueue = SkillReviewQueue.create();

  async save(queue: SkillReviewQueue): Promise<void> {
    this.queue = queue;
  }

  async get(): Promise<SkillReviewQueue> {
    return this.queue;
  }

  getQueue(): SkillReviewQueue {
    return this.queue;
  }
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const knownSkillArb = fc.constantFrom(
  'react',
  'nodejs',
  'postgresql',
  'aws',
  'docker',
  'typescript'
);

const unknownSkillArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => s.trim().length > 0)
  .map(s => `unknown_${s}`);

// ============================================================================
// Property Tests
// ============================================================================

describe('CreateJDSpecUseCase - Property Tests', () => {
  
  /**
   * Property 14: Unknown Skill Detection
   * 
   * For any skill name that does not exist in the dictionary (neither as canonical 
   * nor variation), the system must flag it as unknown and add it to the review queue.
   * 
   * Validates: Requirement 4.8
   */
  describe('Property 14: Unknown Skill Detection', () => {
    it('should detect and queue all unknown skills', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(unknownSkillArb, { minLength: 1, maxLength: 10 }),
          async (unknownSkills) => {
            // Setup: Create dictionary with known skills only
            const dictionary = SkillDictionary.create('2024.1');
            dictionary.addCanonicalSkill('react', 'frontend');
            dictionary.addCanonicalSkill('nodejs', 'backend');
            dictionary.addCanonicalSkill('postgresql', 'database');
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            // Create input with unknown skills
            const input: CreateJDSpecInput = {
              role: 'Test Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: unknownSkills.slice(0, 3).length > 0 
                  ? unknownSkills.slice(0, 3).map((s, i, arr) => ({ 
                      skill: s, 
                      weight: i === arr.length - 1 ? 1 - (arr.length - 1) / arr.length : 1 / arr.length 
                    }))
                  : [],
                backend: unknownSkills.slice(3, 6).length > 0
                  ? unknownSkills.slice(3, 6).map((s, i, arr) => ({ 
                      skill: s, 
                      weight: i === arr.length - 1 ? 1 - (arr.length - 1) / arr.length : 1 / arr.length 
                    }))
                  : [],
                database: [],
                cloud: [],
                devops: [],
                others: []
              }
            };
            
            // Execute
            const result = await useCase.execute(input);
            
            // Verify: All unknown skills should be detected
            const uniqueUnknownSkills = [...new Set(unknownSkills.slice(0, 6).map(s => s.toLowerCase()))];
            expect(result.unknownSkills.length).toBe(uniqueUnknownSkills.length);
            
            // Verify: All unknown skills should be in the queue
            const queue = await queueRepo.get();
            
            for (const unknownSkill of uniqueUnknownSkills) {
              const normalized = unknownSkill.toLowerCase();
              expect(queue.hasSkill(normalized)).toBe(true);
              
              const item = queue.getItemByName(normalized);
              expect(item).not.toBeNull();
              expect(item!.status).toBe('pending');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not queue known skills', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(knownSkillArb, { minLength: 1, maxLength: 5 }),
          async (knownSkills) => {
            // Setup: Create dictionary with these skills
            const dictionary = SkillDictionary.create('2024.1');
            for (const skill of ['react', 'nodejs', 'postgresql', 'aws', 'docker', 'typescript']) {
              dictionary.addCanonicalSkill(skill, 'frontend');
            }
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            // Create input with known skills only
            const input: CreateJDSpecInput = {
              role: 'Test Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: knownSkills.map((s, i, arr) => ({ 
                  skill: s, 
                  weight: i === arr.length - 1 ? 1 - (arr.length - 1) / arr.length : 1 / arr.length 
                })),
                backend: [],
                database: [],
                cloud: [],
                devops: [],
                others: []
              }
            };
            
            // Execute
            const result = await useCase.execute(input);
            
            // Verify: No unknown skills should be detected
            expect(result.unknownSkills.length).toBe(0);
            
            // Verify: Queue should be empty
            const queue = await queueRepo.get();
            const queueItems = queue.getQueueItems();
            expect(queueItems.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed known and unknown skills', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(knownSkillArb, { minLength: 1, maxLength: 3 }),
          fc.array(unknownSkillArb, { minLength: 1, maxLength: 3 }),
          async (knownSkills, unknownSkills) => {
            // Setup
            const dictionary = SkillDictionary.create('2024.1');
            for (const skill of ['react', 'nodejs', 'postgresql', 'aws', 'docker', 'typescript']) {
              dictionary.addCanonicalSkill(skill, 'frontend');
            }
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            // Mix known and unknown skills
            const allSkills = [...knownSkills, ...unknownSkills];
            const input: CreateJDSpecInput = {
              role: 'Test Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: allSkills.map((s, i, arr) => ({ 
                  skill: s, 
                  weight: i === arr.length - 1 ? 1 - (arr.length - 1) / arr.length : 1 / arr.length 
                })),
                backend: [],
                database: [],
                cloud: [],
                devops: [],
                others: []
              }
            };
            
            // Execute
            const result = await useCase.execute(input);
            
            // Verify: Only unknown skills should be detected
            const uniqueUnknownSkills = [...new Set(unknownSkills.map(s => s.toLowerCase()))];
            expect(result.unknownSkills.length).toBe(uniqueUnknownSkills.length);
            
            // Verify: Only unknown skills should be in queue
            const queue = await queueRepo.get();
            for (const unknownSkill of uniqueUnknownSkills) {
              expect(queue.hasSkill(unknownSkill.toLowerCase())).toBe(true);
            }
            
            for (const knownSkill of knownSkills) {
              // Known skills might be in queue if they were added as unknown before
              // but they shouldn't be added by this execution
              const item = queue.getItemByName(knownSkill.toLowerCase());
              if (item) {
                // If it exists, it should have been there before (frequency would be > 1)
                // But in our test, it shouldn't exist
                expect(item).toBeNull();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: JD Specification Input Validation
   * 
   * For any JD specification provided by the user, the input must pass structural 
   * validation (all layers present, weights sum to 1.0) before being persisted.
   * 
   * Validates: Requirement 4.10
   */
  describe('Property 15: JD Specification Input Validation', () => {
    it('should validate that all layers are present in layerWeights', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      // Missing 'others' layer
      const invalidInput: any = {
        role: 'Test Role',
        layerWeights: {
          frontend: 0.2, backend: 0.2, database: 0.2,
          cloud: 0.2, devops: 0.2
          // missing 'others'
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await expect(useCase.execute(invalidInput)).rejects.toThrow('Missing layer');
    });

    it('should validate that layer weights sum to 1.0', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      // Weights don't sum to 1.0
      const invalidInput: CreateJDSpecInput = {
        role: 'Test Role',
        layerWeights: {
          frontend: 0.5, backend: 0.2, database: 0.1,
          cloud: 0.1, devops: 0.05, others: 0.05
          // sum = 1.0 but let's make it invalid
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      // Modify to make sum != 1.0
      invalidInput.layerWeights.frontend = 0.6;
      
      await expect(useCase.execute(invalidInput)).rejects.toThrow('must sum to 1.0');
    });

    it('should validate that skill weights within each layer sum to 1.0', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('vue', 'frontend');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      // Skill weights don't sum to 1.0
      const invalidInput: CreateJDSpecInput = {
        role: 'Test Role',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.4 },
            { skill: 'vue', weight: 0.4 }
            // sum = 0.8, not 1.0
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await expect(useCase.execute(invalidInput)).rejects.toThrow('must sum to 1.0');
    });
  });

  /**
   * Property 11: JD Normalization Version Tracking
   * 
   * For any JD specification created through normalization, the dictionary version 
   * used during normalization must be recorded and retrievable.
   * 
   * Validates: Requirements 3.3, 3.6
   */
  describe('Property 11: JD Normalization Version Tracking', () => {
    it('should record the dictionary version used during creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('2024.1', '2024.2', '2025.1'),
          async (version) => {
            // Setup dictionary with specific version
            const dictionary = SkillDictionary.create(version);
            dictionary.addCanonicalSkill('react', 'frontend');
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            const input: CreateJDSpecInput = {
              role: 'Test Role',
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
              }
            };
            
            // Execute
            const result = await useCase.execute(input);
            
            // Verify: JD spec should have the dictionary version
            expect(result.jdSpec.getDictionaryVersion()).toBe(version);
            
            // Verify: Persisted spec should also have the version
            const saved = await jdSpecRepo.findById(result.jdSpec.getId());
            expect(saved).not.toBeNull();
            expect(saved!.getDictionaryVersion()).toBe(version);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 30: Weight Validation During Normalization
   * 
   * For any JD normalization attempt, if the layer weights or skill weights do not 
   * sum to 1.0 (±0.001 tolerance), the normalization must be rejected with a validation error.
   * 
   * Validates: Requirement 8.6
   */
  describe('Property 30: Weight Validation During Normalization', () => {
    it('should reject JD specs where layer weights do not sum to 1.0', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          async (deviation) => {
            const dictionary = SkillDictionary.create('2024.1');
            dictionary.addCanonicalSkill('react', 'frontend');
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            // Create weights that don't sum to 1.0
            const input: CreateJDSpecInput = {
              role: 'Test Role',
              layerWeights: {
                frontend: 0.2 + deviation,
                backend: 0.2,
                database: 0.2,
                cloud: 0.2,
                devops: 0.1,
                others: 0.1
              },
              skills: {
                frontend: [{ skill: 'react', weight: 1.0 }],
                backend: [],
                database: [],
                cloud: [],
                devops: [],
                others: []
              }
            };
            
            // Should reject
            await expect(useCase.execute(input)).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 49, 50, 51: Skill Name Validation
   * 
   * - Property 49: Empty skill names must be rejected
   * - Property 50: Skill names longer than 100 characters must be rejected
   * - Property 51: Skill names with whitespace must be normalized
   * 
   * Validates: Requirements 12.6, 12.7, 12.8
   */
  describe('Property 49, 50, 51: Skill Name Validation', () => {
    it('should reject empty or whitespace-only skill names', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const invalidInputs = [
        { skill: '', weight: 1.0 },
        { skill: '   ', weight: 1.0 },
        { skill: '\t\n', weight: 1.0 }
      ];
      
      for (const invalidSkill of invalidInputs) {
        const input: CreateJDSpecInput = {
          role: 'Test Role',
          layerWeights: {
            frontend: 1/6, backend: 1/6, database: 1/6,
            cloud: 1/6, devops: 1/6, others: 1/6
          },
          skills: {
            frontend: [invalidSkill],
            backend: [],
            database: [],
            cloud: [],
            devops: [],
            others: []
          }
        };
        
        await expect(useCase.execute(input)).rejects.toThrow('empty');
      }
    });

    it('should reject skill names longer than 100 characters', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const longSkillName = 'a'.repeat(101);
      
      const input: CreateJDSpecInput = {
        role: 'Test Role',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: longSkillName, weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await expect(useCase.execute(input)).rejects.toThrow('too long');
    });

    it('should normalize skill names by trimming whitespace', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          async (skillName) => {
            const dictionary = SkillDictionary.create('2024.1');
            
            const jdSpecRepo = new MockJDSpecRepository();
            const dictRepo = new MockSkillDictionaryRepository(dictionary);
            const queueRepo = new MockSkillReviewQueueRepository();
            
            const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
            
            // Add whitespace around skill name
            const skillWithWhitespace = `  ${skillName}  `;
            
            const input: CreateJDSpecInput = {
              role: 'Test Role',
              layerWeights: {
                frontend: 1/6, backend: 1/6, database: 1/6,
                cloud: 1/6, devops: 1/6, others: 1/6
              },
              skills: {
                frontend: [{ skill: skillWithWhitespace, weight: 1.0 }],
                backend: [],
                database: [],
                cloud: [],
                devops: [],
                others: []
              }
            };
            
            // Execute
            const result = await useCase.execute(input);
            
            // Verify: Skill should be normalized (trimmed and lowercased)
            const frontendSkills = result.jdSpec.getSkillsForLayer('frontend');
            expect(frontendSkills.length).toBe(1);
            expect(frontendSkills[0].skill).toBe(skillName.toLowerCase().trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
