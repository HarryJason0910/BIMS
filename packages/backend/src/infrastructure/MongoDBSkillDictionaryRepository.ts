/**
 * MongoDBSkillDictionaryRepository - MongoDB implementation of ISkillDictionaryRepository
 * 
 * Handles persistence of skill dictionaries with versioning support.
 * Pure data mapping with no business logic.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.6, 3.4, 3.5, 9.7
 */

import { Collection, ObjectId } from 'mongodb';
import { ISkillDictionaryRepository } from '../application/ISkillDictionaryRepository';
import { SkillDictionary } from '../domain/SkillDictionary';
import { SkillDictionaryJSON } from '../domain/JDSpecTypes';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for Skill Dictionary
 */
interface SkillDictionaryDocument {
  _id: ObjectId;
  version: string;
  skills: Array<{
    name: string;
    category: string;
    createdAt: Date;
  }>;
  variations: Array<{
    variation: string;
    canonical: string;
  }>;
  createdAt: Date;
}

/**
 * MongoDB implementation of ISkillDictionaryRepository
 */
export class MongoDBSkillDictionaryRepository implements ISkillDictionaryRepository {
  private collection: Collection<SkillDictionaryDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<SkillDictionaryDocument>('skill_dictionaries');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ version: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating skill dictionary indexes:', error);
    }
  }

  /**
   * Convert domain SkillDictionary to MongoDB document
   */
  private toDocument(dictionary: SkillDictionary): Omit<SkillDictionaryDocument, '_id'> {
    const json = dictionary.toJSON();
    return {
      version: json.version,
      skills: json.skills.map(skill => ({
        name: skill.name,
        category: skill.category,
        createdAt: new Date(skill.createdAt),
      })),
      variations: json.variations,
      createdAt: new Date(json.createdAt),
    };
  }

  /**
   * Convert MongoDB document to domain SkillDictionary
   */
  private toDomain(doc: SkillDictionaryDocument): SkillDictionary {
    const json: SkillDictionaryJSON = {
      version: doc.version,
      skills: doc.skills.map(skill => ({
        name: skill.name,
        category: skill.category as any,
        createdAt: skill.createdAt.toISOString(),
      })),
      variations: doc.variations,
      createdAt: doc.createdAt.toISOString(),
    };
    
    return SkillDictionary.fromJSON(json);
  }

  async save(dictionary: SkillDictionary): Promise<void> {
    const doc = this.toDocument(dictionary);
    
    await this.collection.insertOne({
      _id: new ObjectId(),
      ...doc,
    } as SkillDictionaryDocument);
  }

  async getCurrent(): Promise<SkillDictionary> {
    // Get the most recent dictionary by createdAt
    const doc = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (doc.length === 0) {
      // Return a new empty dictionary if none exists
      return SkillDictionary.create('2024.1');
    }
    
    return this.toDomain(doc[0]);
  }

  async getVersion(version: string): Promise<SkillDictionary | null> {
    const doc = await this.collection.findOne({ version });
    return doc ? this.toDomain(doc) : null;
  }

  async getAllVersions(): Promise<SkillDictionary[]> {
    const docs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return docs.map(doc => this.toDomain(doc));
  }
}
