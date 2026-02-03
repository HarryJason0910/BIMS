/**
 * SkillDictionaryController - REST API endpoints for skill dictionary management
 * 
 * Provides endpoints for managing canonical skills, variations, and dictionary operations.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.7, 9.8, 9.9, 9.10, 9.11
 */

import { Request, Response, NextFunction, Router } from 'express';
import { ManageSkillDictionaryUseCase } from '../application/ManageSkillDictionaryUseCase';
import { ExportDictionaryUseCase } from '../application/ExportDictionaryUseCase';
import { ImportDictionaryUseCase } from '../application/ImportDictionaryUseCase';
import { ISkillDictionaryRepository } from '../application/ISkillDictionaryRepository';

export class SkillDictionaryController {
  private router: Router;

  constructor(
    private readonly manageSkillDictionaryUseCase: ManageSkillDictionaryUseCase,
    private readonly exportDictionaryUseCase: ExportDictionaryUseCase,
    private readonly importDictionaryUseCase: ImportDictionaryUseCase,
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/current', this.getCurrentDictionary.bind(this));
    this.router.get('/version/:version', this.getDictionaryByVersion.bind(this));
    this.router.get('/skills', this.getAllSkills.bind(this));
    this.router.post('/skills', this.addCanonicalSkill.bind(this));
    this.router.delete('/skills/:name', this.removeCanonicalSkill.bind(this));
    this.router.post('/variations', this.addSkillVariation.bind(this));
    this.router.get('/variations/:canonical', this.getVariationsForSkill.bind(this));
    this.router.post('/export', this.exportDictionary.bind(this));
    this.router.post('/import', this.importDictionary.bind(this));
  }

  /**
   * GET /api/dictionary/current - Get current dictionary
   */
  private async getCurrentDictionary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dictionary = await this.dictionaryRepository.getCurrent();
      res.json(dictionary.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dictionary/version/:version - Get specific dictionary version
   */
  private async getDictionaryByVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { version } = req.params;
      const dictionary = await this.dictionaryRepository.getVersion(version);
      if (!dictionary) {
        res.status(404).json({ error: 'Not Found', message: `Dictionary version not found: ${version}` });
        return;
      }
      res.json(dictionary.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dictionary/skills - Get all canonical skills
   */
  private async getAllSkills(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.manageSkillDictionaryUseCase.getSkills();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/dictionary/skills - Add canonical skill
   */
  private async addCanonicalSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, category } = req.body;
      if (!name || !category) {
        res.status(400).json({ error: 'Validation Error', message: 'Missing required fields: name, category' });
        return;
      }
      const result = await this.manageSkillDictionaryUseCase.addCanonicalSkill({ name, category });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/dictionary/skills/:name - Remove canonical skill
   */
  private async removeCanonicalSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const result = await this.manageSkillDictionaryUseCase.removeCanonicalSkill({ name });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/dictionary/variations - Add skill variation
   */
  private async addSkillVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { variation, canonicalName } = req.body;
      if (!variation || !canonicalName) {
        res.status(400).json({ error: 'Validation Error', message: 'Missing required fields: variation, canonicalName' });
        return;
      }
      const result = await this.manageSkillDictionaryUseCase.addSkillVariation({ variation, canonicalName });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dictionary/variations/:canonical - Get variations for skill
   */
  private async getVariationsForSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { canonical } = req.params;
      const result = await this.manageSkillDictionaryUseCase.getVariations({ canonicalName: canonical });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/dictionary/export - Export dictionary
   */
  private async exportDictionary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { version } = req.body;
      const result = await this.exportDictionaryUseCase.execute({ version });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/dictionary/import - Import dictionary
   */
  private async importDictionary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dictionaryData, mode, allowOlderVersion } = req.body;
      if (!dictionaryData) {
        res.status(400).json({ error: 'Validation Error', message: 'Missing required field: dictionaryData' });
        return;
      }
      const result = await this.importDictionaryUseCase.execute({
        data: dictionaryData,
        mode: mode || 'replace',
        allowVersionDowngrade: allowOlderVersion || false
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
