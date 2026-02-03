import { ReviewUnknownSkillsUseCase } from './ReviewUnknownSkillsUseCase';
import { ISkillReviewQueueRepository } from './ISkillReviewQueueRepository';
import { ISkillDictionaryRepository } from './ISkillDictionaryRepository';
import { SkillReviewQueue } from '../domain/SkillReviewQueue';
import { SkillDictionary } from '../domain/SkillDictionary';

class MockSkillReviewQueueRepository implements ISkillReviewQueueRepository {
  private queueData: any = null;

  async save(queue: SkillReviewQueue): Promise<void> {
    this.queueData = queue.toJSON();
  }

  async get(): Promise<SkillReviewQueue> {
    if (!this.queueData) {
      return SkillReviewQueue.create();
    }
    return SkillReviewQueue.fromItems(this.queueData.items);
  }

  setQueue(queue: SkillReviewQueue): void {
    this.queueData = queue.toJSON();
  }
}

class MockSkillDictionaryRepository implements ISkillDictionaryRepository {
  private dictionaryData: any = null;

  async save(dictionary: SkillDictionary): Promise<void> {
    this.dictionaryData = dictionary.toJSON();
  }

  async getCurrent(): Promise<SkillDictionary> {
    if (!this.dictionaryData) {
      return SkillDictionary.create('2024.1');
    }
    return SkillDictionary.fromJSON(this.dictionaryData);
  }

  async getVersion(_version: string): Promise<SkillDictionary | null> {
    if (!this.dictionaryData) {
      return null;
    }
    return SkillDictionary.fromJSON(this.dictionaryData);
  }

  async getAllVersions(): Promise<SkillDictionary[]> {
    if (!this.dictionaryData) {
      return [];
    }
    return [SkillDictionary.fromJSON(this.dictionaryData)];
  }

  setDictionary(dictionary: SkillDictionary): void {
    this.dictionaryData = dictionary.toJSON();
  }
}

describe('ReviewUnknownSkillsUseCase', () => {
  let useCase: ReviewUnknownSkillsUseCase;
  let queueRepository: MockSkillReviewQueueRepository;
  let dictionaryRepository: MockSkillDictionaryRepository;

  beforeEach(() => {
    queueRepository = new MockSkillReviewQueueRepository();
    dictionaryRepository = new MockSkillDictionaryRepository();
    useCase = new ReviewUnknownSkillsUseCase(queueRepository, dictionaryRepository);
  });

  describe('getQueueItems', () => {
    test('returns empty array when queue is empty', async () => {
      const items = await useCase.getQueueItems();
      expect(items).toEqual([]);
    });

    test('returns all items in the queue', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('react-native', 'jd-123');
      queue.addUnknownSkill('vue.js', 'jd-456');
      queueRepository.setQueue(queue);

      const items = await useCase.getQueueItems();
      
      expect(items).toHaveLength(2);
      expect(items.map(i => i.skillName).sort()).toEqual(['react-native', 'vue.js']);
    });

    test('returns items with correct metadata', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('typescript', 'jd-123');
      queue.addUnknownSkill('typescript', 'jd-456');
      queueRepository.setQueue(queue);

      const items = await useCase.getQueueItems();
      
      expect(items).toHaveLength(1);
      expect(items[0].skillName).toBe('typescript');
      expect(items[0].frequency).toBe(2);
      expect(items[0].detectedIn).toEqual(['jd-123', 'jd-456']);
      expect(items[0].status).toBe('pending');
    });
  });

  describe('approveAsCanonical', () => {
    test('approves skill and adds to dictionary as canonical', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('rust', 'jd-123');
      queueRepository.setQueue(queue);

      const decision = await useCase.approveAsCanonical('rust', 'backend');

      expect(decision.skillName).toBe('rust');
      expect(decision.decision).toBe('canonical');
      expect(decision.canonicalName).toBe('rust');
      expect(decision.category).toBe('backend');
      expect(decision.approvedAt).toBeInstanceOf(Date);

      // Verify skill was added to dictionary
      const dictionary = await dictionaryRepository.getCurrent();
      const skill = dictionary.getCanonicalSkill('rust');
      expect(skill).toBeDefined();
      expect(skill?.category).toBe('backend');
    });

    test('increments dictionary version after approval', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('golang', 'jd-123');
      queueRepository.setQueue(queue);

      await useCase.approveAsCanonical('golang', 'backend');

      const updatedDictionary = await dictionaryRepository.getCurrent();
      const newVersion = updatedDictionary.getVersion();
      
      // Version should have been incremented (format: YYYY.N)
      expect(newVersion).toMatch(/^\d{4}\.\d+$/);
      expect(newVersion).not.toBe('2024.1');
    });

    test('throws error when skill not in queue', async () => {
      await expect(
        useCase.approveAsCanonical('nonexistent', 'backend')
      ).rejects.toThrow("Unknown skill 'nonexistent' not found in queue");
    });

    test('throws error when skill already approved', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('kotlin', 'jd-123');
      queueRepository.setQueue(queue);

      await useCase.approveAsCanonical('kotlin', 'backend');

      await expect(
        useCase.approveAsCanonical('kotlin', 'backend')
      ).rejects.toThrow("Skill 'kotlin' has already been approved");
    });
  });

  describe('approveAsVariation', () => {
    test('approves skill and adds to dictionary as variation', async () => {
      // Setup: Add canonical skill to dictionary
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('javascript', 'frontend');
      await dictionaryRepository.save(dictionary);

      // Add unknown skill to queue
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('js', 'jd-123');
      queueRepository.setQueue(queue);

      const decision = await useCase.approveAsVariation('js', 'javascript');

      expect(decision.skillName).toBe('js');
      expect(decision.decision).toBe('variation');
      expect(decision.canonicalName).toBe('javascript');
      expect(decision.approvedAt).toBeInstanceOf(Date);

      // Verify variation was added to dictionary
      const updatedDictionary = await dictionaryRepository.getCurrent();
      const canonical = updatedDictionary.mapToCanonical('js');
      expect(canonical).toBe('javascript');
    });

    test('increments dictionary version after approval', async () => {
      // Setup: Add canonical skill to dictionary
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('python', 'backend');
      await dictionaryRepository.save(dictionary);

      // Add unknown skill to queue
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('py', 'jd-123');
      queueRepository.setQueue(queue);

      await useCase.approveAsVariation('py', 'python');

      const updatedDictionary = await dictionaryRepository.getCurrent();
      const newVersion = updatedDictionary.getVersion();
      
      // Version should have been incremented
      expect(newVersion).toMatch(/^\d{4}\.\d+$/);
      expect(newVersion).not.toBe('2024.1');
    });

    test('throws error when canonical skill does not exist', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('jsx', 'jd-123');
      queueRepository.setQueue(queue);

      await expect(
        useCase.approveAsVariation('jsx', 'nonexistent')
      ).rejects.toThrow("Canonical skill 'nonexistent' not found in dictionary");
    });

    test('throws error when skill not in queue', async () => {
      // Setup: Add canonical skill to dictionary
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      await dictionaryRepository.save(dictionary);

      await expect(
        useCase.approveAsVariation('nonexistent', 'react')
      ).rejects.toThrow("Unknown skill 'nonexistent' not found in queue");
    });

    test('throws error when skill already approved', async () => {
      // Setup: Add canonical skill to dictionary
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('typescript', 'frontend');
      await dictionaryRepository.save(dictionary);

      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('ts', 'jd-123');
      queueRepository.setQueue(queue);

      await useCase.approveAsVariation('ts', 'typescript');

      await expect(
        useCase.approveAsVariation('ts', 'typescript')
      ).rejects.toThrow("Skill 'ts' has already been approved");
    });
  });

  describe('rejectSkill', () => {
    test('rejects skill with reason', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('invalidskill', 'jd-123');
      queueRepository.setQueue(queue);

      const decision = await useCase.rejectSkill('invalidskill', 'Not a valid technical skill');

      expect(decision.skillName).toBe('invalidskill');
      expect(decision.reason).toBe('Not a valid technical skill');
      expect(decision.rejectedAt).toBeInstanceOf(Date);

      // Verify skill status in queue
      const items = await useCase.getQueueItems();
      const rejectedItem = items.find(i => i.skillName === 'invalidskill');
      expect(rejectedItem?.status).toBe('rejected');
    });

    test('throws error when skill not in queue', async () => {
      await expect(
        useCase.rejectSkill('nonexistent', 'Some reason')
      ).rejects.toThrow("Unknown skill 'nonexistent' not found in queue");
    });

    test('throws error when skill already rejected', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('badskill', 'jd-123');
      queueRepository.setQueue(queue);

      await useCase.rejectSkill('badskill', 'Not valid');

      await expect(
        useCase.rejectSkill('badskill', 'Still not valid')
      ).rejects.toThrow("Skill 'badskill' has already been rejected");
    });

    test('throws error when rejection reason is empty', async () => {
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('someskill', 'jd-123');
      queueRepository.setQueue(queue);

      await expect(
        useCase.rejectSkill('someskill', '')
      ).rejects.toThrow('Rejection reason cannot be empty');
    });
  });

  describe('workflow integration', () => {
    test('handles complete approval workflow', async () => {
      // Setup dictionary with some canonical skills
      const dictionary = SkillDictionary.create('2024.1');
      dictionary.addCanonicalSkill('react', 'frontend');
      dictionary.addCanonicalSkill('nodejs', 'backend');
      await dictionaryRepository.save(dictionary);

      // Add unknown skills to queue
      const queue = SkillReviewQueue.create();
      queue.addUnknownSkill('vue', 'jd-123');
      queue.addUnknownSkill('reactjs', 'jd-456');
      queue.addUnknownSkill('node.js', 'jd-789');
      queueRepository.setQueue(queue);

      // Approve vue as canonical
      await useCase.approveAsCanonical('vue', 'frontend');

      // Approve reactjs as variation of react
      await useCase.approveAsVariation('reactjs', 'react');

      // Reject node.js (duplicate of nodejs)
      await useCase.rejectSkill('node.js', 'Duplicate of nodejs');

      // Verify final state
      const items = await useCase.getQueueItems();
      expect(items.find(i => i.skillName === 'vue')?.status).toBe('approved');
      expect(items.find(i => i.skillName === 'reactjs')?.status).toBe('approved');
      expect(items.find(i => i.skillName === 'node.js')?.status).toBe('rejected');

      const finalDictionary = await dictionaryRepository.getCurrent();
      expect(finalDictionary.hasSkill('vue')).toBe(true);
      expect(finalDictionary.mapToCanonical('reactjs')).toBe('react');
      expect(finalDictionary.hasSkill('node.js')).toBe(false);
    });
  });
});
