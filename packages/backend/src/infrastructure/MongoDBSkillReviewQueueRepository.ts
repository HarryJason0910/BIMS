/**
 * MongoDBSkillReviewQueueRepository - MongoDB implementation of ISkillReviewQueueRepository
 * 
 * Handles persistence of the skill review queue (singleton entity).
 * Pure data mapping with no business logic.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.1, 9.12
 */

import { Collection } from 'mongodb';
import { ISkillReviewQueueRepository } from '../application/ISkillReviewQueueRepository';
import { SkillReviewQueue } from '../domain/SkillReviewQueue';
import { UnknownSkillItem } from '../domain/JDSpecTypes';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for Skill Review Queue
 * The queue is stored as a single document with an array of items
 */
interface SkillReviewQueueDocument {
  _id: string;
  items: Array<{
    skillName: string;
    frequency: number;
    firstDetectedAt: Date;
    detectedIn: string[];
    status: 'pending' | 'approved' | 'rejected';
  }>;
  updatedAt: Date;
}

/**
 * MongoDB implementation of ISkillReviewQueueRepository
 * The queue is a singleton - only one document exists in the collection
 */
export class MongoDBSkillReviewQueueRepository implements ISkillReviewQueueRepository {
  private collection: Collection<SkillReviewQueueDocument>;
  private static readonly QUEUE_ID = 'skill-review-queue';

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<SkillReviewQueueDocument>('skill_review_queue');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ updatedAt: -1 });
    } catch (error) {
      console.error('Error creating skill review queue indexes:', error);
    }
  }

  /**
   * Convert domain SkillReviewQueue to MongoDB document
   */
  private toDocument(queue: SkillReviewQueue): Omit<SkillReviewQueueDocument, '_id'> {
    const items = queue.getQueueItems();
    
    return {
      items: items.map(item => ({
        skillName: item.skillName,
        frequency: item.frequency,
        firstDetectedAt: item.firstDetectedAt,
        detectedIn: item.detectedIn,
        status: item.status,
      })),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert MongoDB document to domain SkillReviewQueue
   */
  private toDomain(doc: SkillReviewQueueDocument): SkillReviewQueue {
    const items: UnknownSkillItem[] = doc.items.map(item => ({
      skillName: item.skillName,
      frequency: item.frequency,
      firstDetectedAt: item.firstDetectedAt,
      detectedIn: item.detectedIn,
      status: item.status,
    }));
    
    return SkillReviewQueue.fromItems(items);
  }

  async save(queue: SkillReviewQueue): Promise<void> {
    const doc = this.toDocument(queue);
    
    // Upsert the singleton queue document
    await this.collection.updateOne(
      { _id: MongoDBSkillReviewQueueRepository.QUEUE_ID },
      { 
        $set: doc
      },
      { upsert: true }
    );
  }

  async get(): Promise<SkillReviewQueue> {
    const doc = await this.collection.findOne({ 
      _id: MongoDBSkillReviewQueueRepository.QUEUE_ID 
    });
    
    if (!doc) {
      // Return empty queue if none exists
      return SkillReviewQueue.create();
    }
    
    return this.toDomain(doc);
  }
}
