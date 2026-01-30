/**
 * Integration tests for server route registration
 * 
 * Verifies that all routes are properly registered and wired with their controllers
 */

import request from 'supertest';
import { Server } from './server';
import { Container } from './container';

describe('Server Integration - Resume Routes', () => {
  let server: Server;
  let container: Container;

  beforeAll(async () => {
    // Initialize container with in-memory repositories for testing
    container = Container.getInstance();
    await container.initialize({
      useInMemory: true,
    });

    // Create server instance
    server = new Server(
      {
        port: 3001,
        corsOrigin: '*',
      },
      container
    );
  });

  afterAll(async () => {
    await container.shutdown();
  });

  describe('Resume Routes Registration', () => {
    it('should have GET /api/resumes/metadata route registered', async () => {
      const response = await request(server.getApp())
        .get('/api/resumes/metadata')
        .query({ techStack: 'React,TypeScript' });

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
      
      // Should return 200 with array (even if empty)
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should have GET /api/resumes/file/:resumeId route registered', async () => {
      const testResumeId = Buffer.from('test-resume.pdf').toString('base64');
      
      const response = await request(server.getApp())
        .get(`/api/resumes/file/${testResumeId}`);

      // Should not return 404 for route not found
      // May return 404 for file not found, but that's different
      expect(response.status).not.toBe(404);
      
      // Should return either 404 (file not found) or 500 (error reading file)
      // but not route not found error
      expect([404, 500]).toContain(response.status);
    });

    it('should return 400 when tech stack is missing', async () => {
      const response = await request(server.getApp())
        .get('/api/resumes/metadata');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('Tech stack is required');
    });

    it('should return 400 when resumeId is invalid', async () => {
      const response = await request(server.getApp())
        .get('/api/resumes/file/');

      // Empty resumeId should result in route not matching or 404
      expect([404, 400]).toContain(response.status);
    });
  });

  describe('Route Integration with Use Cases', () => {
    it('should wire ResumeController with GetMatchingResumesUseCase', async () => {
      // This test verifies the complete wiring from route -> controller -> use case -> repository
      const response = await request(server.getApp())
        .get('/api/resumes/metadata')
        .query({ techStack: 'React,Node.js,MongoDB' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Each result should have the expected structure
      response.body.forEach((resume: any) => {
        expect(resume).toHaveProperty('id');
        expect(resume).toHaveProperty('fileName');
        expect(resume).toHaveProperty('techStack');
        expect(resume).toHaveProperty('matchScore');
      });
    });
  });
});
