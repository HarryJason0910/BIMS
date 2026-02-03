/**
 * WeightedMatchRateCalculator - Domain service for calculating weighted match rates
 * 
 * Calculates match rates between bids using weighted skill matching.
 * Uses the weighted product formula: layerScore = Σ (currentWeight × matchedWeight) for matching skills
 * 
 * Part of: role-based-layer-weights feature
 * Requirements: 7
 */

import { Bid } from './Bid';
import { TechLayer, SkillWeight } from './JDSpecTypes';

/**
 * Match result for a single layer
 */
export interface LayerMatchResult {
  score: number; // 0-1
  matchingSkills: string[];
  missingSkills: string[];
  layerWeight: number;
}

/**
 * Overall match result
 */
export interface MatchResult {
  overallMatchRate: number; // 0-1
  layerBreakdown: Map<TechLayer, LayerMatchResult>;
}

/**
 * WeightedMatchRateCalculator - Calculates weighted match rates between bids
 */
export class WeightedMatchRateCalculator {
  private static readonly ALL_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

  /**
   * Calculate match rate between two bids using weighted skill matching
   * 
   * @param currentBid - The current job description
   * @param matchedBid - The past job description to compare
   * @returns Match rate (0-1) and layer breakdown
   */
  calculate(currentBid: Bid, matchedBid: Bid): MatchResult {
    const layerBreakdown = new Map<TechLayer, LayerMatchResult>();
    let overallScore = 0;

    for (const layer of WeightedMatchRateCalculator.ALL_LAYERS) {
      const currentSkills = currentBid.getSkillsForLayer(layer);
      const matchedSkills = matchedBid.getSkillsForLayer(layer);
      const layerWeight = currentBid.getLayerWeight(layer);

      // Calculate layer score using weighted product formula
      const layerScore = this.calculateLayerScore(currentSkills, matchedSkills);

      layerBreakdown.set(layer, {
        score: layerScore,
        matchingSkills: this.getMatchingSkills(currentSkills, matchedSkills),
        missingSkills: this.getMissingSkills(currentSkills, matchedSkills),
        layerWeight
      });

      overallScore += layerScore * layerWeight;
    }

    return {
      overallMatchRate: overallScore,
      layerBreakdown
    };
  }

  /**
   * Calculate layer score using weighted product formula
   * 
   * Formula: layerScore = Σ (currentWeight × matchedWeight) for matching skills
   * 
   * @param currentSkills - Skills from current bid
   * @param matchedSkills - Skills from matched bid
   * @returns Layer score (0-1)
   */
  private calculateLayerScore(
    currentSkills: SkillWeight[],
    matchedSkills: SkillWeight[]
  ): number {
    if (currentSkills.length === 0) {
      // No skills required in this layer - perfect match
      return 0;
    }

    // Create map for O(1) lookup (case-insensitive)
    const matchedMap = new Map<string, number>();
    for (const { skill, weight } of matchedSkills) {
      matchedMap.set(skill.toLowerCase(), weight);
    }

    let layerScore = 0;
    for (const { skill, weight: currentWeight } of currentSkills) {
      const matchedWeight = matchedMap.get(skill.toLowerCase());
      if (matchedWeight !== undefined) {
        // Skill matches - add weighted product
        layerScore += currentWeight * matchedWeight;
      }
      // If skill doesn't match, contribution is 0
    }

    return layerScore;
  }

  /**
   * Get list of matching skills (skill names only)
   * 
   * @param current - Current skills
   * @param matched - Matched skills
   * @returns Array of matching skill names
   */
  private getMatchingSkills(
    current: SkillWeight[],
    matched: SkillWeight[]
  ): string[] {
    const matchedSet = new Set(matched.map(s => s.skill.toLowerCase()));
    return current
      .filter(s => matchedSet.has(s.skill.toLowerCase()))
      .map(s => s.skill);
  }

  /**
   * Get list of missing skills (in current but not in matched)
   * 
   * @param current - Current skills
   * @param matched - Matched skills
   * @returns Array of missing skill names
   */
  private getMissingSkills(
    current: SkillWeight[],
    matched: SkillWeight[]
  ): string[] {
    const matchedSet = new Set(matched.map(s => s.skill.toLowerCase()));
    return current
      .filter(s => !matchedSet.has(s.skill.toLowerCase()))
      .map(s => s.skill);
  }
}
