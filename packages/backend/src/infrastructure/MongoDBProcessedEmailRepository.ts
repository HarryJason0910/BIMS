import { Collection, ObjectId } from 'mongodb';
import { IProcessedEmailRepository } from '../application/IProcessedEmailRepository';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for ProcessedEmail
 * Simple key-value storage for tracking processed emails
 */
interface ProcessedEmailDocument {
  _id: ObjectId;
  emailId: string;
  processedAt: Date;
}

/**
 * MongoDB implementation of IProcessedEmailRepository
 * Tracks which emails have been processed to ensure idempotency
 */
export class MongoDBProcessedEmailRepository implements IProcessedEmailRepository {
  private collection: Collection<ProcessedEmailDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<ProcessedEmailDocument>('processed_emails');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ emailId: 1 }, { unique: true });
      await this.collection.createIndex({ processedAt: -1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  /**
   * Mark an email as processed
   * Uses upsert to handle duplicate calls gracefully
   */
  async markAsProcessed(emailId: string): Promise<void> {
    await this.collection.updateOne(
      { emailId },
      {
        $set: {
          emailId,
          processedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  /**
   * Check if an email has been processed
   * Returns true if the email ID exists in the collection
   */
  async isProcessed(emailId: string): Promise<boolean> {
    const doc = await this.collection.findOne({ emailId });
    return doc !== null;
  }
}
