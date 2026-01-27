import { Request, Response, NextFunction, Router } from 'express';
import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';

export class CompanyHistoryController {
  private router: Router;

  constructor(private companyHistoryRepository: ICompanyHistoryRepository) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.getCompanyHistory.bind(this));
    this.router.get('/all', this.getAllCompanyHistory.bind(this));
  }

  private async getCompanyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { company, role } = req.query;

      if (!company || !role) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Query parameters "company" and "role" are required',
        });
        return;
      }

      const history = await this.companyHistoryRepository.findByCompanyAndRole(
        company as string,
        role as string
      );

      if (!history) {
        res.status(404).json({
          error: 'Not Found',
          message: `No history found for company "${company}" and role "${role}"`,
        });
        return;
      }

      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  private async getAllCompanyHistory(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const history = await this.companyHistoryRepository.findAll();
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
