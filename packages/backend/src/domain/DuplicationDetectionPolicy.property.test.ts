/**
 * Property-Based Tests for DuplicationDetectionPolicy
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using fast-check for randomized input generation.
 */

import * as fc from 'fast-check';
import { Bid, CreateBidData } from './Bid';
import { DuplicationDetectionPolicy } from './DuplicationDetectionPolicy';

describe('DuplicationDetectionPolicy Property-Based Tests', () => {
  let policy: DuplicationDetectionPolicy;

  beforeEach(() => {
    policy = new DuplicationDetectionPolicy();
  });

  // Arbitraries (generators) for test data
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
    jobDescription: nonEmptyStringArb,
    resume: nonEmptyStringArb
  });

  describe('Property 4: Link-Based Duplication Detection', () => {
    // Feature: job-bid-management-system, Property 4: Link-Based Duplication Detection
    // **Validates: Requirements 2.1**
    
    it('should detect LINK_MATCH warning when new bid link matches existing bid link', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          (existingBidData, newBidData) => {
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Create new bid data with the same link as existing bid
            const newBidWithSameLink: CreateBidData = {
              ...newBidData,
              link: existingBid.link // Use the same link
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSameLink, [existingBid]);
            
            // Should have at least one LINK_MATCH warning
            const linkMatchWarning = warnings.find(w => w.type === 'LINK_MATCH');
            
            return (
              linkMatchWarning !== undefined &&
              linkMatchWarning.existingBidId === existingBid.id &&
              linkMatchWarning.message.includes('Duplicate link detected')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect LINK_MATCH warning when new bid link differs from existing bid link', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          (existingBidData, newBidData) => {
            // Ensure the links are different
            fc.pre(existingBidData.link !== newBidData.link);
            
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Check for duplication with different link
            const warnings = policy.checkDuplication(newBidData, [existingBid]);
            
            // Should not have LINK_MATCH warning
            const linkMatchWarning = warnings.find(w => w.type === 'LINK_MATCH');
            
            return linkMatchWarning === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect LINK_MATCH for each existing bid with matching link', () => {
      fc.assert(
        fc.property(
          urlArb,
          fc.array(createBidDataArb, { minLength: 1, maxLength: 5 }),
          createBidDataArb,
          (sharedLink, existingBidsData, newBidData) => {
            // Create existing bids all with the same link
            const existingBids = existingBidsData.map(data => 
              Bid.create({ ...data, link: sharedLink })
            );
            
            // Create new bid data with the same shared link
            const newBidWithSharedLink: CreateBidData = {
              ...newBidData,
              link: sharedLink
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSharedLink, existingBids);
            
            // Should have LINK_MATCH warning for each existing bid
            const linkMatchWarnings = warnings.filter(w => w.type === 'LINK_MATCH');
            
            return linkMatchWarnings.length === existingBids.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Company-Role Duplication Detection', () => {
    // Feature: job-bid-management-system, Property 5: Company-Role Duplication Detection
    // **Validates: Requirements 2.2**
    
    it('should detect COMPANY_ROLE_MATCH warning when company and role match (case-insensitive)', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          fc.constantFrom('lower', 'upper', 'mixed'),
          (existingBidData, newBidData, caseVariant) => {
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Transform company and role to different cases
            let company = existingBid.company;
            let role = existingBid.role;
            
            if (caseVariant === 'lower') {
              company = company.toLowerCase();
              role = role.toLowerCase();
            } else if (caseVariant === 'upper') {
              company = company.toUpperCase();
              role = role.toUpperCase();
            } else {
              // Mixed case - alternate upper and lower
              company = company.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
              role = role.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
            }
            
            // Create new bid data with same company and role but different case
            const newBidWithSameCompanyRole: CreateBidData = {
              ...newBidData,
              link: newBidData.link !== existingBid.link ? newBidData.link : newBidData.link + '/different', // Ensure different link
              company: company,
              role: role
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSameCompanyRole, [existingBid]);
            
            // Should have at least one COMPANY_ROLE_MATCH warning
            const companyRoleMatchWarning = warnings.find(w => w.type === 'COMPANY_ROLE_MATCH');
            
            return (
              companyRoleMatchWarning !== undefined &&
              companyRoleMatchWarning.existingBidId === existingBid.id &&
              companyRoleMatchWarning.message.includes('Duplicate company and role detected')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect COMPANY_ROLE_MATCH when only company matches', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          (existingBidData, newBidData) => {
            // Ensure roles are different
            fc.pre(existingBidData.role.toLowerCase() !== newBidData.role.toLowerCase());
            
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Create new bid data with same company but different role
            const newBidWithSameCompany: CreateBidData = {
              ...newBidData,
              link: newBidData.link !== existingBid.link ? newBidData.link : newBidData.link + '/different',
              company: existingBid.company // Same company
              // role is different from newBidData
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSameCompany, [existingBid]);
            
            // Should not have COMPANY_ROLE_MATCH warning
            const companyRoleMatchWarning = warnings.find(w => w.type === 'COMPANY_ROLE_MATCH');
            
            return companyRoleMatchWarning === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect COMPANY_ROLE_MATCH when only role matches', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          (existingBidData, newBidData) => {
            // Ensure companies are different
            fc.pre(existingBidData.company.toLowerCase() !== newBidData.company.toLowerCase());
            
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Create new bid data with same role but different company
            const newBidWithSameRole: CreateBidData = {
              ...newBidData,
              link: newBidData.link !== existingBid.link ? newBidData.link : newBidData.link + '/different',
              role: existingBid.role // Same role
              // company is different from newBidData
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSameRole, [existingBid]);
            
            // Should not have COMPANY_ROLE_MATCH warning
            const companyRoleMatchWarning = warnings.find(w => w.type === 'COMPANY_ROLE_MATCH');
            
            return companyRoleMatchWarning === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect COMPANY_ROLE_MATCH for each existing bid with matching company and role', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.array(createBidDataArb, { minLength: 1, maxLength: 5 }),
          createBidDataArb,
          (sharedCompany, sharedRole, existingBidsData, newBidData) => {
            // Create existing bids all with the same company and role
            const existingBids = existingBidsData.map(data => 
              Bid.create({ 
                ...data, 
                company: sharedCompany,
                role: sharedRole
              })
            );
            
            // Create new bid data with the same company and role but different link
            const newBidWithSharedCompanyRole: CreateBidData = {
              ...newBidData,
              company: sharedCompany,
              role: sharedRole
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithSharedCompanyRole, existingBids);
            
            // Should have COMPANY_ROLE_MATCH warning for each existing bid
            const companyRoleMatchWarnings = warnings.filter(w => w.type === 'COMPANY_ROLE_MATCH');
            
            return companyRoleMatchWarnings.length === existingBids.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Duplication Warnings Non-Blocking', () => {
    // Feature: job-bid-management-system, Property 6: Duplication Warnings Non-Blocking
    // **Validates: Requirements 2.3, 2.4**
    
    it('should return warnings without throwing errors for any duplication scenario', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.array(createBidDataArb, { minLength: 0, maxLength: 10 }),
          (newBidData, existingBidsData) => {
            // Create existing bids
            const existingBids = existingBidsData.map(data => Bid.create(data));
            
            try {
              // Check for duplication - should never throw
              const warnings = policy.checkDuplication(newBidData, existingBids);
              
              // Should return an array (possibly empty)
              return Array.isArray(warnings);
            } catch (error) {
              // Should not throw
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return both LINK_MATCH and COMPANY_ROLE_MATCH warnings when both conditions are met', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          createBidDataArb,
          (existingBidData, newBidData) => {
            // Create an existing bid
            const existingBid = Bid.create(existingBidData);
            
            // Create new bid data with same link AND same company+role
            const newBidWithBothMatches: CreateBidData = {
              ...newBidData,
              link: existingBid.link,
              company: existingBid.company,
              role: existingBid.role
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithBothMatches, [existingBid]);
            
            // Should have both types of warnings
            const hasLinkMatch = warnings.some(w => w.type === 'LINK_MATCH');
            const hasCompanyRoleMatch = warnings.some(w => w.type === 'COMPANY_ROLE_MATCH');
            
            return hasLinkMatch && hasCompanyRoleMatch && warnings.length === 2;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all warnings from multiple existing bids', () => {
      fc.assert(
        fc.property(
          urlArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.array(createBidDataArb, { minLength: 2, maxLength: 5 }),
          createBidDataArb,
          (sharedLink, sharedCompany, sharedRole, existingBidsData, newBidData) => {
            // Create existing bids with shared link, company, and role
            const existingBids = existingBidsData.map(data => 
              Bid.create({ 
                ...data, 
                link: sharedLink,
                company: sharedCompany,
                role: sharedRole
              })
            );
            
            // Create new bid data with same link, company, and role
            const newBidWithAllMatches: CreateBidData = {
              ...newBidData,
              link: sharedLink,
              company: sharedCompany,
              role: sharedRole
            };
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidWithAllMatches, existingBids);
            
            // Should have 2 warnings per existing bid (LINK_MATCH + COMPANY_ROLE_MATCH)
            const expectedWarningCount = existingBids.length * 2;
            
            return warnings.length === expectedWarningCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no duplicates exist', () => {
      fc.assert(
        fc.property(
          createBidDataArb,
          fc.array(createBidDataArb, { minLength: 0, maxLength: 10 }),
          (newBidData, existingBidsData) => {
            // Filter out any existing bids that would match
            const existingBids = existingBidsData
              .filter(data => 
                data.link !== newBidData.link &&
                !(data.company.toLowerCase() === newBidData.company.toLowerCase() && 
                  data.role.toLowerCase() === newBidData.role.toLowerCase())
              )
              .map(data => Bid.create(data));
            
            // Check for duplication
            const warnings = policy.checkDuplication(newBidData, existingBids);
            
            // Should return empty array
            return warnings.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
