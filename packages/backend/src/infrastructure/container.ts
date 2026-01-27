/**
 * Dependency Injection Container
 * 
 * Wires all components together following clean architecture principles
 */

import { MongoDBBidRepository } from './MongoDBBidRepository';
import { MongoDBInterviewRepository } from './MongoDBInterviewRepository';
import { MongoDBCompanyHistoryRepository } from './MongoDBCompanyHistoryRepository';
import { MongoDBProcessedEmailRepository } from './MongoDBProcessedEmailRepository';
import { MongoDBConnection } from './MongoDBConnection';
import { InMemoryBidRepository } from './InMemoryBidRepository';
import { InMemoryInterviewRepository } from './InMemoryInterviewRepository';
import { InMemoryCompanyHistoryRepository } from './InMemoryCompanyHistoryRepository';
import { InMemoryProcessedEmailRepository } from './InMemoryProcessedEmailRepository';
import { FileStorageService } from './FileStorageService';
import { CreateBidUseCase } from '../application/CreateBidUseCase';
import { RebidWithNewResumeUseCase } from '../application/RebidWithNewResumeUseCase';
import { ScheduleInterviewUseCase } from '../application/ScheduleInterviewUseCase';
import { CompleteInterviewUseCase } from '../application/CompleteInterviewUseCase';
import { ProcessEmailUseCase } from '../application/ProcessEmailUseCase';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { InterviewEligibilityPolicy } from '../domain/InterviewEligibilityPolicy';
import { ResumeCheckerService } from '../domain/ResumeCheckerService';
import { EmailClassifier } from '../domain/EmailClassifier';
import { CompanyHistory } from '../domain/CompanyHistory';
import { EmailAdapter, EmailAdapterConfig } from './EmailAdapter';
import { IBidRepository } from '../application/IBidRepository';
import { IInterviewRepository } from '../application/IInterviewRepository';
import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';
import { IProcessedEmailRepository } from '../application/IProcessedEmailRepository';

export interface ContainerConfig {
  useInMemory?: boolean;
  mongoUri?: string;
  mongoDbName?: string;
  emailConfig?: EmailAdapterConfig;
}

export class Container {
  private static instance: Container;
  
  // Repositories
  public bidRepository!: IBidRepository;
  public interviewRepository!: IInterviewRepository;
  public companyHistoryRepository!: ICompanyHistoryRepository;
  public processedEmailRepository!: IProcessedEmailRepository;

  // Domain Services
  public duplicationDetectionPolicy!: DuplicationDetectionPolicy;
  public interviewEligibilityPolicy!: InterviewEligibilityPolicy;
  public resumeCheckerService!: ResumeCheckerService;
  public emailClassifier!: EmailClassifier;
  public fileStorageService!: FileStorageService;

  // Use Cases
  public createBidUseCase!: CreateBidUseCase;
  public rebidWithNewResumeUseCase!: RebidWithNewResumeUseCase;
  public scheduleInterviewUseCase!: ScheduleInterviewUseCase;
  public completeInterviewUseCase!: CompleteInterviewUseCase;
  public processEmailUseCase!: ProcessEmailUseCase;

  // Infrastructure
  public emailAdapter?: EmailAdapter;

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public async initialize(config: ContainerConfig): Promise<void> {
    console.log('Initializing dependency injection container...');

    // Initialize repositories
    if (config.useInMemory) {
      console.log('Using in-memory repositories');
      this.bidRepository = new InMemoryBidRepository();
      this.interviewRepository = new InMemoryInterviewRepository();
      this.companyHistoryRepository = new InMemoryCompanyHistoryRepository();
      this.processedEmailRepository = new InMemoryProcessedEmailRepository();
    } else {
      console.log('Using MongoDB repositories');
      if (!config.mongoUri || !config.mongoDbName) {
        throw new Error('MongoDB URI and database name are required');
      }

      // Connect to MongoDB using the singleton connection
      const mongoConnection = MongoDBConnection.getInstance();
      await mongoConnection.connect(config.mongoUri, config.mongoDbName);
      console.log('Connected to MongoDB');
      
      // MongoDB repositories use the singleton connection internally
      this.bidRepository = new MongoDBBidRepository();
      this.interviewRepository = new MongoDBInterviewRepository();
      this.companyHistoryRepository = new MongoDBCompanyHistoryRepository();
      this.processedEmailRepository = new MongoDBProcessedEmailRepository();
    }

    // Initialize domain services
    this.duplicationDetectionPolicy = new DuplicationDetectionPolicy();
    this.interviewEligibilityPolicy = new InterviewEligibilityPolicy();
    this.resumeCheckerService = new ResumeCheckerService();
    this.emailClassifier = new EmailClassifier();
    this.fileStorageService = new FileStorageService('./uploads');

    // Initialize CompanyHistory domain object (used by use cases)
    const companyHistory = new CompanyHistory();

    // Initialize use cases
    this.createBidUseCase = new CreateBidUseCase(
      this.bidRepository,
      this.duplicationDetectionPolicy,
      companyHistory
    );

    this.rebidWithNewResumeUseCase = new RebidWithNewResumeUseCase(
      this.bidRepository,
      this.duplicationDetectionPolicy,
      companyHistory
    );

    this.scheduleInterviewUseCase = new ScheduleInterviewUseCase(
      this.interviewRepository,
      this.bidRepository,
      this.interviewEligibilityPolicy,
      companyHistory
    );

    this.completeInterviewUseCase = new CompleteInterviewUseCase(
      this.interviewRepository,
      this.bidRepository,
      companyHistory,
      this.companyHistoryRepository
    );

    this.processEmailUseCase = new ProcessEmailUseCase(
      this.bidRepository,
      this.interviewRepository,
      this.processedEmailRepository,
      this.emailClassifier,
      this.resumeCheckerService
    );

    // Initialize email adapter if config provided
    if (config.emailConfig) {
      console.log('Initializing email adapter');
      this.emailAdapter = new EmailAdapter(config.emailConfig);
      this.emailAdapter.setProcessEmailUseCase(this.processEmailUseCase);
      
      try {
        await this.emailAdapter.authenticate();
        console.log('Email adapter authenticated successfully');
      } catch (error) {
        console.error('Failed to authenticate email adapter:', error);
        // Don't throw - allow app to start without email integration
      }
    }

    console.log('Container initialized successfully');
  }

  public async startEmailPolling(): Promise<void> {
    if (this.emailAdapter) {
      console.log('Starting email polling...');
      await this.emailAdapter.startPolling();
    } else {
      console.log('Email adapter not configured, skipping email polling');
    }
  }

  public stopEmailPolling(): void {
    if (this.emailAdapter) {
      console.log('Stopping email polling...');
      this.emailAdapter.stopPolling();
    }
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down container...');
    
    this.stopEmailPolling();

    // Close MongoDB connection if it was used
    const mongoConnection = MongoDBConnection.getInstance();
    if (mongoConnection.isConnected()) {
      await mongoConnection.disconnect();
      console.log('MongoDB connection closed');
    }

    console.log('Container shutdown complete');
  }
}

export const container = Container.getInstance();
