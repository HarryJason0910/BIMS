/**
 * SkillUsageStatisticsUseCase Unit Tests
 * 
 * Tests for tracking and analyzing skill usage across JDs and resumes.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { SkillUsageStatisticsUseCase } from './SkillUsageStatisticsUseCase';
import { IJDSpecRepository } from './IJDSpecRepository';
import { IResumeRepository } from './IResumeRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { SkillDictionary } from '../domain/SkillDictionary';
import { ResumeMetadata } from '../domain/ResumeMetadata';
import { TechStackValue } from '../domain/TechStackValue';

describe('SkillUsageStatisticsUseCase', () => {
  let useCase: SkillUsageStatisticsUseCase;
  let mockJDSpecRepository: jest.Mocked<IJDSpecRepository>;
  let mockResumeRepository: jest.Mocked<IResumeRepository>;
  let mockDictionaryRepository: jest.Mocked<ISkillDictionaryRepository>;

  beforeEach(() => {
    mockJDSpecRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockResumeRepository = {
      getAllResumeMetadata: jest.fn(),
      getResumeFile: jest.fn(),
      fileExists: jest.fn()
    };

    mockDictionaryRepository = {
      save: jest.fn(),
      getCurrent: jest.fn(),
      getVersion: jest.fn(),
      getAllVersions: jest.fn()
    };

    useCase = new SkillUsageStatisticsUseCase(
      mockJDSpecRepository,
      mockResumeRepository,
      mockDictionaryRepository
    );
  });

  describe('statistics calculation', () => {
    it('should calculate skill usage from JD specifications', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      
      const jdSpec1 = CanonicalJDSpec.create({
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 0.8,
          backend: 0.2,
          database: 0,
          cloud: 0,
          devops: 0,
          others: 0
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
      
      const jdSpec2 = CanonicalJDSpec.create({
        role: 'Full Stack Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.5,
          database: 0,
          cloud: 0,
          devops: 0,
          others: 0
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
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec1, jdSpec2]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(2);
      
      const reactStat = response.statistics.find(s => s.skillName === 'react');
      expect(reactStat).toBeDefined();
      expect(reactStat!.jdCount).toBe(2);
      expect(reactStat!.resumeCount).toBe(0);
      expect(reactStat!.totalUsage).toBe(2);
      
      const nodejsStat = response.statistics.find(s => s.skillName === 'nodejs');
      expect(nodejsStat).toBeDefined();
      expect(nodejsStat!.jdCount).toBe(1);
      expect(nodejsStat!.resumeCount).toBe(0);
      expect(nodejsStat!.totalUsage).toBe(1);
    });

    it('should calculate skill usage from resumes', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('python', 'backend');
      dictionary.addCanonicalSkill('django', 'backend');
      
      const resume1 = new ResumeMetadata(
        'resume1',
        'TechCorp',
        'Backend Developer',
        new TechStackValue(['python', 'django']),
        '/path/to/resume1.pdf',
        new Date('2024-01-01')
      );
      
      const resume2 = new ResumeMetadata(
        'resume2',
        'StartupCo',
        'Python Developer',
        new TechStackValue(['python']),
        '/path/to/resume2.pdf',
        new Date('2024-01-15')
      );
      
      mockJDSpecRepository.findAll.mockResolvedValue([]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume1, resume2]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(2);
      
      const pythonStat = response.statistics.find(s => s.skillName === 'python');
      expect(pythonStat).toBeDefined();
      expect(pythonStat!.jdCount).toBe(0);
      expect(pythonStat!.resumeCount).toBe(2);
      expect(pythonStat!.totalUsage).toBe(2);
      
      const djangoStat = response.statistics.find(s => s.skillName === 'django');
      expect(djangoStat).toBeDefined();
      expect(djangoStat!.jdCount).toBe(0);
      expect(djangoStat!.resumeCount).toBe(1);
      expect(djangoStat!.totalUsage).toBe(1);
    });

    it('should combine JD and resume usage counts', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('typescript', 'backend');
      
      const jdSpec = CanonicalJDSpec.create({
        role: 'TypeScript Developer',
        layerWeights: {
          frontend: 0,
          backend: 1.0,
          database: 0,
          cloud: 0,
          devops: 0,
          others: 0
        },
        skills: {
          frontend: [],
          backend: [{ skill: 'typescript', weight: 1.0 }],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const resume = new ResumeMetadata(
        'resume1',
        'TechCorp',
        'TypeScript Developer',
        new TechStackValue(['typescript']),
        '/path/to/resume.pdf',
        new Date()
      );
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(1);
      
      const typescriptStat = response.statistics[0];
      expect(typescriptStat.skillName).toBe('typescript');
      expect(typescriptStat.jdCount).toBe(1);
      expect(typescriptStat.resumeCount).toBe(1);
      expect(typescriptStat.totalUsage).toBe(2);
    });
  });

  describe('sorting', () => {
    it('should sort by frequency in descending order by default', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('vue', 'frontend');
      dictionary.addCanonicalSkill('angular', 'frontend');
      
      const jdSpec1 = CanonicalJDSpec.create({
        role: 'Frontend Developer',
        layerWeights: { frontend: 1.0, backend: 0, database: 0, cloud: 0, devops: 0, others: 0 },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.5 },
            { skill: 'vue', weight: 0.3 },
            { skill: 'angular', weight: 0.2 }
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      const jdSpec2 = CanonicalJDSpec.create({
        role: 'React Developer',
        layerWeights: { frontend: 1.0, backend: 0, database: 0, cloud: 0, devops: 0, others: 0 },
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
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec1, jdSpec2]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(3);
      expect(response.statistics[0].skillName).toBe('react'); // Most frequent (2 uses)
      expect(response.statistics[1].skillName).toBe('vue'); // Second (1 use)
      expect(response.statistics[2].skillName).toBe('angular'); // Third (1 use)
    });

    it('should sort by name in ascending order when requested', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('angular', 'frontend');
      dictionary.addCanonicalSkill('vue', 'frontend');
      
      const jdSpec = CanonicalJDSpec.create({
        role: 'Frontend Developer',
        layerWeights: { frontend: 1.0, backend: 0, database: 0, cloud: 0, devops: 0, others: 0 },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.4 },
            { skill: 'angular', weight: 0.3 },
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
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(3);
      expect(response.statistics[0].skillName).toBe('angular');
      expect(response.statistics[1].skillName).toBe('react');
      expect(response.statistics[2].skillName).toBe('vue');
    });
  });

  describe('date range filtering', () => {
    it('should filter by date range', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('java', 'backend');
      
      // Create JD specs with different dates
      const oldJDSpec = CanonicalJDSpec.create({
        role: 'Java Developer',
        layerWeights: { frontend: 0, backend: 1.0, database: 0, cloud: 0, devops: 0, others: 0 },
        skills: {
          frontend: [],
          backend: [{ skill: 'java', weight: 1.0 }],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      // Mock the getCreatedAt method to return specific dates
      jest.spyOn(oldJDSpec, 'getCreatedAt').mockReturnValue(new Date('2023-12-01'));
      
      const newJDSpec = CanonicalJDSpec.create({
        role: 'Java Developer',
        layerWeights: { frontend: 0, backend: 1.0, database: 0, cloud: 0, devops: 0, others: 0 },
        skills: {
          frontend: [],
          backend: [{ skill: 'java', weight: 1.0 }],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      jest.spyOn(newJDSpec, 'getCreatedAt').mockReturnValue(new Date('2024-01-15'));
      
      mockJDSpecRepository.findAll.mockResolvedValue([oldJDSpec, newJDSpec]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(1);
      expect(response.statistics[0].jdCount).toBe(1); // Only the new JD spec
      expect(response.dateRange.start).toEqual(new Date('2024-01-01'));
      expect(response.dateRange.end).toEqual(new Date('2024-01-31'));
    });
  });

  describe('variation tracking', () => {
    it('should track skill variations', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('javascript', 'frontend');
      dictionary.addSkillVariation('js', 'javascript');
      dictionary.addSkillVariation('ecmascript', 'javascript');
      
      const jdSpec = CanonicalJDSpec.create({
        role: 'JavaScript Developer',
        layerWeights: { frontend: 1.0, backend: 0, database: 0, cloud: 0, devops: 0, others: 0 },
        skills: {
          frontend: [
            { skill: 'javascript', weight: 0.5 },
            { skill: 'js', weight: 0.5 }
          ],
          backend: [],
          database: [],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      });
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(1);
      
      const jsStat = response.statistics[0];
      expect(jsStat.skillName).toBe('javascript');
      expect(jsStat.totalUsage).toBe(2);
      expect(jsStat.variations).toContain('js');
      expect(jsStat.variationUsageCount).toBe(1);
    });
  });

  describe('category filtering', () => {
    it('should filter by skill category', async () => {
      // Arrange
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      
      const jdSpec = CanonicalJDSpec.create({
        role: 'Full Stack Developer',
        layerWeights: { frontend: 0.5, backend: 0.5, database: 0, cloud: 0, devops: 0, others: 0 },
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
      
      mockJDSpecRepository.findAll.mockResolvedValue([jdSpec]);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);
      mockDictionaryRepository.getCurrent.mockResolvedValue(dictionary);

      // Act
      const response = await useCase.execute({
        category: 'frontend'
      });

      // Assert
      expect(response.success).toBe(true);
      expect(response.statistics).toHaveLength(1);
      expect(response.statistics[0].skillName).toBe('react');
      expect(response.statistics[0].category).toBe('frontend');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockJDSpecRepository.findAll.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await useCase.execute({});

      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toContain('Database connection failed');
      expect(response.statistics).toEqual([]);
      expect(response.totalSkills).toBe(0);
    });
  });
});
