/**
 * BidMatchRateController - API controller for bid match rate calculations
 * 
 * Provides endpoints for calculating weighted match rates between bids.
 * 
 * Part of: role-based-layer-weights feature
 * Requirements: 7, 10
 */

import { Request, Response, NextFunction, Router } from 'express';
import { CalculateBidMatchRateUseCase } from '../application/CalculateBidMatchRateUseCase';

export class BidMatchRateController {
  private router: Router;

  constructor(
    private calculateMatchRateUseCase: CalculateBidMatchRateUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/:id/match-rate', this.getMatchRate.bind(this));
  }

  /**
   * GET /api/bids/:id/match-rate
   * 
   * Calculate match rates for a bid against all other bids
   * Returns sorted results with layer breakdown
   */
  private async getMatchRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Bid ID is required',
        });
        return;
      }

      const results = await this.calculateMatchRateUseCase.execute(id);

      res.status(200).json({
        currentBidId: id,
        matchRates: results,
        count: results.length
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not Found',
            message: error.message,
          });
          return;
        }
        if (error.message.includes('must use LayerSkills format')) {
          res.status(400).json({
            error: 'Invalid Format',
            message: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
