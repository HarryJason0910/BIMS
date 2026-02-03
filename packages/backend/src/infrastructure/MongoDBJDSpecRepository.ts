/**
 * MongoDBJDSpecRepository - MongoDB implementation of IJDSpecRepository
 * 
 * Handles persistence of canonical JD specifications with MongoDB.
 * Pure data mapping with no business logic.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 1.6, 9.2, 9.3, 9.5, 9.6
 */

import { Collection, ObjectId } from 'mongodb';
import { IJDSpecRepository } from '../application/IJDSpecRepository';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { LayerWeights, LayerSkills } from '../domain/JDSpecTypes';
import { MongoDBConnection } from './MongoDBConnection';

/**
 * MongoDB document interface for JD Specification
 * Maps domain CanonicalJDSpec to MongoDB document structure
 */
interface JDSpecDocument {
  _id: ObjectId;
  domainId: string; // Store the original domain ID
  role: string;
  layerWeights: LayerWeights;
  skills: LayerSkills;
  dictionaryVersion: string;
  createdAt: Date;
}

/**
 * MongoDB implementation of IJDSpecRepository
 */
export class MongoDBJDSpecRepository implements IJDSpecRepository {
  private collection: Collection<JDSpecDocument>;

  constructor() {
    const db = MongoDBConnection.getInstance().getDb();
    this.collection = db.collection<JDSpecDocument>('jd_specifications');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ domainId: 1 }, { unique: true });
      await this.collection.createIndex({ role: 1 });
      await this.collection.createIndex({ dictionaryVersion: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating JD spec indexes:', error);
    }
  }

  /**
   * Convert domain CanonicalJDSpec to MongoDB document
   */
  private toDocument(spec: CanonicalJDSpec): Omit<JDSpecDocument, '_id'> {
    const json = spec.toJSON();
    return {
      domainId: json._id,
      role: json.role,
      layerWeights: json.layerWeights,
      skills: json.skills,
      dictionaryVersion: json.dictionaryVersion,
      createdAt: new Date(json.createdAt),
    };
  }

  /**
   * Convert MongoDB document to domain CanonicalJDSpec
   */
  private toDomain(doc: JDSpecDocument): CanonicalJDSpec {
    const spec = CanonicalJDSpec.create({
      id: doc.domainId,
      role: doc.role,
      layerWeights: doc.layerWeights,
      skills: doc.skills,
      dictionaryVersion: doc.dictionaryVersion,
    });

    // Set the createdAt timestamp using Object.defineProperty
    Object.defineProperty(spec, 'createdAt', { 
      value: doc.createdAt, 
      writable: false 
    });

    return spec;
  }

  async save(spec: CanonicalJDSpec): Promise<void> {
    const doc = this.toDocument(spec);
    
    await this.collection.insertOne({
      _id: new ObjectId(),
      ...doc,
    } as JDSpecDocument);
  }

  async findById(id: string): Promise<CanonicalJDSpec | null> {
    const doc = await this.collection.findOne({ domainId: id });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<CanonicalJDSpec[]> {
    const docs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(doc => this.toDomain(doc));
  }

  async update(spec: CanonicalJDSpec): Promise<void> {
    const json = spec.toJSON();
    const doc = this.toDocument(spec);
    
    await this.collection.updateOne(
      { domainId: json._id },
      { $set: doc }
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ domainId: id });
  }
}
