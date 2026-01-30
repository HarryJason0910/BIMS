import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { Container } from './container';
import { BidController } from './BidController';
import { InterviewController } from './InterviewController';
import { CompanyHistoryController } from './CompanyHistoryController';
import { TechStackController } from './TechStackController';
import { AnalyticsController } from './AnalyticsController';
import { ResumeController } from './ResumeController';

export interface ServerConfig {
  port: number;
  corsOrigin: string | string[];
}

export class Server {
  private app: Express;
  private config: ServerConfig;
  private container: Container;
  private bidController!: BidController;
  private interviewController!: InterviewController;
  private companyHistoryController!: CompanyHistoryController;
  private techStackController!: TechStackController;
  private analyticsController!: AnalyticsController;
  private resumeController!: ResumeController;

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

    // CORS middleware - support multiple origins
    const corsOrigins = Array.isArray(this.config.corsOrigin) 
      ? this.config.corsOrigin 
      : this.config.corsOrigin.split(',').map(o => o.trim());

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (same-origin requests, mobile apps, curl)
          if (!origin) return callback(null, true);
          
          if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
            callback(null, true);
          } else {
            callback(null, true); // Allow all origins in production mode when serving static files
          }
        },
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
      this.container.cancelInterviewUseCase,
      this.container.interviewRepository
    );

    this.companyHistoryController = new CompanyHistoryController(
      this.container.companyHistoryRepository
    );

    this.techStackController = new TechStackController();

    this.analyticsController = new AnalyticsController(
      this.container.bidRepository,
      this.container.interviewRepository
    );

    this.resumeController = new ResumeController(
      this.container.getMatchingResumesUseCase,
      this.container.getResumeFileUseCase
    );
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // File download endpoint
    this.app.get('/api/files/:path', this.downloadFile.bind(this));

    // Mount controller routes
    console.log('[Server] Registering API routes...');
    this.app.use('/api/bids', this.bidController.getRouter());
    this.app.use('/api/interviews', this.interviewController.getRouter());
    this.app.use('/api/company-history', this.companyHistoryController.getRouter());
    this.app.use('/api/tech-stacks', this.techStackController.getRouter());
    this.app.use('/api/analytics', this.analyticsController.getRouter());
    this.app.use('/api/resumes', this.resumeController.getRouter());
    console.log('[Server] API routes registered successfully');

    // Serve static files from frontend build
    const frontendDistPath = path.join(__dirname, '../../../frontend/dist');
    this.app.use(express.static(frontendDistPath));

    // SPA fallback - serve index.html for all non-API routes
    this.app.get('*', (req: Request, res: Response) => {
      console.log('[Server] SPA fallback hit for:', req.method, req.path);
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        console.log('[Server] API route not found:', req.method, req.path);
        return res.status(404).json({
          error: 'Not Found',
          message: `API route ${req.method} ${req.path} not found`,
        });
      }
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  private async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const filePath = decodeURIComponent(req.params.path);
      const fileBuffer = await this.container.fileStorageService.readResume(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filePath.split('/').pop()}"`);
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({
        error: 'Not Found',
        message: 'File not found'
      });
    }
  }

  private setupErrorHandling(): void {
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
      const origins = Array.isArray(this.config.corsOrigin) 
        ? this.config.corsOrigin 
        : this.config.corsOrigin.split(',').map(o => o.trim());
      console.log(`CORS enabled for origins: ${origins.join(', ')}`);
    });
  }
}
