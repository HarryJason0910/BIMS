import { GetMatchingResumesUseCase } from './GetMatchingResumesUseCase';
import { IResumeRepository } from './IResumeRepository';
import { StackMatchCalculator } from '../domain/StackMatchCalculator';
import { ResumeMetadata } from '../domain/ResumeMetadata';
import { TechStackValue } from '../domain/TechStackValue';

describe('GetMatchingResumesUseCase', () => {
  let useCase: GetMatchingResumesUseCase;
  let mockResumeRepository: jest.Mocked<IResumeRepository>;
  let calculator: StackMatchCalculator;

  beforeEach(() => {
    // Create mock repository
    mockResumeRepository = {
      getAllResumeMetadata: jest.fn(),
      getResumeFile: jest.fn(),
      fileExists: jest.fn(),
    };

    calculator = new StackMatchCalculator();
    useCase = new GetMatchingResumesUseCase(mockResumeRepository, calculator);
  });

  const createResumeMetadata = (
    id: string,
    company: string,
    role: string,
    techStack: string[],
    createdAt: Date = new Date()
  ): ResumeMetadata => {
    return new ResumeMetadata(
      id,
      company,
      role,
      new TechStackValue(techStack),
      `/uploads/${company}_${role}/resume.pdf`,
      createdAt
    );
  };

  describe('successful resume matching', () => {
    it('should return matching resumes sorted by score', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript', 'AWS'];
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript', 'AWS']), // 100
        createResumeMetadata('2', 'CompanyB', 'Developer', ['React', 'TypeScript']), // 66
        createResumeMetadata('3', 'CompanyC', 'Architect', ['Java', 'Spring']), // 0
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[0].score).toBe(100);
      expect(result[1].id).toBe('2');
      expect(result[1].score).toBeGreaterThanOrEqual(50);
      expect(result[2].id).toBe('3');
      expect(result[2].score).toBe(0);
    });

    it('should return resume metadata with all required fields', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript'];
      const createdDate = new Date('2024-01-15');
      const resume = createResumeMetadata(
        'resume-1',
        'TechCorp',
        'Senior Engineer',
        ['React', 'TypeScript', 'Node.js'],
        createdDate
      );
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'resume-1',
        company: 'TechCorp',
        role: 'Senior Engineer',
        techStack: ['React', 'TypeScript', 'Node.js'],
        score: 100,
        createdAt: createdDate,
        matchedSkills: expect.any(Array),
        missingSkills: expect.any(Array),
      });
    });

    it('should handle exact match (score 100)', async () => {
      // Arrange
      const targetStack = ['React', 'AWS'];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'AWS']);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(100);
    });

    it('should handle superset match (score 100)', async () => {
      // Arrange
      const targetStack = ['React', 'AWS'];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'AWS', 'Lambda', 'DynamoDB']);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(100);
    });

    it('should handle partial match with proportional score', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript', 'AWS', 'Lambda'];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript']); // 2/4 = 50%
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(50);
    });

    it('should handle no match (score 0)', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript'];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['Java', 'Spring']);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(0);
    });
  });

  describe('sorting behavior', () => {
    it('should sort by score descending', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript', 'AWS'];
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React']), // 33
        createResumeMetadata('2', 'CompanyB', 'Developer', ['React', 'TypeScript', 'AWS']), // 100
        createResumeMetadata('3', 'CompanyC', 'Architect', ['React', 'TypeScript']), // 66
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].id).toBe('2'); // 100
      expect(result[1].id).toBe('3'); // 66
      expect(result[2].id).toBe('1'); // 33
    });

    it('should break ties by creation date (most recent first)', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript'];
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-15');
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript'], oldDate), // 100, old
        createResumeMetadata('2', 'CompanyB', 'Developer', ['React', 'TypeScript'], newDate), // 100, new
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].id).toBe('2'); // Most recent
      expect(result[1].id).toBe('1'); // Older
    });
  });

  describe('top 30 limit', () => {
    it('should return only top 30 matches when more than 30 resumes exist', async () => {
      // Arrange
      const targetStack = ['React'];
      const resumes = Array.from({ length: 50 }, (_, i) =>
        createResumeMetadata(`resume-${i}`, `Company${i}`, 'Engineer', ['React'])
      );
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toHaveLength(30);
    });

    it('should return all resumes when fewer than 30 exist', async () => {
      // Arrange
      const targetStack = ['React'];
      const resumes = Array.from({ length: 10 }, (_, i) =>
        createResumeMetadata(`resume-${i}`, `Company${i}`, 'Engineer', ['React'])
      );
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toHaveLength(10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty resume list', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript'];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty target tech stack', async () => {
      // Arrange
      const targetStack: string[] = [];
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript']),
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0); // Empty target stack should score 0
    });

    it('should handle single technology in target stack', async () => {
      // Arrange
      const targetStack = ['React'];
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React']),
        createResumeMetadata('2', 'CompanyB', 'Developer', ['TypeScript']),
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(100);
      expect(result[1].score).toBe(0);
    });

    it('should handle case-insensitive matching', async () => {
      // Arrange
      const targetStack = ['react', 'typescript'];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript']);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(100);
    });

    it('should handle whitespace in tech stack names', async () => {
      // Arrange
      const targetStack = ['  React  ', ' TypeScript '];
      const resume = createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript']);
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue([resume]);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      expect(result[0].score).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      const targetStack = ['React'];
      mockResumeRepository.getAllResumeMetadata.mockRejectedValue(
        new Error('Failed to access upload directory')
      );

      // Act & Assert
      await expect(useCase.execute(targetStack)).rejects.toThrow('Failed to access upload directory');
    });
  });

  describe('integration with StackMatchCalculator', () => {
    it('should use calculator for scoring and sorting', async () => {
      // Arrange
      const targetStack = ['React', 'TypeScript', 'AWS'];
      const resumes = [
        createResumeMetadata('1', 'CompanyA', 'Engineer', ['React', 'TypeScript', 'AWS', 'Lambda']),
        createResumeMetadata('2', 'CompanyB', 'Developer', ['React', 'TypeScript']),
        createResumeMetadata('3', 'CompanyC', 'Architect', ['React']),
      ];
      mockResumeRepository.getAllResumeMetadata.mockResolvedValue(resumes);

      // Act
      const result = await useCase.execute(targetStack);

      // Assert
      // Verify that calculator's scoring logic is applied
      expect(result[0].score).toBe(100); // All target techs present
      expect(result[1].score).toBeGreaterThanOrEqual(50); // Partial match
      expect(result[1].score).toBeLessThan(100);
      expect(result[2].score).toBeGreaterThanOrEqual(50); // Partial match
      expect(result[2].score).toBeLessThan(result[1].score);
    });
  });
});
