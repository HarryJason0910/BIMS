/**
 * Unit tests for CreateJDSpecUseCase
 * 
 * Tests specific examples and edge cases for the CreateJDSpecUseCase.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 4.8, 4.9, 4.10, 12.1-12.11
 */

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
// Unit Tests
// ============================================================================

describe('CreateJDSpecUseCase - Unit Tests', () => {
  
  describe('Successful creation flow', () => {
    it('should create a JD spec with all known skills', async () => {
      // Setup
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      dictionary.addCanonicalSkill('postgresql', 'database');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.3,
          backend: 0.3,
          database: 0.2,
          cloud: 0.1,
          devops: 0.05,
          others: 0.05
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify
      expect(result.jdSpec).toBeDefined();
      expect(result.jdSpec.getRole()).toBe('Full Stack Developer');
      expect(result.jdSpec.getDictionaryVersion()).toBe('2024.1');
      expect(result.unknownSkills).toEqual([]);
      
      // Verify skills are mapped correctly
      const frontendSkills = result.jdSpec.getSkillsForLayer('frontend');
      expect(frontendSkills).toHaveLength(1);
      expect(frontendSkills[0].skill).toBe('react');
      
      // Verify it was saved
      const saved = await jdSpecRepo.findById(result.jdSpec.getId());
      expect(saved).not.toBeNull();
    });

    it('should handle skill variations correctly', async () => {
      // Setup
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [
            { skill: 'ReactJS', weight: 0.5 },  // Variation with different case
            { skill: 'React.js', weight: 0.5 }  // Another variation
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Both variations should map to 'react'
      const frontendSkills = result.jdSpec.getSkillsForLayer('frontend');
      expect(frontendSkills).toHaveLength(2);
      expect(frontendSkills[0].skill).toBe('react');
      expect(frontendSkills[1].skill).toBe('react');
      expect(result.unknownSkills).toEqual([]);
    });
  });

  describe('Unknown skill queueing', () => {
    it('should queue unknown skills for review', async () => {
      // Setup
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.5 },
            { skill: 'svelte', weight: 0.5 }  // Unknown skill
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      // Execute
      const result = await useCase.execute(input);
      
      // Verify: Unknown skill should be in the result
      expect(result.unknownSkills).toContain('svelte');
      
      // Verify: Unknown skill should be in the queue
      const queue = await queueRepo.get();
      expect(queue.hasSkill('svelte')).toBe(true);
      
      const item = queue.getItemByName('svelte');
      expect(item).not.toBeNull();
      expect(item!.frequency).toBe(1);
      expect(item!.status).toBe('pending');
      expect(item!.detectedIn).toContain(result.jdSpec.getId());
    });

    it('should increment frequency for duplicate unknown skills', async () => {
      // Setup
      const dictionary = SkillDictionary.create('2024.1');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      // First JD with unknown skill
      const input1: CreateJDSpecInput = {
        role: 'Developer 1',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'svelte', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await useCase.execute(input1);
      
      // Second JD with same unknown skill
      const input2: CreateJDSpecInput = {
        role: 'Developer 2',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: 'svelte', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await useCase.execute(input2);
      
      // Verify: Frequency should be 2
      const queue = await queueRepo.get();
      const item = queue.getItemByName('svelte');
      expect(item).not.toBeNull();
      expect(item!.frequency).toBe(2);
      expect(item!.detectedIn).toHaveLength(2);
    });
  });

  describe('Validation failures', () => {
    it('should reject empty skill names', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Developer',
        layerWeights: {
          frontend: 1/6, backend: 1/6, database: 1/6,
          cloud: 1/6, devops: 1/6, others: 1/6
        },
        skills: {
          frontend: [{ skill: '', weight: 1.0 }],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        }
      };
      
      await expect(useCase.execute(input)).rejects.toThrow('empty');
    });

    it('should reject skill names that are too long', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const longSkillName = 'a'.repeat(101);
      
      const input: CreateJDSpecInput = {
        role: 'Developer',
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

    it('should reject invalid layer weights', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const jdSpecRepo = new MockJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.2,
          database: 0.1,
          cloud: 0.1,
          devops: 0.05,
          others: 0.05
          // sum = 1.0, but let's make it invalid
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
      
      // Make sum != 1.0
      input.layerWeights.frontend = 0.6;
      
      await expect(useCase.execute(input)).rejects.toThrow('must sum to 1.0');
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      
      // Create a failing repository
      class FailingJDSpecRepository implements IJDSpecRepository {
        async save(): Promise<void> {
          throw new Error('Database connection failed');
        }
        async findById(): Promise<CanonicalJDSpec | null> { return null; }
        async findAll(): Promise<CanonicalJDSpec[]> { return []; }
        async update(): Promise<void> {}
        async delete(): Promise<void> {}
      }
      
      const jdSpecRepo = new FailingJDSpecRepository();
      const dictRepo = new MockSkillDictionaryRepository(dictionary);
      const queueRepo = new MockSkillReviewQueueRepository();
      
      const useCase = new CreateJDSpecUseCase(jdSpecRepo, dictRepo, queueRepo);
      
      const input: CreateJDSpecInput = {
        role: 'Developer',
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
      
      await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
    });
  });
});
