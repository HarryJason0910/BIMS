import { Request, Response, NextFunction } from 'express';
import { ResumeController } from './ResumeController';
import { GetMatchingResumesUseCase, MatchingResumeDTO } from '../application/GetMatchingResumesUseCase';
import { GetResumeFileUseCase } from '../application/GetResumeFileUseCase';

/**
 * Unit tests for ResumeController
 * 
 * Tests the HTTP endpoint handlers for resume metadata and file retrieval.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */
describe('ResumeController', () => {
  let controller: ResumeController;
  let mockGetMatchingResumesUseCase: jest.Mocked<GetMatchingResumesUseCase>;
  let mockGetResumeFileUseCase: jest.Mocked<GetResumeFileUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock use cases
    mockGetMatchingResumesUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetResumeFileUseCase = {
      execute: jest.fn(),
    } as any;

    // Create mock request and response objects
    mockRequest = {
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Create controller instance
    controller = new ResumeController(
      mockGetMatchingResumesUseCase,
      mockGetResumeFileUseCase
    );
  });

  describe('getMetadata', () => {
    /**
     * Test: Successful metadata retrieval with valid tech stack
     * Requirements: 4.1, 4.2
     */
    it('should return resume metadata when valid tech stack is provided', async () => {
      // Arrange
      const techStack = 'React,TypeScript,AWS';
      mockRequest.query = { techStack };

      const mockResults: MatchingResumeDTO[] = [
        {
          id: 'resume1',
          company: 'Google',
          role: 'Senior Engineer',
          techStack: ['React', 'TypeScript', 'AWS'],
          score: 100,
          createdAt: new Date('2024-01-01'),
          matchedSkills: ['React', 'TypeScript', 'AWS'],
          missingSkills: [],
        },
        {
          id: 'resume2',
          company: 'Amazon',
          role: 'Software Developer',
          techStack: ['React', 'TypeScript'],
          score: 66,
          createdAt: new Date('2024-01-02'),
          matchedSkills: ['React', 'TypeScript'],
          missingSkills: ['AWS'],
        },
      ];

      mockGetMatchingResumesUseCase.execute.mockResolvedValue(mockResults);

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetMatchingResumesUseCase.execute).toHaveBeenCalledWith([
        'React',
        'TypeScript',
        'AWS',
      ]);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    /**
     * Test: Error handling when tech stack is missing
     * Requirements: 4.1
     */
    it('should return 400 error when tech stack is missing', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Tech stack is required',
      });
      expect(mockGetMatchingResumesUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * Test: Error handling when tech stack is empty string
     * Requirements: 4.1
     */
    it('should return 400 error when tech stack is empty string', async () => {
      // Arrange
      mockRequest.query = { techStack: '' };

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Tech stack is required',
      });
      expect(mockGetMatchingResumesUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * Test: Error handling when tech stack contains only whitespace
     * Requirements: 4.1
     */
    it('should return 400 error when tech stack contains only whitespace', async () => {
      // Arrange
      mockRequest.query = { techStack: '  ,  ,  ' };

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Tech stack must contain at least one technology',
      });
      expect(mockGetMatchingResumesUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * Test: Proper parsing of comma-separated tech stack with whitespace
     * Requirements: 4.1, 4.2
     */
    it('should properly parse tech stack with whitespace', async () => {
      // Arrange
      mockRequest.query = { techStack: ' React , TypeScript , AWS ' };
      mockGetMatchingResumesUseCase.execute.mockResolvedValue([]);

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetMatchingResumesUseCase.execute).toHaveBeenCalledWith([
        'React',
        'TypeScript',
        'AWS',
      ]);
    });

    /**
     * Test: Error handling when use case throws error
     * Requirements: 4.2
     */
    it('should return 500 error when use case throws error', async () => {
      // Arrange
      mockRequest.query = { techStack: 'React,TypeScript' };
      mockGetMatchingResumesUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const router = controller.getRouter();
      const metadataRoute = router.stack.find(
        layer => layer.route?.path === '/metadata'
      );
      await metadataRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve resume metadata',
      });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getFile', () => {
    /**
     * Test: Successful file retrieval with valid resume ID
     * Requirements: 4.3, 4.4
     */
    it('should return PDF file when valid resume ID is provided', async () => {
      // Arrange
      const resumeId = 'base64encodedpath';
      mockRequest.params = { resumeId };

      const mockFileBuffer = Buffer.from('PDF file content');
      mockGetResumeFileUseCase.execute.mockResolvedValue(mockFileBuffer);

      // Act
      const router = controller.getRouter();
      const fileRoute = router.stack.find(
        layer => layer.route?.path === '/file/:resumeId'
      );
      await fileRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetResumeFileUseCase.execute).toHaveBeenCalledWith(resumeId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="resume.pdf"'
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockFileBuffer);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    /**
     * Test: Error handling when resume ID is missing
     * Requirements: 4.5
     */
    it('should return 400 error when resume ID is missing', async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      const router = controller.getRouter();
      const fileRoute = router.stack.find(
        layer => layer.route?.path === '/file/:resumeId'
      );
      await fileRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Resume ID is required',
      });
      expect(mockGetResumeFileUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * Test: Error handling when resume file is not found
     * Requirements: 4.5
     */
    it('should return 404 error when resume file is not found', async () => {
      // Arrange
      const resumeId = 'invalidresumeId';
      mockRequest.params = { resumeId };

      mockGetResumeFileUseCase.execute.mockRejectedValue(
        new Error('File not found')
      );

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const router = controller.getRouter();
      const fileRoute = router.stack.find(
        layer => layer.route?.path === '/file/:resumeId'
      );
      await fileRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Resume file not found',
      });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    /**
     * Test: Error handling when file system error occurs (ENOENT)
     * Requirements: 4.5
     */
    it('should return 404 error when ENOENT error occurs', async () => {
      // Arrange
      const resumeId = 'validresumeId';
      mockRequest.params = { resumeId };

      const fsError = new Error('ENOENT: no such file or directory');
      mockGetResumeFileUseCase.execute.mockRejectedValue(fsError);

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const router = controller.getRouter();
      const fileRoute = router.stack.find(
        layer => layer.route?.path === '/file/:resumeId'
      );
      await fileRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Resume file not found',
      });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    /**
     * Test: Error handling for other server errors
     * Requirements: 4.5
     */
    it('should return 500 error for other server errors', async () => {
      // Arrange
      const resumeId = 'validresumeId';
      mockRequest.params = { resumeId };

      mockGetResumeFileUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const router = controller.getRouter();
      const fileRoute = router.stack.find(
        layer => layer.route?.path === '/file/:resumeId'
      );
      await fileRoute?.route?.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve resume file',
      });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getRouter', () => {
    /**
     * Test: Router is properly configured
     */
    it('should return a router with configured routes', () => {
      // Act
      const router = controller.getRouter();

      // Assert
      expect(router).toBeDefined();
      expect(router.stack).toHaveLength(2); // Two routes: metadata and file
      
      const routes = router.stack.map(layer => layer.route?.path);
      expect(routes).toContain('/metadata');
      expect(routes).toContain('/file/:resumeId');
    });
  });
});
