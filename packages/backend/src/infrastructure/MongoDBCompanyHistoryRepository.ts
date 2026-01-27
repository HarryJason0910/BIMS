import { Collection, ObjectId } from 'mongodb';
import { ICompanyHistoryRepository } from '../application/ICompanyHistoryRepository';
import { CompanyHistory, CompanyRoleHistory } from '../domain/CompanyHistory';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for CompanyHistory
 * Maps domain CompanyHistory to MongoDB document structure
 */
interface CompanyHistoryDocument {
  _id: ObjectId;
  company: string;
  role: string;
  failures: {
    interviewId: string;
    date: Date;
    recruiter: string;
    attendees: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB implementation of ICompanyHistoryRepository
 * Pure data mapping with no business logic
 */
export class MongoDBCompanyHistoryRepository implements ICompanyHistoryRepository {
  private collection: Collection<CompanyHistoryDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<CompanyHistoryDocument>('company_history');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ company: 1, role: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  /**
   * Convert MongoDB documents to domain CompanyHistory
   */
  private toDomain(docs: CompanyHistoryDocument[]): CompanyHistory {
    const history = new CompanyHistory();
    
    for (const doc of docs) {
      for (const failure of doc.failures) {
        history.recordFailure(
          doc.company,
          doc.role,
          failure.recruiter,
          failure.attendees,
          failure.interviewId
        );
      }
    }
    
    return history;
  }

  /**
   * Save the entire company history
   * This will update or insert all company-role combinations
   */
  async save(_history: CompanyHistory): Promise<void> {
    // Since CompanyHistory doesn't expose its internal map,
    // we can't directly iterate over it. Instead, we'll need to
    // save individual company-role histories when they're updated.
    // For now, this is a no-op as we'll use saveCompanyRoleHistory instead.
  }

  /**
   * Save a specific company-role history
   * This is a helper method for saving individual entries
   */
  async saveCompanyRoleHistory(companyRoleHistory: CompanyRoleHistory): Promise<void> {
    
    await this.collection.updateOne(
      { 
        company: { $regex: new RegExp(`^${companyRoleHistory.company}$`, 'i') },
        role: { $regex: new RegExp(`^${companyRoleHistory.role}$`, 'i') }
      },
      {
        $set: {
          company: companyRoleHistory.company,
          role: companyRoleHistory.role,
          failures: companyRoleHistory.failures.map(f => ({
            interviewId: f.interviewId,
            date: f.date,
            recruiter: f.recruiter,
            attendees: f.attendees,
          })),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
  }

  /**
   * Find history for a specific company and role
   */
  async findByCompanyAndRole(company: string, role: string): Promise<CompanyRoleHistory | null> {
    const doc = await this.collection.findOne({
      company: { $regex: new RegExp(`^${company}$`, 'i') },
      role: { $regex: new RegExp(`^${role}$`, 'i') },
    });

    if (!doc) {
      return null;
    }

    return {
      company: doc.company,
      role: doc.role,
      failures: doc.failures.map(f => ({
        interviewId: f.interviewId,
        date: f.date,
        recruiter: f.recruiter,
        attendees: f.attendees,
      })),
    };
  }

  /**
   * Find all company histories
   * Returns a CompanyHistory object with all recorded failures
   */
  async findAll(): Promise<CompanyHistory> {
    const docs = await this.collection.find().toArray();
    return this.toDomain(docs);
  }

  /**
   * Record a single failure for a company and role
   * This is a convenience method that updates the history incrementally
   */
  async recordFailure(
    company: string,
    role: string,
    recruiter: string,
    attendees: string[],
    interviewId: string
  ): Promise<void> {
    const failureRecord = {
      interviewId,
      date: new Date(),
      recruiter,
      attendees,
    };

    await this.collection.updateOne(
      {
        company: { $regex: new RegExp(`^${company}$`, 'i') },
        role: { $regex: new RegExp(`^${role}$`, 'i') },
      },
      {
        $push: { failures: failureRecord },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          company,
          role,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
}
