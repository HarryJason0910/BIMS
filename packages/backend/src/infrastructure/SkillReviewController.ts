/**
 * SkillReviewController - REST API endpoints for skill review queue management
 * 
 * Provides endpoints for reviewing unknown skills detected during JD specification creation.
 * Supports approval as canonical skills or variations, and rejection.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.12, 9.13
 */

import { Request, Response, NextFunction, Router } from 'express';
import { ReviewUnknownSkillsUseCase } from '../application/ReviewUnknownSkillsUseCase';

export class SkillReviewController {
  private router: Router;

  constructor(
    private readonly reviewUnknownSkillsUseCase: ReviewUnknownSkillsUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/review-queue', this.getReviewQueue.bind(this));
    this.router.post('/review-queue/approve', this.approveSkill.bind(this));
    this.router.post('/review-queue/reject', this.rejectSkill.bind(this));
  }

  /**
   * GET /api/skills/review-queue - Get review queue items
   */
  private async getReviewQueue(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await this.reviewUnknownSkillsUseCase.getQueueItems();

      res.json({ items });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/skills/review-queue/approve - Approve skill
   * Body: { skillName, approvalType: 'canonical' | 'variation', canonicalName?, category? }
   */
  private async approveSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skillName, approvalType, canonicalName, category } = req.body;

      if (!skillName || !approvalType) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: skillName, approvalType'
        });
        return;
      }

      let result;

      if (approvalType === 'canonical') {
        if (!category) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Category is required when approving as canonical skill'
          });
          return;
        }

        result = await this.reviewUnknownSkillsUseCase.approveAsCanonical(skillName, category);
      } else if (approvalType === 'variation') {
        if (!canonicalName) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Canonical name is required when approving as variation'
          });
          return;
        }

        result = await this.reviewUnknownSkillsUseCase.approveAsVariation(skillName, canonicalName);
      } else {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid approval type. Must be "canonical" or "variation"'
        });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/skills/review-queue/reject - Reject skill
   * Body: { skillName, reason }
   */
  private async rejectSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skillName, reason } = req.body;

      if (!skillName || !reason) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: skillName, reason'
        });
        return;
      }

      const result = await this.reviewUnknownSkillsUseCase.rejectSkill(skillName, reason);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
