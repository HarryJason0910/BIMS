/**
 * JDCorrelationCalculator - Domain service for JD-to-JD correlation
 * 
 * Calculates correlation scores between two JD specifications using a deterministic,
 * weighted formula. This is the core algorithm for the enhanced skill matching system.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.4, 8.5
 */

import { CanonicalJDSpec } from './CanonicalJDSpec';
import {
  TechLayer,
  CorrelationResult,
  LayerCorrelationResult,
  getAllTechLayers
} from './JDSpecTypes';

export class JDCorrelationCalculator {
  
  /**
   * Calculate correlation between two JD specifications
   * 
   * Formula:
   * - layerCorrelation(L) = Σ (weightCurrent(skill) × weightPast(skill) × similarity(skillCurrent, skillPast))
   * - JD_Correlation = Σ (layerCorrelation(L) × layerWeightCurrent(L))
   * 
   * @param currentJD - The current job description
   * @param pastJD - The past job description to compare against
   * @returns Correlation result with overall score and layer breakdown
   */
  calculate(currentJD: CanonicalJDSpec, pastJD: CanonicalJDSpec): CorrelationResult {
    const layerBreakdown = new Map<TechLayer, LayerCorrelationResult>();
    let overallScore = 0;
    
    // Calculate correlation for each layer
    for (const layer of getAllTechLayers()) {
      const currentSkills = currentJD.getSkillsForLayer(layer);
      const pastSkills = pastJD.getSkillsForLayer(layer);
      const layerWeight = currentJD.getLayerWeight(layer);
      
      const layerResult = this.calculateLayerCorrelation(
        currentSkills,
        pastSkills
      );
      
      layerResult.layerWeight = layerWeight;
      layerBreakdown.set(layer, layerResult);
      
      // Contribute to overall score using current JD's layer weight
      overallScore += layerResult.score * layerWeight;
    }
    
    return {
      overallScore,
      layerBreakdown,
      currentDictionaryVersion: currentJD.getDictionaryVersion(),
      pastDictionaryVersion: pastJD.getDictionaryVersion()
    };
  }

  /**
   * Calculate correlation for a single layer
   * 
   * @param currentSkills - Skills from current JD for this layer
   * @param pastSkills - Skills from past JD for this layer
   * @returns Layer correlation result with score and skill details
   */
  private calculateLayerCorrelation(
    currentSkills: Array<{ skill: string; weight: number }>,
    pastSkills: Array<{ skill: string; weight: number }>
  ): LayerCorrelationResult {
    // If current JD has no skills in this layer, correlation is 0
    if (currentSkills.length === 0) {
      return {
        score: 0,
        matchingSkills: [],
        missingSkills: [],
        layerWeight: 0
      };
    }
    
    // If past JD has no skills in this layer, all current skills are missing
    if (pastSkills.length === 0) {
      return {
        score: 0,
        matchingSkills: [],
        missingSkills: currentSkills.map(s => s.skill),
        layerWeight: 0
      };
    }
    
    // Create a map of past skills for quick lookup
    const pastSkillMap = new Map<string, number>();
    for (const { skill, weight } of pastSkills) {
      pastSkillMap.set(skill, weight);
    }
    
    let layerScore = 0;
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];
    
    // Calculate weighted correlation for each skill in current JD
    for (const { skill: currentSkill, weight: currentWeight } of currentSkills) {
      const pastWeight = pastSkillMap.get(currentSkill);
      
      if (pastWeight !== undefined) {
        // Skill exists in both JDs
        const similarity = this.calculateSkillSimilarity(currentSkill, currentSkill);
        layerScore += currentWeight * pastWeight * similarity;
        matchingSkills.push(currentSkill);
      } else {
        // Skill missing in past JD
        missingSkills.push(currentSkill);
        // Contribution is 0 (similarity = 0 for missing skills)
      }
    }
    
    return {
      score: layerScore,
      matchingSkills,
      missingSkills,
      layerWeight: 0 // Will be set by caller
    };
  }

  /**
   * Calculate similarity between two skills
   * 
   * Current implementation:
   * - Exact match: 1.0
   * - Different skills: 0.0
   * 
   * Future enhancement: Use skill graph for partial similarity
   * 
   * @param currentSkill - Skill from current JD
   * @param pastSkill - Skill from past JD
   * @returns Similarity score in range [0, 1]
   */
  private calculateSkillSimilarity(currentSkill: string, pastSkill: string): number {
    // Exact match
    if (currentSkill === pastSkill) {
      return 1.0;
    }
    
    // No match (future: could use skill graph for partial similarity)
    return 0.0;
  }
}
