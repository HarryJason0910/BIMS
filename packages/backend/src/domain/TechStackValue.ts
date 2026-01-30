/**
 * TechStackValue - Value object representing a collection of technologies
 * 
 * Represents a tech stack as an immutable collection of technology names.
 * Used for matching job requirements with resume tech stacks.
 * Uses canonical skill normalization for consistent matching.
 * 
 * Part of: resume-selection-from-history feature
 */

import { CanonicalSkillMapper } from './CanonicalSkillMapper';

export class TechStackValue {
  private readonly canonicalTechnologies: string[];
  
  constructor(private readonly technologies: string[]) {
    // Normalize technologies to canonical form and remove duplicates
    const trimmed = technologies.map(t => t.trim()).filter(t => t.length > 0);
    const canonical = trimmed.map(t => CanonicalSkillMapper.normalize(t));
    
    // Remove duplicates after canonicalization
    this.canonicalTechnologies = Array.from(new Set(canonical));
  }

  /**
   * Get all technologies in this stack (original form)
   */
  getTechnologies(): string[] {
    return [...this.technologies];
  }

  /**
   * Get all technologies in canonical form
   */
  getCanonicalTechnologies(): string[] {
    return [...this.canonicalTechnologies];
  }

  /**
   * Check if this stack contains a specific technology (canonical matching)
   * 
   * @param technology - The technology to check for
   * @returns true if the technology is present, false otherwise
   */
  contains(technology: string): boolean {
    const canonical = CanonicalSkillMapper.normalize(technology);
    return this.canonicalTechnologies.includes(canonical);
  }

  /**
   * Calculate the number of overlapping technologies with another stack
   * Uses canonical matching for accurate comparison.
   * 
   * @param other - The other tech stack to compare with
   * @returns The count of matching technologies (canonical)
   */
  overlapWith(other: TechStackValue): number {
    const otherCanonical = other.getCanonicalTechnologies();
    const matches = otherCanonical.filter(tech => this.canonicalTechnologies.includes(tech));
    return matches.length;
  }

  /**
   * Get the technologies that match with another stack
   * 
   * @param other - The other tech stack to compare with
   * @returns Array of matching canonical technology names
   */
  getMatchingTechnologies(other: TechStackValue): string[] {
    const otherCanonical = other.getCanonicalTechnologies();
    return this.canonicalTechnologies.filter(tech => otherCanonical.includes(tech));
  }

  /**
   * Get the technologies that are missing from another stack
   * 
   * @param other - The other tech stack to compare with
   * @returns Array of canonical technology names that are in this stack but not in the other
   */
  getMissingTechnologies(other: TechStackValue): string[] {
    const otherCanonical = other.getCanonicalTechnologies();
    return this.canonicalTechnologies.filter(tech => !otherCanonical.includes(tech));
  }
}
