/**
 * Unit tests for ManageSkillDictionaryUseCase
 * 
 * Tests CRUD operations on the canonical skills dictionary.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.4, 9.8, 9.9, 9.10, 9.11
 */

import {
  ManageSkillDictionaryUseCase,
  AddCanonicalSkillInput,
  AddSkillVariationInput,
  RemoveCanonicalSkillInput,
  UpdateCanonicalSkillInput,
  GetSkillsByCategoryInput,
  GetVariationsInput
} from './ManageSkillDictionaryUseCase';
import { SkillDictionary } from '../domain/SkillDictionary';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';

// ============================================================================
// Mock Repository
// ============================================================================

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

// ============================================================================
// Unit Tests
// ============================================================================

describe('ManageSkillDictionaryUseCase - Unit Tests', () => {
  const currentYear = new Date().getFullYear();
  
  describe('Add canonical skill operations', () => {
    it('should add a new canonical skill successfully', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: 'React',
        category: 'frontend'
      };

      // Execute
      const result = await useCase.addCanonicalSkill(input);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toContain('react');
      expect(result.dictionaryVersion).toBe(`${currentYear}.2`);

      // Verify skill was added
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.hasSkill('react')).toBe(true);
      const skill = updatedDict.getCanonicalSkill('react');
      expect(skill).not.toBeNull();
      expect(skill!.category).toBe('frontend');
    });

    it('should normalize skill names to lowercase', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: 'TypeScript',
        category: 'frontend'
      };

      // Execute
      await useCase.addCanonicalSkill(input);

      // Verify: Skill should be stored as lowercase
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.hasSkill('typescript')).toBe(true);
      expect(updatedDict.hasSkill('TypeScript')).toBe(true); // Should still find it
    });

    it('should reject empty skill names', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: '   ',
        category: 'frontend'
      };

      // Execute & Verify
      await expect(useCase.addCanonicalSkill(input)).rejects.toThrow('cannot be empty');
    });

    it('should reject skill names longer than 100 characters', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: 'a'.repeat(101),
        category: 'frontend'
      };

      // Execute & Verify
      await expect(useCase.addCanonicalSkill(input)).rejects.toThrow('cannot exceed 100 characters');
    });

    it('should reject duplicate canonical skills', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: 'React',
        category: 'frontend'
      };

      // Execute & Verify
      await expect(useCase.addCanonicalSkill(input)).rejects.toThrow('already exists');
    });
  });

  describe('Add skill variation operations', () => {
    it('should add a skill variation successfully', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddSkillVariationInput = {
        variation: 'ReactJS',
        canonicalName: 'react'
      };

      // Execute
      const result = await useCase.addSkillVariation(input);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toContain('reactjs');
      expect(result.dictionaryVersion).toBe(`${currentYear}.2`);

      // Verify variation was added
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.mapToCanonical('reactjs')).toBe('react');
    });

    it('should reject variation for non-existent canonical skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddSkillVariationInput = {
        variation: 'ReactJS',
        canonicalName: 'react'
      };

      // Execute & Verify
      await expect(useCase.addSkillVariation(input)).rejects.toThrow('does not exist');
    });

    it('should reject duplicate variations', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddSkillVariationInput = {
        variation: 'ReactJS',
        canonicalName: 'react'
      };

      // Execute & Verify
      await expect(useCase.addSkillVariation(input)).rejects.toThrow('already');
    });

    it('should reject empty variation names', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddSkillVariationInput = {
        variation: '   ',
        canonicalName: 'react'
      };

      // Execute & Verify
      await expect(useCase.addSkillVariation(input)).rejects.toThrow('cannot be empty');
    });
  });

  describe('Remove canonical skill operations', () => {
    it('should remove a canonical skill successfully', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: RemoveCanonicalSkillInput = {
        name: 'react'
      };

      // Execute
      const result = await useCase.removeCanonicalSkill(input);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toContain('removed');
      expect(result.dictionaryVersion).toBe(`${currentYear}.2`);

      // Verify skill was removed
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.hasSkill('react')).toBe(false);
    });

    it('should remove skill variations when removing canonical skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: RemoveCanonicalSkillInput = {
        name: 'react'
      };

      // Execute
      await useCase.removeCanonicalSkill(input);

      // Verify: Variations should also be removed
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.hasSkill('reactjs')).toBe(false);
      expect(updatedDict.hasSkill('react.js')).toBe(false);
    });

    it('should reject removing non-existent skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: RemoveCanonicalSkillInput = {
        name: 'react'
      };

      // Execute & Verify
      await expect(useCase.removeCanonicalSkill(input)).rejects.toThrow('does not exist');
    });
  });

  describe('Update canonical skill operations', () => {
    it('should update skill name successfully', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: UpdateCanonicalSkillInput = {
        oldName: 'react',
        newName: 'reactjs'
      };

      // Execute
      const result = await useCase.updateCanonicalSkill(input);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toContain('updated');
      expect(result.dictionaryVersion).toBe(`${currentYear}.2`);

      // Verify skill was updated
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.hasSkill('react')).toBe(false);
      expect(updatedDict.hasSkill('reactjs')).toBe(true);
    });

    it('should update skill category successfully', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('typescript', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: UpdateCanonicalSkillInput = {
        oldName: 'typescript',
        newName: 'typescript',
        category: 'backend'
      };

      // Execute
      await useCase.updateCanonicalSkill(input);

      // Verify: Category should be updated
      const updatedDict = await repository.getCurrent();
      const skill = updatedDict.getCanonicalSkill('typescript');
      expect(skill).not.toBeNull();
      expect(skill!.category).toBe('backend');
    });

    it('should preserve variations when updating skill name', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: UpdateCanonicalSkillInput = {
        oldName: 'react',
        newName: 'react-library'
      };

      // Execute
      await useCase.updateCanonicalSkill(input);

      // Verify: Variations should now map to new name
      const updatedDict = await repository.getCurrent();
      expect(updatedDict.mapToCanonical('reactjs')).toBe('react-library');
      expect(updatedDict.mapToCanonical('react.js')).toBe('react-library');
    });

    it('should reject updating to an existing skill name', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('vue', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: UpdateCanonicalSkillInput = {
        oldName: 'react',
        newName: 'vue'
      };

      // Execute & Verify
      await expect(useCase.updateCanonicalSkill(input)).rejects.toThrow('already exists');
    });

    it('should reject updating non-existent skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: UpdateCanonicalSkillInput = {
        oldName: 'react',
        newName: 'reactjs'
      };

      // Execute & Verify
      await expect(useCase.updateCanonicalSkill(input)).rejects.toThrow('does not exist');
    });
  });

  describe('Get skills operations', () => {
    it('should get all canonical skills', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      dictionary.addCanonicalSkill('postgresql', 'database');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      // Execute
      const result = await useCase.getSkills();

      // Verify
      expect(result.skills).toHaveLength(3);
      expect(result.dictionaryVersion).toBe(`${currentYear}.1`);
      expect(result.skills.map(s => s.name)).toContain('react');
      expect(result.skills.map(s => s.name)).toContain('nodejs');
      expect(result.skills.map(s => s.name)).toContain('postgresql');
    });

    it('should get skills by category', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('vue', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: GetSkillsByCategoryInput = {
        category: 'frontend'
      };

      // Execute
      const result = await useCase.getSkillsByCategory(input);

      // Verify
      expect(result.skills).toHaveLength(2);
      expect(result.skills.map(s => s.name)).toContain('react');
      expect(result.skills.map(s => s.name)).toContain('vue');
      expect(result.skills.map(s => s.name)).not.toContain('nodejs');
    });

    it('should return empty array for category with no skills', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: GetSkillsByCategoryInput = {
        category: 'backend'
      };

      // Execute
      const result = await useCase.getSkillsByCategory(input);

      // Verify
      expect(result.skills).toHaveLength(0);
    });
  });

  describe('Get variations operations', () => {
    it('should get all variations for a canonical skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      dictionary.addSkillVariation('react-library', 'react');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: GetVariationsInput = {
        canonicalName: 'react'
      };

      // Execute
      const result = await useCase.getVariations(input);

      // Verify
      expect(result.variations).toHaveLength(3);
      expect(result.variations).toContain('reactjs');
      expect(result.variations).toContain('react.js');
      expect(result.variations).toContain('react-library');
      expect(result.canonicalName).toBe('react');
    });

    it('should return empty array for skill with no variations', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: GetVariationsInput = {
        canonicalName: 'react'
      };

      // Execute
      const result = await useCase.getVariations(input);

      // Verify
      expect(result.variations).toHaveLength(0);
    });

    it('should reject getting variations for non-existent skill', async () => {
      // Setup
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const repository = new MockSkillDictionaryRepository(dictionary);
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: GetVariationsInput = {
        canonicalName: 'react'
      };

      // Execute & Verify
      await expect(useCase.getVariations(input)).rejects.toThrow('does not exist');
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const currentYear = new Date().getFullYear();
      
      // Setup: Create a failing repository
      class FailingRepository implements ISkillDictionaryRepository {
        async save(): Promise<void> {
          throw new Error('Database connection failed');
        }
        async getCurrent(): Promise<SkillDictionary> {
          const dict = SkillDictionary.create(`${currentYear}.1`);
          dict.addCanonicalSkill('react', 'frontend');
          return dict;
        }
        async getVersion(): Promise<SkillDictionary | null> { return null; }
        async getAllVersions(): Promise<SkillDictionary[]> { return []; }
      }

      const repository = new FailingRepository();
      const useCase = new ManageSkillDictionaryUseCase(repository);

      const input: AddCanonicalSkillInput = {
        name: 'vue',
        category: 'frontend'
      };

      // Execute & Verify
      await expect(useCase.addCanonicalSkill(input)).rejects.toThrow('Database connection failed');
    });
  });
});
