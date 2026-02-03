/**
 * ReviewUnknownSkillsUseCase - Application use case for reviewing unknown skills
 * 
 * Provides operations to review, approve, and reject unknown skills from the review queue.
 * Coordinates between the skill review queue and the skill dictionary.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.3, 5.4, 5.5, 5.6, 9.12, 9.13
 */

import { ISkillReviewQueueRepository } from './ISkillReviewQueueRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { UnknownSkillItem, TechLayer, ApprovalDecision, RejectionDecision } from '../domain/JDSpecTypes';

export class ReviewUnknownSkillsUseCase {
  constructor(
    private readonly reviewQueueRepository: ISkillReviewQueueRepository,
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {}

  /**
   * Get all items in the review queue
   * @returns Array of unknown skills awaiting review
   */
  async getQueueItems(): Promise<UnknownSkillItem[]> {
    const queue = await this.reviewQueueRepository.get();
    return queue.getQueueItems();
  }

  /**
   * Approve an unknown skill as a new canonical skill
   * @param skillName - The skill name to approve
   * @param category - The tech layer category for the new canonical skill
   * @returns The approval decision
   */
  async approveAsCanonical(skillName: string, category: TechLayer): Promise<ApprovalDecision> {
    // Get the review queue
    const queue = await this.reviewQueueRepository.get();
    
    // Approve the skill in the queue
    const decision = queue.approveAsCanonical(skillName, category);
    
    // Get the current dictionary
    let dictionary = await this.dictionaryRepository.getCurrent();
    
    // Add the skill as a new canonical skill
    dictionary.addCanonicalSkill(skillName, category);
    
    // Increment dictionary version (returns new instance)
    dictionary = dictionary.withIncrementedVersion();
    
    // Save both the queue and dictionary
    await this.reviewQueueRepository.save(queue);
    await this.dictionaryRepository.save(dictionary);
    
    return decision;
  }

  /**
   * Approve an unknown skill as a variation of an existing canonical skill
   * @param skillName - The skill name to approve
   * @param canonicalName - The canonical skill name this is a variation of
   * @returns The approval decision
   */
  async approveAsVariation(skillName: string, canonicalName: string): Promise<ApprovalDecision> {
    // Get the review queue
    const queue = await this.reviewQueueRepository.get();
    
    // Get the current dictionary
    let dictionary = await this.dictionaryRepository.getCurrent();
    
    // Verify the canonical skill exists
    const canonicalSkill = dictionary.getCanonicalSkill(canonicalName);
    if (!canonicalSkill) {
      throw new Error(`Canonical skill '${canonicalName}' not found in dictionary`);
    }
    
    // Approve the skill in the queue
    const decision = queue.approveAsVariation(skillName, canonicalName);
    
    // Add the skill as a variation (variation first, then canonical)
    dictionary.addSkillVariation(skillName, canonicalName);
    
    // Increment dictionary version (returns new instance)
    dictionary = dictionary.withIncrementedVersion();
    
    // Save both the queue and dictionary
    await this.reviewQueueRepository.save(queue);
    await this.dictionaryRepository.save(dictionary);
    
    return decision;
  }

  /**
   * Reject an unknown skill
   * @param skillName - The skill name to reject
   * @param reason - The reason for rejection
   * @returns The rejection decision
   */
  async rejectSkill(skillName: string, reason: string): Promise<RejectionDecision> {
    // Get the review queue
    const queue = await this.reviewQueueRepository.get();
    
    // Reject the skill in the queue
    const decision = queue.reject(skillName, reason);
    
    // Save the queue
    await this.reviewQueueRepository.save(queue);
    
    return decision;
  }
}
