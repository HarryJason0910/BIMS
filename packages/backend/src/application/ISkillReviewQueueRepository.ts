/**
 * ISkillReviewQueueRepository - Repository interface for Skill Review Queue
 * 
 * Defines the contract for persisting and retrieving the skill review queue.
 * The queue is a singleton entity that tracks all unknown skills awaiting review.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 9.12, 5.1
 */

import { SkillReviewQueue } from '../domain/SkillReviewQueue';

export interface ISkillReviewQueueRepository {
  /**
   * Save the skill review queue
   * @param queue - The skill review queue to save
   */
  save(queue: SkillReviewQueue): Promise<void>;

  /**
   * Get the skill review queue
   * @returns The skill review queue (creates empty queue if none exists)
   */
  get(): Promise<SkillReviewQueue>;
}
