/**
 * CanonicalJDSpec Unit Tests
 * 
 * Unit tests for specific examples and edge cases of the CanonicalJDSpec aggregate root.
 * 
 * Part of: enhanced-skill-matching feature
 */

import { CanonicalJDSpec } from './CanonicalJDSpec';
import { CreateJDSpecData } from './JDSpecTypes';

describe('CanonicalJDSpec - Unit Tests', () => {
  
  describe('Edge Cases', () => {
    
    it('should accept empty skill arrays for all layers', () => {
      const data: CreateJDSpecData = {
        role: 'Backend Developer',
        layerWeights: {
          frontend: 0.1,
          backend: 0.5,
          database: 0.2,
          cloud: 0.1,
          devops: 0.05,
          others: 0.05
        },
        skills: {
          frontend: [],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).not.toThrow();
      const spec = CanonicalJDSpec.create(data);
      expect(spec.getSkillsForLayer('frontend')).toEqual([]);
      expect(spec.getSkillsForLayer('cloud')).toEqual([]);
    });
    
    it('should accept zero-weight layers', () => {
      const data: CreateJDSpecData = {
        role: 'Frontend Developer',
        layerWeights: {
          frontend: 0.8,
          backend: 0.15,
          database: 0.05,
          cloud: 0.0,
          devops: 0.0,
          others: 0.0
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.6 },
            { skill: 'typescript', weight: 0.4 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).not.toThrow();
      const spec = CanonicalJDSpec.create(data);
      expect(spec.getLayerWeight('cloud')).toBe(0.0);
      expect(spec.getLayerWeight('devops')).toBe(0.0);
    });
    
    it('should reject layer weights that sum to less than 1.0', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.3,
          backend: 0.3,
          database: 0.2,
          cloud: 0.1,
          devops: 0.05,
          others: 0.03  // Sum = 0.98, below tolerance
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/must sum to 1\.0/);
    });
    
    it('should reject layer weights that sum to more than 1.0', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.3,
          backend: 0.3,
          database: 0.2,
          cloud: 0.1,
          devops: 0.1,
          others: 0.05  // Sum = 1.05, above tolerance
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/must sum to 1\.0/);
    });
    
    it('should reject skill weights that sum to less than 1.0 in a layer', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: 'react', weight: 0.5 },
            { skill: 'typescript', weight: 0.3 }
            // Sum = 0.8, below tolerance
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/must sum to 1\.0/);
    });
    
    it('should reject empty skill identifiers', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: '', weight: 0.5 },
            { skill: 'typescript', weight: 0.5 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/Invalid skill identifier/);
    });
    
    it('should reject whitespace-only skill identifiers', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: '   ', weight: 0.5 },
            { skill: 'typescript', weight: 0.5 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/Empty skill identifier/);
    });
    
    it('should reject skill identifiers longer than 100 characters', () => {
      const longSkill = 'a'.repeat(101);
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [
            { skill: longSkill, weight: 0.5 },
            { skill: 'typescript', weight: 0.5 }
          ],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/too long/);
    });
    
    it('should reject invalid dictionary version format', () => {
      const data: CreateJDSpecData = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: 'invalid-version'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/Invalid dictionary version format/);
    });
    
    it('should accept valid dictionary version formats', () => {
      const validVersions = ['2024.1', '2025.10', '2030.999'];
      
      for (const version of validVersions) {
        const data: CreateJDSpecData = {
          role: 'Developer',
          layerWeights: {
            frontend: 0.5,
            backend: 0.3,
            database: 0.1,
            cloud: 0.05,
            devops: 0.03,
            others: 0.02
          },
          skills: {
            frontend: [{ skill: 'react', weight: 1.0 }],
            backend: [{ skill: 'nodejs', weight: 1.0 }],
            database: [{ skill: 'postgresql', weight: 1.0 }],
            cloud: [],
            devops: [],
            others: []
          },
          dictionaryVersion: version
        };
        
        expect(() => CanonicalJDSpec.create(data)).not.toThrow();
      }
    });
  });
  
  describe('Validation Error Messages', () => {
    
    it('should provide clear error message for missing layer in layerWeights', () => {
      const data: any = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03
          // Missing 'others'
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: [],
          others: []
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/Missing layer in layerWeights: others/);
    });
    
    it('should provide clear error message for missing layer in skills', () => {
      const data: any = {
        role: 'Developer',
        layerWeights: {
          frontend: 0.5,
          backend: 0.3,
          database: 0.1,
          cloud: 0.05,
          devops: 0.03,
          others: 0.02
        },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [],
          devops: []
          // Missing 'others'
        },
        dictionaryVersion: '2024.1'
      };
      
      expect(() => CanonicalJDSpec.create(data)).toThrow(/Missing layer in skills: others/);
    });
  });
});
