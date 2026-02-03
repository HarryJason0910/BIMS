/**
 * Unit tests for RoleService
 */

import { RoleService } from './RoleService';
import { ROLE_LAYER_WEIGHTS, BasicTitle, SeniorityLevel, FullStackModifier } from './RoleTypes';

describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(() => {
    roleService = new RoleService();
  });

  describe('getDefaultLayerWeights', () => {
    it('should return correct weights for Backend Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Senior Backend Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Backend Engineer']);
      expect(weights.backend).toBe(0.60);
      expect(weights.database).toBe(0.20);
    });

    it('should return correct weights for Frontend Developer', () => {
      const weights = roleService.getDefaultLayerWeights('Junior Frontend Developer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Frontend Developer']);
      expect(weights.frontend).toBe(0.70);
    });

    it('should return correct weights for Balanced Full Stack Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Senior Balanced Full Stack Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Balanced Full Stack Engineer']);
      expect(weights.frontend).toBe(0.35);
      expect(weights.backend).toBe(0.35);
    });

    it('should return correct weights for Frontend Heavy Full Stack Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Mid Frontend Heavy Full Stack Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Frontend Heavy Full Stack Engineer']);
      expect(weights.frontend).toBe(0.50);
      expect(weights.backend).toBe(0.25);
    });

    it('should return correct weights for Backend Heavy Full Stack Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Lead Backend Heavy Full Stack Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Backend Heavy Full Stack Engineer']);
      expect(weights.backend).toBe(0.50);
      expect(weights.frontend).toBe(0.25);
    });

    it('should return correct weights for QA Automation Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Senior QA Automation Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['QA Automation Engineer']);
      expect(weights.devops).toBe(0.20);
    });

    it('should return correct weights for DevOps Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Staff DevOps Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['DevOps Engineer']);
      expect(weights.cloud).toBe(0.40);
      expect(weights.devops).toBe(0.35);
    });

    it('should return correct weights for Data Engineer', () => {
      const weights = roleService.getDefaultLayerWeights('Senior Data Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Data Engineer']);
      expect(weights.database).toBe(0.50);
    });

    it('should return correct weights for Mobile Developer', () => {
      const weights = roleService.getDefaultLayerWeights('Junior Mobile Developer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Mobile Developer']);
      expect(weights.frontend).toBe(0.60);
    });

    it('should throw error for unknown role', () => {
      expect(() => roleService.getDefaultLayerWeights('Senior Unknown Engineer'))
        .toThrow('Unknown role: Unknown Engineer');
    });

    it('should work with role without seniority prefix', () => {
      const weights = roleService.getDefaultLayerWeights('Backend Engineer');
      expect(weights).toEqual(ROLE_LAYER_WEIGHTS['Backend Engineer']);
    });
  });

  describe('extractBasicTitle', () => {
    it('should extract basic title from role with Junior seniority', () => {
      expect(roleService.extractBasicTitle('Junior Backend Engineer')).toBe('Backend Engineer');
    });

    it('should extract basic title from role with Mid seniority', () => {
      expect(roleService.extractBasicTitle('Mid Frontend Developer')).toBe('Frontend Developer');
    });

    it('should extract basic title from role with Senior seniority', () => {
      expect(roleService.extractBasicTitle('Senior Backend Engineer')).toBe('Backend Engineer');
    });

    it('should extract basic title from role with Lead seniority', () => {
      expect(roleService.extractBasicTitle('Lead DevOps Engineer')).toBe('DevOps Engineer');
    });

    it('should extract basic title from role with Staff seniority', () => {
      expect(roleService.extractBasicTitle('Staff Software Engineer')).toBe('Software Engineer');
    });

    it('should extract Full Stack Engineer with modifier', () => {
      expect(roleService.extractBasicTitle('Senior Balanced Full Stack Engineer'))
        .toBe('Balanced Full Stack Engineer');
      expect(roleService.extractBasicTitle('Junior Frontend Heavy Full Stack Engineer'))
        .toBe('Frontend Heavy Full Stack Engineer');
      expect(roleService.extractBasicTitle('Mid Backend Heavy Full Stack Engineer'))
        .toBe('Backend Heavy Full Stack Engineer');
    });

    it('should return role as-is if no seniority prefix', () => {
      expect(roleService.extractBasicTitle('Backend Engineer')).toBe('Backend Engineer');
      expect(roleService.extractBasicTitle('Balanced Full Stack Engineer'))
        .toBe('Balanced Full Stack Engineer');
    });
  });

  describe('validateRole', () => {
    it('should return true for valid roles', () => {
      expect(roleService.validateRole('Senior Backend Engineer')).toBe(true);
      expect(roleService.validateRole('Junior Frontend Developer')).toBe(true);
      expect(roleService.validateRole('Mid Balanced Full Stack Engineer')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(roleService.validateRole('Senior Unknown Engineer')).toBe(false);
      expect(roleService.validateRole('Invalid Role')).toBe(false);
    });
  });

  describe('parseRole', () => {
    it('should parse standard role correctly', () => {
      const parsed = roleService.parseRole('Senior Backend Engineer');
      expect(parsed).toEqual({
        seniority: 'Senior',
        basicTitle: 'Backend Engineer'
      });
    });

    it('should parse Full Stack Engineer with modifier', () => {
      const parsed = roleService.parseRole('Junior Frontend Heavy Full Stack Engineer');
      expect(parsed).toEqual({
        seniority: 'Junior',
        basicTitle: 'Full Stack Engineer',
        modifier: 'Frontend Heavy'
      });
    });

    it('should parse all seniority levels', () => {
      expect(roleService.parseRole('Junior Backend Engineer').seniority).toBe('Junior');
      expect(roleService.parseRole('Mid Backend Engineer').seniority).toBe('Mid');
      expect(roleService.parseRole('Senior Backend Engineer').seniority).toBe('Senior');
      expect(roleService.parseRole('Lead Backend Engineer').seniority).toBe('Lead');
      expect(roleService.parseRole('Staff Backend Engineer').seniority).toBe('Staff');
    });

    it('should parse all Full Stack modifiers', () => {
      expect(roleService.parseRole('Senior Balanced Full Stack Engineer').modifier).toBe('Balanced');
      expect(roleService.parseRole('Senior Frontend Heavy Full Stack Engineer').modifier).toBe('Frontend Heavy');
      expect(roleService.parseRole('Senior Backend Heavy Full Stack Engineer').modifier).toBe('Backend Heavy');
    });

    it('should throw error for role without seniority', () => {
      expect(() => roleService.parseRole('Backend Engineer'))
        .toThrow('Invalid role format: missing seniority level');
    });

    it('should throw error for Full Stack Engineer without modifier', () => {
      expect(() => roleService.parseRole('Senior Full Stack Engineer'))
        .toThrow('Full Stack Engineer role requires a modifier');
    });

    it('should throw error for unknown basic title', () => {
      expect(() => roleService.parseRole('Senior Unknown Engineer'))
        .toThrow('Invalid role format: unknown basic title');
    });
  });

  describe('composeRole', () => {
    it('should compose standard role', () => {
      const role = roleService.composeRole('Senior', 'Backend Engineer');
      expect(role).toBe('Senior Backend Engineer');
    });

    it('should compose Full Stack Engineer with modifier', () => {
      const role = roleService.composeRole('Junior', 'Full Stack Engineer', 'Frontend Heavy');
      expect(role).toBe('Junior Frontend Heavy Full Stack Engineer');
    });

    it('should compose role without modifier', () => {
      const role = roleService.composeRole('Mid', 'Frontend Developer');
      expect(role).toBe('Mid Frontend Developer');
    });
  });

  describe('layer weights validation', () => {
    it('should ensure all predefined weights sum to 1.0', () => {
      Object.entries(ROLE_LAYER_WEIGHTS).forEach(([role, weights]) => {
        const sum = weights.frontend + weights.backend + weights.database + 
                    weights.cloud + weights.devops + weights.others;
        expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001);
      });
    });
  });
});
