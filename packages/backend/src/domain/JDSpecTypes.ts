/**
 * JDSpecTypes - Type definitions for JD Specification domain
 * 
 * Defines the core types and interfaces for the Enhanced Skill Matching system.
 * These types support the 6-layer weighted architecture for JD-to-JD correlation.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 1.1, 1.6, 2.2
 */

/**
 * TechLayer - The six technical categories used in JD specifications
 */
export type TechLayer = 'frontend' | 'backend' | 'database' | 'cloud' | 'devops' | 'others';

/**
 * LayerWeights - Weights for each technical layer (must sum to 1.0)
 */
export interface LayerWeights {
  frontend: number;
  backend: number;
  database: number;
  cloud: number;
  devops: number;
  others: number;
}

/**
 * SkillWeight - A skill with its importance weight within a layer
 */
export interface SkillWeight {
  skill: string;  // canonical skill ID
  weight: number; // 0-1, must sum to 1.0 within layer
}

/**
 * LayerSkills - Skills organized by technical layer
 */
export interface LayerSkills {
  frontend: SkillWeight[];
  backend: SkillWeight[];
  database: SkillWeight[];
  cloud: SkillWeight[];
  devops: SkillWeight[];
  others: SkillWeight[];
}

/**
 * CanonicalSkill - A skill in the canonical dictionary
 */
export interface CanonicalSkill {
  name: string;
  category: TechLayer;
  createdAt: Date;
}

/**
 * UnknownSkillItem - An unknown skill awaiting review
 */
export interface UnknownSkillItem {
  skillName: string;
  frequency: number;
  firstDetectedAt: Date;
  detectedIn: string[]; // JD IDs where this skill appeared
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * ApprovalDecision - Result of approving an unknown skill
 */
export interface ApprovalDecision {
  skillName: string;
  decision: 'canonical' | 'variation';
  canonicalName: string;
  category?: TechLayer;
  approvedAt: Date;
}

/**
 * RejectionDecision - Result of rejecting an unknown skill
 */
export interface RejectionDecision {
  skillName: string;
  reason: string;
  rejectedAt: Date;
}

/**
 * CreateJDSpecData - Data required to create a JD specification
 */
export interface CreateJDSpecData {
  id?: string;
  role: string;
  layerWeights: LayerWeights;
  skills: LayerSkills;
  dictionaryVersion: string;
}

/**
 * CanonicalJDSpecJSON - JSON representation of a JD specification
 */
export interface CanonicalJDSpecJSON {
  _id: string;
  role: string;
  layerWeights: LayerWeights;
  skills: LayerSkills;
  dictionaryVersion: string;
  createdAt: string;
}

/**
 * SkillDictionaryJSON - JSON representation of a skill dictionary
 */
export interface SkillDictionaryJSON {
  version: string;
  skills: Array<{
    name: string;
    category: TechLayer;
    createdAt: string;
  }>;
  variations: { variation: string; canonical: string }[];
  createdAt: string;
}

/**
 * CorrelationResult - Result of JD-to-JD correlation calculation
 */
export interface CorrelationResult {
  overallScore: number; // 0-1
  layerBreakdown: Map<TechLayer, LayerCorrelationResult>;
  currentDictionaryVersion: string;
  pastDictionaryVersion: string;
}

/**
 * LayerCorrelationResult - Correlation result for a single layer
 */
export interface LayerCorrelationResult {
  score: number; // 0-1
  matchingSkills: string[];
  missingSkills: string[];
  layerWeight: number;
}

/**
 * Helper function to get all tech layers
 */
export function getAllTechLayers(): TechLayer[] {
  return ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
}

/**
 * Helper function to validate if a string is a valid TechLayer
 */
export function isValidTechLayer(value: string): value is TechLayer {
  return ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'].includes(value);
}

/**
 * Helper function to validate LayerWeights sum to 1.0 (±0.001 tolerance)
 */
export function isValidLayerWeights(weights: LayerWeights): boolean {
  const sum = weights.frontend + weights.backend + weights.database + 
              weights.cloud + weights.devops + weights.others;
  return Math.abs(sum - 1.0) <= 0.001;
}

/**
 * Helper function to get weight for a specific layer
 */
export function getLayerWeight(weights: LayerWeights, layer: TechLayer): number {
  return weights[layer];
}

/**
 * Helper function to convert LayerWeights to JSON
 */
export function layerWeightsToJSON(weights: LayerWeights): LayerWeights {
  return {
    frontend: weights.frontend,
    backend: weights.backend,
    database: weights.database,
    cloud: weights.cloud,
    devops: weights.devops,
    others: weights.others
  };
}
