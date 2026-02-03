/**
 * SkillReviewQueue - Aggregate root for unknown skills review queue
 * 
 * Manages unknown skills awaiting human review and approval.
 * Prevents duplicate entries and tracks skill frequency.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { TechLayer, UnknownSkillItem, ApprovalDecision, RejectionDecision } from './JDSpecTypes';

export class SkillReviewQueue {
  private readonly items: Map<string, UnknownSkillItem>;

  private constructor(items: Map<string, UnknownSkillItem>) {
    this.items = items;
  }

  /**
   * Create a new empty review queue
   */
  static create(): SkillReviewQueue {
    return new SkillReviewQueue(new Map<string, UnknownSkillItem>());
  }

  /**
   * Create a review queue from existing items
   */
  static fromItems(items: UnknownSkillItem[]): SkillReviewQueue {
    const itemsMap = new Map<string, UnknownSkillItem>();
    
    for (const item of items) {
      const normalizedName = item.skillName.toLowerCase().trim();
      itemsMap.set(normalizedName, {
        ...item,
        skillName: normalizedName
      });
    }
    
    return new SkillReviewQueue(itemsMap);
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  /**
   * Add an unknown skill to the review queue
   * If the skill already exists, increment its frequency and add the detection source
   */
  addUnknownSkill(skillName: string, detectedIn: string): void {
    const normalizedName = skillName.toLowerCase().trim();
    
    if (!normalizedName) {
      throw new Error('Skill name cannot be empty');
    }
    
    const existing = this.items.get(normalizedName);
    
    if (existing) {
      // Skill already in queue - increment frequency and add source if not already present
      if (!existing.detectedIn.includes(detectedIn)) {
        existing.detectedIn.push(detectedIn);
      }
      existing.frequency += 1;
    } else {
      // New skill - add to queue
      this.items.set(normalizedName, {
        skillName: normalizedName,
        frequency: 1,
        firstDetectedAt: new Date(),
        detectedIn: [detectedIn],
        status: 'pending'
      });
    }
  }

  /**
   * Get all items in the review queue
   */
  getQueueItems(): UnknownSkillItem[] {
    return Array.from(this.items.values()).map(item => ({
      ...item,
      detectedIn: [...item.detectedIn],
      firstDetectedAt: new Date(item.firstDetectedAt)
    }));
  }

  /**
   * Approve an unknown skill as a new canonical skill
   */
  approveAsCanonical(skillName: string, category: TechLayer): ApprovalDecision {
    const normalizedName = skillName.toLowerCase().trim();
    
    const item = this.items.get(normalizedName);
    if (!item) {
      throw new Error(`Unknown skill '${normalizedName}' not found in queue`);
    }
    
    if (item.status !== 'pending') {
      throw new Error(`Skill '${normalizedName}' has already been ${item.status}`);
    }
    
    // Mark as approved
    item.status = 'approved';
    
    return {
      skillName: normalizedName,
      decision: 'canonical',
      canonicalName: normalizedName,
      category,
      approvedAt: new Date()
    };
  }

  /**
   * Approve an unknown skill as a variation of an existing canonical skill
   */
  approveAsVariation(skillName: string, canonicalName: string): ApprovalDecision {
    const normalizedName = skillName.toLowerCase().trim();
    const normalizedCanonical = canonicalName.toLowerCase().trim();
    
    if (!normalizedCanonical) {
      throw new Error('Canonical name cannot be empty');
    }
    
    const item = this.items.get(normalizedName);
    if (!item) {
      throw new Error(`Unknown skill '${normalizedName}' not found in queue`);
    }
    
    if (item.status !== 'pending') {
      throw new Error(`Skill '${normalizedName}' has already been ${item.status}`);
    }
    
    // Mark as approved
    item.status = 'approved';
    
    return {
      skillName: normalizedName,
      decision: 'variation',
      canonicalName: normalizedCanonical,
      approvedAt: new Date()
    };
  }

  /**
   * Reject an unknown skill
   */
  reject(skillName: string, reason: string): RejectionDecision {
    const normalizedName = skillName.toLowerCase().trim();
    
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason cannot be empty');
    }
    
    const item = this.items.get(normalizedName);
    if (!item) {
      throw new Error(`Unknown skill '${normalizedName}' not found in queue`);
    }
    
    if (item.status !== 'pending') {
      throw new Error(`Skill '${normalizedName}' has already been ${item.status}`);
    }
    
    // Mark as rejected
    item.status = 'rejected';
    
    return {
      skillName: normalizedName,
      reason: reason.trim(),
      rejectedAt: new Date()
    };
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Check if a skill exists in the queue
   */
  hasSkill(skillName: string): boolean {
    const normalizedName = skillName.toLowerCase().trim();
    return this.items.has(normalizedName);
  }

  /**
   * Get a specific item by skill name
   */
  getItemByName(skillName: string): UnknownSkillItem | null {
    const normalizedName = skillName.toLowerCase().trim();
    const item = this.items.get(normalizedName);
    
    if (!item) {
      return null;
    }
    
    return {
      ...item,
      detectedIn: [...item.detectedIn],
      firstDetectedAt: new Date(item.firstDetectedAt)
    };
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Serialize to JSON
   */
  toJSON(): { items: UnknownSkillItem[] } {
    return {
      items: this.getQueueItems()
    };
  }
}
