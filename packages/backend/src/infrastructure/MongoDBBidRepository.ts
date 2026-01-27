import { Collection, ObjectId } from 'mongodb';
import { IBidRepository, BidFilterOptions, BidSortOptions } from '../application/IBidRepository';
import { Bid, BidStatus, ResumeCheckerType } from '../domain/Bid';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for Bid
 * Maps domain Bid to MongoDB document structure
 */
interface BidDocument {
  _id: ObjectId;
  date: Date;
  link: string;
  company: string;
  client: string;
  role: string;
  mainStacks: string[];
  jobDescriptionPath: string;
  resumePath: string;
  bidStatus: string;
  interviewWinning: boolean;
  bidDetail: string;
  resumeChecker: string | null;
  originalBidId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB implementation of IBidRepository
 * Pure data mapping with no business logic
 */
export class MongoDBBidRepository implements IBidRepository {
  private collection: Collection<BidDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<BidDocument>('bids');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ link: 1 });
      await this.collection.createIndex({ company: 1, role: 1 });
      await this.collection.createIndex({ bidStatus: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  /**
   * Convert domain Bid to MongoDB document
   */
  private toDocument(bid: Bid): Omit<BidDocument, '_id'> {
    const json = bid.toJSON();
    return {
      date: json.date,
      link: json.link,
      company: json.company,
      client: json.client,
      role: json.role,
      mainStacks: json.mainStacks,
      jobDescriptionPath: json.jobDescriptionPath,
      resumePath: json.resumePath,
      bidStatus: json.bidStatus,
      interviewWinning: json.interviewWinning,
      bidDetail: json.bidDetail,
      resumeChecker: json.resumeChecker,
      originalBidId: json.originalBidId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert MongoDB document to domain Bid
   * Uses reflection to reconstruct the Bid object with private fields
   */
  private toDomain(doc: BidDocument): Bid {
    // Create a bid using the static factory method first
    const bid = Bid.create({
      link: doc.link,
      company: doc.company,
      client: doc.client,
      role: doc.role,
      mainStacks: doc.mainStacks,
      jobDescriptionPath: doc.jobDescriptionPath,
      resumePath: doc.resumePath,
      originalBidId: doc.originalBidId || undefined,
    });

    // Use Object.defineProperty to set private fields and readonly fields
    Object.defineProperty(bid, 'id', { value: doc._id.toString(), writable: false });
    Object.defineProperty(bid, 'date', { value: doc.date, writable: false });
    Object.defineProperty(bid, '_bidStatus', { value: doc.bidStatus as BidStatus, writable: true });
    Object.defineProperty(bid, '_interviewWinning', { value: doc.interviewWinning, writable: true });
    Object.defineProperty(bid, '_bidDetail', { value: doc.bidDetail, writable: true });
    Object.defineProperty(bid, '_resumeChecker', { 
      value: doc.resumeChecker ? (doc.resumeChecker as ResumeCheckerType) : null, 
      writable: true 
    });

    return bid;
  }

  async save(bid: Bid): Promise<void> {
    const json = bid.toJSON();
    const doc = this.toDocument(bid);
    
    await this.collection.insertOne({
      _id: new ObjectId(json.id.replace('bid-', '')),
      ...doc,
    } as BidDocument);
  }

  async findById(id: string): Promise<Bid | null> {
    try {
      const doc = await this.collection.findOne({ 
        _id: new ObjectId(id.replace('bid-', '')) 
      });
      return doc ? this.toDomain(doc) : null;
    } catch (error) {
      // Invalid ObjectId format
      return null;
    }
  }

  async findAll(filters?: BidFilterOptions, sort?: BidSortOptions): Promise<Bid[]> {
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
        query.bidStatus = filters.status;
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
      const sortField = sort.field === 'bidStatus' ? 'bidStatus' : sort.field;
      sortOptions[sortField] = sort.order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default sort by creation date descending
    }

    const docs = await this.collection.find(query).sort(sortOptions).toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async findByCompanyAndRole(company: string, role: string): Promise<Bid[]> {
    const docs = await this.collection.find({
      company: { $regex: new RegExp(`^${company}$`, 'i') },
      role: { $regex: new RegExp(`^${role}$`, 'i') },
    }).toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async findByLink(link: string): Promise<Bid | null> {
    const doc = await this.collection.findOne({ link });
    return doc ? this.toDomain(doc) : null;
  }

  async update(bid: Bid): Promise<void> {
    const json = bid.toJSON();
    const doc = this.toDocument(bid);
    
    await this.collection.updateOne(
      { _id: new ObjectId(json.id.replace('bid-', '')) },
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
      _id: new ObjectId(id.replace('bid-', '')) 
    });
  }
}
