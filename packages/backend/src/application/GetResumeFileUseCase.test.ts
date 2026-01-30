import { GetResumeFileUseCase } from './GetResumeFileUseCase';
import { IResumeRepository } from './IResumeRepository';

describe('GetResumeFileUseCase', () => {
  let useCase: GetResumeFileUseCase;
  let mockResumeRepository: jest.Mocked<IResumeRepository>;

  beforeEach(() => {
    // Create mock repository
    mockResumeRepository = {
      getAllResumeMetadata: jest.fn(),
      getResumeFile: jest.fn(),
      fileExists: jest.fn(),
    };

    useCase = new GetResumeFileUseCase(mockResumeRepository);
  });

  describe('successful file retrieval', () => {
    it('should retrieve resume file by valid ID', async () => {
      // Arrange
      const resumeId = Buffer.from('/uploads/Company_Role_React,AWS/resume.pdf').toString('base64');
      const mockFileBuffer = Buffer.from('mock PDF content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockFileBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledWith(resumeId);
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockFileBuffer);
    });

    it('should return Buffer containing PDF content', async () => {
      // Arrange
      const resumeId = 'valid-resume-id';
      const pdfContent = Buffer.from('%PDF-1.4 mock content');
      mockResumeRepository.getResumeFile.mockResolvedValue(pdfContent);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('%PDF-1.4');
    });

    it('should handle large PDF files', async () => {
      // Arrange
      const resumeId = 'large-file-id';
      const largePdfBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      mockResumeRepository.getResumeFile.mockResolvedValue(largePdfBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBe(largePdfBuffer);
      expect(result.length).toBe(5 * 1024 * 1024);
    });
  });

  describe('error handling for invalid IDs', () => {
    it('should propagate error when resume ID is invalid', async () => {
      // Arrange
      const invalidResumeId = 'invalid-base64-id';
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Invalid resume ID')
      );

      // Act & Assert
      await expect(useCase.execute(invalidResumeId)).rejects.toThrow('Invalid resume ID');
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledWith(invalidResumeId);
    });

    it('should propagate error when file does not exist', async () => {
      // Arrange
      const resumeId = Buffer.from('/uploads/NonExistent_Company/resume.pdf').toString('base64');
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Resume file not found')
      );

      // Act & Assert
      await expect(useCase.execute(resumeId)).rejects.toThrow('Resume file not found');
    });

    it('should propagate error when file cannot be read', async () => {
      // Arrange
      const resumeId = 'valid-id';
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Permission denied')
      );

      // Act & Assert
      await expect(useCase.execute(resumeId)).rejects.toThrow('Permission denied');
    });

    it('should propagate error when file path is malformed', async () => {
      // Arrange
      const malformedId = '!!!invalid!!!';
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Failed to decode resume ID')
      );

      // Act & Assert
      await expect(useCase.execute(malformedId)).rejects.toThrow('Failed to decode resume ID');
    });
  });

  describe('edge cases', () => {
    it('should handle empty resume ID', async () => {
      // Arrange
      const emptyId = '';
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Resume ID cannot be empty')
      );

      // Act & Assert
      await expect(useCase.execute(emptyId)).rejects.toThrow('Resume ID cannot be empty');
    });

    it('should handle resume ID with special characters', async () => {
      // Arrange
      const specialCharPath = '/uploads/Company-Name_Role (Senior)_React,AWS/resume.pdf';
      const resumeId = Buffer.from(specialCharPath).toString('base64');
      const mockBuffer = Buffer.from('PDF content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBe(mockBuffer);
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledWith(resumeId);
    });

    it('should handle resume ID with Unicode characters', async () => {
      // Arrange
      const unicodePath = '/uploads/Société_Développeur_React/resume.pdf';
      const resumeId = Buffer.from(unicodePath).toString('base64');
      const mockBuffer = Buffer.from('PDF content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBe(mockBuffer);
    });

    it('should handle empty PDF file (0 bytes)', async () => {
      // Arrange
      const resumeId = 'valid-id';
      const emptyBuffer = Buffer.alloc(0);
      mockResumeRepository.getResumeFile.mockResolvedValue(emptyBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBe(emptyBuffer);
      expect(result.length).toBe(0);
    });
  });

  describe('repository interaction', () => {
    it('should call repository exactly once per execution', async () => {
      // Arrange
      const resumeId = 'test-id';
      const mockBuffer = Buffer.from('content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockBuffer);

      // Act
      await useCase.execute(resumeId);

      // Assert
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledTimes(1);
    });

    it('should pass resume ID unchanged to repository', async () => {
      // Arrange
      const resumeId = 'exact-id-to-pass';
      const mockBuffer = Buffer.from('content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockBuffer);

      // Act
      await useCase.execute(resumeId);

      // Assert
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledWith('exact-id-to-pass');
    });

    it('should not modify the returned buffer', async () => {
      // Arrange
      const resumeId = 'test-id';
      const originalBuffer = Buffer.from('original content');
      const bufferCopy = Buffer.from(originalBuffer);
      mockResumeRepository.getResumeFile.mockResolvedValue(originalBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBe(originalBuffer);
      expect(result.equals(bufferCopy)).toBe(true);
    });
  });

  describe('concurrent executions', () => {
    it('should handle multiple concurrent file retrievals', async () => {
      // Arrange
      const resumeId1 = 'resume-1';
      const resumeId2 = 'resume-2';
      const resumeId3 = 'resume-3';
      const buffer1 = Buffer.from('content 1');
      const buffer2 = Buffer.from('content 2');
      const buffer3 = Buffer.from('content 3');

      mockResumeRepository.getResumeFile
        .mockImplementation((id: string) => {
          if (id === resumeId1) return Promise.resolve(buffer1);
          if (id === resumeId2) return Promise.resolve(buffer2);
          if (id === resumeId3) return Promise.resolve(buffer3);
          return Promise.reject(new Error('Unknown ID'));
        });

      // Act
      const [result1, result2, result3] = await Promise.all([
        useCase.execute(resumeId1),
        useCase.execute(resumeId2),
        useCase.execute(resumeId3),
      ]);

      // Assert
      expect(result1).toBe(buffer1);
      expect(result2).toBe(buffer2);
      expect(result3).toBe(buffer3);
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 4.3: retrieve resume file by ID', async () => {
      // Requirement 4.3: THE System SHALL provide an API endpoint at 
      // GET /api/resumes/file/:resumeId that retrieves a specific resume file
      
      // Arrange
      const resumeId = 'valid-resume-id';
      const mockBuffer = Buffer.from('PDF content');
      mockResumeRepository.getResumeFile.mockResolvedValue(mockBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(mockResumeRepository.getResumeFile).toHaveBeenCalledWith(resumeId);
    });

    it('should satisfy Requirement 4.4: return PDF file with appropriate content', async () => {
      // Requirement 4.4: WHEN the file endpoint is called with a valid resumeId, 
      // THE System SHALL return the PDF file with appropriate content-type headers
      
      // Arrange
      const resumeId = 'valid-resume-id';
      const pdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\nMock PDF content');
      mockResumeRepository.getResumeFile.mockResolvedValue(pdfBuffer);

      // Act
      const result = await useCase.execute(resumeId);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('%PDF');
    });

    it('should satisfy Requirement 4.5: return error for invalid resumeId', async () => {
      // Requirement 4.5: IF the file endpoint is called with an invalid resumeId, 
      // THEN THE System SHALL return a 404 error with a descriptive message
      
      // Arrange
      const invalidResumeId = 'non-existent-id';
      mockResumeRepository.getResumeFile.mockRejectedValue(
        new Error('Resume file not found')
      );

      // Act & Assert
      await expect(useCase.execute(invalidResumeId)).rejects.toThrow('Resume file not found');
    });
  });
});
