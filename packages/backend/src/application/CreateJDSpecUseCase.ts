/**
 * CreateJDSpecUseCase - Application use case for creating JD specifications
 * 
 * Handles the creation of canonical JD specifications by:
 * - Mapping skills using the skill dictionary
 * - Detecting and queueing unknown skills
 * - Validating input before persisting
 * - Saving the JD specification to the repository
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 4.1-4.10, 12.1-12.11
 */

import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { SkillDictionary } from '../domain/SkillDictionary';
import { SkillReviewQueue } from '../domain/SkillReviewQueue';
import { IJDSpecRepository } from './IJDSpecRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { ISkillReviewQueueRepository } from './ISkillReviewQueueRepository';
import { CreateJDSpecData, LayerSkills, getAllTechLayers } from '../domain/JDSpecTypes';

/**
 * Input DTO for CreateJDSpecUseCase
 * Accepts raw skill names that may not be canonical
 */
export interface CreateJDSpecInput {
  role: string;
  layerWeights: {
    frontend: number;
    backend: number;
    database: number;
    cloud: number;
    devops: number;
    others: number;
  };
  skills: {
    frontend: Array<{ skill: string; weight: number }>;
    backend: Array<{ skill: string; weight: number }>;
    database: Array<{ skill: string; weight: number }>;
    cloud: Array<{ skill: string; weight: number }>;
    devops: Array<{ skill: string; weight: number }>;
    others: Array<{ skill: string; weight: number }>;
  };
}

/**
 * Output DTO for CreateJDSpecUseCase
 */
export interface CreateJDSpecOutput {
  jdSpec: CanonicalJDSpec;
  unknownSkills: string[]; // List of skills that were queued for review
}

/**
 * CreateJDSpecUseCase - Creates a canonical JD specification
 */
export class CreateJDSpecUseCase {
  constructor(
    private readonly jdSpecRepository: IJDSpecRepository,
    private readonly skillDictionaryRepository: ISkillDictionaryRepository,
    private readonly skillReviewQueueRepository: ISkillReviewQueueRepository
  ) {}

  /**
   * Execute the use case
   * @param input - The JD specification input data
   * @returns The created JD specification and list of unknown skills
   */
  async execute(input: CreateJDSpecInput): Promise<CreateJDSpecOutput> {
    // Get the current skill dictionary
    const dictionary = await this.skillDictionaryRepository.getCurrent();
    
    // Get the skill review queue
    const reviewQueue = await this.skillReviewQueueRepository.get();
    
    // Map skills to canonical form and detect unknown skills
    const { mappedSkills, unknownSkills, jdId } = this.mapSkillsAndDetectUnknown(
      input.skills,
      dictionary,
      reviewQueue
    );
    
    // Create the canonical JD specification
    const jdSpecData: CreateJDSpecData = {
      id: jdId,
      role: input.role,
      layerWeights: input.layerWeights,
      skills: mappedSkills,
      dictionaryVersion: dictionary.getVersion()
    };
    
    const jdSpec = CanonicalJDSpec.create(jdSpecData);
    
    // Save the JD specification
    await this.jdSpecRepository.save(jdSpec);
    
    // Save the updated review queue if there were unknown skills
    if (unknownSkills.length > 0) {
      await this.skillReviewQueueRepository.save(reviewQueue);
    }
    
    return {
      jdSpec,
      unknownSkills
    };
  }

  /**
   * Map skills to canonical form and detect unknown skills
   * @private
   */
  private mapSkillsAndDetectUnknown(
    inputSkills: CreateJDSpecInput['skills'],
    dictionary: SkillDictionary,
    reviewQueue: SkillReviewQueue
  ): { mappedSkills: LayerSkills; unknownSkills: string[]; jdId: string } {
    const jdId = `jd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const unknownSkills: string[] = [];
    const mappedSkills: LayerSkills = {
      frontend: [],
      backend: [],
      database: [],
      cloud: [],
      devops: [],
      others: []
    };
    
    // Process each layer
    for (const layer of getAllTechLayers()) {
      const layerSkills = inputSkills[layer];
      
      for (const skillWeight of layerSkills) {
        const rawSkillName = skillWeight.skill.trim();
        
        // Validate skill name
        this.validateSkillName(rawSkillName);
        
        // Try to map to canonical form
        const canonicalName = dictionary.mapToCanonical(rawSkillName);
        
        if (canonicalName) {
          // Skill is known - use canonical form
          mappedSkills[layer].push({
            skill: canonicalName,
            weight: skillWeight.weight
          });
        } else {
          // Skill is unknown - queue for review and use normalized form
          const normalizedName = rawSkillName.toLowerCase();
          
          if (!unknownSkills.includes(normalizedName)) {
            unknownSkills.push(normalizedName);
            reviewQueue.addUnknownSkill(normalizedName, jdId);
          }
          
          // Still add the skill to the JD spec using the normalized name
          // This allows the JD to be created even with unknown skills
          mappedSkills[layer].push({
            skill: normalizedName,
            weight: skillWeight.weight
          });
        }
      }
    }
    
    return { mappedSkills, unknownSkills, jdId };
  }

  /**
   * Validate skill name
   * @private
   */
  private validateSkillName(skillName: string): void {
    // Empty or whitespace-only names
    if (!skillName || skillName.trim().length === 0) {
      throw new Error('Skill name cannot be empty or contain only whitespace');
    }
    
    // Length limit
    if (skillName.length > 100) {
      throw new Error(`Skill name too long: '${skillName}' (max 100 characters)`);
    }
  }
}
