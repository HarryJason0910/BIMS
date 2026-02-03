/**
 * SkillStatisticsController - REST API endpoints for skill usage statistics
 * 
 * Provides endpoints for retrieving skill usage statistics across JDs and resumes.
 * Supports filtering by date range, category, and sorting options.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 11.1-11.6
 */

import { Request, Response, NextFunction, Router } from 'express';
import { SkillUsageStatisticsUseCase } from '../application/SkillUsageStatisticsUseCase';
import { TechLayer } from '../domain/JDSpecTypes';

export class SkillStatisticsController {
  private router: Router;

  constructor(
    private readonly skillUsageStatisticsUseCase: SkillUsageStatisticsUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/skills', this.getSkillStatistics.bind(this));
    this.router.get('/skills/:name', this.getStatisticsForSkill.bind(this));
  }

  /**
   * GET /api/statistics/skills
   * Query params: startDate, endDate, category, sortBy, sortOrder
   * Get skill usage statistics
   */
  private async getSkillStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, category, sortBy, sortOrder } = req.query;

      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

      // Validate dates
      if (startDate && isNaN(parsedStartDate!.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-01)'
        });
        return;
      }

      if (endDate && isNaN(parsedEndDate!.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use ISO 8601 format (e.g., 2024-01-31)'
        });
        return;
      }

      // Validate category if provided
      const validCategories: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
      if (category && !validCategories.includes(category as TechLayer)) {
        res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
        return;
      }

      // Validate sortBy if provided
      if (sortBy && sortBy !== 'frequency' && sortBy !== 'name') {
        res.status(400).json({
          success: false,
          message: 'Invalid sortBy. Must be "frequency" or "name"'
        });
        return;
      }

      // Validate sortOrder if provided
      if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
        res.status(400).json({
          success: false,
          message: 'Invalid sortOrder. Must be "asc" or "desc"'
        });
        return;
      }

      const result = await this.skillUsageStatisticsUseCase.execute({
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        category: category as TechLayer | undefined,
        sortBy: (sortBy as 'frequency' | 'name') || 'frequency',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/statistics/skills/:name
   * Get statistics for specific skill
   */
  private async getStatisticsForSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;

      // Get all statistics and filter for the specific skill
      const result = await this.skillUsageStatisticsUseCase.execute({});

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      const skillStat = result.statistics.find(stat => 
        stat.skillName.toLowerCase() === name.toLowerCase()
      );

      if (!skillStat) {
        res.status(404).json({
          success: false,
          message: `No statistics found for skill: ${name}`
        });
        return;
      }

      res.json({
        success: true,
        statistic: skillStat
      });
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
