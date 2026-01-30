import { CanonicalSkillMapper } from './CanonicalSkillMapper';

describe('CanonicalSkillMapper', () => {
  describe('normalize', () => {
    it('should normalize .NET variations to dotnet', () => {
      expect(CanonicalSkillMapper.normalize('.NET')).toBe('dotnet');
      expect(CanonicalSkillMapper.normalize('.net core')).toBe('dotnet');
      expect(CanonicalSkillMapper.normalize('ASP.NET')).toBe('dotnet');
      expect(CanonicalSkillMapper.normalize('asp.net core')).toBe('dotnet');
    });

    it('should normalize Spring Boot variations to springboot', () => {
      expect(CanonicalSkillMapper.normalize('Spring Boot')).toBe('springboot');
      expect(CanonicalSkillMapper.normalize('spring boot')).toBe('springboot');
    });

    it('should normalize React variations to react', () => {
      expect(CanonicalSkillMapper.normalize('React')).toBe('react');
      expect(CanonicalSkillMapper.normalize('ReactJS')).toBe('react');
      expect(CanonicalSkillMapper.normalize('react.js')).toBe('react');
    });

    it('should normalize AWS Lambda variations to lambda', () => {
      expect(CanonicalSkillMapper.normalize('Lambda')).toBe('lambda');
      expect(CanonicalSkillMapper.normalize('AWS Lambda')).toBe('lambda');
    });

    it('should handle case-insensitive input', () => {
      expect(CanonicalSkillMapper.normalize('JAVASCRIPT')).toBe('javascript');
      expect(CanonicalSkillMapper.normalize('JavaScript')).toBe('javascript');
      expect(CanonicalSkillMapper.normalize('js')).toBe('javascript');
    });

    it('should return normalized input for unmapped skills', () => {
      expect(CanonicalSkillMapper.normalize('UnknownSkill')).toBe('unknownskill');
      expect(CanonicalSkillMapper.normalize('  Custom Tech  ')).toBe('custom tech');
    });
  });

  describe('normalizeArray', () => {
    it('should normalize and deduplicate an array of skills', () => {
      const skills = ['.NET', 'asp.net core', 'React', 'reactjs', 'JavaScript', 'js'];
      const result = CanonicalSkillMapper.normalizeArray(skills);
      
      expect(result).toContain('dotnet');
      expect(result).toContain('react');
      expect(result).toContain('javascript');
      expect(result.length).toBe(3); // Should be deduplicated
    });

    it('should handle empty array', () => {
      expect(CanonicalSkillMapper.normalizeArray([])).toEqual([]);
    });
  });

  describe('hasMapping', () => {
    it('should return true for skills with canonical mappings', () => {
      expect(CanonicalSkillMapper.hasMapping('.NET')).toBe(true);
      expect(CanonicalSkillMapper.hasMapping('Spring Boot')).toBe(true);
      expect(CanonicalSkillMapper.hasMapping('react')).toBe(true);
    });

    it('should return false for skills without canonical mappings', () => {
      expect(CanonicalSkillMapper.hasMapping('UnknownSkill')).toBe(false);
      expect(CanonicalSkillMapper.hasMapping('CustomTech')).toBe(false);
    });
  });
});
