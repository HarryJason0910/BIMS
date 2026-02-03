/**
 * SkillDictionary - Unit Tests
 * 
 * Tests specific examples and edge cases for the SkillDictionary aggregate root.
 * Complements property-based tests with concrete scenarios.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.4, 3.1, 3.2
 */

import { SkillDictionary } from './SkillDictionary';

describe('SkillDictionary - Unit Tests', () => {
  
  describe('Creation and Initialization', () => {
    it('should create an empty dictionary with valid version', () => {
      const dictionary = SkillDictionary.create('2024.1');
      
      expect(dictionary.getVersion()).toBe('2024.1');
      expect(dictionary.getAllSkills()).toEqual([]);
      expect(dictionary.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should throw error for invalid version format', () => {
      expect(() => SkillDictionary.create('2024')).toThrow(/Invalid dictionary version format/);
      expect(() => SkillDictionary.create('24.1')).toThrow(/Invalid dictionary version format/);
      expect(() => SkillDictionary.create('2024.')).toThrow(/Invalid dictionary version format/);
      expect(() => SkillDictionary.create('.1')).toThrow(/Invalid dictionary version format/);
      expect(() => SkillDictionary.create('invalid')).toThrow(/Invalid dictionary version format/);
    });
  });

  describe('Canonical Skill Management', () => {
    let dictionary: SkillDictionary;

    beforeEach(() => {
      dictionary = SkillDictionary.create('2024.1');
    });

    it('should add a canonical skill successfully', () => {
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const skill = dictionary.getCanonicalSkill('react');
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('react');
      expect(skill!.category).toBe('frontend');
      expect(skill!.createdAt).toBeInstanceOf(Date);
    });

    it('should normalize skill names to lowercase', () => {
      dictionary.addCanonicalSkill('React', 'frontend');
      
      const skill = dictionary.getCanonicalSkill('react');
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('react');
    });

    it('should trim whitespace from skill names', () => {
      dictionary.addCanonicalSkill('  react  ', 'frontend');
      
      const skill = dictionary.getCanonicalSkill('react');
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('react');
    });

    it('should throw error for empty skill name', () => {
      expect(() => dictionary.addCanonicalSkill('', 'frontend')).toThrow(/Skill name cannot be empty/);
      expect(() => dictionary.addCanonicalSkill('   ', 'frontend')).toThrow(/Skill name cannot be empty/);
    });

    it('should throw error for skill name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => dictionary.addCanonicalSkill(longName, 'frontend')).toThrow(/Skill name cannot exceed 100 characters/);
    });

    it('should throw error when adding duplicate canonical skill', () => {
      dictionary.addCanonicalSkill('react', 'frontend');
      expect(() => dictionary.addCanonicalSkill('react', 'frontend')).toThrow(/already exists/);
    });

    it('should remove a canonical skill successfully', () => {
      dictionary.addCanonicalSkill('react', 'frontend');
      expect(dictionary.hasSkill('react')).toBe(true);
      
      dictionary.removeCanonicalSkill('react');
      expect(dictionary.hasSkill('react')).toBe(false);
    });

    it('should throw error when removing non-existent skill', () => {
      expect(() => dictionary.removeCanonicalSkill('nonexistent')).toThrow(/does not exist/);
    });
  });

  describe('Skill Variation Management', () => {
    let dictionary: SkillDictionary;

    beforeEach(() => {
      dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
    });

    it('should add a skill variation successfully', () => {
      dictionary.addSkillVariation('reactjs', 'react');
      
      expect(dictionary.hasSkill('reactjs')).toBe(true);
      expect(dictionary.mapToCanonical('reactjs')).toBe('react');
    });

    it('should normalize variation names to lowercase', () => {
      dictionary.addSkillVariation('ReactJS', 'react');
      
      expect(dictionary.mapToCanonical('reactjs')).toBe('react');
    });

    it('should throw error for empty variation name', () => {
      expect(() => dictionary.addSkillVariation('', 'react')).toThrow(/Variation name cannot be empty/);
      expect(() => dictionary.addSkillVariation('   ', 'react')).toThrow(/Variation name cannot be empty/);
    });

    it('should throw error for empty canonical name', () => {
      expect(() => dictionary.addSkillVariation('reactjs', '')).toThrow(/Canonical name cannot be empty/);
    });

    it('should throw error when canonical skill does not exist', () => {
      expect(() => dictionary.addSkillVariation('vuejs', 'vue')).toThrow(/does not exist/);
    });

    it('should throw error when variation conflicts with canonical skill', () => {
      dictionary.addCanonicalSkill('vue', 'frontend');
      expect(() => dictionary.addSkillVariation('react', 'vue')).toThrow(/conflicts with existing canonical skill/);
    });

    it('should remove all variations when canonical skill is removed', () => {
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      
      expect(dictionary.hasSkill('reactjs')).toBe(true);
      expect(dictionary.hasSkill('react.js')).toBe(true);
      
      dictionary.removeCanonicalSkill('react');
      
      expect(dictionary.hasSkill('reactjs')).toBe(false);
      expect(dictionary.hasSkill('react.js')).toBe(false);
    });

    it('should get all variations for a canonical skill', () => {
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      
      const variations = dictionary.getVariationsFor('react');
      expect(variations).toHaveLength(2);
      expect(variations).toContain('reactjs');
      expect(variations).toContain('react.js');
    });

    it('should return empty array for canonical skill with no variations', () => {
      const variations = dictionary.getVariationsFor('react');
      expect(variations).toEqual([]);
    });

    it('should return empty array for non-existent canonical skill', () => {
      const variations = dictionary.getVariationsFor('nonexistent');
      expect(variations).toEqual([]);
    });
  });
});

  describe('Skill Lookup', () => {
    let dictionary: SkillDictionary;

    beforeEach(() => {
      dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('node', 'backend');
      dictionary.addSkillVariation('reactjs', 'react');
    });

    it('should find canonical skill by exact name', () => {
      const skill = dictionary.getCanonicalSkill('react');
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('react');
      expect(skill!.category).toBe('frontend');
    });

    it('should return null for non-existent skill', () => {
      const skill = dictionary.getCanonicalSkill('vue');
      expect(skill).toBeNull();
    });

    it('should map canonical skill to itself', () => {
      expect(dictionary.mapToCanonical('react')).toBe('react');
    });

    it('should map variation to canonical skill', () => {
      expect(dictionary.mapToCanonical('reactjs')).toBe('react');
    });

    it('should return null for unknown skill', () => {
      expect(dictionary.mapToCanonical('vue')).toBeNull();
    });

    it('should check if canonical skill exists', () => {
      expect(dictionary.hasSkill('react')).toBe(true);
      expect(dictionary.hasSkill('vue')).toBe(false);
    });

    it('should check if variation exists', () => {
      expect(dictionary.hasSkill('reactjs')).toBe(true);
      expect(dictionary.hasSkill('vuejs')).toBe(false);
    });

    it('should get all canonical skills', () => {
      const skills = dictionary.getAllSkills();
      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name)).toContain('react');
      expect(skills.map(s => s.name)).toContain('node');
    });

    it('should get skills by category', () => {
      const frontendSkills = dictionary.getSkillsByCategory('frontend');
      expect(frontendSkills).toHaveLength(1);
      expect(frontendSkills[0].name).toBe('react');
      
      const backendSkills = dictionary.getSkillsByCategory('backend');
      expect(backendSkills).toHaveLength(1);
      expect(backendSkills[0].name).toBe('node');
    });

    it('should return empty array for category with no skills', () => {
      const devopsSkills = dictionary.getSkillsByCategory('devops');
      expect(devopsSkills).toEqual([]);
    });
  });

  describe('Version Management', () => {
    it('should increment version within same year', () => {
      const currentYear = new Date().getFullYear();
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      const newVersion = dictionary.incrementVersion();
      expect(newVersion).toBe(`${currentYear}.2`);
    });

    it('should reset version to .1 for new year', () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const dictionary = SkillDictionary.create(`${lastYear}.5`);
      const newVersion = dictionary.incrementVersion();
      expect(newVersion).toBe(`${currentYear}.1`);
    });

    it('should create new dictionary with incremented version', () => {
      const currentYear = new Date().getFullYear();
      const dictionary = SkillDictionary.create(`${currentYear}.1`);
      dictionary.addCanonicalSkill('react', 'frontend');
      
      const newDictionary = dictionary.withIncrementedVersion();
      
      expect(dictionary.getVersion()).toBe(`${currentYear}.1`);
      expect(newDictionary.getVersion()).toBe(`${currentYear}.2`);
      expect(newDictionary.hasSkill('react')).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      
      const json = dictionary.toJSON();
      
      expect(json.version).toBe('2024.1');
      expect(json.skills).toHaveLength(1);
      expect(json.skills[0].name).toBe('react');
      expect(json.skills[0].category).toBe('frontend');
      expect(json.variations).toHaveLength(1);
      expect(json.variations[0].variation).toBe('reactjs');
      expect(json.variations[0].canonical).toBe('react');
      expect(json.createdAt).toBeDefined();
    });

    it('should deserialize from JSON correctly', () => {
      const json = {
        version: '2024.1',
        skills: [
          {
            name: 'react',
            category: 'frontend' as const,
            createdAt: new Date().toISOString()
          }
        ],
        variations: [
          {
            variation: 'reactjs',
            canonical: 'react'
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const dictionary = SkillDictionary.fromJSON(json);
      
      expect(dictionary.getVersion()).toBe('2024.1');
      expect(dictionary.hasSkill('react')).toBe(true);
      expect(dictionary.hasSkill('reactjs')).toBe(true);
      expect(dictionary.mapToCanonical('reactjs')).toBe('react');
    });

    it('should round-trip through JSON serialization', () => {
      const original = SkillDictionary.create('2024.1');
      original.addCanonicalSkill('react', 'frontend');
      original.addCanonicalSkill('node', 'backend');
      original.addSkillVariation('reactjs', 'react');
      original.addSkillVariation('nodejs', 'node');
      
      const json = original.toJSON();
      const restored = SkillDictionary.fromJSON(json);
      
      expect(restored.getVersion()).toBe(original.getVersion());
      expect(restored.getAllSkills()).toHaveLength(original.getAllSkills().length);
      expect(restored.hasSkill('react')).toBe(true);
      expect(restored.hasSkill('node')).toBe(true);
      expect(restored.mapToCanonical('reactjs')).toBe('react');
      expect(restored.mapToCanonical('nodejs')).toBe('node');
    });
  });

  describe('Edge Cases', () => {
    let dictionary: SkillDictionary;

    beforeEach(() => {
      dictionary = SkillDictionary.create('2024.1');
    });

    it('should handle case-insensitive skill lookups', () => {
      dictionary.addCanonicalSkill('React', 'frontend');
      
      expect(dictionary.hasSkill('react')).toBe(true);
      expect(dictionary.hasSkill('REACT')).toBe(true);
      expect(dictionary.hasSkill('ReAcT')).toBe(true);
    });

    it('should handle whitespace in skill names', () => {
      dictionary.addCanonicalSkill('  react  ', 'frontend');
      
      expect(dictionary.hasSkill('react')).toBe(true);
      expect(dictionary.hasSkill('  react  ')).toBe(true);
    });

    it('should handle empty dictionary operations', () => {
      expect(dictionary.getAllSkills()).toEqual([]);
      expect(dictionary.getSkillsByCategory('frontend')).toEqual([]);
      expect(dictionary.hasSkill('anything')).toBe(false);
      expect(dictionary.mapToCanonical('anything')).toBeNull();
    });

    it('should handle multiple variations for same canonical skill', () => {
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addSkillVariation('reactjs', 'react');
      dictionary.addSkillVariation('react.js', 'react');
      dictionary.addSkillVariation('react-js', 'react');
      
      expect(dictionary.mapToCanonical('reactjs')).toBe('react');
      expect(dictionary.mapToCanonical('react.js')).toBe('react');
      expect(dictionary.mapToCanonical('react-js')).toBe('react');
      
      const variations = dictionary.getVariationsFor('react');
      expect(variations).toHaveLength(3);
    });
  });
