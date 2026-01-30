/**
 * Unit tests for DuplicationDetectionPolicy
 */

import { Bid, CreateBidData, BidOrigin } from './Bid';
import { DuplicationDetectionPolicy } from './DuplicationDetectionPolicy';

describe('DuplicationDetectionPolicy', () => {
  let policy: DuplicationDetectionPolicy;

  beforeEach(() => {
    policy = new DuplicationDetectionPolicy();
  });

  describe('checkDuplication', () => {
    it('should return empty array when no existing bids', () => {
      const newBid: CreateBidData = {
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, []);

      expect(warnings).toEqual([]);
    });

    it('should return empty array when no duplicates found', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job2',
        company: 'OtherCorp',
        client: 'OtherCorp',
        role: 'Backend Developer',
        mainStacks: ['Node.js'],
        jobDescriptionPath: 'OtherCorp_Backend_Developer/JD.txt',
        resumePath: 'OtherCorp_Backend_Developer/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toEqual([]);
    });

    it('should detect exact link match', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job1', // Same link
        company: 'DifferentCorp',
        client: 'DifferentCorp',
        role: 'Different Role',
        mainStacks: ['Java'],
        jobDescriptionPath: 'DifferentCorp_Different_Role/JD.txt',
        resumePath: 'DifferentCorp_Different_Role/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('LINK_MATCH');
      expect(warnings[0].existingBidId).toBe(existingBid.id);
      expect(warnings[0].message).toContain('Duplicate link detected');
      expect(warnings[0].message).toContain(existingBid.id);
    });

    it('should detect company and role match (case-insensitive)', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job2', // Different link
        company: 'techcorp', // Same company, different case
        client: 'TechCorp',
        role: 'software engineer', // Same role, different case
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'techcorp_software_engineer/JD.txt',
        resumePath: 'techcorp_software_engineer/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('COMPANY_ROLE_MATCH');
      expect(warnings[0].existingBidId).toBe(existingBid.id);
      expect(warnings[0].message).toContain('Duplicate company and role detected');
      expect(warnings[0].message).toContain('techcorp');
      expect(warnings[0].message).toContain('software engineer');
    });

    it('should detect both link and company+role match', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job1', // Same link
        company: 'TechCorp', // Same company
        client: 'TechCorp',
        role: 'Software Engineer', // Same role
        mainStacks: ['TypeScript', 'React'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD_v2.txt',
        resumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toHaveLength(2);
      expect(warnings.some(w => w.type === 'LINK_MATCH')).toBe(true);
      expect(warnings.some(w => w.type === 'COMPANY_ROLE_MATCH')).toBe(true);
    });

    it('should detect duplicates across multiple existing bids', () => {
      const existingBid1 = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const existingBid2 = Bid.create({
        link: 'https://example.com/job2',
        company: 'DataCorp',
        client: 'DataCorp',
        role: 'Data Engineer',
        mainStacks: ['Python'],
        jobDescriptionPath: 'DataCorp_Data_Engineer/JD.txt',
        resumePath: 'DataCorp_Data_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job1', // Matches bid1 link
        company: 'DataCorp', // Matches bid2 company
        client: 'DataCorp',
        role: 'Data Engineer', // Matches bid2 role
        mainStacks: ['Python'],
        jobDescriptionPath: 'DataCorp_Data_Engineer/JD_new.txt',
        resumePath: 'DataCorp_Data_Engineer/resume_new.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid1, existingBid2]);

      expect(warnings).toHaveLength(2);
      
      const linkWarning = warnings.find(w => w.type === 'LINK_MATCH');
      expect(linkWarning).toBeDefined();
      expect(linkWarning?.existingBidId).toBe(existingBid1.id);

      const companyRoleWarning = warnings.find(w => w.type === 'COMPANY_ROLE_MATCH');
      expect(companyRoleWarning).toBeDefined();
      expect(companyRoleWarning?.existingBidId).toBe(existingBid2.id);
    });

    it('should not match company without matching role', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job2',
        company: 'TechCorp', // Same company
        client: 'TechCorp',
        role: 'Data Engineer', // Different role
        mainStacks: ['Python'],
        jobDescriptionPath: 'TechCorp_Data_Engineer/JD.txt',
        resumePath: 'TechCorp_Data_Engineer/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toEqual([]);
    });

    it('should not match role without matching company', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job2',
        company: 'DataCorp', // Different company
        client: 'DataCorp',
        role: 'Software Engineer', // Same role
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'DataCorp_Software_Engineer/JD.txt',
        resumePath: 'DataCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      expect(warnings).toEqual([]);
    });

    it('should handle case sensitivity correctly for company and role', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const testCases = [
        { company: 'TECHCORP', role: 'SOFTWARE ENGINEER' },
        { company: 'techcorp', role: 'software engineer' },
        { company: 'TeCHcOrP', role: 'SoFtWaRe EnGiNeEr' }
      ];

      for (const testCase of testCases) {
        const newBid: CreateBidData = {
          link: 'https://example.com/job2',
          company: testCase.company,
          client: testCase.company,
          role: testCase.role,
          mainStacks: ['TypeScript'],
          jobDescriptionPath: `${testCase.company}_${testCase.role}/JD.txt`,
          resumePath: `${testCase.company}_${testCase.role}/resume.pdf`,
          origin: BidOrigin.BID
        };

        const warnings = policy.checkDuplication(newBid, [existingBid]);

        expect(warnings).toHaveLength(1);
        expect(warnings[0].type).toBe('COMPANY_ROLE_MATCH');
      }
    });

    it('should not match links with different URLs', () => {
      const existingBid = Bid.create({
        link: 'https://example.com/job1',
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD.txt',
        resumePath: 'TechCorp_Software_Engineer/resume.pdf',
        origin: BidOrigin.BID
      });

      const newBid: CreateBidData = {
        link: 'https://example.com/job2', // Different link
        company: 'TechCorp',
        client: 'TechCorp',
        role: 'Software Engineer',
        mainStacks: ['TypeScript'],
        jobDescriptionPath: 'TechCorp_Software_Engineer/JD_v2.txt',
        resumePath: 'TechCorp_Software_Engineer/resume_v2.pdf',
        origin: BidOrigin.BID
      };

      const warnings = policy.checkDuplication(newBid, [existingBid]);

      // Should only have company+role match, not link match
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('COMPANY_ROLE_MATCH');
    });
  });
});
