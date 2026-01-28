/**
 * Dependency Injection Container
 * 
 * Wires all components together following clean architecture principles
 */

import { MongoDBBidRepository } from './MongoDBBidRepository';
import { MongoDBInterviewRepository } from './MongoDBInterviewRepository';
import { MongoDBCompanyHistoryRepository } from './MongoDBCompanyHistoryRepository';
import { MongoDBConnection } from './MongoDBConnection';
import { InMemoryBidRepository } from './InMemoryBidRepository';
import { InMemoryInterviewRepository } from './InMemoryInterviewRepository';
import { InMemoryCompanyHistoryRepository } from './InMemoryCompanyHistoryRepository';
import { FileStorageService } from './FileStorageService';
import { CreateBidUseCase } from '../application/CreateBidUseCase';
import { RebidWithNewResumeUseCase } from '../application/RebidWithNewResumeUseCase';
import { ScheduleInterviewUseCase } from '../application/ScheduleInterviewUseCase';
import { CompleteInterviewUseCase } from '../application/CompleteInterviewUseCase';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { InterviewEligibilityPolicy } from '../domain/InterviewEligibilityPolicy';
import { ResumeCheckerService } from '../domain/ResumeCheckerService';
import { CompanyHistory } from '../domain/CompanyHistory';
import { IBidRepository } from '../application/IBidRepository';
import { IInterviewRepository } from '../application/IInterviewRepository';
import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';

export interface ContainerConfig {
  useInMemory?: boolean;
  mongoUri?: string;
  mongoDbName?: string;
}

export class Container {
  private static instance: Container;
  
  // Repositories
  public bidRepository!: IBidRepository;
  public interviewRepository!: IInterviewRepository;
  public companyHistoryRepository!: ICompanyHistoryRepository;

  // Domain Services
  public duplicationDetectionPolicy!: DuplicationDetectionPolicy;
  public interviewEligibilityPolicy!: InterviewEligibilityPolicy;
  public resumeCheckerService!: ResumeCheckerService;
  public fileStorageService!: FileStorageService;

  // Use Cases
  public createBidUseCase!: CreateBidUseCase;
  public rebidWithNewResumeUseCase!: RebidWithNewResumeUseCase;
  public scheduleInterviewUseCase!: ScheduleInterviewUseCase;
  public completeInterviewUseCase!: CompleteInterviewUseCase;

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
    }

    // Initialize domain services
    this.duplicationDetectionPolicy = new DuplicationDetectionPolicy();
    this.interviewEligibilityPolicy = new InterviewEligibilityPolicy();
    this.resumeCheckerService = new ResumeCheckerService();
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

    console.log('Container initialized successfully');
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down container...');

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
