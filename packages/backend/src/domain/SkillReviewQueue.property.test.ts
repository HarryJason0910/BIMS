/**
 * SkillReviewQueue - Property-Based Tests
 * 
 * Tests universal correctness properties for the SkillReviewQueue aggregate root.
 * Uses fast-check for property-based testing with 100+ iterations per property.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { SkillReviewQueue } from './SkillReviewQueue';
import { TechLayer } from './JDSpecTypes';

// ============================================================================
// Arbitraries (Generators for property-based testing)
// ============================================================================

/**
 * Generate a valid TechLayer
 */
const arbitraryTechLayer = (): fc.Arbitrary<TechLayer> => {
  return fc.constantFrom<TechLayer>(
    'frontend',
    'backend',
    'database',
    'cloud',
    'devops',
    'others'
  );
};

/**
 * Generate a valid skill name (non-empty, max 100 chars)
 */
const arbitrarySkillName = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
};

/**
 * Generate a valid JD ID
 */
const arbitraryJDId = (): fc.Arbitrary<string> => {
  return fc.hexaString({ minLength: 24, maxLength: 24 });
};

/**
 * Generate a non-empty rejection reason
 */
const arbitraryRejectionReason = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 1, maxLength: 200 })
    .filter(s => s.trim().length > 0);
};

// ============================================================================
// Property Tests
// ============================================================================

describe('SkillReviewQueue - Property-Based Tests', () => {
  
  // Feature: enhanced-skill-matching, Property 16: Unknown Skill Queue Uniqueness
  // Validates: Requirements 5.1, 5.2
  describe('Property 16: Unknown Skill Queue Uniqueness', () => {
    it('should ensure each skill appears only once in the queue regardless of case or whitespace', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          fc.array(arbitraryJDId(), { minLength: 1, maxLength: 10 }),
          (skillName, jdIds) => {
            const queue = SkillReviewQueue.create();
            
            // Add the same skill multiple times with different case/whitespace variations
            const variations = [
              skillName,
              skillName.toUpperCase(),
              skillName.toLowerCase(),
              `  ${skillName}  `,
              `\t${skillName}\n`
            ];
            
            for (const variation of variations) {
              for (const jdId of jdIds) {
                queue.addUnknownSkill(variation, jdId);
              }
            }
            
            // Should have exactly one item in queue
            const items = queue.getQueueItems();
            expect(items).toHaveLength(1);
            
            // The item should have the normalized name
            const normalizedName = skillName.toLowerCase().trim();
            expect(items[0].skillName).toBe(normalizedName);
            
            // Frequency should be total number of additions
            const expectedFrequency = variations.length * jdIds.length;
            expect(items[0].frequency).toBe(expectedFrequency);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track unique detection sources without duplicates', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          fc.array(arbitraryJDId(), { minLength: 1, maxLength: 10 }),
          (skillName, jdIds) => {
            const queue = SkillReviewQueue.create();
            
            // Add skill multiple times from same sources
            for (const jdId of jdIds) {
              queue.addUnknownSkill(skillName, jdId);
              queue.addUnknownSkill(skillName, jdId); // Duplicate
            }
            
            const item = queue.getItemByName(skillName);
            expect(item).not.toBeNull();
            
            // Should have unique sources only
            expect(item!.detectedIn).toHaveLength(jdIds.length);
            expect(new Set(item!.detectedIn).size).toBe(jdIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 17: Unknown Skill Queue Completeness
  // Validates: Requirement 5.3
  describe('Property 17: Unknown Skill Queue Completeness', () => {
    it('should ensure all queue items have required fields populated', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              skillName: arbitrarySkillName(),
              jdId: arbitraryJDId()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (skillsData) => {
            const queue = SkillReviewQueue.create();
            
            // Add all skills
            for (const { skillName, jdId } of skillsData) {
              queue.addUnknownSkill(skillName, jdId);
            }
            
            const items = queue.getQueueItems();
            
            // Every item must have all required fields
            for (const item of items) {
              expect(item.skillName).toBeTruthy();
              expect(typeof item.skillName).toBe('string');
              expect(item.skillName.trim()).toBe(item.skillName); // Normalized
              
              expect(item.frequency).toBeGreaterThan(0);
              expect(typeof item.frequency).toBe('number');
              
              expect(item.firstDetectedAt).toBeInstanceOf(Date);
              expect(item.firstDetectedAt.getTime()).toBeLessThanOrEqual(Date.now());
              
              expect(Array.isArray(item.detectedIn)).toBe(true);
              expect(item.detectedIn.length).toBeGreaterThan(0);
              
              expect(['pending', 'approved', 'rejected']).toContain(item.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 18: Skill Approval Workflow
  // Validates: Requirements 5.4, 5.5
  describe('Property 18: Skill Approval Workflow', () => {
    it('should allow approving pending skills as canonical', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitraryJDId(),
          arbitraryTechLayer(),
          (skillName, jdId, category) => {
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            const decision = queue.approveAsCanonical(skillName, category);
            
            // Decision should have correct structure
            expect(decision.skillName).toBe(skillName.toLowerCase().trim());
            expect(decision.decision).toBe('canonical');
            expect(decision.canonicalName).toBe(skillName.toLowerCase().trim());
            expect(decision.category).toBe(category);
            expect(decision.approvedAt).toBeInstanceOf(Date);
            
            // Item should be marked as approved
            const item = queue.getItemByName(skillName);
            expect(item!.status).toBe('approved');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow approving pending skills as variations', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitrarySkillName(),
          arbitraryJDId(),
          (skillName, canonicalName, jdId) => {
            fc.pre(skillName.toLowerCase().trim() !== canonicalName.toLowerCase().trim());
            
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            const decision = queue.approveAsVariation(skillName, canonicalName);
            
            // Decision should have correct structure
            expect(decision.skillName).toBe(skillName.toLowerCase().trim());
            expect(decision.decision).toBe('variation');
            expect(decision.canonicalName).toBe(canonicalName.toLowerCase().trim());
            expect(decision.category).toBeUndefined();
            expect(decision.approvedAt).toBeInstanceOf(Date);
            
            // Item should be marked as approved
            const item = queue.getItemByName(skillName);
            expect(item!.status).toBe('approved');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent approving already processed skills', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitraryJDId(),
          arbitraryTechLayer(),
          (skillName, jdId, category) => {
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            // Approve once
            queue.approveAsCanonical(skillName, category);
            
            // Second approval should throw
            expect(() => queue.approveAsCanonical(skillName, category))
              .toThrow(/already been approved/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 19: Skill Rejection Workflow
  // Validates: Requirement 5.6
  describe('Property 19: Skill Rejection Workflow', () => {
    it('should allow rejecting pending skills with a reason', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitraryJDId(),
          arbitraryRejectionReason(),
          (skillName, jdId, reason) => {
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            const decision = queue.reject(skillName, reason);
            
            // Decision should have correct structure
            expect(decision.skillName).toBe(skillName.toLowerCase().trim());
            expect(decision.reason).toBe(reason.trim());
            expect(decision.rejectedAt).toBeInstanceOf(Date);
            
            // Item should be marked as rejected
            const item = queue.getItemByName(skillName);
            expect(item!.status).toBe('rejected');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent rejecting already processed skills', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitraryJDId(),
          arbitraryRejectionReason(),
          (skillName, jdId, reason) => {
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            // Reject once
            queue.reject(skillName, reason);
            
            // Second rejection should throw
            expect(() => queue.reject(skillName, reason))
              .toThrow(/already been rejected/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should require non-empty rejection reason', () => {
      fc.assert(
        fc.property(
          arbitrarySkillName(),
          arbitraryJDId(),
          (skillName, jdId) => {
            const queue = SkillReviewQueue.create();
            queue.addUnknownSkill(skillName, jdId);
            
            // Empty reason should throw
            expect(() => queue.reject(skillName, ''))
              .toThrow(/Rejection reason cannot be empty/);
            
            expect(() => queue.reject(skillName, '   '))
              .toThrow(/Rejection reason cannot be empty/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-skill-matching, Property 20: Review Decision Audit Trail
  // Validates: Requirement 5.7
  describe('Property 20: Review Decision Audit Trail', () => {
    it('should maintain immutable audit trail for all decisions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              skillName: arbitrarySkillName(),
              jdId: arbitraryJDId()
            }),
            { minLength: 3, maxLength: 10 }
          ),
          arbitraryTechLayer(),
          arbitraryRejectionReason(),
          (skillsData, category, reason) => {
            const queue = SkillReviewQueue.create();
            
            // Add all skills
            for (const { skillName, jdId } of skillsData) {
              queue.addUnknownSkill(skillName, jdId);
            }
            
            const decisions: Array<{ skill: string; timestamp: Date }> = [];
            
            // Process some skills
            const items = queue.getQueueItems();
            if (items.length >= 3) {
              // Approve first as canonical
              const decision1 = queue.approveAsCanonical(items[0].skillName, category);
              decisions.push({ skill: items[0].skillName, timestamp: decision1.approvedAt });
              
              // Approve second as variation
              const decision2 = queue.approveAsVariation(items[1].skillName, items[0].skillName);
              decisions.push({ skill: items[1].skillName, timestamp: decision2.approvedAt });
              
              // Reject third
              const decision3 = queue.reject(items[2].skillName, reason);
              decisions.push({ skill: items[2].skillName, timestamp: decision3.rejectedAt });
              
              // All timestamps should be valid and in order
              for (let i = 0; i < decisions.length; i++) {
                expect(decisions[i].timestamp).toBeInstanceOf(Date);
                expect(decisions[i].timestamp.getTime()).toBeLessThanOrEqual(Date.now());
                
                if (i > 0) {
                  // Timestamps should be in chronological order (or equal)
                  expect(decisions[i].timestamp.getTime())
                    .toBeGreaterThanOrEqual(decisions[i - 1].timestamp.getTime());
                }
              }
              
              // Status should be persisted
              expect(queue.getItemByName(items[0].skillName)!.status).toBe('approved');
              expect(queue.getItemByName(items[1].skillName)!.status).toBe('approved');
              expect(queue.getItemByName(items[2].skillName)!.status).toBe('rejected');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
