import { Collection, ObjectId } from 'mongodb';
import { IInterviewRepository, InterviewFilterOptions, InterviewSortOptions, InterviewPaginationOptions, PaginatedInterviews } from '../application/IInterviewRepository';
import { Interview, InterviewBase, InterviewStatus, InterviewType } from '../domain/Interview';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for Interview
 * Maps domain Interview to MongoDB document structure
 */
interface InterviewDocument {
  _id: ObjectId;
  date: Date;
  base: string;
  company: string;
  client: string;
  role: string;
  jobDescription: string;
  resume: string;
  interviewType: string;
  recruiter: string;
  attendees: string[];
  status: string;
  detail: string;
  failureReason: string | null;
  bidId: string | null;
  hasScheduledNext: boolean;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB implementation of IInterviewRepository
 * Pure data mapping with no business logic
 */
export class MongoDBInterviewRepository implements IInterviewRepository {
  private collection: Collection<InterviewDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<InterviewDocument>('interviews');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ company: 1, role: 1 });
      await this.collection.createIndex({ bidId: 1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  /**
   * Convert domain Interview to MongoDB document
   */
  private toDocument(interview: Interview): Omit<InterviewDocument, '_id'> {
    const json = interview.toJSON();
    return {
      date: json.date,
      base: json.base,
      company: json.company,
      client: json.client,
      role: json.role,
      jobDescription: json.jobDescription,
      resume: json.resume,
      interviewType: json.interviewType,
      recruiter: json.recruiter,
      attendees: json.attendees,
      status: json.status,
      detail: json.detail,
      failureReason: json.failureReason,
      bidId: json.bidId,
      hasScheduledNext: json.hasScheduledNext,
      cancellationReason: json.cancellationReason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert MongoDB document to domain Interview
   * Uses reflection to reconstruct the Interview object with private fields
   */
  private toDomain(doc: InterviewDocument): Interview {
    // Create an interview using the static factory method first
    const interview = Interview.create({
      base: doc.base as InterviewBase,
      company: doc.company,
      client: doc.client,
      role: doc.role,
      jobDescription: doc.jobDescription,
      resume: doc.resume,
      interviewType: doc.interviewType as InterviewType,
      recruiter: doc.recruiter,
      attendees: doc.attendees,
      detail: doc.detail,
      bidId: doc.bidId || undefined,
      date: doc.date, // Pass the stored date from database
    });

    // Use Object.defineProperty to set private fields and readonly fields
    Object.defineProperty(interview, 'id', { value: doc._id.toString(), writable: false });
    // Note: date is already set correctly in Interview.create() above
    Object.defineProperty(interview, '_status', { value: doc.status as InterviewStatus, writable: true });
    Object.defineProperty(interview, '_detail', { value: doc.detail, writable: true });
    Object.defineProperty(interview, '_failureReason', { value: doc.failureReason, writable: true });
    Object.defineProperty(interview, '_hasScheduledNext', { value: doc.hasScheduledNext || false, writable: true });
    Object.defineProperty(interview, '_cancellationReason', { value: doc.cancellationReason || null, writable: true });

    return interview;
  }

  async save(interview: Interview): Promise<void> {
    const json = interview.toJSON();
    const doc = this.toDocument(interview);
    
    await this.collection.insertOne({
      _id: new ObjectId(json.id.replace('interview-', '')),
      ...doc,
    } as InterviewDocument);
  }

  async findById(id: string): Promise<Interview | null> {
    try {
      const doc = await this.collection.findOne({ 
        _id: new ObjectId(id.replace('interview-', '')) 
      });
      return doc ? this.toDomain(doc) : null;
    } catch (error) {
      // Invalid ObjectId format
      return null;
    }
  }

  async findAll(filters?: InterviewFilterOptions, sort?: InterviewSortOptions): Promise<Interview[]> {
    const query: any = {};

    // Apply filters
    if (filters) {
      if (filters.company) {
        query.company = { $regex: new RegExp(filters.company, 'i') };
      }
      if (filters.role) {
        query.role = { $regex: new RegExp(filters.role, 'i') };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.recruiter) {
        query.recruiter = { $regex: new RegExp(filters.recruiter, 'i') };
      }
      if (filters.interviewType) {
        query.interviewType = filters.interviewType;
      }
      if (filters.attendees) {
        query.attendees = { $elemMatch: { $regex: new RegExp(filters.attendees, 'i') } };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      }
    }

    // Build sort options
    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort.field] = sort.order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default sort by creation date descending
    }

    const docs = await this.collection.find(query).sort(sortOptions).toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async findByCompanyAndRole(company: string, role: string): Promise<Interview[]> {
    const docs = await this.collection.find({
      company: { $regex: new RegExp(`^${company}`, 'i') },
      role: { $regex: new RegExp(`^${role}`, 'i') },
    }).toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async findByBidId(bidId: string): Promise<Interview[]> {
    const docs = await this.collection.find({ bidId }).toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async update(interview: Interview): Promise<void> {
    const json = interview.toJSON();
    const doc = this.toDocument(interview);
    
    await this.collection.updateOne(
      { _id: new ObjectId(json.id.replace('interview-', '')) },
      { 
        $set: {
          ...doc,
          updatedAt: new Date(),
        }
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ 
      _id: new ObjectId(id.replace('interview-', '')) 
    });
  }

  async findAllPaginated(filters?: InterviewFilterOptions, sort?: InterviewSortOptions, pagination?: InterviewPaginationOptions): Promise<PaginatedInterviews> {
    const query: any = {};

    // Apply filters (same as findAll)
    if (filters) {
      if (filters.company) {
        query.company = { $regex: new RegExp(filters.company, 'i') };
      }
      if (filters.role) {
        query.role = { $regex: new RegExp(filters.role, 'i') };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.recruiter) {
        query.recruiter = { $regex: new RegExp(filters.recruiter, 'i') };
      }
      if (filters.interviewType) {
        query.interviewType = filters.interviewType;
      }
      if (filters.attendees) {
        query.attendees = { $elemMatch: { $regex: new RegExp(filters.attendees, 'i') } };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      }
    }

    // Build sort options
    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort.field] = sort.order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Get total count
    const total = await this.collection.countDocuments(query);

    // Apply pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const docs = await this.collection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return {
      items: docs.map(doc => this.toDomain(doc)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}
