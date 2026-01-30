/**
 * Unit tests for FileSystemResumeRepository
 * 
 * Tests the file system implementation of the resume repository,
 * including metadata retrieval from bids and file operations.
 * 
 * Part of: resume-selection-from-history feature
 * Requirements: 1.1, 1.2, 4.4
 */

import { FileSystemResumeRepository } from './FileSystemResumeRepository';
import { IBidRepository } from '../application/IBidRepository';
import { Bid, BidOrigin } from '../domain/Bid';
import * as path from 'path';

describe('FileSystemResumeRepository', () => {
  const uploadDirectory = path.join(__dirname, '../../uploads');
  let repository: FileSystemResumeRepository;
  let mockBidRepository: jest.Mocked<IBidRepository>;

  beforeEach(() => {
    // Create mock bid repository
    mockBidRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCompanyAndRole: jest.fn(),
      findByLink: jest.fn(),
      findAllPaginated: jest.fn(),
    } as jest.Mocked<IBidRepository>;

    repository = new FileSystemResumeRepository(uploadDirectory, mockBidRepository);
  });

  describe('getAllResumeMetadata', () => {
    it('should retrieve metadata for all valid resumes from bids', async () => {
      // Create mock bids with valid resume paths
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
        Bid.create({
          link: 'https://example.com/job2',
          company: 'Capgemini',
          client: 'Capgemini',
          role: 'Full Stack Engineer',
          mainStacks: ['Go', 'C#', 'AWS', 'React', 'TypeScript'],
          jobDescriptionPath: path.join(uploadDirectory, 'Capgemini_Full Stack Engineer_Go_C#_AWS_React_TypeScript_SQL Server_CI_CD/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Capgemini_Full Stack Engineer_Go_C#_AWS_React_TypeScript_SQL Server_CI_CD/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();

      // Should have 2 resumes
      expect(metadata.length).toBe(2);

      // Each metadata should have all required properties
      metadata.forEach(resume => {
        expect(resume.getId()).toBeTruthy();
        expect(resume.getCompany()).toBeTruthy();
        expect(resume.getRole()).toBeTruthy();
        expect(resume.getTechStack()).toBeTruthy();
        expect(resume.getTechStack().getTechnologies().length).toBeGreaterThan(0);
        expect(resume.getFilePath()).toBeTruthy();
        const createdAt = resume.getCreatedAt();
        expect(createdAt).toBeTruthy();
        expect(createdAt instanceof Date).toBe(true);
        expect(createdAt.getTime()).toBeGreaterThan(0);
      });
    });

    it('should extract correct data from bids', async () => {
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();

      // Find the Alpaca resume
      const alpacaResume = metadata.find(r => r.getCompany() === 'Alpaca');
      expect(alpacaResume).toBeDefined();
      
      if (alpacaResume) {
        expect(alpacaResume.getRole()).toBe('Senior Software Engineer');
        const techStack = alpacaResume.getTechStack().getTechnologies();
        expect(techStack).toContain('React');
        expect(techStack).toContain('gRPC');
        expect(techStack).toContain('Go');
      }
    });

    it('should skip bids with non-existent resume files', async () => {
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Test Company',
          client: 'Test Client',
          role: 'Test Role',
          mainStacks: ['React'],
          jobDescriptionPath: '/non/existent/JD.txt',
          resumePath: '/non/existent/resume.pdf',
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();

      // Should return empty array since file doesn't exist
      expect(metadata).toEqual([]);
    });

    it('should handle empty bid list', async () => {
      mockBidRepository.findAll.mockResolvedValue([]);

      const metadata = await repository.getAllResumeMetadata();

      expect(metadata).toEqual([]);
    });
  });

  describe('getResumeFile', () => {
    it('should retrieve resume file content for a valid resume ID', async () => {
      // Create a mock bid with a valid resume path
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      // First get metadata to get a valid resume ID
      const metadata = await repository.getAllResumeMetadata();
      expect(metadata.length).toBeGreaterThan(0);

      const firstResume = metadata[0];
      const resumeId = firstResume.getId();

      // Retrieve the file
      const fileBuffer = await repository.getResumeFile(resumeId);

      // Should return a buffer with content
      expect(fileBuffer).toBeInstanceOf(Buffer);
      expect(fileBuffer.length).toBeGreaterThan(0);

      // PDF files start with %PDF
      const pdfHeader = fileBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    it('should throw error for invalid resume ID', async () => {
      const invalidId = Buffer.from('/invalid/path/resume.pdf').toString('base64');

      await expect(repository.getResumeFile(invalidId)).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing resume files', async () => {
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();
      expect(metadata.length).toBeGreaterThan(0);

      const firstResume = metadata[0];
      const exists = await repository.fileExists(firstResume.getFilePath());

      expect(exists).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const exists = await repository.fileExists('/non/existent/file.pdf');

      expect(exists).toBe(false);
    });
  });

  describe('ID generation and decoding', () => {
    it('should generate deterministic IDs from file paths', async () => {
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();
      expect(metadata.length).toBeGreaterThan(0);

      const firstResume = metadata[0];
      const resumeId = firstResume.getId();

      // Decode the ID
      const decodedPath = Buffer.from(resumeId, 'base64').toString('utf-8');

      // Should match the original file path
      expect(decodedPath).toBe(firstResume.getFilePath());
    });

    it('should generate unique IDs for different resumes', async () => {
      const mockBids = [
        Bid.create({
          link: 'https://example.com/job1',
          company: 'Alpaca',
          client: 'Alpaca',
          role: 'Senior Software Engineer',
          mainStacks: ['React', 'gRPC', 'Go'],
          jobDescriptionPath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Alpaca_Senior Software Engineer_React_gRPC_Go/resume.pdf'),
          origin: BidOrigin.BID,
        }),
        Bid.create({
          link: 'https://example.com/job2',
          company: 'Capgemini',
          client: 'Capgemini',
          role: 'Full Stack Engineer',
          mainStacks: ['Go', 'C#', 'AWS'],
          jobDescriptionPath: path.join(uploadDirectory, 'Capgemini_Full Stack Engineer_Go_C#_AWS_React_TypeScript_SQL Server_CI_CD/JD.txt'),
          resumePath: path.join(uploadDirectory, 'Capgemini_Full Stack Engineer_Go_C#_AWS_React_TypeScript_SQL Server_CI_CD/resume.pdf'),
          origin: BidOrigin.BID,
        }),
      ];

      mockBidRepository.findAll.mockResolvedValue(mockBids);

      const metadata = await repository.getAllResumeMetadata();
      
      if (metadata.length > 1) {
        const ids = metadata.map(r => r.getId());
        const uniqueIds = new Set(ids);

        // All IDs should be unique
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
  });
});
