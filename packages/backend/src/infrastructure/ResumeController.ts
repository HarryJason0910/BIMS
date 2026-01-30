import { Request, Response, NextFunction, Router } from 'express';
import { GetMatchingResumesUseCase } from '../application/GetMatchingResumesUseCase';
import { GetResumeFileUseCase } from '../application/GetResumeFileUseCase';

/**
 * Controller for resume-related API endpoints.
 * 
 * This controller provides HTTP endpoints for the resume selection from history feature:
 * - GET /api/resumes/metadata - Retrieve matching resumes based on tech stack
 * - GET /api/resumes/file/:resumeId - Retrieve a specific resume PDF file
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export class ResumeController {
  private router: Router;

  constructor(
    private readonly getMatchingResumesUseCase: GetMatchingResumesUseCase,
    private readonly getResumeFileUseCase: GetResumeFileUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Set up the routes for the resume controller
   */
  private setupRoutes(): void {
    this.router.get('/metadata', this.getMetadata.bind(this));
    this.router.get('/file/:resumeId', this.getFile.bind(this));
  }

  /**
   * GET /api/resumes/metadata
   * 
   * Retrieve resume metadata filtered and sorted by tech stack match score.
   * 
   * Query Parameters:
   * - techStack: Comma-separated list of technologies (required)
   * 
   * Response:
   * - 200: Array of resume metadata objects sorted by match score
   * - 400: Missing or invalid tech stack parameter
   * - 500: Server error during retrieval
   * 
   * Requirements: 4.1, 4.2
   */
  private async getMetadata(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const techStack = req.query.techStack as string;
      console.log('[ResumeController] GET /api/resumes/metadata - techStack:', techStack);

      // Validate that tech stack is provided
      if (!techStack) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Tech stack is required',
        });
        return;
      }

      // Parse comma-separated tech stack into array
      const techStackArray = techStack
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log('[ResumeController] Parsed tech stack array:', techStackArray);

      // Validate that tech stack array is not empty after parsing
      if (techStackArray.length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Tech stack must contain at least one technology',
        });
        return;
      }

      // Execute use case to get matching resumes
      const results = await this.getMatchingResumesUseCase.execute(techStackArray);
      console.log('[ResumeController] Found', results.length, 'matching resumes');

      res.json(results);
    } catch (error) {
      // Log error for debugging
      console.error('[ResumeController] Error retrieving resume metadata:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve resume metadata',
      });
    }
  }

  /**
   * GET /api/resumes/file/:resumeId
   * 
   * Retrieve a specific resume PDF file by its ID.
   * 
   * Path Parameters:
   * - resumeId: Base64 encoded file path identifying the resume
   * 
   * Response:
   * - 200: PDF file with appropriate headers
   * - 404: Resume file not found
   * - 500: Server error during retrieval
   * 
   * Requirements: 4.3, 4.4, 4.5
   */
  private async getFile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resumeId } = req.params;

      // Validate that resumeId is provided
      if (!resumeId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Resume ID is required',
        });
        return;
      }

      // Execute use case to get resume file
      const fileBuffer = await this.getResumeFileUseCase.execute(resumeId);

      // Set appropriate headers for PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.send(fileBuffer);
    } catch (error) {
      // Log error for debugging
      console.error('Error retrieving resume file:', error);

      // Check if error is due to file not found
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Resume file not found',
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to retrieve resume file',
        });
      }
    }
  }

  /**
   * Get the Express router for this controller
   * 
   * @returns Express Router instance with configured routes
   */
  public getRouter(): Router {
    return this.router;
  }
}
