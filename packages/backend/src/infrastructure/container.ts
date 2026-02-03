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
import { CancelInterviewUseCase } from '../application/CancelInterviewUseCase';
import { GetMatchingResumesUseCase } from '../application/GetMatchingResumesUseCase';
import { GetResumeFileUseCase } from '../application/GetResumeFileUseCase';
import { DuplicationDetectionPolicy } from '../domain/DuplicationDetectionPolicy';
import { InterviewEligibilityPolicy } from '../domain/InterviewEligibilityPolicy';
import { ResumeCheckerService } from '../domain/ResumeCheckerService';
import { CompanyHistory } from '../domain/CompanyHistory';
import { StackMatchCalculator } from '../domain/StackMatchCalculator';
import { IBidRepository } from '../application/IBidRepository';
import { IInterviewRepository } from '../application/IInterviewRepository';
import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';
import { IResumeRepository } from '../application/IResumeRepository';
import { FileSystemResumeRepository } from './FileSystemResumeRepository';
import { IJDSpecRepository } from '../application/IJDSpecRepository';
import { ISkillDictionaryRepository } from '../application/ISkillDictionaryRepository';
import { ISkillReviewQueueRepository } from '../application/ISkillReviewQueueRepository';
import { MongoDBJDSpecRepository } from './MongoDBJDSpecRepository';
import { MongoDBSkillDictionaryRepository } from './MongoDBSkillDictionaryRepository';
import { MongoDBSkillReviewQueueRepository } from './MongoDBSkillReviewQueueRepository';
import { CreateJDSpecUseCase } from '../application/CreateJDSpecUseCase';
import { CalculateCorrelationUseCase } from '../application/CalculateCorrelationUseCase';
import { CalculateResumeMatchRateUseCase } from '../application/CalculateResumeMatchRateUseCase';
import { ManageSkillDictionaryUseCase } from '../application/ManageSkillDictionaryUseCase';
import { ReviewUnknownSkillsUseCase } from '../application/ReviewUnknownSkillsUseCase';
import { ExportDictionaryUseCase } from '../application/ExportDictionaryUseCase';
import { ImportDictionaryUseCase } from '../application/ImportDictionaryUseCase';
import { SkillUsageStatisticsUseCase } from '../application/SkillUsageStatisticsUseCase';
import { CalculateBidMatchRateUseCase } from '../application/CalculateBidMatchRateUseCase';
import { JDCorrelationCalculator } from '../domain/JDCorrelationCalculator';
import { WeightedMatchRateCalculator } from '../domain/WeightedMatchRateCalculator';

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
  public resumeRepository!: IResumeRepository;
  public jdSpecRepository!: IJDSpecRepository;
  public skillDictionaryRepository!: ISkillDictionaryRepository;
  public skillReviewQueueRepository!: ISkillReviewQueueRepository;

  // Domain Services
  public duplicationDetectionPolicy!: DuplicationDetectionPolicy;
  public interviewEligibilityPolicy!: InterviewEligibilityPolicy;
  public resumeCheckerService!: ResumeCheckerService;
  public fileStorageService!: FileStorageService;
  public stackMatchCalculator!: StackMatchCalculator;
  public jdCorrelationCalculator!: JDCorrelationCalculator;
  public weightedMatchRateCalculator!: WeightedMatchRateCalculator;

  // Use Cases
  public createBidUseCase!: CreateBidUseCase;
  public rebidWithNewResumeUseCase!: RebidWithNewResumeUseCase;
  public scheduleInterviewUseCase!: ScheduleInterviewUseCase;
  public completeInterviewUseCase!: CompleteInterviewUseCase;
  public cancelInterviewUseCase!: CancelInterviewUseCase;
  public getMatchingResumesUseCase!: GetMatchingResumesUseCase;
  public getResumeFileUseCase!: GetResumeFileUseCase;
  public createJDSpecUseCase!: CreateJDSpecUseCase;
  public calculateCorrelationUseCase!: CalculateCorrelationUseCase;
  public calculateResumeMatchRateUseCase!: CalculateResumeMatchRateUseCase;
  public calculateBidMatchRateUseCase!: CalculateBidMatchRateUseCase;
  public manageSkillDictionaryUseCase!: ManageSkillDictionaryUseCase;
  public reviewUnknownSkillsUseCase!: ReviewUnknownSkillsUseCase;
  public exportDictionaryUseCase!: ExportDictionaryUseCase;
  public importDictionaryUseCase!: ImportDictionaryUseCase;
  public skillUsageStatisticsUseCase!: SkillUsageStatisticsUseCase;

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
      // Note: Enhanced skill matching repositories don't have in-memory implementations yet
      // They will need MongoDB for now
      throw new Error('In-memory mode not yet supported for enhanced skill matching features. Please use MongoDB.');
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
      this.jdSpecRepository = new MongoDBJDSpecRepository();
      this.skillDictionaryRepository = new MongoDBSkillDictionaryRepository();
      this.skillReviewQueueRepository = new MongoDBSkillReviewQueueRepository();
    }

    // Initialize domain services
    this.duplicationDetectionPolicy = new DuplicationDetectionPolicy();
    this.interviewEligibilityPolicy = new InterviewEligibilityPolicy();
    this.resumeCheckerService = new ResumeCheckerService();
    this.fileStorageService = new FileStorageService('./uploads');
    this.stackMatchCalculator = new StackMatchCalculator();
    this.jdCorrelationCalculator = new JDCorrelationCalculator();
    this.weightedMatchRateCalculator = new WeightedMatchRateCalculator();

    // Initialize resume repository (always uses file system, but gets metadata from bids)
    this.resumeRepository = new FileSystemResumeRepository('./uploads', this.bidRepository);

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
      this.interviewRepository,
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

    this.cancelInterviewUseCase = new CancelInterviewUseCase(
      this.interviewRepository,
      this.bidRepository,
      companyHistory,
      this.companyHistoryRepository
    );

    this.getMatchingResumesUseCase = new GetMatchingResumesUseCase(
      this.resumeRepository,
      this.stackMatchCalculator
    );

    this.getResumeFileUseCase = new GetResumeFileUseCase(
      this.resumeRepository
    );

    // Enhanced skill matching use cases
    this.createJDSpecUseCase = new CreateJDSpecUseCase(
      this.jdSpecRepository,
      this.skillDictionaryRepository,
      this.skillReviewQueueRepository
    );

    this.calculateCorrelationUseCase = new CalculateCorrelationUseCase(
      this.jdSpecRepository
    );

    this.calculateResumeMatchRateUseCase = new CalculateResumeMatchRateUseCase(
      this.jdSpecRepository,
      this.resumeRepository
    );

    this.calculateBidMatchRateUseCase = new CalculateBidMatchRateUseCase(
      this.bidRepository,
      this.weightedMatchRateCalculator
    );

    this.manageSkillDictionaryUseCase = new ManageSkillDictionaryUseCase(
      this.skillDictionaryRepository
    );

    this.reviewUnknownSkillsUseCase = new ReviewUnknownSkillsUseCase(
      this.skillReviewQueueRepository,
      this.skillDictionaryRepository
    );

    this.exportDictionaryUseCase = new ExportDictionaryUseCase(
      this.skillDictionaryRepository
    );

    this.importDictionaryUseCase = new ImportDictionaryUseCase(
      this.skillDictionaryRepository
    );

    this.skillUsageStatisticsUseCase = new SkillUsageStatisticsUseCase(
      this.jdSpecRepository,
      this.resumeRepository,
      this.skillDictionaryRepository
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
