import { Request, Response, NextFunction, Router } from 'express';
import { TechStack } from '../domain/TechStack';

export class TechStackController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.getAllStacks.bind(this));
    this.router.post('/', this.addStack.bind(this));
  }

  private async getAllStacks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stacks = TechStack.getAllStacks();
      res.json(stacks);
    } catch (error) {
      next(error);
    }
  }

  private async addStack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stack } = req.body;

      if (!stack || typeof stack !== 'string') {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Stack name is required and must be a string',
        });
        return;
      }

      TechStack.addStack(stack);
      
      res.status(201).json({
        message: 'Stack added successfully',
        stack: stack.trim(),
        allStacks: TechStack.getAllStacks()
      });
    } catch (error) {
      next(error);
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
