/**
 * SkillReviewQueue - Unit Tests
 * 
 * Tests specific examples and edge cases for the SkillReviewQueue aggregate root.
 * Complements property-based tests with concrete scenarios.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6
 */

import { SkillReviewQueue } from './SkillReviewQueue';

describe('SkillReviewQueue - Unit Tests', () => {
  
  describe('Creation and Initialization', () => {
    it('should create an empty queue', () => {
      const queue = SkillReviewQueue.create();
      
      expect(queue.getQueueItems()).toEqual([]);
    });

    it('should create queue from existing items', () => {
      const items = [
        {
          skillName: 'react',
          frequency: 3,
          firstDetectedAt: new Date('2024-01-01'),
          detectedIn: ['jd1', 'jd2'],
          status: 'pending' as const
        },
        {
          skillName: 'vue',
          frequency: 1,
          firstDetectedAt: new Date('2024-01-02'),
          detectedIn: ['jd3'],
          status: 'pending' as const
        }
      ];
      
      const queue = SkillReviewQueue.fromItems(items);
      const queueItems = queue.getQueueItems();
      
      expect(queueItems).toHaveLength(2);
      expect(queueItems.map(i => i.skillName)).toContain('react');
      expect(queueItems.map(i => i.skillName)).toContain('vue');
    });
  });

  describe('Adding Unknown Skills', () => {
    let queue: SkillReviewQueue;

    beforeEach(() => {
      queue = SkillReviewQueue.create();
    });

    it('should add a new unknown skill', () => {
      queue.addUnknownSkill('react', 'jd-123');
      
      const items = queue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].skillName).toBe('react');
      expect(items[0].frequency).toBe(1);
      expect(items[0].detectedIn).toEqual(['jd-123']);
      expect(items[0].status).toBe('pending');
      expect(items[0].firstDetectedAt).toBeInstanceOf(Date);
    });

    it('should normalize skill names to lowercase', () => {
      queue.addUnknownSkill('React', 'jd-123');
      
      const item = queue.getItemByName('react');
      expect(item).not.toBeNull();
      expect(item!.skillName).toBe('react');
    });

    it('should trim whitespace from skill names', () => {
      queue.addUnknownSkill('  react  ', 'jd-123');
      
      const item = queue.getItemByName('react');
      expect(item).not.toBeNull();
      expect(item!.skillName).toBe('react');
    });

    it('should throw error for empty skill name', () => {
      expect(() => queue.addUnknownSkill('', 'jd-123')).toThrow(/Skill name cannot be empty/);
      expect(() => queue.addUnknownSkill('   ', 'jd-123')).toThrow(/Skill name cannot be empty/);
    });

    it('should increment frequency for duplicate skills', () => {
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('react', 'jd-456');
      queue.addUnknownSkill('react', 'jd-789');
      
      const item = queue.getItemByName('react');
      expect(item!.frequency).toBe(3);
    });

    it('should track all detection sources', () => {
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('react', 'jd-456');
      queue.addUnknownSkill('react', 'jd-789');
      
      const item = queue.getItemByName('react');
      expect(item!.detectedIn).toHaveLength(3);
      expect(item!.detectedIn).toContain('jd-123');
      expect(item!.detectedIn).toContain('jd-456');
      expect(item!.detectedIn).toContain('jd-789');
    });

    it('should not duplicate detection sources', () => {
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('react', 'jd-123');
      
      const item = queue.getItemByName('react');
      expect(item!.frequency).toBe(3);
      expect(item!.detectedIn).toHaveLength(1);
      expect(item!.detectedIn).toEqual(['jd-123']);
    });
  });

  describe('Approving Skills as Canonical', () => {
    let queue: SkillReviewQueue;

    beforeEach(() => {
      queue = SkillReviewQueue.create();
      queue.addUnknownSkill('react', 'jd-123');
    });

    it('should approve a skill as canonical', () => {
      const decision = queue.approveAsCanonical('react', 'frontend');
      
      expect(decision.skillName).toBe('react');
      expect(decision.decision).toBe('canonical');
      expect(decision.canonicalName).toBe('react');
      expect(decision.category).toBe('frontend');
      expect(decision.approvedAt).toBeInstanceOf(Date);
    });

    it('should mark skill as approved after approval', () => {
      queue.approveAsCanonical('react', 'frontend');
      
      const item = queue.getItemByName('react');
      expect(item!.status).toBe('approved');
    });

    it('should throw error for non-existent skill', () => {
      expect(() => queue.approveAsCanonical('vue', 'frontend'))
        .toThrow(/not found in queue/);
    });

    it('should throw error when approving already approved skill', () => {
      queue.approveAsCanonical('react', 'frontend');
      
      expect(() => queue.approveAsCanonical('react', 'frontend'))
        .toThrow(/already been approved/);
    });

    it('should throw error when approving rejected skill', () => {
      queue.reject('react', 'Not a real skill');
      
      expect(() => queue.approveAsCanonical('react', 'frontend'))
        .toThrow(/already been rejected/);
    });
  });

  describe('Approving Skills as Variations', () => {
    let queue: SkillReviewQueue;

    beforeEach(() => {
      queue = SkillReviewQueue.create();
      queue.addUnknownSkill('reactjs', 'jd-123');
    });

    it('should approve a skill as variation', () => {
      const decision = queue.approveAsVariation('reactjs', 'react');
      
      expect(decision.skillName).toBe('reactjs');
      expect(decision.decision).toBe('variation');
      expect(decision.canonicalName).toBe('react');
      expect(decision.category).toBeUndefined();
      expect(decision.approvedAt).toBeInstanceOf(Date);
    });

    it('should mark skill as approved after variation approval', () => {
      queue.approveAsVariation('reactjs', 'react');
      
      const item = queue.getItemByName('reactjs');
      expect(item!.status).toBe('approved');
    });

    it('should normalize canonical name', () => {
      const decision = queue.approveAsVariation('reactjs', '  React  ');
      
      expect(decision.canonicalName).toBe('react');
    });

    it('should throw error for empty canonical name', () => {
      expect(() => queue.approveAsVariation('reactjs', ''))
        .toThrow(/Canonical name cannot be empty/);
      
      expect(() => queue.approveAsVariation('reactjs', '   '))
        .toThrow(/Canonical name cannot be empty/);
    });

    it('should throw error for non-existent skill', () => {
      expect(() => queue.approveAsVariation('vue', 'react'))
        .toThrow(/not found in queue/);
    });

    it('should throw error when approving already approved skill', () => {
      queue.approveAsVariation('reactjs', 'react');
      
      expect(() => queue.approveAsVariation('reactjs', 'react'))
        .toThrow(/already been approved/);
    });
  });

  describe('Rejecting Skills', () => {
    let queue: SkillReviewQueue;

    beforeEach(() => {
      queue = SkillReviewQueue.create();
      queue.addUnknownSkill('foobar', 'jd-123');
    });

    it('should reject a skill with reason', () => {
      const decision = queue.reject('foobar', 'Not a real technology');
      
      expect(decision.skillName).toBe('foobar');
      expect(decision.reason).toBe('Not a real technology');
      expect(decision.rejectedAt).toBeInstanceOf(Date);
    });

    it('should mark skill as rejected after rejection', () => {
      queue.reject('foobar', 'Not a real technology');
      
      const item = queue.getItemByName('foobar');
      expect(item!.status).toBe('rejected');
    });

    it('should trim rejection reason', () => {
      const decision = queue.reject('foobar', '  Not a real technology  ');
      
      expect(decision.reason).toBe('Not a real technology');
    });

    it('should throw error for empty rejection reason', () => {
      expect(() => queue.reject('foobar', ''))
        .toThrow(/Rejection reason cannot be empty/);
      
      expect(() => queue.reject('foobar', '   '))
        .toThrow(/Rejection reason cannot be empty/);
    });

    it('should throw error for non-existent skill', () => {
      expect(() => queue.reject('nonexistent', 'Some reason'))
        .toThrow(/not found in queue/);
    });

    it('should throw error when rejecting already rejected skill', () => {
      queue.reject('foobar', 'Not a real technology');
      
      expect(() => queue.reject('foobar', 'Still not real'))
        .toThrow(/already been rejected/);
    });

    it('should throw error when rejecting approved skill', () => {
      queue.approveAsCanonical('foobar', 'others');
      
      expect(() => queue.reject('foobar', 'Changed my mind'))
        .toThrow(/already been approved/);
    });
  });

  describe('Query Methods', () => {
    let queue: SkillReviewQueue;

    beforeEach(() => {
      queue = SkillReviewQueue.create();
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('vue', 'jd-456');
      queue.addUnknownSkill('angular', 'jd-789');
    });

    it('should check if skill exists in queue', () => {
      expect(queue.hasSkill('react')).toBe(true);
      expect(queue.hasSkill('vue')).toBe(true);
      expect(queue.hasSkill('svelte')).toBe(false);
    });

    it('should be case-insensitive when checking existence', () => {
      expect(queue.hasSkill('React')).toBe(true);
      expect(queue.hasSkill('REACT')).toBe(true);
      expect(queue.hasSkill('ReAcT')).toBe(true);
    });

    it('should get item by name', () => {
      const item = queue.getItemByName('react');
      
      expect(item).not.toBeNull();
      expect(item!.skillName).toBe('react');
      expect(item!.frequency).toBe(1);
      expect(item!.detectedIn).toEqual(['jd-123']);
    });

    it('should return null for non-existent skill', () => {
      const item = queue.getItemByName('nonexistent');
      
      expect(item).toBeNull();
    });

    it('should return immutable copy of item', () => {
      const item1 = queue.getItemByName('react');
      const item2 = queue.getItemByName('react');
      
      expect(item1).not.toBe(item2);
      expect(item1!.detectedIn).not.toBe(item2!.detectedIn);
    });

    it('should get all queue items', () => {
      const items = queue.getQueueItems();
      
      expect(items).toHaveLength(3);
      expect(items.map(i => i.skillName)).toContain('react');
      expect(items.map(i => i.skillName)).toContain('vue');
      expect(items.map(i => i.skillName)).toContain('angular');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('react', 'jd-123');
      queue.addUnknownSkill('vue', 'jd-456');
      
      const json = queue.toJSON();
      
      expect(json.items).toHaveLength(2);
      expect(json.items[0].skillName).toBeTruthy();
      expect(json.items[0].frequency).toBeGreaterThan(0);
      expect(json.items[0].detectedIn).toBeTruthy();
      expect(json.items[0].status).toBeTruthy();
    });

    it('should round-trip through JSON', () => {
      const original = SkillReviewQueue.create();
      original.addUnknownSkill('react', 'jd-123');
      original.addUnknownSkill('vue', 'jd-456');
      original.approveAsCanonical('react', 'frontend');
      
      const json = original.toJSON();
      const restored = SkillReviewQueue.fromItems(json.items);
      
      expect(restored.getQueueItems()).toHaveLength(2);
      expect(restored.hasSkill('react')).toBe(true);
      expect(restored.hasSkill('vue')).toBe(true);
      expect(restored.getItemByName('react')!.status).toBe('approved');
      expect(restored.getItemByName('vue')!.status).toBe('pending');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple skills with different statuses', () => {
      const queue = SkillReviewQueue.create();
      
      queue.addUnknownSkill('react', 'jd-1');
      queue.addUnknownSkill('vue', 'jd-2');
      queue.addUnknownSkill('angular', 'jd-3');
      queue.addUnknownSkill('svelte', 'jd-4');
      
      queue.approveAsCanonical('react', 'frontend');
      queue.approveAsVariation('vue', 'react');
      queue.reject('angular', 'Too complex');
      // svelte remains pending
      
      const items = queue.getQueueItems();
      expect(items).toHaveLength(4);
      
      const statusCounts = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(statusCounts.approved).toBe(2);
      expect(statusCounts.rejected).toBe(1);
      expect(statusCounts.pending).toBe(1);
    });

    it('should handle skills detected in many JDs', () => {
      const queue = SkillReviewQueue.create();
      
      for (let i = 1; i <= 100; i++) {
        queue.addUnknownSkill('react', `jd-${i}`);
      }
      
      const item = queue.getItemByName('react');
      expect(item!.frequency).toBe(100);
      expect(item!.detectedIn).toHaveLength(100);
    });

    it('should handle empty queue operations', () => {
      const queue = SkillReviewQueue.create();
      
      expect(queue.getQueueItems()).toEqual([]);
      expect(queue.hasSkill('anything')).toBe(false);
      expect(queue.getItemByName('anything')).toBeNull();
    });
  });
});
