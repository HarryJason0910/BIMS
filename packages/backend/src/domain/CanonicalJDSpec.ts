/**
 * CanonicalJDSpec - Aggregate root for normalized JD specifications
 * 
 * Represents a normalized, layer-complete job description specification with weighted skills.
 * Enforces the 6-layer structure and validates that all weights sum to 1.0.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import {
  TechLayer,
  LayerWeights,
  LayerSkills,
  SkillWeight,
  CreateJDSpecData,
  CanonicalJDSpecJSON,
  getAllTechLayers
} from './JDSpecTypes';

export class CanonicalJDSpec {
  private readonly id: string;
  private readonly role: string;
  private readonly layerWeights: LayerWeights;
  private readonly skills: LayerSkills;
  private readonly dictionaryVersion: string;
  private readonly createdAt: Date;

  private constructor(
    id: string,
    role: string,
    layerWeights: LayerWeights,
    skills: LayerSkills,
    dictionaryVersion: string,
    createdAt: Date
  ) {
    this.id = id;
    this.role = role;
    this.layerWeights = layerWeights;
    this.skills = skills;
    this.dictionaryVersion = dictionaryVersion;
    this.createdAt = createdAt;
  }

  /**
   * Factory method to create a new CanonicalJDSpec
   * Validates all invariants before creating the instance
   */
  static create(data: CreateJDSpecData): CanonicalJDSpec {
    // Validate layer completeness
    this.validateLayerCompleteness(data.layerWeights, data.skills);
    
    // Validate layer weights sum to 1.0
    this.validateLayerWeightsSum(data.layerWeights);
    
    // Validate skill weights sum to 1.0 per layer
    this.validateSkillWeightsSum(data.skills);
    
    // Validate skill identifiers
    this.validateSkillIdentifiers(data.skills);
    
    // Validate dictionary version format
    this.validateDictionaryVersion(data.dictionaryVersion);

    const id = data.id || `jd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return new CanonicalJDSpec(
      id,
      data.role,
      data.layerWeights,
      data.skills,
      data.dictionaryVersion,
      new Date()
    );
  }

  /**
   * Validate that all six layers are present
   */
  private static validateLayerCompleteness(
    layerWeights: LayerWeights,
    skills: LayerSkills
  ): void {
    const requiredLayers = getAllTechLayers();
    
    // Check layerWeights
    for (const layer of requiredLayers) {
      if (!(layer in layerWeights)) {
        throw new Error(`Missing layer in layerWeights: ${layer}`);
      }
      if (typeof layerWeights[layer] !== 'number') {
        throw new Error(`Invalid weight type for layer ${layer}: expected number`);
      }
    }
    
    // Check skills
    for (const layer of requiredLayers) {
      if (!(layer in skills)) {
        throw new Error(`Missing layer in skills: ${layer}`);
      }
      if (!Array.isArray(skills[layer])) {
        throw new Error(`Invalid skills type for layer ${layer}: expected array`);
      }
    }
  }

  /**
   * Validate that layer weights sum to 1.0 (±0.001 tolerance)
   */
  private static validateLayerWeightsSum(layerWeights: LayerWeights): void {
    const sum = Object.values(layerWeights).reduce((acc, weight) => acc + weight, 0);
    const tolerance = 0.001;
    
    if (Math.abs(sum - 1.0) > tolerance) {
      throw new Error(
        `Layer weights must sum to 1.0 (±${tolerance}). Current sum: ${sum.toFixed(6)}`
      );
    }
  }

  /**
   * Validate that skill weights within each layer sum to 1.0 (±0.001 tolerance)
   */
  private static validateSkillWeightsSum(skills: LayerSkills): void {
    const tolerance = 0.001;
    
    for (const layer of getAllTechLayers()) {
      const layerSkills = skills[layer];
      
      // Empty layer is allowed (weight = 0)
      if (layerSkills.length === 0) {
        continue;
      }
      
      const sum = layerSkills.reduce((acc, skillWeight) => acc + skillWeight.weight, 0);
      
      if (Math.abs(sum - 1.0) > tolerance) {
        throw new Error(
          `Skill weights in layer '${layer}' must sum to 1.0 (±${tolerance}). Current sum: ${sum.toFixed(6)}`
        );
      }
    }
  }

  /**
   * Validate that all skill identifiers are non-empty strings
   */
  private static validateSkillIdentifiers(skills: LayerSkills): void {
    for (const layer of getAllTechLayers()) {
      const layerSkills = skills[layer];
      
      for (const skillWeight of layerSkills) {
        if (!skillWeight.skill || typeof skillWeight.skill !== 'string') {
          throw new Error(`Invalid skill identifier in layer '${layer}': must be a non-empty string`);
        }
        
        if (skillWeight.skill.trim().length === 0) {
          throw new Error(`Empty skill identifier in layer '${layer}'`);
        }
        
        if (skillWeight.skill.length > 100) {
          throw new Error(`Skill identifier too long in layer '${layer}': max 100 characters`);
        }
      }
    }
  }

  /**
   * Validate dictionary version format (YYYY.N)
   */
  private static validateDictionaryVersion(version: string): void {
    const versionPattern = /^\d{4}\.\d+$/;
    
    if (!versionPattern.test(version)) {
      throw new Error(
        `Invalid dictionary version format: '${version}'. Expected format: YYYY.N (e.g., 2024.1)`
      );
    }
  }

  // Getters

  getId(): string {
    return this.id;
  }

  getRole(): string {
    return this.role;
  }

  getLayerWeight(layer: TechLayer): number {
    return this.layerWeights[layer];
  }

  getLayerWeights(): LayerWeights {
    return { ...this.layerWeights };
  }

  getSkillsForLayer(layer: TechLayer): SkillWeight[] {
    return [...this.skills[layer]];
  }

  getAllSkills(): LayerSkills {
    return {
      frontend: [...this.skills.frontend],
      backend: [...this.skills.backend],
      database: [...this.skills.database],
      cloud: [...this.skills.cloud],
      devops: [...this.skills.devops],
      others: [...this.skills.others]
    };
  }

  getDictionaryVersion(): string {
    return this.dictionaryVersion;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  /**
   * Serialize to JSON
   */
  toJSON(): CanonicalJDSpecJSON {
    return {
      _id: this.id,
      role: this.role,
      layerWeights: { ...this.layerWeights },
      skills: {
        frontend: [...this.skills.frontend],
        backend: [...this.skills.backend],
        database: [...this.skills.database],
        cloud: [...this.skills.cloud],
        devops: [...this.skills.devops],
        others: [...this.skills.others]
      },
      dictionaryVersion: this.dictionaryVersion,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: CanonicalJDSpecJSON): CanonicalJDSpec {
    return new CanonicalJDSpec(
      json._id,
      json.role,
      json.layerWeights,
      json.skills,
      json.dictionaryVersion,
      new Date(json.createdAt)
    );
  }
}
