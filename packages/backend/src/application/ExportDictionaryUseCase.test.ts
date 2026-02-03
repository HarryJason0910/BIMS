/**
 * ExportDictionaryUseCase Unit Tests
 * 
 * Tests for exporting skill dictionary to JSON format.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 10.1, 10.2
 */

import { ExportDictionaryUseCase } from './ExportDictionaryUseCase';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { SkillDictionary } from '../domain/SkillDictionary';

describe('ExportDictionaryUseCase', () => {
  let useCase: ExportDictionaryUseCase;
  let mockRepository: jest.Mocked<ISkillDictionaryRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getCurrent: jest.fn(),
      getVersion: jest.fn(),
      getAllVersions: jest.fn()
    };

    useCase = new ExportDictionaryUseCase(mockRepository);
  });

  describe('successful export', () => {
    it('should export current dictionary with all metadata', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      dictionary.addSkillVariation('reactjs', 'react');
      
      mockRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.version).toBe('2024.1');
      expect(response.data.skills).toHaveLength(2);
      expect(response.data.variations).toHaveLength(1);
      expect(response.data.createdAt).toBeDefined();
      expect(response.message).toContain('Successfully exported');
      expect(response.message).toContain('2 skills');
      expect(response.message).toContain('1 variations');
    });

    it('should export specific version when requested', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2023.5');
      dictionary.addCanonicalSkill('python', 'backend');
      
      mockRepository.getVersion.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({ version: '2023.5' });

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.version).toBe('2023.5');
      expect(mockRepository.getVersion).toHaveBeenCalledWith('2023.5');
      expect(mockRepository.getCurrent).not.toHaveBeenCalled();
    });

    it('should include all skill metadata in export', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('typescript', 'backend');
      
      mockRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.skills[0]).toHaveProperty('name');
      expect(response.data.skills[0]).toHaveProperty('category');
      expect(response.data.skills[0]).toHaveProperty('createdAt');
      expect(response.data.skills[0].name).toBe('typescript');
      expect(response.data.skills[0].category).toBe('backend');
    });

    it('should include all variation mappings in export', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('javascript', 'frontend');
      dictionary.addSkillVariation('js', 'javascript');
      dictionary.addSkillVariation('ecmascript', 'javascript');
      
      mockRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.variations).toHaveLength(2);
      expect(response.data.variations).toContainEqual({
        variation: 'js',
        canonical: 'javascript'
      });
      expect(response.data.variations).toContainEqual({
        variation: 'ecmascript',
        canonical: 'javascript'
      });
    });
  });

  describe('error handling', () => {
    it('should return error when current dictionary not found', async () => {
      // Arrange
      mockRepository.getCurrent.mockResolvedValue(null as any);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('No dictionary found');
    });

    it('should return error when specific version not found', async () => {
      // Arrange
      mockRepository.getVersion.mockResolvedValue(null);

      // Act
      const response = await useCase.execute({ version: '2023.1' });

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain("Dictionary version '2023.1' not found");
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.getCurrent.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Database connection failed');
    });
  });
});
