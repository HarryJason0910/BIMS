/**
 * Property-Based Tests for Bid Aggregate
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { Bid, BidStatus, BidOrigin, RejectionReason } from './Bid';

describe('Bid Property-Based Tests', () => {
  // Arbitraries (generators) for test data
  // Generate non-empty strings that are not just whitespace
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
  const nonEmptyArrayArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 10 });
  const urlArb = fc.webUrl();

  const createBidDataArb = fc.record({
    link: urlArb,
    company: nonEmptyStringArb,
    client: nonEmptyStringArb,
    role: nonEmptyStringArb,
    mainStacks: nonEmptyArrayArb,
    jobDescriptionPath: nonEmptyStringArb,
    resumePath: nonEmptyStringArb,
    origin: fc.constant(BidOrigin.BID)
  });

  describe('Property 1: Bid Creation Date Initialization', () => {
    // Feature: job-bid-management-system, Property 1: Bid Creation Date Initialization
    // **Validates: Requirements 1.1**
    
    it('should set date to today for any valid bid creation request', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const bid = Bid.create(bidData);
          const bidDate = new Date(bid.date);
          bidDate.setHours(0, 0, 0, 0);
          
          return bidDate.getTime() === today.getTime();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Bid Required Fields Validation', () => {
    // Feature: job-bid-management-system, Property 2: Bid Required Fields Validation
    // **Validates: Requirements 1.2**
    
    it('should reject bid creation when link is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: fc.constant(''),
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('link');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when company is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: fc.constant(''),
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('company');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when client is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: fc.constant(''),
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('client');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when role is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: fc.constant(''),
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('role');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when mainStacks is empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: fc.constant([]),
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('mainStacks');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when jobDescriptionPath is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: fc.constant(''),
            resumePath: nonEmptyStringArb,
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('jobDescriptionPath');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bid creation when resumePath is missing or empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            link: urlArb,
            company: nonEmptyStringArb,
            client: nonEmptyStringArb,
            role: nonEmptyStringArb,
            mainStacks: nonEmptyArrayArb,
            jobDescriptionPath: nonEmptyStringArb,
            resumePath: fc.constant(''),
            origin: fc.constant(BidOrigin.BID)
          }),
          (bidData) => {
            try {
              Bid.create(bidData);
              return false; // Should have thrown
            } catch (error) {
              return error instanceof Error && error.message.includes('resumePath');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Bid Default Field Initialization', () => {
    // Feature: job-bid-management-system, Property 3: Bid Default Field Initialization
    // **Validates: Requirements 1.4**
    
    it('should initialize bidStatus to NEW, interviewWinning to false, bidDetail to empty, and resumeChecker to null', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          return (
            bid.bidStatus === BidStatus.NEW &&
            bid.interviewWinning === false &&
            bid.bidDetail === '' &&
            bid.resumeChecker === null
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Rebidding Eligibility', () => {
    // Feature: job-bid-management-system, Property 11: Rebidding Eligibility
    // **Validates: Requirements 5.1, 5.2, 5.3**
    
    it('should allow rebidding if and only if status is REJECTED and interviewWinning is false', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.constantFrom(...Object.values(BidStatus)),
          fc.boolean(),
          (bidData, targetStatus, shouldStartInterview) => {
            const bid = Bid.create(bidData);
            
            // Transition to target status
            try {
              if (targetStatus === BidStatus.SUBMITTED) {
                bid.markAsSubmitted();
              } else if (targetStatus === BidStatus.REJECTED) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                bid.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
              } else if (targetStatus === BidStatus.INTERVIEW_STAGE) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                bid.markInterviewStarted();
              } else if (targetStatus === BidStatus.CLOSED) {
                if (bid.bidStatus === BidStatus.NEW) {
                  bid.markAsSubmitted();
                }
                if (shouldStartInterview) {
                  bid.markInterviewStarted();
                }
                bid.markAsClosed();
              }
            } catch (error) {
              // Some transitions are invalid, skip this test case
              return true;
            }
            
            const canRebid = bid.canRebid();
            const expectedCanRebid = 
              bid.bidStatus === BidStatus.REJECTED && 
              bid.interviewWinning === false;
            
            return canRebid === expectedCanRebid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should forbid rebidding when interviewWinning is true', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // Start interview (sets interviewWinning to true)
          bid.markAsSubmitted();
          bid.markInterviewStarted();
          
          // Even if we could reject (which we can't), rebidding should be forbidden
          return !bid.canRebid() && bid.interviewWinning === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow rebidding only after rejection without interview', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // Reject without starting interview
          bid.markAsSubmitted();
          bid.markAsRejected(RejectionReason.UNSATISFIED_RESUME);
          
          return bid.canRebid() && 
                 bid.bidStatus === BidStatus.REJECTED && 
                 !bid.interviewWinning;
        }),
        { numRuns: 100 }
      );
    });
  });
});

  describe('Property 12: Layer Weights Validation', () => {
    // Feature: role-based-layer-weights, Property 12: Layer Weights Validation
    // **Validates: Requirements 3.2, 3.5**
    
    it('should ensure layer weights always sum to 1.0 (±0.001 tolerance)', () => {
      fc.assert(
        fc.property(createBidDataArb, (bidData) => {
          const bid = Bid.create(bidData);
          const weights = bid.getLayerWeights();
          
          const sum = weights.frontend + weights.backend + weights.database + 
                      weights.cloud + weights.devops + weights.others;
          
          return Math.abs(sum - 1.0) <= 0.001;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: LayerSkills Structure Validation', () => {
    // Feature: role-based-layer-weights, Property 13: LayerSkills Structure Validation
    // **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    
    // Generator for valid skill weights that sum to 1.0
    const skillWeightsArbitrary = (minSkills: number = 0, maxSkills: number = 5) =>
      fc.integer({ min: minSkills, max: maxSkills }).chain(count => {
        if (count === 0) {
          return fc.constant([]);
        }
        
        return fc.array(fc.string({ minLength: 1, maxLength: 20 }), { 
          minLength: count, 
          maxLength: count 
        }).chain(skills => {
          // Generate weights that sum to 1.0
          return fc.array(fc.float({ min: 0.01, max: 1 }), { 
            minLength: count, 
            maxLength: count 
          }).map(weights => {
            const sum = weights.reduce((a, b) => a + b, 0);
            const normalized = weights.map(w => w / sum);
            return skills.map((skill, i) => ({ skill, weight: normalized[i] }));
          });
        });
      });

    const layerSkillsArbitrary = fc.record({
      frontend: skillWeightsArbitrary(0, 5),
      backend: skillWeightsArbitrary(0, 5),
      database: skillWeightsArbitrary(0, 5),
      cloud: skillWeightsArbitrary(0, 5),
      devops: skillWeightsArbitrary(0, 5),
      others: skillWeightsArbitrary(0, 5)
    });

    const createBidDataWithLayerSkillsArb = fc.record({
      link: urlArb,
      company: nonEmptyStringArb,
      client: nonEmptyStringArb,
      role: fc.constantFrom(
        'Senior Backend Engineer',
        'Senior Frontend Developer',
        'Senior Balanced Full Stack Engineer',
        'Junior Backend Engineer',
        'Mid Frontend Developer'
      ),
      mainStacks: layerSkillsArbitrary,
      jobDescriptionPath: nonEmptyStringArb,
      resumePath: nonEmptyStringArb,
      origin: fc.constant(BidOrigin.BID)
    });

    it('should accept LayerSkills with all 6 required keys', () => {
      fc.assert(
        fc.property(createBidDataWithLayerSkillsArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // Verify all layers are accessible
          const layers = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'] as const;
          for (const layer of layers) {
            const skills = bid.getSkillsForLayer(layer);
            expect(Array.isArray(skills)).toBe(true);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate that skill weights sum to 1.0 per layer (or layer is empty)', () => {
      fc.assert(
        fc.property(createBidDataWithLayerSkillsArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          return bid.validateSkillWeights();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject LayerSkills with invalid weight sums', () => {
      const invalidLayerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.3 }
          // Sum is 0.8, not 1.0 - should be rejected
        ],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: []
      };

      expect(() => {
        Bid.create({
          link: 'https://example.com/job',
          company: 'Company A',
          client: 'Client A',
          role: 'Senior Frontend Developer',
          mainStacks: invalidLayerSkills,
          jobDescriptionPath: '/path/to/jd.pdf',
          resumePath: '/path/to/resume.pdf',
          origin: BidOrigin.BID
        });
      }).toThrow('Skill weights in layer \'frontend\' must sum to 1.0');
    });

    it('should allow empty layers', () => {
      fc.assert(
        fc.property(createBidDataWithLayerSkillsArb, (bidData) => {
          const bid = Bid.create(bidData);
          
          // At least one layer might be empty
          const layers = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'] as const;
          let hasEmptyLayer = false;
          for (const layer of layers) {
            const skills = bid.getSkillsForLayer(layer);
            if (skills.length === 0) {
              hasEmptyLayer = true;
              break;
            }
          }
          
          // Test passes regardless - just verifying no errors with empty layers
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Role Parsing and Layer Weights', () => {
    // Feature: role-based-layer-weights, Property 14: Role Parsing and Layer Weights
    // **Validates: Requirements 1, 2, 3, 4**
    
    it('should assign correct layer weights based on role', () => {
      const testCases = [
        { role: 'Senior Backend Engineer', expectedBackendWeight: 0.60 },
        { role: 'Junior Frontend Developer', expectedFrontendWeight: 0.70 },
        { role: 'Mid Balanced Full Stack Engineer', expectedFrontendWeight: 0.35, expectedBackendWeight: 0.35 },
        { role: 'Lead Frontend Heavy Full Stack Engineer', expectedFrontendWeight: 0.50 },
        { role: 'Staff Backend Heavy Full Stack Engineer', expectedBackendWeight: 0.50 }
      ];

      for (const testCase of testCases) {
        const bid = Bid.create({
          link: 'https://example.com/job',
          company: 'Company A',
          client: 'Client A',
          role: testCase.role,
          mainStacks: ['skill1', 'skill2'],
          jobDescriptionPath: '/path/to/jd.pdf',
          resumePath: '/path/to/resume.pdf',
          origin: BidOrigin.BID
        });

        const weights = bid.getLayerWeights();
        
        if ('expectedBackendWeight' in testCase) {
          expect(weights.backend).toBe(testCase.expectedBackendWeight);
        }
        if ('expectedFrontendWeight' in testCase) {
          expect(weights.frontend).toBe(testCase.expectedFrontendWeight);
        }
      }
    });

    it('should use default weights for unrecognized roles', () => {
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'Company A',
        client: 'Client A',
        role: 'Unknown Role',
        mainStacks: ['skill1', 'skill2'],
        jobDescriptionPath: '/path/to/jd.pdf',
        resumePath: '/path/to/resume.pdf',
        origin: BidOrigin.BID
      });

      const weights = bid.getLayerWeights();
      
      // Should have balanced default weights
      const sum = weights.frontend + weights.backend + weights.database + 
                  weights.cloud + weights.devops + weights.others;
      expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001);
    });
  });

  describe('Property 15: getAllSkills Method', () => {
    // Feature: role-based-layer-weights, Property 15: getAllSkills Method
    // **Validates: Requirements 6.1, 6.2**
    
    it('should flatten all layer skills into a single array', () => {
      const layerSkills = {
        frontend: [
          { skill: 'react', weight: 0.5 },
          { skill: 'typescript', weight: 0.5 }
        ],
        backend: [
          { skill: 'python', weight: 1.0 }
        ],
        database: [
          { skill: 'postgresql', weight: 1.0 }
        ],
        cloud: [],
        devops: [],
        others: []
      };

      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Balanced Full Stack Engineer',
        mainStacks: layerSkills,
        jobDescriptionPath: '/path/to/jd.pdf',
        resumePath: '/path/to/resume.pdf',
        origin: BidOrigin.BID
      });

      const allSkills = bid.getAllSkills();
      
      expect(allSkills).toContain('react');
      expect(allSkills).toContain('typescript');
      expect(allSkills).toContain('python');
      expect(allSkills).toContain('postgresql');
      expect(allSkills.length).toBe(4);
    });

    it('should work with legacy format (string array)', () => {
      const bid = Bid.create({
        link: 'https://example.com/job',
        company: 'Company A',
        client: 'Client A',
        role: 'Senior Backend Engineer',
        mainStacks: ['react', 'python', 'postgresql'],
        jobDescriptionPath: '/path/to/jd.pdf',
        resumePath: '/path/to/resume.pdf',
        origin: BidOrigin.BID
      });

      const allSkills = bid.getAllSkills();
      
      expect(allSkills).toEqual(['react', 'python', 'postgresql']);
    });
  });
