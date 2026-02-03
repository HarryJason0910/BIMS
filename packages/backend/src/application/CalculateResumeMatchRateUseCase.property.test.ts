/**
 * Property-Based Tests for CalculateResumeMatchRateUseCase
 * 
 * Tests universal properties that must hold for all valid inputs using fast-check.
 * Each property is run with 100+ iterations to ensure correctness across diverse inputs.
 * 
 * Part of: enhanced-skill-matching feature
 */

import * as fc from 'fast-check';
import { CalculateResumeMatchRateUseCase } from './CalculateResumeMatchRateUseCase';
import { IJDSpecRepository } from './IJDSpecRepository';
import { IResumeRepository } from './IResumeRepository';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { ResumeMetadata } from '../domain/ResumeMetadata';
import { TechStackValue } from '../domain/TechStackValue';

// Mock repositories
class MockJDSpecRepository implements IJDSpecRepository {
  private specs = new Map<string, CanonicalJDSpec>();

  async save(spec: CanonicalJDSpec): Promise<void> {
    this.specs.set(spec.getId(), spec);
  }

  async findById(id: string): Promise<CanonicalJDSpec | null> {
    return this.specs.get(id) || null;
  }

  async findAll(): Promise<CanonicalJDSpec[]> {
    return Array.from(this.specs.values());
  }

  async update(spec: CanonicalJDSpec): Promise<void> {
    this.specs.set(spec.getId(), spec);
  }

  async delete(id: string): Promise<void> {
    this.specs.delete(id);
  }
}

class MockResumeRepository implements IResumeRepository {
  private resumes: any[] = [];

  setResumes(resumes: any[]) {
    this.resumes = resumes;
  }

  async getAllResumeMetadata(): Promise<ResumeMetadata[]> {
    return this.resumes;
  }

  async getResumeFile(_resumeId: string): Promise<Buffer> {
    return Buffer.from('mock pdf');
  }

  async fileExists(_filePath: string): Promise<boolean> {
    return true;
  }
}

// Arbitraries for generating test data

const layerWeightsArbitrary = fc
  .array(fc.float({ min: Math.fround(0.1), max: Math.fround(1) }), { minLength: 6, maxLength: 6 })
  .map((weights) => {
    const sum = weights.reduce((a, b) => a + b, 0);
    // Ensure sum is not zero to avoid NaN
    if (sum === 0 || !isFinite(sum)) {
      // Fallback to equal weights
      return {
        frontend: 1/6,
        backend: 1/6,
        database: 1/6,
        cloud: 1/6,
        devops: 1/6,
        others: 1/6
      };
    }
    const normalized = weights.map((w) => w / sum);
    return {
      frontend: normalized[0],
      backend: normalized[1],
      database: normalized[2],
      cloud: normalized[3],
      devops: normalized[4],
      others: normalized[5]
    };
  });

const skillWeightsArbitrary = fc
  .array(
    fc.record({
      skill: fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => s.trim().length > 0)  // Filter out empty/whitespace strings
        .map(s => s.trim().toLowerCase()),
      weight: fc.float({ min: Math.fround(0.1), max: Math.fround(1) })
    }),
    { minLength: 1, maxLength: 5 }
  )
  .map((skills) => {
    const sum = skills.reduce((a, b) => a + b.weight, 0);
    // Ensure sum is not zero to avoid NaN
    if (sum === 0 || !isFinite(sum)) {
      // Fallback to equal weights
      return skills.map((s) => ({ skill: s.skill, weight: 1 / skills.length }));
    }
    return skills.map((s) => ({ skill: s.skill, weight: s.weight / sum }));
  });

const jdSpecArbitrary = fc.record({
  id: fc.uuid(),
  role: fc.string({ minLength: 5, maxLength: 30 }),
  layerWeights: layerWeightsArbitrary,
  skills: fc.record({
    frontend: skillWeightsArbitrary,
    backend: skillWeightsArbitrary,
    database: skillWeightsArbitrary,
    cloud: skillWeightsArbitrary,
    devops: skillWeightsArbitrary,
    others: skillWeightsArbitrary
  }),
  dictionaryVersion: fc.constant('2024.1')
}).map((data) => {
  return CanonicalJDSpec.create({
    id: data.id,
    role: data.role,
    layerWeights: data.layerWeights,
    skills: data.skills,
    dictionaryVersion: data.dictionaryVersion
  });
});

describe('CalculateResumeMatchRateUseCase - Property-Based Tests', () => {
  let useCase: CalculateResumeMatchRateUseCase;
  let jdSpecRepository: MockJDSpecRepository;
  let resumeRepository: MockResumeRepository;

  beforeEach(() => {
    jdSpecRepository = new MockJDSpecRepository();
    resumeRepository = new MockResumeRepository();
    useCase = new CalculateResumeMatchRateUseCase(jdSpecRepository, resumeRepository);
  });

  /**
   * Property 31: Resume Match Rate Equals JD Correlation
   * 
   * For any resume with an associated original JD, the resume match rate for a current JD
   * must equal the JD-to-JD correlation between the current JD and the resume's original JD.
   * 
   * Validates: Requirements 7.1, 7.2, 13.4
   */
  describe('Property 31: Resume Match Rate Equals JD Correlation', () => {
    it('should ensure match rate equals JD-to-JD correlation', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          jdSpecArbitrary,
          fc.uuid(),
          async (currentJD, originalJD, resumeId) => {
            // Save JD specs
            await jdSpecRepository.save(currentJD);
            await jdSpecRepository.save(originalJD);

            // Create resume with original JD association
            const resume = {
              getId: () => resumeId,
              getCompany: () => 'Test Company',
              getRole: () => 'Test Role',
              getTechStack: () => new TechStackValue(['skill1', 'skill2']),
              getFilePath: () => '/path/to/resume.pdf',
              getCreatedAt: () => new Date(),
              jdSpecId: originalJD.getId() // Associate with original JD
            };

            resumeRepository.setResumes([resume]);

            // Calculate match rate
            const result = await useCase.execute({
              currentJDId: currentJD.getId(),
              resumeId
            });

            // Calculate direct JD-to-JD correlation for comparison
            const { JDCorrelationCalculator } = await import('../domain/JDCorrelationCalculator');
            const calculator = new JDCorrelationCalculator();
            const directCorrelation = calculator.calculate(currentJD, originalJD);

            // Match rate should equal JD correlation
            expect(result.matchRate).toBeCloseTo(directCorrelation.overallScore, 10);
            expect(result.matchRatePercentage).toBeCloseTo(directCorrelation.overallScore * 100, 8);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 32: Resume Ranking by Match Rate
   * 
   * For any collection of resumes with match rates, they must be sorted in descending order
   * by match rate (highest match first).
   * 
   * Validates: Requirement 7.4
   */
  describe('Property 32: Resume Ranking by Match Rate', () => {
    it('should rank resumes by match rate in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          fc.array(jdSpecArbitrary, { minLength: 2, maxLength: 10 }),
          async (currentJD, originalJDs) => {
            // Save current JD
            await jdSpecRepository.save(currentJD);

            // Save all original JDs and create resumes
            const resumes = [];
            for (let i = 0; i < originalJDs.length; i++) {
              const originalJD = originalJDs[i];
              await jdSpecRepository.save(originalJD);

              const resume = {
                getId: () => `resume-${i}`,
                getCompany: () => `Company ${i}`,
                getRole: () => `Role ${i}`,
                getTechStack: () => new TechStackValue(['skill1']),
                getFilePath: () => `/path/resume-${i}.pdf`,
                getCreatedAt: () => new Date(),
                jdSpecId: originalJD.getId()
              };
              resumes.push(resume);
            }

            resumeRepository.setResumes(resumes);

            // Calculate match rates for all resumes
            const result = await useCase.executeForAllResumes({
              currentJDId: currentJD.getId()
            });

            // Verify results are sorted in descending order
            for (let i = 0; i < result.results.length - 1; i++) {
              expect(result.results[i].matchRate).toBeGreaterThanOrEqual(
                result.results[i + 1].matchRate
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 33: Match Rate Percentage Display
   * 
   * For any resume match rate displayed to the user, it must be shown as a percentage
   * in the range [0, 100].
   * 
   * Validates: Requirement 7.5
   */
  describe('Property 33: Match Rate Percentage Display', () => {
    it('should display match rate as percentage in range [0, 100]', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          jdSpecArbitrary,
          fc.uuid(),
          async (currentJD, originalJD, resumeId) => {
            // Save JD specs
            await jdSpecRepository.save(currentJD);
            await jdSpecRepository.save(originalJD);

            // Create resume
            const resume = {
              getId: () => resumeId,
              getCompany: () => 'Test Company',
              getRole: () => 'Test Role',
              getTechStack: () => new TechStackValue(['skill1']),
              getFilePath: () => '/path/to/resume.pdf',
              getCreatedAt: () => new Date(),
              jdSpecId: originalJD.getId()
            };

            resumeRepository.setResumes([resume]);

            // Calculate match rate
            const result = await useCase.execute({
              currentJDId: currentJD.getId(),
              resumeId
            });

            // Verify percentage is in valid range
            expect(result.matchRatePercentage).toBeGreaterThanOrEqual(0);
            expect(result.matchRatePercentage).toBeLessThanOrEqual(100);

            // Verify percentage equals match rate * 100
            expect(result.matchRatePercentage).toBeCloseTo(result.matchRate * 100, 8);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 36: Resume-JD Association
   * Property 37: Resume Original JD Retrieval
   * Property 38: Missing Original JD Handling
   * 
   * For any resume created for a bid, the resume record must store the JD specification ID.
   * For any resume match rate calculation, the system must retrieve the resume's original JD.
   * For any resume whose original JD cannot be found, the match rate must be 0.
   * 
   * Validates: Requirements 13.1, 13.2, 13.3, 13.5
   */
  describe('Property 36-38: Resume-JD Association and Retrieval', () => {
    it('should handle resume with associated JD', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          jdSpecArbitrary,
          fc.uuid(),
          async (currentJD, originalJD, resumeId) => {
            // Save JD specs
            await jdSpecRepository.save(currentJD);
            await jdSpecRepository.save(originalJD);

            // Create resume with JD association
            const resume = {
              getId: () => resumeId,
              getCompany: () => 'Test Company',
              getRole: () => 'Test Role',
              getTechStack: () => new TechStackValue(['skill1']),
              getFilePath: () => '/path/to/resume.pdf',
              getCreatedAt: () => new Date(),
              jdSpecId: originalJD.getId()
            };

            resumeRepository.setResumes([resume]);

            // Calculate match rate
            const result = await useCase.execute({
              currentJDId: currentJD.getId(),
              resumeId
            });

            // Verify original JD ID is stored
            expect(result.originalJDId).toBe(originalJD.getId());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 match rate when resume has no associated JD', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          fc.uuid(),
          async (currentJD, resumeId) => {
            // Save current JD
            await jdSpecRepository.save(currentJD);

            // Create resume WITHOUT JD association
            const resume = {
              getId: () => resumeId,
              getCompany: () => 'Test Company',
              getRole: () => 'Test Role',
              getTechStack: () => new TechStackValue(['skill1']),
              getFilePath: () => '/path/to/resume.pdf',
              getCreatedAt: () => new Date()
              // No jdSpecId
            };

            resumeRepository.setResumes([resume]);

            // Calculate match rate
            const result = await useCase.execute({
              currentJDId: currentJD.getId(),
              resumeId
            });

            // Verify match rate is 0
            expect(result.matchRate).toBe(0);
            expect(result.matchRatePercentage).toBe(0);
            expect(result.originalJDId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 match rate when original JD is not found', async () => {
      await fc.assert(
        fc.asyncProperty(
          jdSpecArbitrary,
          fc.uuid(),
          fc.uuid(),
          async (currentJD, resumeId, missingJDId) => {
            // Save only current JD (not the original JD)
            await jdSpecRepository.save(currentJD);

            // Create resume with reference to non-existent JD
            const resume = {
              getId: () => resumeId,
              getCompany: () => 'Test Company',
              getRole: () => 'Test Role',
              getTechStack: () => new TechStackValue(['skill1']),
              getFilePath: () => '/path/to/resume.pdf',
              getCreatedAt: () => new Date(),
              jdSpecId: missingJDId // References non-existent JD
            };

            resumeRepository.setResumes([resume]);

            // Calculate match rate
            const result = await useCase.execute({
              currentJDId: currentJD.getId(),
              resumeId
            });

            // Verify match rate is 0 when original JD not found
            expect(result.matchRate).toBe(0);
            expect(result.matchRatePercentage).toBe(0);
            expect(result.originalJDId).toBe(missingJDId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
