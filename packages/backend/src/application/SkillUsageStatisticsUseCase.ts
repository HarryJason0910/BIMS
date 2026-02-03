/**
 * SkillUsageStatisticsUseCase - Track and analyze skill usage across JDs and resumes
 * 
 * Provides statistics on skill usage frequency, trends over time, and variation usage.
 * Supports filtering by date range and sorting by frequency.
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { IJDSpecRepository } from './IJDSpecRepository';
import { IResumeRepository } from './IResumeRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { TechLayer } from '../domain/JDSpecTypes';

export interface SkillUsageStatisticsRequest {
  startDate?: Date; // Optional: filter by date range
  endDate?: Date;   // Optional: filter by date range
  category?: TechLayer; // Optional: filter by skill category
  sortBy?: 'frequency' | 'name'; // Sort order (default: frequency)
  sortOrder?: 'asc' | 'desc'; // Sort direction (default: desc for frequency)
}

export interface SkillStatistic {
  skillName: string;
  category: TechLayer;
  jdCount: number; // Number of JDs using this skill
  resumeCount: number; // Number of resumes using this skill
  totalUsage: number; // Total usage count (jdCount + resumeCount)
  variations: string[]; // List of variations used
  variationUsageCount: number; // Number of times variations were used
  firstSeen: Date; // First time this skill was used
  lastSeen: Date; // Last time this skill was used
}

export interface SkillUsageStatisticsResponse {
  success: boolean;
  statistics: SkillStatistic[];
  totalSkills: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  message: string;
}

export class SkillUsageStatisticsUseCase {
  constructor(
    private readonly jdSpecRepository: IJDSpecRepository,
    private readonly resumeRepository: IResumeRepository,
    private readonly dictionaryRepository: ISkillDictionaryRepository
  ) {}

  async execute(request: SkillUsageStatisticsRequest = {}): Promise<SkillUsageStatisticsResponse> {
    try {
      // Fetch all JD specifications
      const allJDSpecs = await this.jdSpecRepository.findAll();
      
      // Fetch all resumes
      const allResumes = await this.resumeRepository.getAllResumeMetadata();
      
      // Fetch current dictionary for skill information
      const dictionary = await this.dictionaryRepository.getCurrent();
      
      // Filter by date range if specified
      const filteredJDSpecs = this.filterByDateRange(
        allJDSpecs,
        request.startDate,
        request.endDate
      );
      
      const filteredResumes = this.filterResumesByDateRange(
        allResumes,
        request.startDate,
        request.endDate
      );
      
      // Build skill usage map
      const skillUsageMap = new Map<string, {
        category: TechLayer;
        jdCount: number;
        resumeCount: number;
        variations: Set<string>;
        variationUsageCount: number;
        firstSeen: Date;
        lastSeen: Date;
      }>();
      
      // Track skill usage from JD specifications
      for (const jdSpec of filteredJDSpecs) {
        const allSkills = jdSpec.getAllSkills();
        const jdDate = jdSpec.getCreatedAt();
        
        // Iterate over each layer
        for (const layer of Object.keys(allSkills) as TechLayer[]) {
          const layerSkills = allSkills[layer];
          
          // Iterate over each skill in the layer
          for (const skillWeight of layerSkills) {
            const skill = skillWeight.skill;
            const canonicalSkill = dictionary.mapToCanonical(skill);
            const skillKey = canonicalSkill || skill;
            
            if (!skillUsageMap.has(skillKey)) {
              skillUsageMap.set(skillKey, {
                category: layer,
                jdCount: 0,
                resumeCount: 0,
                variations: new Set<string>(),
                variationUsageCount: 0,
                firstSeen: jdDate,
                lastSeen: jdDate
              });
            }
            
            const stats = skillUsageMap.get(skillKey)!;
            stats.jdCount++;
            
            // Track if this is a variation
            if (canonicalSkill && canonicalSkill !== skill) {
              stats.variations.add(skill);
              stats.variationUsageCount++;
            }
            
            // Update date range
            if (jdDate < stats.firstSeen) {
              stats.firstSeen = jdDate;
            }
            if (jdDate > stats.lastSeen) {
              stats.lastSeen = jdDate;
            }
          }
        }
      }
      
      // Track skill usage from resumes
      for (const resume of filteredResumes) {
        const resumeDate = resume.createdAt;
        
        for (const skill of resume.techStack.getTechnologies()) {
          const canonicalSkill = dictionary.mapToCanonical(skill);
          const skillKey = canonicalSkill || skill;
          
          // Get skill info from dictionary
          const skillInfo = dictionary.getCanonicalSkill(skillKey);
          
          if (!skillUsageMap.has(skillKey)) {
            skillUsageMap.set(skillKey, {
              category: skillInfo?.category || 'others',
              jdCount: 0,
              resumeCount: 0,
              variations: new Set<string>(),
              variationUsageCount: 0,
              firstSeen: resumeDate,
              lastSeen: resumeDate
            });
          }
          
          const stats = skillUsageMap.get(skillKey)!;
          stats.resumeCount++;
          
          // Track if this is a variation
          if (canonicalSkill && canonicalSkill !== skill) {
            stats.variations.add(skill);
            stats.variationUsageCount++;
          }
          
          // Update date range
          if (resumeDate < stats.firstSeen) {
            stats.firstSeen = resumeDate;
          }
          if (resumeDate > stats.lastSeen) {
            stats.lastSeen = resumeDate;
          }
        }
      }
      
      // Convert map to array of statistics
      let statistics: SkillStatistic[] = Array.from(skillUsageMap.entries()).map(
        ([skillName, stats]) => ({
          skillName,
          category: stats.category,
          jdCount: stats.jdCount,
          resumeCount: stats.resumeCount,
          totalUsage: stats.jdCount + stats.resumeCount,
          variations: Array.from(stats.variations),
          variationUsageCount: stats.variationUsageCount,
          firstSeen: stats.firstSeen,
          lastSeen: stats.lastSeen
        })
      );
      
      // Filter by category if specified
      if (request.category) {
        statistics = statistics.filter(stat => stat.category === request.category);
      }
      
      // Sort statistics
      statistics = this.sortStatistics(
        statistics,
        request.sortBy || 'frequency',
        request.sortOrder || 'desc'
      );
      
      return {
        success: true,
        statistics,
        totalSkills: statistics.length,
        dateRange: {
          start: request.startDate || null,
          end: request.endDate || null
        },
        message: `Successfully retrieved statistics for ${statistics.length} skills`
      };
    } catch (error) {
      return {
        success: false,
        statistics: [],
        totalSkills: 0,
        dateRange: {
          start: null,
          end: null
        },
        message: error instanceof Error ? error.message : 'Unknown error retrieving statistics'
      };
    }
  }

  /**
   * Filter JD specifications by date range
   */
  private filterByDateRange(
    jdSpecs: any[],
    startDate?: Date,
    endDate?: Date
  ): any[] {
    if (!startDate && !endDate) {
      return jdSpecs;
    }
    
    return jdSpecs.filter(spec => {
      const createdAt = spec.getCreatedAt();
      
      if (startDate && createdAt < startDate) {
        return false;
      }
      
      if (endDate && createdAt > endDate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Filter resumes by date range
   */
  private filterResumesByDateRange(
    resumes: any[],
    startDate?: Date,
    endDate?: Date
  ): any[] {
    if (!startDate && !endDate) {
      return resumes;
    }
    
    return resumes.filter(resume => {
      const createdAt = resume.createdAt;
      
      if (startDate && createdAt < startDate) {
        return false;
      }
      
      if (endDate && createdAt > endDate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort statistics by specified criteria
   */
  private sortStatistics(
    statistics: SkillStatistic[],
    sortBy: 'frequency' | 'name',
    sortOrder: 'asc' | 'desc'
  ): SkillStatistic[] {
    const sorted = [...statistics];
    
    if (sortBy === 'frequency') {
      sorted.sort((a, b) => {
        const diff = b.totalUsage - a.totalUsage;
        return sortOrder === 'desc' ? diff : -diff;
      });
    } else {
      sorted.sort((a, b) => {
        const comparison = a.skillName.localeCompare(b.skillName);
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return sorted;
  }
}
