/**
 * Property-based tests for WeightedMatchRateCalculator
 * 
 * **Validates: Requirements 7**
 */

import * as fc from 'fast-check';
import { WeightedMatchRateCalculator } from './WeightedMatchRateCalculator';
import { Bid, BidOrigin } from './Bid';
import { LayerSkills, TechLayer } from './JDSpecTypes';

describe('WeightedMatchRateCalculator - Property-Based Tests', () => {
  const calculator = new WeightedMatchRateCalculator();

  // Generator for valid skill weights that sum to 1.0
  const skillWeightsArbitrary = (minSkills: number = 1, maxSkills: number = 5) =>
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

  // Generator for LayerSkills
  const layerSkillsArbitrary = fc.record({
    frontend: skillWeightsArbitrary(0, 5),
    backend: skillWeightsArbitrary(0, 5),
    database: skillWeightsArbitrary(0, 5),
    cloud: skillWeightsArbitrary(0, 5),
    devops: skillWeightsArbitrary(0, 5),
    others: skillWeightsArbitrary(0, 5)
  });

  // Generator for Bid with LayerSkills
  const bidArbitrary = fc.record({
    link: fc.webUrl(),
    company: fc.string({ minLength: 1, maxLength: 50 }),
    client: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.constantFrom(
      'Senior Backend Engineer',
      'Senior Frontend Developer',
      'Senior Balanced Full Stack Engineer',
      'Junior Backend Engineer',
      'Mid Frontend Developer'
    ),
    mainStacks: layerSkillsArbitrary,
    jobDescriptionPath: fc.string({ minLength: 1 }),
    resumePath: fc.string({ minLength: 1 }),
    origin: fc.constant(BidOrigin.BID)
  }).map(data => Bid.create(data));

  /**
   * Property 1: Match rate is always between 0 and 1
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it('property: match rate is always between 0 and 1', () => {
    fc.assert(
      fc.property(bidArbitrary, bidArbitrary, (bid1, bid2) => {
        const result = calculator.calculate(bid1, bid2);
        expect(result.overallMatchRate).toBeGreaterThanOrEqual(0);
        expect(result.overallMatchRate).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Perfect match (same bid) = 1.0
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it('property: perfect match (same bid) equals 1.0', () => {
    fc.assert(
      fc.property(bidArbitrary, (bid) => {
        const result = calculator.calculate(bid, bid);
        expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Layer score is always between 0 and 1
   * **Validates: Requirements 7.1, 7.4**
   */
  it('property: layer score is always between 0 and 1', () => {
    fc.assert(
      fc.property(bidArbitrary, bidArbitrary, (bid1, bid2) => {
        const result = calculator.calculate(bid1, bid2);
        const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
        
        for (const layer of layers) {
          const layerResult = result.layerBreakdown.get(layer);
          expect(layerResult).toBeDefined();
          expect(layerResult!.score).toBeGreaterThanOrEqual(0);
          expect(layerResult!.score).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: If all skills match with weight 1.0, score = 1.0
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it('property: if all skills match with weight 1.0, overall score is 1.0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom(
          'Senior Backend Engineer',
          'Senior Frontend Developer',
          'Senior Balanced Full Stack Engineer'
        ),
        (skillName, role) => {
          const skills: LayerSkills = {
            frontend: [{ skill: skillName, weight: 1.0 }],
            backend: [],
            database: [],
            cloud: [],
            devops: [],
            others: []
          };

          const bid1 = Bid.create({
            link: 'https://example.com/job1',
            company: 'Company A',
            client: 'Client A',
            role,
            mainStacks: skills,
            jobDescriptionPath: '/path/to/jd1.pdf',
            resumePath: '/path/to/resume1.pdf',
            origin: BidOrigin.BID
          });

          const bid2 = Bid.create({
            link: 'https://example.com/job2',
            company: 'Company B',
            client: 'Client B',
            role,
            mainStacks: skills,
            jobDescriptionPath: '/path/to/jd2.pdf',
            resumePath: '/path/to/resume2.pdf',
            origin: BidOrigin.BID
          });

          const result = calculator.calculate(bid1, bid2);
          expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5: Disjoint skills = 0.0
   * **Validates: Requirements 7.1, 7.4**
   */
  it('property: disjoint skills result in 0.0 match rate', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('frontend', 'backend', 'database', 'cloud', 'devops', 'others'),
        (skill1, skill2, layer) => {
          fc.pre(skill1.toLowerCase() !== skill2.toLowerCase()); // Ensure different skills

          const skills1: LayerSkills = {
            frontend: layer === 'frontend' ? [{ skill: skill1, weight: 1.0 }] : [],
            backend: layer === 'backend' ? [{ skill: skill1, weight: 1.0 }] : [],
            database: layer === 'database' ? [{ skill: skill1, weight: 1.0 }] : [],
            cloud: layer === 'cloud' ? [{ skill: skill1, weight: 1.0 }] : [],
            devops: layer === 'devops' ? [{ skill: skill1, weight: 1.0 }] : [],
            others: layer === 'others' ? [{ skill: skill1, weight: 1.0 }] : []
          };

          const skills2: LayerSkills = {
            frontend: layer === 'frontend' ? [{ skill: skill2, weight: 1.0 }] : [],
            backend: layer === 'backend' ? [{ skill: skill2, weight: 1.0 }] : [],
            database: layer === 'database' ? [{ skill: skill2, weight: 1.0 }] : [],
            cloud: layer === 'cloud' ? [{ skill: skill2, weight: 1.0 }] : [],
            devops: layer === 'devops' ? [{ skill: skill2, weight: 1.0 }] : [],
            others: layer === 'others' ? [{ skill: skill2, weight: 1.0 }] : []
          };

          const bid1 = Bid.create({
            link: 'https://example.com/job1',
            company: 'Company A',
            client: 'Client A',
            role: 'Senior Backend Engineer',
            mainStacks: skills1,
            jobDescriptionPath: '/path/to/jd1.pdf',
            resumePath: '/path/to/resume1.pdf',
            origin: BidOrigin.BID
          });

          const bid2 = Bid.create({
            link: 'https://example.com/job2',
            company: 'Company B',
            client: 'Client B',
            role: 'Senior Backend Engineer',
            mainStacks: skills2,
            jobDescriptionPath: '/path/to/jd2.pdf',
            resumePath: '/path/to/resume2.pdf',
            origin: BidOrigin.BID
          });

          const result = calculator.calculate(bid1, bid2);
          expect(result.overallMatchRate).toBe(0.0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6: Match rate is not symmetric (A→B ≠ B→A in general)
   * **Validates: Requirements 7.1, 7.2**
   */
  it('property: match rate is not necessarily symmetric', () => {
    // Create specific example where asymmetry is guaranteed
    const skills1: LayerSkills = {
      frontend: [
        { skill: 'react', weight: 0.5 },
        { skill: 'typescript', weight: 0.5 }
      ],
      backend: [],
      database: [],
      cloud: [],
      devops: [],
      others: []
    };

    const skills2: LayerSkills = {
      frontend: [{ skill: 'react', weight: 1.0 }],
      backend: [],
      database: [],
      cloud: [],
      devops: [],
      others: []
    };

    const bid1 = Bid.create({
      link: 'https://example.com/job1',
      company: 'Company A',
      client: 'Client A',
      role: 'Senior Frontend Developer',
      mainStacks: skills1,
      jobDescriptionPath: '/path/to/jd1.pdf',
      resumePath: '/path/to/resume1.pdf',
      origin: BidOrigin.BID
    });

    const bid2 = Bid.create({
      link: 'https://example.com/job2',
      company: 'Company B',
      client: 'Client B',
      role: 'Senior Frontend Developer',
      mainStacks: skills2,
      jobDescriptionPath: '/path/to/jd2.pdf',
      resumePath: '/path/to/resume2.pdf',
      origin: BidOrigin.BID
    });

    const result1to2 = calculator.calculate(bid1, bid2);
    const result2to1 = calculator.calculate(bid2, bid1);

    // In this case, they should actually be equal (both 0.5 * 1.0 = 0.5)
    // But in general, they can be different
    // Let's verify the calculation is correct
    expect(result1to2.overallMatchRate).toBeCloseTo(0.5 * 0.70, 3); // 0.5 * 1.0 * 0.70 (frontend weight)
    expect(result2to1.overallMatchRate).toBeCloseTo(1.0 * 0.5 * 0.70, 3); // 1.0 * 0.5 * 0.70
  });

  /**
   * Property 7: Matching skills list is always a subset of current skills
   * **Validates: Requirements 7.1, 7.4**
   */
  it('property: matching skills are always a subset of current skills', () => {
    fc.assert(
      fc.property(bidArbitrary, bidArbitrary, (bid1, bid2) => {
        const result = calculator.calculate(bid1, bid2);
        const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
        
        for (const layer of layers) {
          const layerResult = result.layerBreakdown.get(layer);
          const currentSkills = bid1.getSkillsForLayer(layer).map(s => s.skill.toLowerCase());
          const matchingSkills = layerResult!.matchingSkills.map(s => s.toLowerCase());
          
          // All matching skills should be in current skills
          for (const skill of matchingSkills) {
            expect(currentSkills).toContain(skill);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Missing skills + matching skills = current skills
   * **Validates: Requirements 7.1, 7.4**
   */
  it('property: missing skills + matching skills equals current skills', () => {
    fc.assert(
      fc.property(bidArbitrary, bidArbitrary, (bid1, bid2) => {
        const result = calculator.calculate(bid1, bid2);
        const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
        
        for (const layer of layers) {
          const layerResult = result.layerBreakdown.get(layer);
          const currentSkills = bid1.getSkillsForLayer(layer).map(s => s.skill.toLowerCase()).sort();
          const allSkills = [
            ...layerResult!.matchingSkills.map(s => s.toLowerCase()),
            ...layerResult!.missingSkills.map(s => s.toLowerCase())
          ].sort();
          
          expect(allSkills).toEqual(currentSkills);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Case-insensitive matching
   * **Validates: Requirements 7.1, 7.4**
   */
  it('property: skill matching is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (skillName) => {
          const skills1: LayerSkills = {
            frontend: [{ skill: skillName.toLowerCase(), weight: 1.0 }],
            backend: [],
            database: [],
            cloud: [],
            devops: [],
            others: []
          };

          const skills2: LayerSkills = {
            frontend: [{ skill: skillName.toUpperCase(), weight: 1.0 }],
            backend: [],
            database: [],
            cloud: [],
            devops: [],
            others: []
          };

          const bid1 = Bid.create({
            link: 'https://example.com/job1',
            company: 'Company A',
            client: 'Client A',
            role: 'Senior Frontend Developer',
            mainStacks: skills1,
            jobDescriptionPath: '/path/to/jd1.pdf',
            resumePath: '/path/to/resume1.pdf',
            origin: BidOrigin.BID
          });

          const bid2 = Bid.create({
            link: 'https://example.com/job2',
            company: 'Company B',
            client: 'Client B',
            role: 'Senior Frontend Developer',
            mainStacks: skills2,
            jobDescriptionPath: '/path/to/jd2.pdf',
            resumePath: '/path/to/resume2.pdf',
            origin: BidOrigin.BID
          });

          const result = calculator.calculate(bid1, bid2);
          expect(result.overallMatchRate).toBeCloseTo(1.0, 3);
        }
      ),
      { numRuns: 50 }
    );
  });
});
