import { CalculateResumeMatchRateUseCase } from './CalculateResumeMatchRateUseCase';
import { IJDSpecRepository } from './IJDSpecRepository';
import { IResumeRepository } from './IResumeRepository';
import { CanonicalJDSpec } from '../domain/CanonicalJDSpec';
import { ResumeMetadata } from '../domain/ResumeMetadata';
import { TechStackValue } from '../domain/TechStackValue';

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

describe('CalculateResumeMatchRateUseCase', () => {
  let useCase: CalculateResumeMatchRateUseCase;
  let jdSpecRepository: MockJDSpecRepository;
  let resumeRepository: MockResumeRepository;

  beforeEach(() => {
    jdSpecRepository = new MockJDSpecRepository();
    resumeRepository = new MockResumeRepository();
    useCase = new CalculateResumeMatchRateUseCase(jdSpecRepository, resumeRepository);
  });

  describe('execute', () => {
    test('calculates match rate for identical JDs', async () => {
      const jdData = {
        id: 'jd-1',
        role: 'Full Stack Developer',
        layerWeights: { frontend: 0.3, backend: 0.3, database: 0.2, cloud: 0.1, devops: 0.05, others: 0.05 },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const currentJD = CanonicalJDSpec.create(jdData);
      const originalJD = CanonicalJDSpec.create({ ...jdData, id: 'jd-2' });

      await jdSpecRepository.save(currentJD);
      await jdSpecRepository.save(originalJD);

      const resume = {
        getId: () => 'resume-1',
        getCompany: () => 'Test Company',
        getRole: () => 'Full Stack Developer',
        getTechStack: () => new TechStackValue(['react', 'nodejs']),
        getFilePath: () => '/path/to/resume.pdf',
        getCreatedAt: () => new Date(),
        jdSpecId: originalJD.getId()
      };

      resumeRepository.setResumes([resume]);

      const result = await useCase.execute({
        currentJDId: currentJD.getId(),
        resumeId: 'resume-1'
      });

      expect(result.matchRate).toBeCloseTo(1.0, 5);
      expect(result.matchRatePercentage).toBeCloseTo(100, 3);
      expect(result.originalJDId).toBe(originalJD.getId());
    });

    test('returns 0 when resume has no original JD', async () => {
      const jdData = {
        id: 'jd-1',
        role: 'Developer',
        layerWeights: { frontend: 0.3, backend: 0.3, database: 0.2, cloud: 0.1, devops: 0.05, others: 0.05 },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const currentJD = CanonicalJDSpec.create(jdData);
      await jdSpecRepository.save(currentJD);

      const resume = {
        getId: () => 'resume-1',
        getCompany: () => 'Test Company',
        getRole: () => 'Developer',
        getTechStack: () => new TechStackValue(['react', 'nodejs']),
        getFilePath: () => '/path/to/resume.pdf',
        getCreatedAt: () => new Date()
      };

      resumeRepository.setResumes([resume]);

      const result = await useCase.execute({
        currentJDId: currentJD.getId(),
        resumeId: 'resume-1'
      });

      expect(result.matchRate).toBe(0);
      expect(result.matchRatePercentage).toBe(0);
      expect(result.originalJDId).toBeNull();
    });

    test('throws error when current JD not found', async () => {
      const resume = {
        getId: () => 'resume-1',
        getCompany: () => 'Test Company',
        getRole: () => 'Developer',
        getTechStack: () => new TechStackValue(['react']),
        getFilePath: () => '/path/to/resume.pdf',
        getCreatedAt: () => new Date(),
        jdSpecId: 'jd-2'
      };

      resumeRepository.setResumes([resume]);

      await expect(
        useCase.execute({ currentJDId: 'non-existent-jd', resumeId: 'resume-1' })
      ).rejects.toThrow('Current JD specification not found');
    });

    test('throws error when resume not found', async () => {
      const jdData = {
        id: 'jd-1',
        role: 'Developer',
        layerWeights: { frontend: 0.3, backend: 0.3, database: 0.2, cloud: 0.1, devops: 0.05, others: 0.05 },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const currentJD = CanonicalJDSpec.create(jdData);
      await jdSpecRepository.save(currentJD);

      resumeRepository.setResumes([]);

      await expect(
        useCase.execute({ currentJDId: currentJD.getId(), resumeId: 'non-existent-resume' })
      ).rejects.toThrow('Resume not found');
    });
  });

  describe('executeForAllResumes', () => {
    test('calculates and ranks match rates for multiple resumes', async () => {
      const currentJDData = {
        id: 'jd-current',
        role: 'Full Stack Developer',
        layerWeights: { frontend: 0.4, backend: 0.4, database: 0.1, cloud: 0.05, devops: 0.03, others: 0.02 },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const highMatchJDData = {
        id: 'jd-high',
        role: 'Full Stack Developer',
        layerWeights: { frontend: 0.4, backend: 0.4, database: 0.1, cloud: 0.05, devops: 0.03, others: 0.02 },
        skills: {
          frontend: [{ skill: 'react', weight: 1.0 }],
          backend: [{ skill: 'nodejs', weight: 1.0 }],
          database: [{ skill: 'postgresql', weight: 1.0 }],
          cloud: [{ skill: 'aws', weight: 1.0 }],
          devops: [{ skill: 'docker', weight: 1.0 }],
          others: [{ skill: 'git', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const lowMatchJDData = {
        id: 'jd-low',
        role: 'Data Scientist',
        layerWeights: { frontend: 0.05, backend: 0.3, database: 0.3, cloud: 0.2, devops: 0.1, others: 0.05 },
        skills: {
          frontend: [{ skill: 'vue', weight: 1.0 }],
          backend: [{ skill: 'python', weight: 1.0 }],
          database: [{ skill: 'mongodb', weight: 1.0 }],
          cloud: [{ skill: 'gcp', weight: 1.0 }],
          devops: [{ skill: 'kubernetes', weight: 1.0 }],
          others: [{ skill: 'jupyter', weight: 1.0 }]
        },
        dictionaryVersion: '2024.1'
      };

      const currentJD = CanonicalJDSpec.create(currentJDData);
      const highMatchJD = CanonicalJDSpec.create(highMatchJDData);
      const lowMatchJD = CanonicalJDSpec.create(lowMatchJDData);

      await jdSpecRepository.save(currentJD);
      await jdSpecRepository.save(highMatchJD);
      await jdSpecRepository.save(lowMatchJD);

      const resumes = [
        {
          getId: () => 'resume-high',
          getCompany: () => 'Company A',
          getRole: () => 'Full Stack Developer',
          getTechStack: () => new TechStackValue(['react', 'nodejs']),
          getFilePath: () => '/path/resume-high.pdf',
          getCreatedAt: () => new Date(),
          jdSpecId: highMatchJD.getId()
        },
        {
          getId: () => 'resume-low',
          getCompany: () => 'Company B',
          getRole: () => 'Data Scientist',
          getTechStack: () => new TechStackValue(['python', 'jupyter']),
          getFilePath: () => '/path/resume-low.pdf',
          getCreatedAt: () => new Date(),
          jdSpecId: lowMatchJD.getId()
        }
      ];

      resumeRepository.setResumes(resumes);

      const result = await useCase.executeForAllResumes({ currentJDId: currentJD.getId() });

      expect(result.results).toHaveLength(2);
      expect(result.results[0].resumeId).toBe('resume-high');
      expect(result.results[1].resumeId).toBe('resume-low');
      expect(result.results[0].matchRate).toBeGreaterThan(result.results[1].matchRate);
    });
  });
});
