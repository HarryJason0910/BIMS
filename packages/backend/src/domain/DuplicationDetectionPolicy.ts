/**
 * Duplication Detection Policy - Job Bid and Interview Management System
 * 
 * Domain policy that identifies potential duplicate bids based on:
 * 1. Link matching (exact match)
 * 2. Company + Role matching (case-insensitive)
 * 
 * This is a pure domain policy with no infrastructure dependencies.
 */

import { Bid, CreateBidData } from './Bid';

/**
 * Type of duplication warning
 */
export type DuplicationWarningType = 'LINK_MATCH' | 'COMPANY_ROLE_MATCH';

/**
 * Warning about a potential duplicate bid
 */
export interface DuplicationWarning {
  type: DuplicationWarningType;
  existingBidId: string;
  message: string;
}

/**
 * Duplication Detection Policy
 * 
 * Identifies potential duplicate bids by checking:
 * - Link matching: exact match of job posting URL
 * - Company+Role matching: case-insensitive match of company and role combination
 * 
 * Returns all warnings found (can have multiple warnings for the same bid).
 * Warnings are informational and do not block bid creation.
 */
export class DuplicationDetectionPolicy {
  /**
   * Check for potential duplicates of a new bid against existing bids
   * 
   * @param newBid - The new bid data to check
   * @param existingBids - Array of existing bids to check against
   * @returns Array of duplication warnings (empty if no duplicates found)
   */
  checkDuplication(
    newBid: CreateBidData,
    existingBids: Bid[]
  ): DuplicationWarning[] {
    const warnings: DuplicationWarning[] = [];

    // Check each existing bid for potential duplicates
    for (const existingBid of existingBids) {
      // Check for link match (exact match)
      if (this.isLinkMatch(newBid.link, existingBid.link)) {
        warnings.push({
          type: 'LINK_MATCH',
          existingBidId: existingBid.id,
          message: `Duplicate link detected: This job posting URL matches an existing bid (ID: ${existingBid.id})`
        });
      }

      // Check for company + role match (case-insensitive)
      if (this.isCompanyRoleMatch(newBid, existingBid)) {
        warnings.push({
          type: 'COMPANY_ROLE_MATCH',
          existingBidId: existingBid.id,
          message: `Duplicate company and role detected: ${newBid.company} - ${newBid.role} matches an existing bid (ID: ${existingBid.id})`
        });
      }
    }

    return warnings;
  }

  /**
   * Check if two links match exactly
   * 
   * @param newLink - The new bid's link
   * @param existingLink - The existing bid's link
   * @returns true if links match exactly
   */
  private isLinkMatch(newLink: string, existingLink: string): boolean {
    return newLink === existingLink;
  }

  /**
   * Check if company and role match (case-insensitive)
   * 
   * @param newBid - The new bid data
   * @param existingBid - The existing bid
   * @returns true if both company and role match (case-insensitive)
   */
  private isCompanyRoleMatch(newBid: CreateBidData, existingBid: Bid): boolean {
    const newCompanyLower = newBid.company.toLowerCase();
    const existingCompanyLower = existingBid.company.toLowerCase();
    const newRoleLower = newBid.role.toLowerCase();
    const existingRoleLower = existingBid.role.toLowerCase();

    return newCompanyLower === existingCompanyLower && 
           newRoleLower === existingRoleLower;
  }
}
