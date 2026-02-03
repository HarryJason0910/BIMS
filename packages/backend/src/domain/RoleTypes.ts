/**
 * RoleTypes - Type definitions and constants for role-based layer weights
 * 
 * Defines role structure, seniority levels, basic titles, and predefined layer weights.
 * 
 * Part of: role-based-layer-weights feature
 * Requirements: 1, 2, 3, 4
 */

import { LayerWeights } from './JDSpecTypes';

/**
 * Seniority levels for job roles
 */
export enum SeniorityLevel {
  Junior = 'Junior',
  Mid = 'Mid',
  Senior = 'Senior',
  Lead = 'Lead',
  Staff = 'Staff'
}

/**
 * Basic job titles (without seniority prefix)
 */
export enum BasicTitle {
  SoftwareEngineer = 'Software Engineer',
  BackendEngineer = 'Backend Engineer',
  FrontendDeveloper = 'Frontend Developer',
  FullStackEngineer = 'Full Stack Engineer',
  QAAutomationEngineer = 'QA Automation Engineer',
  DevOpsEngineer = 'DevOps Engineer',
  DataEngineer = 'Data Engineer',
  MobileDeveloper = 'Mobile Developer'
}

/**
 * Full Stack Engineer modifiers (specialization)
 */
export enum FullStackModifier {
  Balanced = 'Balanced',
  FrontendHeavy = 'Frontend Heavy',
  BackendHeavy = 'Backend Heavy'
}

/**
 * Predefined layer weights for each role type
 * 
 * Note: Seniority level doesn't affect layer weights
 * "Junior Backend Engineer" and "Senior Backend Engineer" use the same weights
 */
export const ROLE_LAYER_WEIGHTS: Record<string, LayerWeights> = {
  // Software Engineer (general)
  'Software Engineer': {
    frontend: 0.25,
    backend: 0.40,
    database: 0.15,
    cloud: 0.10,
    devops: 0.05,
    others: 0.05
  },
  
  // Backend roles
  'Backend Engineer': {
    frontend: 0.05,
    backend: 0.60,
    database: 0.20,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Frontend roles
  'Frontend Developer': {
    frontend: 0.70,
    backend: 0.10,
    database: 0.05,
    cloud: 0.05,
    devops: 0.05,
    others: 0.05
  },
  
  // Full Stack - Balanced
  'Balanced Full Stack Engineer': {
    frontend: 0.35,
    backend: 0.35,
    database: 0.15,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Full Stack - Frontend Heavy
  'Frontend Heavy Full Stack Engineer': {
    frontend: 0.50,
    backend: 0.25,
    database: 0.10,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Full Stack - Backend Heavy
  'Backend Heavy Full Stack Engineer': {
    frontend: 0.25,
    backend: 0.50,
    database: 0.15,
    cloud: 0.05,
    devops: 0.05,
    others: 0.00
  },
  
  // QA roles
  'QA Automation Engineer': {
    frontend: 0.20,
    backend: 0.30,
    database: 0.10,
    cloud: 0.10,
    devops: 0.20,
    others: 0.10
  },
  
  // DevOps roles
  'DevOps Engineer': {
    frontend: 0.00,
    backend: 0.15,
    database: 0.10,
    cloud: 0.40,
    devops: 0.35,
    others: 0.00
  },
  
  // Data roles
  'Data Engineer': {
    frontend: 0.00,
    backend: 0.30,
    database: 0.50,
    cloud: 0.15,
    devops: 0.05,
    others: 0.00
  },
  
  // Mobile roles
  'Mobile Developer': {
    frontend: 0.60,
    backend: 0.15,
    database: 0.10,
    cloud: 0.10,
    devops: 0.00,
    others: 0.05
  }
};

/**
 * Get all seniority levels as an array
 */
export function getAllSeniorityLevels(): string[] {
  return Object.values(SeniorityLevel);
}

/**
 * Get all basic titles as an array
 */
export function getAllBasicTitles(): string[] {
  return Object.values(BasicTitle);
}

/**
 * Get all full stack modifiers as an array
 */
export function getAllFullStackModifiers(): string[] {
  return Object.values(FullStackModifier);
}

/**
 * Check if a basic title requires a full stack modifier
 */
export function requiresFullStackModifier(basicTitle: string): boolean {
  return basicTitle === BasicTitle.FullStackEngineer;
}
