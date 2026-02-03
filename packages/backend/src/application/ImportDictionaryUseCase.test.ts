/**
 * ImportDictionaryUseCase Unit Tests
 * 
 * Tests for importing skill dictionary from JSON format with validation,
 * version conflict checking, and merge mode support.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 10.3, 10.4, 10.5, 10.6
 */

import { ImportDictionaryUseCase } from './ImportDictionaryUseCase';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { SkillDictionary } from '../domain/SkillDictionary';
import { SkillDictionaryJSON } from '../domain/JDSpecTypes';

describe('ImportDictionaryUseCase', () => {
  let useCase: ImportDictionaryUseCase;
  let mockRepository: jest.Mocked<ISkillDictionaryRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getCurrent: jest.fn(),
      getVersion: jest.fn(),
      getAllVersions: jest.fn()
    };

    useCase = new ImportDictionaryUseCase(mockRepository);
  });

  const createValidJSON = (version: string = '2024.1'): SkillDictionaryJSON => ({
    version,
    skills: [
      { name: 'react', category: 'frontend', createdAt: new Date().toISOString() },
      { name: 'nodejs', category: 'backend', createdAt: new Date().toISOString() }
    ],
    variations: [
      { variation: 'reactjs', canonical: 'react' }
    ],
    createdAt: new Date().toISOString()
  });

  describe('successful import - replace mode', () => {
    it('should import dictionary in replace mode', async () => {
      // Arrange
      const data = createValidJSON('2024.2');
      mockRepository.getCurrent.mockResolvedValue(SkillDictionary.create('2024.1'));

      // Act
      const response = await useCase.execute({
        data,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.2');
      expect(response.message).toContain('Successfully imported');
      expect(response.message).toContain('replace mode');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should import when no current dictionary exists', async () => {
      // Arrange
      const data = createValidJSON('2024.1');
      mockRepository.getCurrent.mockRejectedValue(new Error('No dictionary found'));

      // Act
      const response = await useCase.execute({
        data,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.1');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('successful import - merge mode', () => {
    it('should merge dictionaries and increment version', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.1');
      currentDict.addCanonicalSkill('python', 'backend');
      
      const importData = createValidJSON('2024.2');
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'merge'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.2'); // Version incremented
      expect(response.conflictsResolved).toBeDefined();
      expect(response.message).toContain('Successfully merged');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should add new skills from imported dictionary', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.1');
      currentDict.addCanonicalSkill('python', 'backend');
      
      const importData: SkillDictionaryJSON = {
        version: '2024.2',
        skills: [
          { name: 'react', category: 'frontend', createdAt: new Date().toISOString() },
          { name: 'vue', category: 'frontend', createdAt: new Date().toISOString() }
        ],
        variations: [],
        createdAt: new Date().toISOString()
      };
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'merge'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify the saved dictionary has all skills
      const savedDict = mockRepository.save.mock.calls[0][0];
      expect(savedDict.hasSkill('python')).toBe(true);
      expect(savedDict.hasSkill('react')).toBe(true);
      expect(savedDict.hasSkill('vue')).toBe(true);
    });

    it('should resolve conflicts by keeping imported version', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.1');
      currentDict.addCanonicalSkill('react', 'frontend');
      
      const importData: SkillDictionaryJSON = {
        version: '2024.2',
        skills: [
          { name: 'react', category: 'backend', createdAt: new Date().toISOString() } // Different category
        ],
        variations: [],
        createdAt: new Date().toISOString()
      };
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'merge'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.conflictsResolved).toBeGreaterThan(0);
      
      // Verify the saved dictionary has the imported version
      const savedDict = mockRepository.save.mock.calls[0][0];
      const reactSkill = savedDict.getCanonicalSkill('react');
      expect(reactSkill?.category).toBe('backend');
    });

    it('should handle merge when no current dictionary exists', async () => {
      // Arrange
      const importData = createValidJSON('2024.1');
      mockRepository.getCurrent.mockRejectedValue(new Error('No dictionary found'));

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'merge'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.1');
      expect(response.conflictsResolved).toBe(0);
      expect(response.message).toContain('no existing dictionary to merge');
    });
  });

  describe('version conflict checking', () => {
    it('should reject import of older version', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.5');
      const importData = createValidJSON('2024.3'); // Older version
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Version conflict');
      expect(response.message).toContain('Cannot import version 2024.3');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject import of same version', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.5');
      const importData = createValidJSON('2024.5'); // Same version
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Version conflict');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should allow import of older version with allowVersionDowngrade flag', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2024.5');
      const importData = createValidJSON('2024.3');
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'replace',
        allowVersionDowngrade: true
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.3');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should allow import of newer version from previous year', async () => {
      // Arrange
      const currentDict = SkillDictionary.create('2023.10');
      const importData = createValidJSON('2024.1'); // New year
      
      mockRepository.getCurrent.mockResolvedValue(currentDict);

      // Act
      const response = await useCase.execute({
        data: importData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.importedVersion).toBe('2024.1');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('JSON validation', () => {
    it('should reject import with missing version', async () => {
      // Arrange
      const invalidData = {
        skills: [],
        variations: [],
        createdAt: new Date().toISOString()
      } as any;

      // Act
      const response = await useCase.execute({
        data: invalidData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid dictionary JSON');
      expect(response.message).toContain('Missing required field: version');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject import with invalid skills array', async () => {
      // Arrange
      const invalidData = {
        version: '2024.1',
        skills: 'not an array',
        variations: [],
        createdAt: new Date().toISOString()
      } as any;

      // Act
      const response = await useCase.execute({
        data: invalidData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid dictionary JSON');
      expect(response.message).toContain('skills');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject import with invalid skill structure', async () => {
      // Arrange
      const invalidData: SkillDictionaryJSON = {
        version: '2024.1',
        skills: [
          { name: 'react', category: 'frontend' } as any // Missing createdAt
        ],
        variations: [],
        createdAt: new Date().toISOString()
      };

      // Act
      const response = await useCase.execute({
        data: invalidData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid skill structure');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject import with invalid variation structure', async () => {
      // Arrange
      const invalidData: SkillDictionaryJSON = {
        version: '2024.1',
        skills: [],
        variations: [
          { variation: 'reactjs' } as any // Missing canonical
        ],
        createdAt: new Date().toISOString()
      };

      // Act
      const response = await useCase.execute({
        data: invalidData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid variation structure');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const data = createValidJSON('2024.1');
      mockRepository.getCurrent.mockResolvedValue(SkillDictionary.create('2024.1'));
      mockRepository.save.mockRejectedValue(new Error('Database write failed'));

      // Act
      const response = await useCase.execute({
        data,
        mode: 'replace',
        allowVersionDowngrade: true
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Database write failed');
    });

    it('should handle invalid version format in imported data', async () => {
      // Arrange
      const invalidData = createValidJSON('invalid-version');

      // Act
      const response = await useCase.execute({
        data: invalidData,
        mode: 'replace'
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid dictionary version format');
    });
  });
});
