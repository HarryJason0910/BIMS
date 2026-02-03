/**
 * ResumeMatchController - REST API endpoints for resume matching
 * 
 * Provides endpoints for calculating resume match rates against current JD specifications.
 * Uses JD-to-JD correlation to determine how well historical resumes match current requirements.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

import { Request, Response, NextFunction, Router } from 'express';
import { CalculateResumeMatchRateUseCase } from '../application/CalculateResumeMatchRateUseCase';

export class ResumeMatchController {
  private router: Router;

  constructor(
    private readonly calculateResumeMatchRateUseCase: CalculateResumeMatchRateUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/match-rate', this.calculateMatchRates.bind(this));
    this.router.get('/:id/match-rate', this.getMatchRateForResume.bind(this));
  }

  /**
   * GET /api/resume/match-rate?currentJDId=xxx
   * Calculate resume match rates for current JD
   */
  private async calculateMatchRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentJDId } = req.query;

      if (!currentJDId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required query parameter: currentJDId'
        });
        return;
      }

      // This would need to be implemented to get all resumes and calculate match rates
      // For now, return a placeholder response
      res.status(501).json({
        error: 'Not Implemented',
        message: 'Batch resume match rate calculation not yet implemented. Use /:id/match-rate endpoint for individual resumes.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resume/:id/match-rate?currentJDId=xxx
   * Get match rate for specific resume
   */
  private async getMatchRateForResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { currentJDId } = req.query;

      if (!currentJDId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required query parameter: currentJDId'
        });
        return;
      }

      const result = await this.calculateResumeMatchRateUseCase.execute({
        resumeId: id,
        currentJDId: currentJDId as string
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
