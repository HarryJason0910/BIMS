/**
 * SkillDictionary - Aggregate root for canonical skills dictionary
 * 
 * Manages the canonical skills dictionary with versioning and skill variations.
 * Provides skill lookup, validation, and CRUD operations.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2
 */

import { TechLayer, CanonicalSkill, SkillDictionaryJSON } from './JDSpecTypes';

export class SkillDictionary {
  private readonly version: string;
  private readonly skills: Map<string, CanonicalSkill>;
  private readonly variations: Map<string, string>; // variation -> canonical
  private readonly createdAt: Date;

  private constructor(
    version: string,
    skills: Map<string, CanonicalSkill>,
    variations: Map<string, string>,
    createdAt: Date
  ) {
    this.version = version;
    this.skills = skills;
    this.variations = variations;
    this.createdAt = createdAt;
  }

  /**
   * Create a new empty dictionary with the specified version
   */
  static create(version: string): SkillDictionary {
    this.validateVersionFormat(version);
    
    return new SkillDictionary(
      version,
      new Map<string, CanonicalSkill>(),
      new Map<string, string>(),
      new Date()
    );
  }

  /**
   * Create a dictionary from JSON
   */
  static fromJSON(data: SkillDictionaryJSON): SkillDictionary {
    this.validateVersionFormat(data.version);
    
    const skills = new Map<string, CanonicalSkill>();
    for (const skill of data.skills) {
      skills.set(skill.name, {
        name: skill.name,
        category: skill.category,
        createdAt: new Date(skill.createdAt)
      });
    }
    
    const variations = new Map<string, string>();
    for (const { variation, canonical } of data.variations) {
      variations.set(variation.toLowerCase(), canonical);
    }
    
    return new SkillDictionary(
      data.version,
      skills,
      variations,
      new Date(data.createdAt)
    );
  }

  /**
   * Validate dictionary version format (YYYY.N)
   */
  private static validateVersionFormat(version: string): void {
    const versionPattern = /^\d{4}\.\d+$/;
    
    if (!versionPattern.test(version)) {
      throw new Error(
        `Invalid dictionary version format: '${version}'. Expected format: YYYY.N (e.g., 2024.1)`
      );
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getVersion(): string {
    return this.version;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  // ============================================================================
  // Skill Management
  // ============================================================================

  /**
   * Add a new canonical skill to the dictionary
   */
  addCanonicalSkill(name: string, category: TechLayer): void {
    const normalizedName = name.toLowerCase().trim();
    
    if (!normalizedName) {
      throw new Error('Skill name cannot be empty');
    }
    
    if (normalizedName.length > 100) {
      throw new Error('Skill name cannot exceed 100 characters');
    }
    
    if (this.skills.has(normalizedName)) {
      throw new Error(`Canonical skill '${normalizedName}' already exists`);
    }
    
    this.skills.set(normalizedName, {
      name: normalizedName,
      category,
      createdAt: new Date()
    });
  }

  /**
   * Add a skill variation that maps to a canonical skill
   */
  addSkillVariation(variation: string, canonicalName: string): void {
    const normalizedVariation = variation.toLowerCase().trim();
    const normalizedCanonical = canonicalName.toLowerCase().trim();
    
    if (!normalizedVariation) {
      throw new Error('Variation name cannot be empty');
    }
    
    if (!normalizedCanonical) {
      throw new Error('Canonical name cannot be empty');
    }
    
    if (!this.skills.has(normalizedCanonical)) {
      throw new Error(`Canonical skill '${normalizedCanonical}' does not exist`);
    }
    
    if (this.skills.has(normalizedVariation)) {
      throw new Error(`Variation '${normalizedVariation}' conflicts with existing canonical skill`);
    }
    
    this.variations.set(normalizedVariation, normalizedCanonical);
  }

  /**
   * Remove a canonical skill and all its variations
   */
  removeCanonicalSkill(name: string): void {
    const normalizedName = name.toLowerCase().trim();
    
    if (!this.skills.has(normalizedName)) {
      throw new Error(`Canonical skill '${normalizedName}' does not exist`);
    }
    
    // Remove the canonical skill
    this.skills.delete(normalizedName);
    
    // Remove all variations that map to this canonical skill
    const variationsToRemove: string[] = [];
    for (const [variation, canonical] of this.variations.entries()) {
      if (canonical === normalizedName) {
        variationsToRemove.push(variation);
      }
    }
    
    for (const variation of variationsToRemove) {
      this.variations.delete(variation);
    }
  }

  // ============================================================================
  // Skill Lookup
  // ============================================================================

  /**
   * Get a canonical skill by name
   */
  getCanonicalSkill(name: string): CanonicalSkill | null {
    const normalizedName = name.toLowerCase().trim();
    return this.skills.get(normalizedName) || null;
  }

  /**
   * Map a skill name (canonical or variation) to its canonical form
   */
  mapToCanonical(skillName: string): string | null {
    const normalized = skillName.toLowerCase().trim();
    
    // Check if it's already a canonical skill
    if (this.skills.has(normalized)) {
      return normalized;
    }
    
    // Check if it's a variation
    return this.variations.get(normalized) || null;
  }

  /**
   * Check if a skill exists (either as canonical or variation)
   */
  hasSkill(skillName: string): boolean {
    const normalized = skillName.toLowerCase().trim();
    return this.skills.has(normalized) || this.variations.has(normalized);
  }

  /**
   * Get all canonical skills
   */
  getAllSkills(): CanonicalSkill[] {
    return Array.from(this.skills.values()).map(skill => ({
      name: skill.name,
      category: skill.category,
      createdAt: new Date(skill.createdAt)
    }));
  }

  /**
   * Get all canonical skills in a specific category
   */
  getSkillsByCategory(category: TechLayer): CanonicalSkill[] {
    return this.getAllSkills().filter(skill => skill.category === category);
  }

  /**
   * Get all variations for a canonical skill
   */
  getVariationsFor(canonicalName: string): string[] {
    const normalizedCanonical = canonicalName.toLowerCase().trim();
    
    if (!this.skills.has(normalizedCanonical)) {
      return [];
    }
    
    const variations: string[] = [];
    for (const [variation, canonical] of this.variations.entries()) {
      if (canonical === normalizedCanonical) {
        variations.push(variation);
      }
    }
    
    return variations;
  }

  // ============================================================================
  // Versioning
  // ============================================================================

  /**
   * Increment the dictionary version
   * Returns the new version string
   */
  incrementVersion(): string {
    const [year, n] = this.version.split('.').map(Number);
    const currentYear = new Date().getFullYear();
    
    let newYear: number;
    let newN: number;
    
    if (currentYear > year) {
      // New year, reset to .1
      newYear = currentYear;
      newN = 1;
    } else {
      // Same year, increment N
      newYear = year;
      newN = n + 1;
    }
    
    const newVersion = `${newYear}.${newN}`;
    
    // Create a new dictionary with the incremented version
    return newVersion;
  }

  /**
   * Create a new dictionary with an incremented version
   * This returns a new instance; the original is immutable
   */
  withIncrementedVersion(): SkillDictionary {
    const newVersion = this.incrementVersion();
    
    return new SkillDictionary(
      newVersion,
      new Map(this.skills),
      new Map(this.variations),
      new Date()
    );
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Serialize to JSON
   */
  toJSON(): SkillDictionaryJSON {
    return {
      version: this.version,
      skills: this.getAllSkills().map(skill => ({
        name: skill.name,
        category: skill.category,
        createdAt: skill.createdAt.toISOString()
      })),
      variations: Array.from(this.variations.entries()).map(([variation, canonical]) => ({
        variation,
        canonical
      })),
      createdAt: this.createdAt.toISOString()
    };
  }
}
