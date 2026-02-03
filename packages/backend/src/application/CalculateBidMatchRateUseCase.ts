/**
 * CalculateBidMatchRateUseCase - Calculate weighted match rates between bids
 * 
 * Compares a current bid against all other bids using weighted skill matching.
 * Returns sorted results with layer breakdown.
 * 
 * Part of: role-based-layer-weights feature
 * Requirements: 7, 10
 */

import { IBidRepository } from './IBidRepository';
import { WeightedMatchRateCalculator, MatchResult } from '../domain/WeightedMatchRateCalculator';
import { TechLayer } from '../domain/JDSpecTypes';

/**
 * Layer match result for API response
 */
export interface LayerMatchResultDTO {
  score: number; // 0-1
  matchingSkills: string[];
  missingSkills: string[];
  layerWeight: number;
}

/**
 * Bid match rate result for API response
 */
export interface BidMatchRateResult {
  bidId: string;
  company: string;
  role: string;
  matchRate: number; // 0-1
  matchRatePercentage: number; // 0-100
  layerBreakdown: Record<TechLayer, LayerMatchResultDTO>;
}

/**
 * Use case for calculating match rates between bids
 */
export class CalculateBidMatchRateUseCase {
  constructor(
    private bidRepository: IBidRepository,
    private matchRateCalculator: WeightedMatchRateCalculator
  ) {}

  /**
   * Calculate match rates for a current bid against all other bids
   * 
   * @param currentBidId - ID of the current bid to compare
   * @returns Array of match results sorted by match rate (descending)
   */
  async execute(currentBidId: string): Promise<BidMatchRateResult[]> {
    // 1. Fetch current bid
    const currentBid = await this.bidRepository.findById(currentBidId);
    if (!currentBid) {
      throw new Error(`Bid not found: ${currentBidId}`);
    }

    // 2. Check if current bid uses new LayerSkills format
    if (!currentBid.isLayerSkillsFormat()) {
      throw new Error('Current bid must use LayerSkills format for match rate calculation');
    }

    // 3. Fetch all other bids
    const allBids = await this.bidRepository.findAll();
    const otherBids = allBids.filter(bid => 
      bid.id !== currentBidId && bid.isLayerSkillsFormat()
    );

    // 4. Calculate match rate for each bid
    const results: BidMatchRateResult[] = [];
    for (const matchedBid of otherBids) {
      const matchResult = this.matchRateCalculator.calculate(currentBid, matchedBid);
      
      // Convert layer breakdown from Map to Record for JSON serialization
      const layerBreakdown: Record<TechLayer, LayerMatchResultDTO> = {
        frontend: this.convertLayerResult(matchResult, 'frontend'),
        backend: this.convertLayerResult(matchResult, 'backend'),
        database: this.convertLayerResult(matchResult, 'database'),
        cloud: this.convertLayerResult(matchResult, 'cloud'),
        devops: this.convertLayerResult(matchResult, 'devops'),
        others: this.convertLayerResult(matchResult, 'others')
      };

      results.push({
        bidId: matchedBid.id,
        company: matchedBid.company,
        role: matchedBid.role,
        matchRate: matchResult.overallMatchRate,
        matchRatePercentage: matchResult.overallMatchRate * 100,
        layerBreakdown
      });
    }

    // 5. Sort by match rate (descending)
    results.sort((a, b) => b.matchRate - a.matchRate);

    return results;
  }

  /**
   * Convert layer result from Map to DTO
   */
  private convertLayerResult(matchResult: MatchResult, layer: TechLayer): LayerMatchResultDTO {
    const layerResult = matchResult.layerBreakdown.get(layer);
    if (!layerResult) {
      throw new Error(`Layer result not found for ${layer}`);
    }

    return {
      score: layerResult.score,
      matchingSkills: layerResult.matchingSkills,
      missingSkills: layerResult.missingSkills,
      layerWeight: layerResult.layerWeight
    };
  }
}
