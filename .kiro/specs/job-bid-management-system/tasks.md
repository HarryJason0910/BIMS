# Implementation Plan: Job Bid and Interview Management System

## Overview

This implementation plan breaks down the job bid and interview management system into discrete coding tasks following clean architecture principles. The implementation will proceed layer by layer, starting with the domain layer (pure business logic), then application layer (use cases), infrastructure layer (MongoDB, REST API, Email integration), and finally the presentation layer (Tauri + React frontend). Each task builds on previous tasks, with property-based tests integrated throughout to validate correctness properties from the design document.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create monorepo structure with backend and frontend packages
  - Initialize TypeScript configuration for backend (Node 22, strict mode)
  - Initialize TypeScript configuration for frontend (React, Tauri)
  - Install dependencies: Express, MongoDB driver, Microsoft Graph SDK, fast-check, Jest
  - Install frontend dependencies: React, React Query, Tauri
  - Set up ESLint and Prettier for code quality
  - _Requirements: 17.1, 17.2, 17.3, 18.1, 18.2_


- [x] 2. Implement Domain Layer - Bid Aggregate
  - [x] 2.1 Create Bid aggregate with all fields and enums
    - Define BidStatus enum (NEW, SUBMITTED, REJECTED, INTERVIEW_STAGE, CLOSED)
    - Define ResumeCheckerType enum (ATS, RECRUITER)
    - Implement Bid class with all fields from design
    - Implement static factory method create()
    - Implement behavior methods: markAsSubmitted(), markAsRejected(), markInterviewStarted(), markAsClosed()
    - Implement helper methods: attachWarning(), setResumeChecker(), canRebid(), isInterviewStarted()
    - Enforce invariants: interviewWinning cannot be unset, prevent invalid state transitions
    - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2_
  
  - [x]* 2.2 Write property test for Bid creation date initialization
    - **Property 1: Bid Creation Date Initialization**
    - **Validates: Requirements 1.1**
  
  - [x]* 2.3 Write property test for Bid required fields validation
    - **Property 2: Bid Required Fields Validation**
    - **Validates: Requirements 1.2**
  
  - [x]* 2.4 Write property test for Bid default field initialization
    - **Property 3: Bid Default Field Initialization**
    - **Validates: Requirements 1.4**
  
  - [x]* 2.5 Write property test for rebidding eligibility
    - **Property 11: Rebidding Eligibility**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x]* 2.6 Write unit tests for Bid state transitions
    - Test valid transitions (NEW → SUBMITTED → REJECTED)
    - Test valid transitions (NEW → SUBMITTED → INTERVIEW_STAGE → CLOSED)
    - Test invalid transitions (INTERVIEW_STAGE → REJECTED should fail)
    - _Requirements: 17.5_


- [x] 3. Implement Domain Layer - Interview Aggregate
  - [x] 3.1 Create Interview aggregate with all fields and enums
    - Define InterviewBase enum (BID, LINKEDIN_CHAT)
    - Define InterviewStatus enum (SCHEDULED, COMPLETED_SUCCESS, COMPLETED_FAILURE, CANCELLED)
    - Implement Interview class with all fields from design
    - Implement static factory method create()
    - Implement behavior methods: markAsCompleted(), markAsCancelled()
    - Implement helper methods: isFailed(), getFailureInfo()
    - Enforce invariants: prevent invalid state transitions, require bidId when base is BID
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x]* 3.2 Write property test for Interview creation date initialization
    - **Property 13: Interview Creation Date Initialization**
    - **Validates: Requirements 7.1**
  
  - [x]* 3.3 Write property test for Interview base validation
    - **Property 14: Interview Base Validation**
    - **Validates: Requirements 7.2**
  
  - [x]* 3.4 Write property test for Interview field population from Bid
    - **Property 15: Interview Field Population from Bid**
    - **Validates: Requirements 7.3**
  
  - [x]* 3.5 Write property test for Interview LinkedIn base required fields
    - **Property 16: Interview LinkedIn Base Required Fields**
    - **Validates: Requirements 7.4**
  
  - [x]* 3.6 Write unit tests for Interview state transitions
    - Test valid transitions (SCHEDULED → COMPLETED_SUCCESS)
    - Test valid transitions (SCHEDULED → COMPLETED_FAILURE)
    - Test invalid transitions (COMPLETED_SUCCESS → SCHEDULED should fail)
    - _Requirements: 17.5_


- [x] 4. Implement Domain Layer - Duplication Detection Policy
  - [x] 4.1 Create DuplicationDetectionPolicy class
    - Define DuplicationWarning interface with type, existingBidId, and message
    - Implement checkDuplication() method
    - Implement link matching logic (exact match)
    - Implement company+role matching logic (case-insensitive)
    - Return all warnings found (can have multiple)
    - _Requirements: 2.1, 2.2_
  
  - [x]* 4.2 Write property test for link-based duplication detection
    - **Property 4: Link-Based Duplication Detection**
    - **Validates: Requirements 2.1**
  
  - [x]* 4.3 Write property test for company-role duplication detection
    - **Property 5: Company-Role Duplication Detection**
    - **Validates: Requirements 2.2**
  
  - [x]* 4.4 Write property test for duplication warnings non-blocking
    - **Property 6: Duplication Warnings Non-Blocking**
    - **Validates: Requirements 2.3, 2.4**


- [x] 5. Implement Domain Layer - Interview Eligibility Policy
  - [x] 5.1 Create InterviewEligibilityPolicy class
    - Define EligibilityResult interface with allowed and reason fields
    - Implement checkEligibility() method
    - Implement logic: no previous failures → allowed
    - Implement logic: new recruiter → allowed with explanation
    - Implement logic: all new attendees → allowed with explanation
    - Implement logic: same recruiter AND overlapping attendees → forbidden with explanation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x]* 5.2 Write property test for interview eligibility with new recruiter or attendees
    - **Property 17: Interview Eligibility with New Recruiter or Attendees**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [x]* 5.3 Write unit tests for eligibility edge cases
    - Test no previous failures (should allow)
    - Test same recruiter but all new attendees (should allow)
    - Test new recruiter but overlapping attendees (should allow)
    - Test same recruiter and one overlapping attendee (should forbid)
    - _Requirements: 8.3, 8.4_


- [x] 6. Implement Domain Layer - Company History
  - [x] 6.1 Create CompanyHistory class
    - Define CompanyRoleHistory and FailureRecord interfaces
    - Implement recordFailure() method with company:role key normalization
    - Implement getHistory() method
    - Implement getAllRecruiters() method
    - Implement getAllAttendees() method
    - Implement hasFailures() method
    - Implement getWarningMessage() method
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x]* 6.2 Write property test for complete failure recording
    - **Property 18: Complete Failure Recording in Company History**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [x]* 6.3 Write property test for company history query
    - **Property 19: Company History Query by Company and Role**
    - **Validates: Requirements 9.4**
  
  - [x]* 6.4 Write unit tests for company history operations
    - Test recording multiple failures for same company+role
    - Test recording failures for different companies
    - Test case-insensitive company+role matching
    - Test warning message generation
    - _Requirements: 4.1, 4.2_


- [x] 7. Implement Domain Layer - Resume Checker Service
  - [x] 7.1 Create ResumeCheckerService class
    - Define ResumeCheckerInference interface with type, confidence, and reasoning
    - Implement inferScreeningType() method
    - Implement timing-based inference logic (1-3 days → ATS, 4+ days → RECRUITER)
    - Implement confidence scoring (high: 0.8-1.0, medium: 0.5-0.79)
    - Implement pattern analysis across multiple bids to same company
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x]* 7.2 Write property test for resume checker timing-based inference
    - **Property 12: Resume Checker Timing-Based Inference**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x]* 7.3 Write unit tests for resume checker edge cases
    - Test rejection within 1 day (should infer ATS with high confidence)
    - Test rejection after 10 days (should infer RECRUITER with high confidence)
    - Test rejection at 3-4 day boundary (should handle gracefully)
    - _Requirements: 6.3, 6.4_


- [x] 8. Implement Domain Layer - Email Classifier
  - [x] 8.1 Create EmailClassifier class
    - Define EmailEvent and EmailClassification interfaces
    - Implement classify() method with keyword matching
    - Implement isRejection() with rejection keywords
    - Implement isInterviewScheduled() with interview keywords
    - Implement isInterviewCompleted() with completion keywords
    - Implement extractCompany() from sender domain or body
    - Implement extractRole() from subject or body
    - _Requirements: 10.3_
  
  - [x]* 8.2 Write property test for email information extraction
    - **Property 22: Email Information Extraction**
    - **Validates: Requirements 10.3**
  
  - [x]* 8.3 Write unit tests for email classification
    - Test rejection email classification
    - Test interview scheduling email classification
    - Test interview completion email classification
    - Test unknown email classification
    - Test company extraction from various formats
    - Test role extraction from various formats
    - _Requirements: 3.1, 3.2, 10.1, 10.2_


- [x] 9. Checkpoint - Ensure all domain layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Infrastructure Layer - Repository Interfaces
  - [x] 10.1 Define repository interfaces
    - Create IBidRepository interface with CRUD operations
    - Create IInterviewRepository interface with CRUD operations
    - Create ICompanyHistoryRepository interface with save and query operations
    - Create IProcessedEmailRepository interface with mark and check operations
    - Place interfaces in application layer (dependency inversion)
    - _Requirements: 15.1_


- [x] 11. Implement Infrastructure Layer - MongoDB Repositories
  - [x] 11.1 Create MongoDB connection and configuration
    - Set up MongoDB client with connection string
    - Create database and collection initialization
    - Implement connection pooling and error handling
    - _Requirements: 15.1_
  
  - [x] 11.2 Implement MongoDBBidRepository
    - Define BidDocument interface matching MongoDB schema
    - Implement toDocument() method (domain → document)
    - Implement toDomain() method (document → domain)
    - Implement all IBidRepository methods (save, findById, findAll, etc.)
    - No business logic, pure data mapping
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 11.3 Implement MongoDBInterviewRepository
    - Define InterviewDocument interface matching MongoDB schema
    - Implement toDocument() method (domain → document)
    - Implement toDomain() method (document → domain)
    - Implement all IInterviewRepository methods
    - No business logic, pure data mapping
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 11.4 Implement MongoDBCompanyHistoryRepository
    - Define CompanyHistoryDocument interface matching MongoDB schema
    - Implement toDocument() method (domain → document)
    - Implement toDomain() method (document → domain)
    - Implement all ICompanyHistoryRepository methods
    - No business logic, pure data mapping
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 11.5 Implement MongoDBProcessedEmailRepository
    - Define ProcessedEmailDocument interface
    - Implement markAsProcessed() method
    - Implement isProcessed() method
    - Simple key-value storage
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 11.6 Write property test for MongoDB round-trip serialization
    - **Property 28: MongoDB Round-Trip Serialization**
    - **Validates: Requirements 15.2, 15.3**
  
  - [ ]* 11.7 Write integration tests for MongoDB repositories
    - Test save and findById for Bid
    - Test save and findById for Interview
    - Test findByCompanyAndRole for both
    - Test company history save and query
    - Use test database
    - _Requirements: 15.1_


- [x] 12. Implement Application Layer - CreateBid Use Case
  - [x] 12.1 Create CreateBidUseCase class
    - Define CreateBidRequest and CreateBidResponse interfaces
    - Implement execute() method
    - Validate required fields
    - Fetch existing bids from repository
    - Run duplication detection policy
    - Check company history for warnings
    - Create Bid aggregate
    - Attach company warning to bidDetail if exists
    - Save bid to repository
    - Return bid ID and warnings
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_
  
  - [x]* 12.2 Write unit tests for CreateBid use case
    - Test successful bid creation without warnings
    - Test bid creation with duplication warnings
    - Test bid creation with company history warnings
    - Test validation error handling
    - Mock repositories and policies
    - _Requirements: 1.1, 1.2, 2.3, 2.4, 4.3_


- [x] 13. Implement Application Layer - RebidWithNewResume Use Case
  - [x] 13.1 Create RebidWithNewResumeUseCase class
    - Define RebidRequest and RebidResponse interfaces
    - Implement execute() method
    - Fetch original bid from repository
    - Check if rebidding is allowed (canRebid())
    - If not allowed, return error with reason
    - Create new bid with same company, role, link but new resume
    - Link new bid to original bid (store originalBidId)
    - Run duplication detection (will show warnings)
    - Check company history for warnings
    - Save new bid to repository
    - Return new bid ID
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x]* 13.2 Write unit tests for RebidWithNewResume use case
    - Test successful rebid after rejection without interview
    - Test rebid rejection when interviewWinning is true
    - Test rebid with updated job description
    - Test error messages
    - Mock repositories
    - _Requirements: 5.1, 5.2, 5.3_


- [x] 14. Implement Application Layer - ScheduleInterview Use Case
  - [x] 14.1 Create ScheduleInterviewUseCase class
    - Define ScheduleInterviewRequest and ScheduleInterviewResponse interfaces
    - Implement execute() method
    - Validate required fields
    - If base is BID, fetch bid and populate fields from it
    - Check interview eligibility using policy and company history
    - If not eligible, throw error with explanation
    - Create Interview aggregate
    - Save interview to repository
    - If base is BID and interview type is "HR", update bid (interviewWinning = true, status = INTERVIEW_STAGE)
    - Return interview ID and eligibility result
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x]* 14.2 Write unit tests for ScheduleInterview use case
    - Test successful interview scheduling from bid
    - Test successful interview scheduling from LinkedIn chat
    - Test interview eligibility check (allowed)
    - Test interview eligibility check (forbidden)
    - Test bid update when HR interview is scheduled
    - Test validation error handling
    - Mock repositories and policies
    - _Requirements: 7.3, 7.4, 8.3, 8.4, 8.5_


- [x] 15. Implement Application Layer - CompleteInterview Use Case
  - [x] 15.1 Create CompleteInterviewUseCase class
    - Define CompleteInterviewRequest and CompleteInterviewResponse interfaces
    - Implement execute() method
    - Fetch interview from repository
    - Mark interview as completed with success/failure
    - Update detail if provided
    - Save interview to repository
    - If interview failed, record failure in company history with recruiter and attendees
    - If interview failed, save company history to repository
    - If interview succeeded and has bidId, update bid status to CLOSED
    - Return result
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x]* 15.2 Write unit tests for CompleteInterview use case
    - Test successful interview completion
    - Test failed interview completion with company history update
    - Test bid status update on interview success
    - Test error handling for non-existent interview
    - Mock repositories
    - _Requirements: 9.1, 9.2, 9.3_


- [x] 16. Implement Application Layer - ProcessEmail Use Case
  - [x] 16.1 Create ProcessEmailUseCase class
    - Define EmailEvent and ProcessEmailResponse interfaces
    - Implement execute() method
    - Check if email already processed (idempotency)
    - If processed, return early
    - Classify email using EmailClassifier
    - Handle BID_REJECTION: find matching bid, mark as rejected, infer resume checker type
    - Handle INTERVIEW_SCHEDULED: find matching bid, set interviewWinning to true, create/update interview
    - Handle INTERVIEW_COMPLETED: find matching interview, mark as completed
    - Handle UNKNOWN: log and skip
    - Save updated entities to repositories
    - Mark email as processed
    - Return result
    - _Requirements: 3.1, 3.2, 3.4, 10.1, 10.2, 10.3, 12.1, 12.2, 12.3_
  
  - [ ]* 16.2 Write property test for email rejection updates bid status
    - **Property 7: Email Rejection Updates Bid Status**
    - **Validates: Requirements 3.1**
  
  - [ ]* 16.3 Write property test for email interview scheduled sets interview winning
    - **Property 8: Email Interview Scheduled Sets Interview Winning**
    - **Validates: Requirements 3.2**
  
  - [ ]* 16.4 Write property test for email matching to bids
    - **Property 9: Email Matching to Bids**
    - **Validates: Requirements 3.4**
  
  - [ ]* 16.5 Write property test for email interview scheduling creates or updates interview
    - **Property 20: Email Interview Scheduling Creates or Updates Interview**
    - **Validates: Requirements 10.1**
  
  - [ ]* 16.6 Write property test for email interview completion updates status
    - **Property 21: Email Interview Completion Updates Status**
    - **Validates: Requirements 10.2**
  
  - [ ]* 16.7 Write property test for email processing idempotency
    - **Property 23: Email Processing Idempotency**
    - **Validates: Requirements 12.1, 12.2, 12.3**
  
  - [x]* 16.8 Write unit tests for ProcessEmail use case
    - Test rejection email processing
    - Test interview scheduling email processing
    - Test interview completion email processing
    - Test unknown email handling
    - Test idempotency with same email ID
    - Mock repositories and classifier
    - _Requirements: 3.1, 3.2, 10.1, 10.2, 12.1, 12.2_


- [x] 17. Checkpoint - Ensure all application layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement Infrastructure Layer - REST API Controllers
  - [x] 18.1 Create Express server setup
    - Initialize Express app
    - Set up middleware (body-parser, CORS, error handling)
    - Configure routes
    - Set up dependency injection for use cases
    - _Requirements: 16.1, 16.2_
  
  - [x] 18.2 Implement BidController
    - POST /api/bids → CreateBidUseCase
    - GET /api/bids → BidRepository.findAll() with filters
    - GET /api/bids/:id → BidRepository.findById()
    - POST /api/bids/:id/rebid → RebidWithNewResumeUseCase
    - PUT /api/bids/:id → BidRepository.update()
    - DELETE /api/bids/:id → BidRepository.delete()
    - Validate input data
    - Return appropriate HTTP status codes
    - No business logic in controller
    - _Requirements: 16.1, 16.2, 16.4_
  
  - [x] 18.3 Implement InterviewController
    - POST /api/interviews → ScheduleInterviewUseCase
    - GET /api/interviews → InterviewRepository.findAll() with filters
    - GET /api/interviews/:id → InterviewRepository.findById()
    - POST /api/interviews/:id/complete → CompleteInterviewUseCase
    - PUT /api/interviews/:id → InterviewRepository.update()
    - DELETE /api/interviews/:id → InterviewRepository.delete()
    - Validate input data
    - Return appropriate HTTP status codes
    - No business logic in controller
    - _Requirements: 16.1, 16.2, 16.4_
  
  - [x] 18.4 Implement CompanyHistoryController
    - GET /api/company-history → CompanyHistoryRepository.findByCompanyAndRole()
    - GET /api/company-history/all → CompanyHistoryRepository.findAll()
    - Validate query parameters
    - Return appropriate HTTP status codes
    - _Requirements: 16.3_
  
  - [ ]* 18.5 Write property test for REST API input validation
    - **Property 29: REST API Input Validation**
    - **Validates: Requirements 16.2**
  
  - [ ]* 18.6 Write integration tests for REST API endpoints
    - Test POST /api/bids with valid and invalid data
    - Test GET /api/bids with filters
    - Test POST /api/interviews with valid and invalid data
    - Test GET /api/interviews with filters
    - Test error responses (400, 404, 409, 500)
    - Use test database
    - _Requirements: 16.1, 16.2, 16.4_


- [x] 19. Implement Infrastructure Layer - Microsoft Graph API Email Adapter
  - [x] 19.1 Create EmailAdapter class
    - Set up Microsoft Graph Client with OAuth configuration
    - Implement authenticate() method with client credentials flow
    - Implement fetchNewEmails() method to retrieve emails from inbox
    - Implement email filtering by keywords (configurable)
    - Convert Graph API email format to EmailEvent
    - Implement error handling for API rate limits
    - Implement retry logic with exponential backoff
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [x] 19.2 Implement email polling mechanism
    - Implement startPolling() method with configurable interval
    - Implement stopPolling() method
    - Pass each email to ProcessEmailUseCase
    - Handle errors gracefully without stopping polling
    - Log email processing results
    - _Requirements: 11.3_
  
  - [ ]* 19.3 Write integration tests for EmailAdapter
    - Test authentication with Microsoft Graph API (use test credentials)
    - Test fetching emails from inbox
    - Test email filtering by keywords
    - Test error handling for rate limits
    - Test retry logic
    - Mock Microsoft Graph API where appropriate
    - _Requirements: 11.1, 11.2, 11.3, 11.4_


- [x] 20. Implement Filtering and Sorting Logic
  - [x] 20.1 Implement bid filtering logic
    - Add filter support to BidRepository.findAll()
    - Support filtering by company (case-insensitive)
    - Support filtering by role (case-insensitive)
    - Support filtering by status
    - Support filtering by date range
    - Combine multiple filters with AND logic
    - _Requirements: 13.4_
  
  - [x] 20.2 Implement bid sorting logic
    - Add sort support to BidRepository.findAll()
    - Support sorting by any column (date, company, role, status)
    - Support ascending and descending order
    - _Requirements: 13.5_
  
  - [x] 20.3 Implement interview filtering logic
    - Add filter support to InterviewRepository.findAll()
    - Support filtering by company (case-insensitive)
    - Support filtering by role (case-insensitive)
    - Support filtering by status
    - Support filtering by date range
    - Combine multiple filters with AND logic
    - _Requirements: 14.4_
  
  - [x] 20.4 Implement interview sorting logic
    - Add sort support to InterviewRepository.findAll()
    - Support sorting by any column (date, company, role, status)
    - Support ascending and descending order
    - _Requirements: 14.5_
  
  - [ ]* 20.5 Write property test for bid filtering
    - **Property 24: Bid Filtering by Criteria**
    - **Validates: Requirements 13.4**
  
  - [ ]* 20.6 Write property test for bid sorting
    - **Property 25: Bid Sorting by Column**
    - **Validates: Requirements 13.5**
  
  - [ ]* 20.7 Write property test for interview filtering
    - **Property 26: Interview Filtering by Criteria**
    - **Validates: Requirements 14.4**
  
  - [ ]* 20.8 Write property test for interview sorting
    - **Property 27: Interview Sorting by Column**
    - **Validates: Requirements 14.5**


- [x] 21. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Implement Frontend - Tauri Setup and Configuration
  - [x] 22.1 Initialize Tauri project
    - Set up Tauri with React and TypeScript
    - Configure Tauri permissions and capabilities
    - Set up build configuration
    - Configure window settings (size, title, etc.)
    - _Requirements: 18.1_
  
  - [x] 22.2 Set up React Query
    - Install and configure React Query
    - Set up QueryClient with default options
    - Configure background refetch settings
    - Set up error handling
    - _Requirements: 18.2_
  
  - [x] 22.3 Create API client
    - Create axios instance with base URL
    - Implement API methods for all endpoints
    - Implement error handling and retry logic
    - Define TypeScript DTOs matching backend contracts
    - _Requirements: 18.3_


- [x] 23. Implement Frontend - Bid Dashboard
  - [x] 23.1 Create Bid list component
    - Implement bid list table with columns (date, company, client, role, status, interviewWinning)
    - Use React Query to fetch bids from API
    - Display loading and error states
    - Show resumeChecker inference results
    - Highlight bidDetail warnings prominently
    - _Requirements: 13.1, 13.6, 13.7_
  
  - [x] 23.2 Create Bid creation form
    - Implement form with all required fields (link, company, client, role, mainStacks, jobDescription, resume)
    - Validate required fields on client side
    - Display duplication warnings from API response
    - Display company history warnings from API response
    - Use React Query mutation to create bid
    - Handle success and error states
    - _Requirements: 13.2, 13.3_
  
  - [x] 23.3 Implement bid filtering
    - Add filter controls for company, role, status, date range
    - Update API query parameters based on filters
    - Use React Query with query keys for caching
    - _Requirements: 13.4_
  
  - [x] 23.4 Implement bid sorting
    - Add sort controls for each column
    - Support ascending and descending order
    - Update API query parameters based on sort
    - _Requirements: 13.5_
  
  - [x] 23.5 Implement rebid functionality
    - Add rebid button for eligible bids
    - Show rebid form with pre-filled data
    - Allow updating resume and job description
    - Display error if rebidding not allowed
    - _Requirements: 5.1, 5.2, 5.3_


- [ ] 24. Implement Frontend - Interview Dashboard
  - [x] 24.1 Create Interview list component
    - Implement interview list table with columns (date, company, client, role, interviewType, recruiter, status)
    - Use React Query to fetch interviews from API
    - Display loading and error states
    - Show interview history per company and role
    - _Requirements: 14.1, 14.6_
  
  - [x] 24.2 Create Interview creation form
    - Implement form with base selection (Bid or LinkedIn chat)
    - If base is Bid, show bid selector and auto-populate fields
    - If base is LinkedIn chat, show manual input fields
    - Add fields for recruiter, attendees, interviewType, detail
    - Display eligibility validation results from API
    - Use React Query mutation to create interview
    - Handle success and error states
    - _Requirements: 14.2, 14.3_
  
  - [x] 24.3 Implement interview filtering
    - Add filter controls for company, role, status, date range
    - Update API query parameters based on filters
    - Use React Query with query keys for caching
    - _Requirements: 14.4_
  
  - [x] 24.4 Implement interview sorting
    - Add sort controls for each column
    - Support ascending and descending order
    - Update API query parameters based on sort
    - _Requirements: 14.5_
  
  - [x] 24.5 Implement interview completion
    - Add complete button for scheduled interviews
    - Show completion form with success/failure selection
    - Allow adding completion details
    - Use React Query mutation to complete interview
    - _Requirements: 14.7_


- [x] 25. Implement Frontend - Navigation and Layout
  - [x] 25.1 Create main layout component
    - Implement navigation between Bid Dashboard and Interview Dashboard
    - Add header with application title
    - Add sidebar or tabs for dashboard switching
    - Implement responsive layout
    - _Requirements: 18.4_
  
  - [x] 25.2 Create routing
    - Set up React Router
    - Define routes for Bid Dashboard and Interview Dashboard
    - Implement navigation guards if needed
    - _Requirements: 18.4_
  
  - [x] 25.3 Add styling and UI polish
    - Apply consistent styling across components
    - Add loading spinners and error messages
    - Implement toast notifications for success/error
    - Ensure accessibility (ARIA labels, keyboard navigation)
    - _Requirements: 18.4_


- [-] 26. Integration and Wiring
  - [x] 26.1 Wire backend components together
    - Set up dependency injection container
    - Wire repositories to use cases
    - Wire use cases to controllers
    - Wire EmailAdapter to ProcessEmailUseCase
    - Configure MongoDB connection
    - Configure Microsoft Graph API credentials
    - _Requirements: 16.3_
  
  - [x] 26.2 Configure environment variables
    - Set up .env files for backend (MongoDB URI, Graph API credentials)
    - Set up .env files for frontend (API base URL)
    - Document required environment variables
    - _Requirements: 11.1_
  
  - [x] 26.3 Start email polling
    - Initialize EmailAdapter on backend startup
    - Configure polling interval (e.g., 5 minutes)
    - Start background polling
    - Log polling status
    - _Requirements: 11.3_
  
  - [ ]* 26.4 Write end-to-end tests
    - Test complete bid creation flow
    - Test bid rejection via email processing
    - Test rebidding after rejection
    - Test interview scheduling from bid
    - Test interview eligibility validation
    - Test interview completion and company history update
    - Use test database and mock email service
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_


- [x] 27. Final checkpoint - Ensure all tests pass and system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate infrastructure layer components
- End-to-end tests validate complete workflows
- All property tests must include comment tags referencing design properties
- Domain layer has no dependencies on infrastructure
- Application layer depends on domain layer
- Infrastructure layer implements application layer interfaces
- Frontend communicates with backend via REST API only
