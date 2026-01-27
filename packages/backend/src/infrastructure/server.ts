import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Container } from './container';
import { BidController } from './BidController';
import { InterviewController } from './InterviewController';
import { CompanyHistoryController } from './CompanyHistoryController';

export interface ServerConfig {
  port: number;
  corsOrigin: string;
}

export class Server {
  private app: Express;
  private config: ServerConfig;
  private container: Container;
  private bidController!: BidController;
  private interviewController!: InterviewController;
  private companyHistoryController!: CompanyHistoryController;

  constructor(config: ServerConfig, container: Container) {
    this.app = express();
    this.config = config;
    this.container = container;
    this.setupMiddleware();
    this.setupControllers();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Body parser middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
      })
    );

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupControllers(): void {
    // Initialize controllers with use cases from container
    this.bidController = new BidController(
      this.container.createBidUseCase,
      this.container.rebidWithNewResumeUseCase,
      this.container.bidRepository,
      this.container.fileStorageService
    );

    this.interviewController = new InterviewController(
      this.container.scheduleInterviewUseCase,
      this.container.completeInterviewUseCase,
      this.container.interviewRepository
    );

    this.companyHistoryController = new CompanyHistoryController(
      this.container.companyHistoryRepository
    );
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Email connection status endpoint
    this.app.get('/api/email/status', async (_req: Request, res: Response) => {
      try {
        const isConnected = await this.container.emailAdapter.testConnection();
        res.json({ 
          connected: isConnected,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.json({ 
          connected: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Mount controller routes
    this.app.use('/api/bids', this.bidController.getRouter());
    this.app.use('/api/interviews', this.interviewController.getRouter());
    this.app.use('/api/company-history', this.companyHistoryController.getRouter());
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });

    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);

      // Handle validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: err.message,
        });
      }

      // Handle not found errors
      if (err.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: err.message,
        });
      }

      // Handle conflict errors (e.g., duplicate entries)
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        return res.status(409).json({
          error: 'Conflict',
          message: err.message,
        });
      }

      // Default to 500 server error
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`Server running on port ${this.config.port}`);
      console.log(`CORS enabled for origin: ${this.config.corsOrigin}`);
    });
  }
}
