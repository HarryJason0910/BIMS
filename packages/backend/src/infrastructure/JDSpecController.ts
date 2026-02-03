/**
 * JDSpecController - REST API endpoints for JD specification management
 * 
 * Provides endpoints for creating, retrieving, updating, and deleting JD specifications,
 * as well as calculating correlation between JD specifications.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { Request, Response, NextFunction, Router } from 'express';
import { CreateJDSpecUseCase } from '../application/CreateJDSpecUseCase';
import { CalculateCorrelationUseCase } from '../application/CalculateCorrelationUseCase';
import { IJDSpecRepository } from '../application/IJDSpecRepository';

export class JDSpecController {
  private router: Router;

  constructor(
    private readonly createJDSpecUseCase: CreateJDSpecUseCase,
    private readonly calculateCorrelationUseCase: CalculateCorrelationUseCase,
    private readonly jdSpecRepository: IJDSpecRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/create', this.createJDSpec.bind(this));
    this.router.get('/:id', this.getJDSpecById.bind(this));
    this.router.get('/', this.getAllJDSpecs.bind(this));
    this.router.put('/:id', this.updateJDSpec.bind(this));
    this.router.delete('/:id', this.deleteJDSpec.bind(this));
    this.router.get('/correlation', this.calculateCorrelation.bind(this));
  }

  /**
   * POST /api/jd/create - Create JD specification
   */
  private async createJDSpec(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, layerWeights, skills } = req.body;

      // Validate required fields
      if (!role || !layerWeights || !skills) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: role, layerWeights, skills'
        });
        return;
      }

      const result = await this.createJDSpecUseCase.execute({
        role,
        layerWeights,
        skills
      });

      res.status(201).json({
        jdSpec: result.jdSpec.toJSON(),
        unknownSkills: result.unknownSkills
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jd/:id - Get JD specification by ID
   */
  private async getJDSpecById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const jdSpec = await this.jdSpecRepository.findById(id);

      if (!jdSpec) {
        res.status(404).json({
          error: 'Not Found',
          message: `JD specification not found: ${id}`
        });
        return;
      }

      res.json(jdSpec.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jd - Get all JD specifications
   */
  private async getAllJDSpecs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jdSpecs = await this.jdSpecRepository.findAll();

      res.json({
        success: true,
        count: jdSpecs.length,
        jdSpecs: jdSpecs.map(spec => spec.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/jd/:id - Update JD specification
   */
  private async updateJDSpec(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, layerWeights, skills } = req.body;

      // Check if JD spec exists
      const existingSpec = await this.jdSpecRepository.findById(id);
      if (!existingSpec) {
        res.status(404).json({
          success: false,
          message: `JD specification not found: ${id}`
        });
        return;
      }

      // Validate required fields
      if (!role || !layerWeights || !skills) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: role, layerWeights, skills'
        });
        return;
      }

      // Create new JD spec with updated data
      const result = await this.createJDSpecUseCase.execute({
        role,
        layerWeights,
        skills
      });

      // Update the repository with the new spec (keeping the same ID)
      const updatedSpec = result.jdSpec;
      // Replace the ID with the original one
      (updatedSpec as any)._id = id;
      
      await this.jdSpecRepository.update(updatedSpec);
      
      res.json({
        message: 'JD specification updated successfully',
        jdSpec: updatedSpec.toJSON(),
        unknownSkills: result.unknownSkills
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/jd/:id - Delete JD specification
   */
  private async deleteJDSpec(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if JD spec exists
      const existingSpec = await this.jdSpecRepository.findById(id);
      if (!existingSpec) {
        res.status(404).json({
          success: false,
          message: `JD specification not found: ${id}`
        });
        return;
      }

      await this.jdSpecRepository.delete(id);

      res.json({
        success: true,
        message: 'JD specification deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jd/correlation?currentJDId=xxx&historicalJDId=yyy
   * Calculate correlation between two JDs
   */
  private async calculateCorrelation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentJDId, historicalJDId } = req.query;

      if (!currentJDId || !historicalJDId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required query parameters: currentJDId, historicalJDId'
        });
        return;
      }

      const result = await this.calculateCorrelationUseCase.execute({
        currentJDId: currentJDId as string,
        pastJDId: historicalJDId as string
      });

      res.json(result.correlation);
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
