/**
 * RoleService - Domain service for role management and layer weight retrieval
 * 
 * Provides methods to parse role strings, extract basic titles, and retrieve
 * default layer weights for different role types.
 * 
 * Part of: role-based-layer-weights feature
 * Requirements: 1, 2, 3, 4
 */

import { LayerWeights, isValidLayerWeights } from './JDSpecTypes';
import { 
  ROLE_LAYER_WEIGHTS, 
  SeniorityLevel, 
  BasicTitle,
  FullStackModifier
} from './RoleTypes';

/**
 * Parsed role structure
 */
export interface ParsedRole {
  seniority: string;
  basicTitle: string;
  modifier?: string;
}

/**
 * RoleService - Domain service for role operations
 */
export class RoleService {
  /**
   * Get default layer weights for a role
   * Extracts the basic title from the full role string
   * 
   * Examples:
   * - "Senior Backend Engineer" → "Backend Engineer" → weights
   * - "Junior Frontend Heavy Full Stack Engineer" → "Frontend Heavy Full Stack Engineer" → weights
   * 
   * @param role - Full role string (e.g., "Senior Backend Engineer")
   * @returns Default layer weights for the role
   * @throws Error if role is invalid or unknown
   */
  getDefaultLayerWeights(role: string): LayerWeights {
    const basicTitle = this.extractBasicTitle(role);
    
    const weights = ROLE_LAYER_WEIGHTS[basicTitle];
    if (!weights) {
      throw new Error(`Unknown role: ${basicTitle}`);
    }
    
    // Validate weights sum to 1.0
    if (!isValidLayerWeights(weights)) {
      throw new Error(`Invalid layer weights for role ${basicTitle}: weights do not sum to 1.0`);
    }
    
    return weights;
  }
  
  /**
   * Extract basic title from full role string (removes seniority prefix)
   * 
   * Examples:
   * - "Senior Backend Engineer" → "Backend Engineer"
   * - "Junior Frontend Heavy Full Stack Engineer" → "Frontend Heavy Full Stack Engineer"
   * - "Backend Engineer" → "Backend Engineer" (no seniority)
   * 
   * @param role - Full role string
   * @returns Basic title (may include Full Stack modifier)
   */
  extractBasicTitle(role: string): string {
    const seniorities = Object.values(SeniorityLevel);
    
    for (const seniority of seniorities) {
      if (role.startsWith(seniority + ' ')) {
        return role.substring(seniority.length + 1);
      }
    }
    
    // No seniority prefix found, return as-is
    return role;
  }
  
  /**
   * Validate if a role string is valid
   * 
   * @param role - Full role string
   * @returns true if role is valid, false otherwise
   */
  validateRole(role: string): boolean {
    try {
      this.getDefaultLayerWeights(role);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Parse a role string into its components
   * 
   * Examples:
   * - "Senior Backend Engineer" → { seniority: "Senior", basicTitle: "Backend Engineer" }
   * - "Junior Frontend Heavy Full Stack Engineer" → 
   *   { seniority: "Junior", basicTitle: "Full Stack Engineer", modifier: "Frontend Heavy" }
   * 
   * @param role - Full role string
   * @returns Parsed role components
   * @throws Error if role format is invalid
   */
  parseRole(role: string): ParsedRole {
    const seniorities = Object.values(SeniorityLevel);
    let seniority = '';
    let remainder = role;
    
    // Extract seniority
    for (const sen of seniorities) {
      if (role.startsWith(sen + ' ')) {
        seniority = sen;
        remainder = role.substring(sen.length + 1);
        break;
      }
    }
    
    if (!seniority) {
      throw new Error(`Invalid role format: missing seniority level in "${role}"`);
    }
    
    // Check for Full Stack Engineer with modifier
    const fullStackModifiers = Object.values(FullStackModifier);
    for (const modifier of fullStackModifiers) {
      if (remainder.startsWith(modifier + ' ')) {
        const basicTitle = remainder.substring(modifier.length + 1);
        if (basicTitle === BasicTitle.FullStackEngineer) {
          return { seniority, basicTitle, modifier };
        }
      }
    }
    
    // Check if it's a Full Stack Engineer without modifier (invalid)
    if (remainder === BasicTitle.FullStackEngineer) {
      throw new Error(`Full Stack Engineer role requires a modifier (Balanced, Frontend Heavy, or Backend Heavy)`);
    }
    
    // Regular role without modifier
    const basicTitles = Object.values(BasicTitle);
    if (basicTitles.includes(remainder as BasicTitle)) {
      return { seniority, basicTitle: remainder };
    }
    
    throw new Error(`Invalid role format: unknown basic title "${remainder}"`);
  }
  
  /**
   * Compose a role string from components
   * 
   * @param seniority - Seniority level
   * @param basicTitle - Basic job title
   * @param modifier - Optional Full Stack modifier
   * @returns Composed role string
   */
  composeRole(seniority: string, basicTitle: string, modifier?: string): string {
    if (modifier) {
      return `${seniority} ${modifier} ${basicTitle}`;
    }
    return `${seniority} ${basicTitle}`;
  }
}
