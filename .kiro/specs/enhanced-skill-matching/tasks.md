# Implementation Plan: Enhanced Skill Matching

## Overview

This implementation plan breaks down the Enhanced Skill Matching feature into discrete, incremental coding tasks. The feature implements a JD-to-JD correlation engine with a 6-layer weighted architecture, canonical skills dictionary management, and property-based testing for correctness validation.

The implementation follows clean architecture principles with pure domain logic, clear layer separation, and comprehensive testing at each step.

## Tasks

- [x] 1. Set up domain value objects and types
  - Create TechLayer type and LayerWeights interface
  - Create SkillWeight interface and LayerSkills interface
  - Create CanonicalSkill interface
  - Create UnknownSkillItem, ApprovalDecision, and RejectionDecision interfaces
  - _Requirements: 1.1, 1.6, 2.2_

- [x] 2. Implement CanonicalJDSpec aggregate root
  - [x] 2.1 Create CanonicalJDSpec class with private fields and constructor
    - Implement static create() factory method
    - Implement getter methods for all fields
    - Implement toJSON() serialization method
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [x] 2.2 Write property test for layer completeness
    - **Property 1: JD Specification Layer Completeness**
    - **Validates: Requirements 1.1, 1.2, 12.2, 12.3**

  - [x] 2.3 Write property test for layer weights sum to unity
    - **Property 2: Layer Weights Sum to Unity**
    - **Validates: Requirements 1.3, 1.7, 8.1, 12.4**

  - [x] 2.4 Write property test for skill weights sum to unity per layer
    - **Property 3: Skill Weights Sum to Unity Per Layer**
    - **Validates: Requirements 1.4, 1.8, 8.2, 12.5**

  - [x] 2.5 Write property test for serialization round-trip
    - **Property 5: JD Specification Serialization Round-Trip**
    - **Validates: Requirement 1.6**

  - [x] 2.6 Write unit tests for edge cases
    - Test empty skill arrays
    - Test zero-weight layers
    - Test validation error messages
    - _Requirements: 1.7, 1.8_

- [x] 3. Implement SkillDictionary aggregate root
  - [x] 3.1 Create SkillDictionary class with skill and variation management
    - Implement static create() and fromJSON() methods
    - Implement addCanonicalSkill() and addSkillVariation() methods
    - Implement removeCanonicalSkill() method
    - Implement getCanonicalSkill(), mapToCanonical(), hasSkill() methods
    - Implement getAllSkills(), getSkillsByCategory(), getVariationsFor() methods
    - Implement incrementVersion() method
    - Implement toJSON() method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x] 3.2 Write property test for canonical skill completeness
    - **Property 6: Canonical Skill Completeness**
    - **Validates: Requirement 2.2**

  - [x] 3.3 Write property test for skill variation uniqueness
    - **Property 7: Skill Variation Uniqueness**
    - **Validates: Requirement 2.3**

  - [x] 3.4 Write property test for skill deletion cascade
    - **Property 8: Canonical Skill Deletion Cascade**
    - **Validates: Requirement 2.5**

  - [x] 3.5 Write property test for dictionary version format
    - **Property 9: Dictionary Version Format**
    - **Validates: Requirement 3.1**

  - [x] 3.6 Write property test for version monotonicity
    - **Property 10: Dictionary Version Monotonicity**
    - **Validates: Requirement 3.2**

  - [x] 3.7 Write property test for skill mapping determinism
    - **Property 13: Skill Mapping Determinism**
    - **Validates: Requirement 4.7**

  - [x] 3.8 Write unit tests for dictionary operations
    - Test CRUD operations
    - Test variation mapping
    - Test version incrementing
    - _Requirements: 2.4, 3.1, 3.2_

- [x] 4. Implement SkillReviewQueue aggregate root
  - [x] 4.1 Create SkillReviewQueue class with queue management
    - Implement addUnknownSkill() method
    - Implement getQueueItems() method
    - Implement approveAsCanonical() and approveAsVariation() methods
    - Implement reject() method
    - Implement hasSkill() and getItemByName() methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 4.2 Write property test for queue uniqueness
    - **Property 16: Unknown Skill Queue Uniqueness**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 4.3 Write property test for queue completeness
    - **Property 17: Unknown Skill Queue Completeness**
    - **Validates: Requirement 5.3**

  - [x] 4.4 Write property test for approval workflow
    - **Property 18: Skill Approval Workflow**
    - **Validates: Requirements 5.4, 5.5**

  - [x] 4.5 Write property test for rejection workflow
    - **Property 19: Skill Rejection Workflow**
    - **Validates: Requirement 5.6**

  - [x] 4.6 Write property test for audit trail
    - **Property 20: Review Decision Audit Trail**
    - **Validates: Requirement 5.7**

  - [x] 4.7 Write unit tests for queue operations
    - Test duplicate prevention
    - Test frequency counting
    - Test approval/rejection flows
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

- [x] 5. Checkpoint - Ensure all domain aggregate tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement JDCorrelationCalculator domain service
  - [x] 6.1 Create JDCorrelationCalculator class with correlation logic
    - Implement calculate() method for overall correlation
    - Implement calculateLayerCorrelation() private method
    - Implement calculateSkillSimilarity() private method
    - Create CorrelationResult and LayerCorrelationResult interfaces
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.4, 8.5_

  - [x] 6.2 Write property test for correlation determinism
    - **Property 21: Correlation Calculation Determinism**
    - **Validates: Requirement 6.1**

  - [x] 6.3 Write property test for layer correlation formula
    - **Property 22: Layer Correlation Formula Correctness**
    - **Validates: Requirement 6.2**

  - [x] 6.4 Write property test for overall correlation formula
    - **Property 23: Overall Correlation Formula Correctness**
    - **Validates: Requirement 6.3**

  - [x] 6.5 Write property test for current JD layer weights usage
    - **Property 24: Current JD Layer Weights Used**
    - **Validates: Requirements 6.4, 8.3**

  - [x] 6.6 Write property test for correlation score range
    - **Property 25: Correlation Score Range**
    - **Validates: Requirement 6.5**

  - [x] 6.7 Write property test for missing skill similarity
    - **Property 26: Missing Skill Similarity**
    - **Validates: Requirement 6.6**

  - [x] 6.8 Write property test for skill weight contribution
    - **Property 28: Skill Weight Contribution**
    - **Validates: Requirement 8.4**

  - [x] 6.9 Write property test for zero-weight layer no penalty
    - **Property 29: Zero-Weight Layer No Penalty**
    - **Validates: Requirement 8.5**

  - [x] 6.10 Write unit tests for correlation edge cases
    - Test identical JDs (correlation = 1.0)
    - Test completely different JDs (correlation = 0.0)
    - Test partial overlap
    - Test zero-weight layers
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [x] 7. Implement repository interfaces
  - Create IJDSpecRepository interface
  - Create ISkillDictionaryRepository interface
  - Create ISkillReviewQueueRepository interface
  - _Requirements: 9.1-9.14_

- [x] 8. Implement MongoDB repositories
  - [x] 8.1 Create MongoDBJDSpecRepository
    - Implement save(), findById(), findAll(), update(), delete() methods
    - Add MongoDB schema and indexes
    - _Requirements: 1.6, 9.2, 9.3, 9.5, 9.6_

  - [x] 8.2 Create MongoDBSkillDictionaryRepository
    - Implement save(), getCurrent(), getVersion(), getAllVersions() methods
    - Add MongoDB schema and indexes
    - _Requirements: 2.6, 3.4, 3.5, 9.7_

  - [x] 8.3 Create MongoDBSkillReviewQueueRepository
    - Implement save() and get() methods
    - Add MongoDB schema
    - _Requirements: 5.1, 9.12_

  - [x] 8.4 Write integration tests for repositories
    - Test CRUD operations with real MongoDB
    - Test query operations
    - Test error handling
    - _Requirements: 2.6, 9.1-9.14_

- [x] 9. Checkpoint - Ensure infrastructure layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement CreateJDSpecUseCase
  - [x] 10.1 Create CreateJDSpecUseCase class
    - Implement execute() method
    - Map skills using SkillDictionary
    - Detect and queue unknown skills
    - Validate input before persisting
    - Save JD specification to repository
    - _Requirements: 4.1-4.10, 12.1-12.11_

  - [x] 10.2 Write property test for unknown skill detection
    - **Property 14: Unknown Skill Detection**
    - **Validates: Requirement 4.8**

  - [x] 10.3 Write property test for input validation
    - **Property 15: JD Specification Input Validation**
    - **Validates: Requirement 4.10**

  - [x] 10.4 Write property test for JD specification version tracking
    - **Property 11: JD Normalization Version Tracking**
    - **Validates: Requirements 3.3, 3.6**

  - [x] 10.5 Write property test for weight validation
    - **Property 30: Weight Validation During Normalization**
    - **Validates: Requirement 8.6**

  - [x] 10.6 Write property test for skill name validation
    - **Property 49: Skill Name Validation - Empty Rejection**
    - **Property 50: Skill Name Validation - Length Limit**
    - **Property 51: Skill Name Normalization**
    - **Validates: Requirements 12.6, 12.7, 12.8**

  - [x] 10.7 Write unit tests for create JD spec use case
    - Test successful creation flow
    - Test unknown skill queueing
    - Test validation failures
    - Test error handling
    - _Requirements: 4.8, 4.9, 4.10, 12.1-12.11_

- [x] 11. Implement CalculateCorrelationUseCase
  - [x] 11.1 Create CalculateCorrelationUseCase class
    - Implement execute() method
    - Fetch JD specifications from repository
    - Call JDCorrelationCalculator
    - Return correlation result with breakdown
    - _Requirements: 6.1-6.8, 7.6, 7.7_

  - [x] 11.2 Write property test for correlation dictionary version tracking
    - **Property 27: Correlation Dictionary Version Tracking**
    - **Validates: Requirement 6.7**

  - [x] 11.3 Write property test for correlation explainability
    - **Property 34: Correlation Explainability - Layer Breakdown**
    - **Property 35: Correlation Explainability - Skill Details**
    - **Validates: Requirements 7.6, 7.7**

  - [x] 11.4 Write unit tests for correlation use case
    - Test successful correlation calculation
    - Test JD not found error
    - Test correlation breakdown structure
    - _Requirements: 6.7, 7.6, 7.7_

- [x] 12. Implement CalculateResumeMatchRateUseCase
  - [x] 12.1 Create CalculateResumeMatchRateUseCase class
    - Implement execute() method
    - Fetch resume and its original JD
    - Fetch current JD
    - Calculate JD-to-JD correlation
    - Return match rate as percentage
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 13.1-13.5_

  - [x] 12.2 Write property test for resume match rate equals correlation
    - **Property 31: Resume Match Rate Equals JD Correlation**
    - **Validates: Requirements 7.1, 7.2, 13.4**

  - [x] 12.3 Write property test for resume ranking
    - **Property 32: Resume Ranking by Match Rate**
    - **Validates: Requirement 7.4**

  - [x] 12.4 Write property test for match rate percentage display
    - **Property 33: Match Rate Percentage Display**
    - **Validates: Requirement 7.5**

  - [x] 12.5 Write property test for resume-JD association
    - **Property 36: Resume-JD Association**
    - **Property 37: Resume Original JD Retrieval**
    - **Property 38: Missing Original JD Handling**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.5**

  - [x] 12.6 Write unit tests for resume match rate use case
    - Test successful match rate calculation
    - Test missing original JD (returns 0)
    - Test percentage conversion
    - _Requirements: 7.1, 7.2, 7.5, 13.5_

- [x] 13. Implement ManageSkillDictionaryUseCase
  - [x] 13.1 Create ManageSkillDictionaryUseCase class
    - Implement addCanonicalSkill() method
    - Implement addSkillVariation() method
    - Implement removeCanonicalSkill() method
    - Implement updateCanonicalSkill() method
    - Implement getSkills() and getVariations() methods
    - _Requirements: 2.4, 9.8, 9.9, 9.10, 9.11_

  - [x] 13.2 Write unit tests for dictionary management
    - Test add/remove/update operations
    - Test variation management
    - Test error handling
    - _Requirements: 2.4, 9.8, 9.9, 9.10, 9.11_

- [x] 14. Implement ReviewUnknownSkillsUseCase
  - [x] 14.1 Create ReviewUnknownSkillsUseCase class
    - Implement getQueueItems() method
    - Implement approveAsCanonical() method
    - Implement approveAsVariation() method
    - Implement rejectSkill() method
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 9.12, 9.13_

  - [x] 14.2 Write unit tests for skill review use case
    - Test approval workflows
    - Test rejection workflow
    - Test queue retrieval
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 9.12, 9.13_

- [x] 15. Checkpoint - Ensure all use case tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement ExportDictionaryUseCase and ImportDictionaryUseCase
  - [x] 16.1 Create ExportDictionaryUseCase class
    - Implement execute() method to export dictionary as JSON
    - Include all metadata (version, skills, variations, timestamps)
    - _Requirements: 10.1, 10.2_

  - [x] 17.2 Create ImportDictionaryUseCase class
    - Implement execute() method to import dictionary from JSON
    - Validate JSON structure
    - Check version conflicts
    - Support merge mode
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

  - [ ]* 17.3 Write property test for dictionary export completeness
    - **Property 39: Dictionary Export Completeness**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 17.4 Write property test for dictionary import validation
    - **Property 40: Dictionary Import Validation**
    - **Validates: Requirement 10.3**

  - [ ]* 17.5 Write property test for version protection
    - **Property 41: Dictionary Version Protection**
    - **Validates: Requirement 10.4**

  - [ ]* 17.6 Write property test for dictionary merge
    - **Property 42: Dictionary Merge Correctness**
    - **Validates: Requirement 10.5**

  - [x] 16.7 Write unit tests for import/export
    - Test successful export
    - Test successful import
    - Test version conflict handling
    - Test merge mode
    - _Requirements: 10.1-10.6_

- [x] 17. Implement SkillUsageStatisticsUseCase
  - [x] 17.1 Create SkillUsageStatisticsUseCase class
    - Implement getStatistics() method
    - Track skill usage in JDs and resumes
    - Support date range filtering
    - Sort by frequency
    - Include variation statistics
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 18.2 Write property test for skill usage tracking
    - **Property 43: Skill Usage Tracking - JD Count**
    - **Property 44: Skill Usage Tracking - Resume Count**
    - **Validates: Requirements 11.1, 11.2**

  - [ ]* 18.3 Write property test for statistics sorting
    - **Property 45: Skill Statistics Sorting**
    - **Validates: Requirement 11.3**

  - [ ]* 18.4 Write property test for statistics date range
    - **Property 46: Skill Statistics Date Range**
    - **Property 47: Skill Statistics Filtering**
    - **Validates: Requirements 11.4, 11.5**

  - [ ]* 18.5 Write property test for variation statistics
    - **Property 48: Skill Variation Statistics**
    - **Validates: Requirement 11.6**

  - [x] 17.6 Write unit tests for statistics use case
    - Test statistics calculation
    - Test date range filtering
    - Test sorting
    - _Requirements: 11.1-11.6_

- [x] 18. Implement API controllers
  - [x] 18.1 Create JDSpecController
    - POST /api/jd/create - Create JD specification
    - GET /api/jd/:id - Get JD specification by ID
    - GET /api/jd - Get all JD specifications
    - PUT /api/jd/:id - Update JD specification
    - DELETE /api/jd/:id - Delete JD specification
    - GET /api/jd/correlation - Calculate correlation between two JDs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 18.2 Create SkillDictionaryController
    - GET /api/dictionary/current - Get current dictionary
    - GET /api/dictionary/version/:version - Get specific version
    - GET /api/dictionary/skills - Get all canonical skills
    - POST /api/dictionary/skills - Add canonical skill
    - DELETE /api/dictionary/skills/:name - Remove canonical skill
    - POST /api/dictionary/variations - Add skill variation
    - GET /api/dictionary/variations/:canonical - Get variations for skill
    - POST /api/dictionary/export - Export dictionary
    - POST /api/dictionary/import - Import dictionary
    - _Requirements: 9.7, 9.8, 9.9, 9.10, 9.11_

  - [x] 19.3 Create SkillReviewController
    - GET /api/skills/review-queue - Get review queue items
    - POST /api/skills/review-queue/approve - Approve skill
    - POST /api/skills/review-queue/reject - Reject skill
    - _Requirements: 9.12, 9.13_

  - [x] 19.4 Create ResumeMatchController
    - GET /api/resume/match-rate - Calculate resume match rates for current JD
    - GET /api/resume/:id/match-rate - Get match rate for specific resume
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x] 19.5 Create SkillStatisticsController
    - GET /api/statistics/skills - Get skill usage statistics
    - GET /api/statistics/skills/:name - Get statistics for specific skill
    - _Requirements: 11.1-11.6_

  - [ ]* 18.6 Write integration tests for API endpoints
    - Test all endpoints with valid inputs
    - Test error responses
    - Test authentication/authorization
    - _Requirements: 9.1-9.14_

- [x] 19. Update Resume domain model and repository
  - [x] 19.1 Add jdSpecId field to ResumeMetadata
    - Update ResumeMetadata constructor
    - Add getJDSpecId() method
    - Update toJSON() method
    - _Requirements: 13.1, 13.2_

  - [x] 20.2 Update IResumeRepository interface
    - Add findByJDSpecId() method
    - Update save() to include jdSpecId
    - _Requirements: 13.1, 13.2_

  - [x] 20.3 Update FileSystemResumeRepository implementation
    - Implement jdSpecId storage in metadata
    - Implement findByJDSpecId() method
    - _Requirements: 13.1, 13.2, 13.6_

  - [ ]* 20.4 Write property test for JD-resume association persistence
    - **Property 36: Resume-JD Association**
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 19.5 Write unit tests for updated resume model
    - Test jdSpecId storage
    - Test retrieval by JD spec ID
    - _Requirements: 13.1, 13.2, 13.6_

- [x] 20. Update CreateBidUseCase to associate JD with resume
  - [x] 20.1 Modify CreateBidUseCase to associate JD with resume
    - Store JD spec ID with resume metadata when creating bid
    - _Requirements: 13.1, 13.2_

  - [x] 20.2 Write unit tests for bid-JD-resume association
    - Test JD spec ID storage with resume
    - _Requirements: 13.1, 13.2_

- [x] 21. Create seed dictionary initialization script
  - [x] 21.1 Create seed-dictionary.ts script
    - Define 300-500 initial canonical skills across all layers
    - Populate common skill variations
    - Set initial version to "2024.1"
    - _Requirements: 2.1_

  - [x] 21.2 Add script to package.json
    - Add npm script to run seed dictionary
    - Document usage in README
    - _Requirements: 2.1_

- [x] 22. Update dependency injection container
  - Register all new repositories
  - Register all new use cases
  - Register JDCorrelationCalculator
  - _Requirements: 9.1-9.14_

- [x] 23. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 24. Update frontend to integrate enhanced skill matching
  - [x] 24.1 Create JD specification input UI component
    - Add form to input JD specification data
    - Display JD specification
    - Show unknown skills for review
    - _Requirements: 4.1-4.10_

  - [x] 24.2 Create skill dictionary management UI
    - Display canonical skills by category
    - Add/edit/delete skills interface
    - Manage skill variations
    - Export/import dictionary
    - _Requirements: 2.4, 9.8-9.11, 10.1-10.6_

  - [x] 25.3 Create skill review queue UI
    - Display unknown skills with frequency
    - Approve as canonical or variation
    - Reject skills
    - _Requirements: 5.3-5.6, 9.12, 9.13_

  - [x] 25.4 Update resume selector to show match rates
    - Display match rate percentage for each resume
    - Show layer breakdown on hover/expand
    - Show matching and missing skills per layer
    - Sort resumes by match rate
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 25.5 Create skill usage statistics dashboard
    - Display most common skills
    - Show skill trends over time
    - Filter by date range
    - Show variation usage
    - _Requirements: 11.1-11.6_

  - [x] 24.6 Write component tests for new UI
    - Test JD specification input component
    - Test dictionary management component
    - Test review queue component
    - Test resume selector with match rates
    - Test statistics dashboard
    - _Requirements: 4.1-4.10, 5.3-5.6, 7.4-7.7, 9.8-9.13, 11.1-11.6_

- [x] 25. Add documentation
  - Document API endpoints in OpenAPI/Swagger format
  - Document correlation algorithm with examples
  - Document dictionary management workflows
  - Document skill review process
  - Add inline code documentation
  - _Requirements: All_

- [x] 26. Final checkpoint - End-to-end testing
  - Test complete flow: Create bid → Create JD spec → Calculate match rates → Select resume
  - Test dictionary management workflow
  - Test skill review workflow
  - Test statistics generation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows and external service integration
- The implementation follows clean architecture with clear layer separation
- All domain logic is pure TypeScript with no infrastructure dependencies
- All 51 correctness properties from the design document are implemented as property-based tests
- Comprehensive testing approach ensures high confidence in system correctness
