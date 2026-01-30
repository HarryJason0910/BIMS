# Implementation Plan: Resume Selection from History

## Overview

This implementation plan breaks down the Resume Selection from History feature into incremental coding steps. The approach follows clean architecture principles, starting with pure domain logic, then application use cases, infrastructure implementations, and finally presentation layer components. Each step builds on previous work and includes testing tasks to validate correctness early.

## Tasks

- [x] 1. Set up domain layer foundations
  - [x] 1.1 Extend TechStack class with overlap calculation
    - Add `overlapWith()` method to calculate matching technologies
    - Ensure case-insensitive comparison in `contains()` method
    - _Requirements: 5.1_
  
  - [ ]* 1.2 Write property tests for TechStack overlap
    - **Property 2: Tech Stack Scoring Correctness (case-insensitivity)**
    - **Validates: Requirements 5.1**
  
  - [x] 1.3 Create ResumeMetadata value object
    - Implement immutable class with id, company, role, techStack, filePath, createdAt
    - Add getter methods for all properties
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.4 Write unit tests for ResumeMetadata
    - Test object creation and getter methods
    - Test immutability
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement tech stack matching algorithm
  - [x] 2.1 Create StackMatchCalculator class
    - Implement `calculateScore()` method with scoring rules (100 for exact, 0-99 for partial, 0 for no match)
    - Implement `sortByScore()` method with score and date sorting
    - _Requirements: 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 2.2 Write property tests for scoring algorithm
    - **Property 2: Tech Stack Scoring Correctness**
    - **Validates: Requirements 1.3, 1.4, 5.1, 5.2, 5.4, 5.5**
  
  - [ ]* 2.3 Write property tests for sorting consistency
    - **Property 3: Result Sorting Consistency**
    - **Validates: Requirements 1.5, 5.3**
  
  - [ ]* 2.4 Write unit tests for edge cases
    - Test empty tech stacks
    - Test single-technology stacks
    - Test very long tech stacks
    - _Requirements: 1.3, 1.4_

- [x] 3. Checkpoint - Ensure domain tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create repository interface and infrastructure implementation
  - [x] 4.1 Define IResumeRepository interface
    - Add `getAllResumeMetadata()` method signature
    - Add `getResumeFile(resumeId: string)` method signature
    - Add `fileExists(filePath: string)` method signature
    - _Requirements: 1.1, 4.3_
  
  - [x] 4.2 Implement FileSystemResumeRepository
    - Implement `getAllResumeMetadata()` with directory scanning and parsing
    - Implement `parseDirectoryName()` helper to extract company, role, tech stack
    - Implement `generateId()` helper to create base64 IDs from file paths
    - Implement `getResumeFile()` to read PDF files
    - Implement `fileExists()` to check file existence
    - _Requirements: 1.1, 1.2, 4.3, 4.4_
  
  - [ ]* 4.3 Write unit tests for FileSystemResumeRepository
    - Test directory parsing with valid formats
    - Test handling of malformed directory names
    - Test file existence checking
    - Test resume file retrieval
    - _Requirements: 1.1, 1.2, 4.4_
  
  - [ ]* 4.4 Write property tests for metadata retrieval
    - **Property 1: Metadata Retrieval Completeness**
    - **Validates: Requirements 1.1, 1.2**

- [x] 5. Implement application layer use cases
  - [x] 5.1 Create GetMatchingResumesUseCase
    - Inject IResumeRepository and StackMatchCalculator dependencies
    - Implement `execute()` method to fetch, score, sort, and return top 30 matches
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  
  - [ ]* 5.2 Write property tests for GetMatchingResumesUseCase
    - **Property 6: API Metadata Response Format**
    - **Validates: Requirements 4.2**
  
  - [x] 5.3 Create GetResumeFileUseCase
    - Inject IResumeRepository dependency
    - Implement `execute()` method to retrieve resume file by ID
    - _Requirements: 4.3, 4.4_
  
  - [ ]* 5.4 Write unit tests for GetResumeFileUseCase
    - Test successful file retrieval
    - Test error handling for invalid IDs
    - _Requirements: 4.4, 4.5_
  
  - [x] 5.5 Modify CreateBidWithResumeUseCase
    - Add resume validation logic to check file existence
    - Add logic to handle both uploaded files and selected resumes
    - Throw descriptive errors for missing resume files
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 5.6 Write property tests for bid submission with resume
    - **Property 9: Bid Submission with Resume Reference**
    - **Property 10: Resume Existence Validation**
    - **Property 11: Bid-Resume Association Persistence**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 6. Checkpoint - Ensure application layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create backend API endpoints
  - [x] 7.1 Implement ResumeController
    - Create `getMetadata()` endpoint handler for GET /api/resumes/metadata
    - Create `getFile()` endpoint handler for GET /api/resumes/file/:resumeId
    - Add query parameter parsing for tech stack
    - Add error handling with appropriate status codes (400, 404, 500)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 7.2 Register routes in Express app
    - Add GET /api/resumes/metadata route
    - Add GET /api/resumes/file/:resumeId route
    - Wire up controller with use case dependencies
    - _Requirements: 4.1, 4.3_
  
  - [ ]* 7.3 Write unit tests for ResumeController
    - Test metadata endpoint with valid tech stack
    - Test metadata endpoint with missing tech stack (400 error)
    - Test file endpoint with valid resume ID
    - Test file endpoint with invalid resume ID (404 error)
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ]* 7.4 Write property tests for API error handling
    - **Property 8: API File Retrieval Error Handling**
    - **Validates: Requirements 4.5**

- [x] 8. Create React components for resume selection
  - [x] 8.1 Create ResumeCard component
    - Display company, role, tech stack, and match score
    - Add selection state styling
    - Add click handler for selection
    - _Requirements: 2.3_
  
  - [x] 8.2 Create ResumeSelector component
    - Implement state management for resumes list, loading, and selected ID
    - Add useEffect hook to fetch resumes when tech stack changes
    - Implement debouncing for API calls (500ms delay)
    - Render loading state, empty state, and resume list
    - _Requirements: 2.2, 2.3, 6.1, 6.2, 10.4_
  
  - [ ]* 8.3 Write unit tests for ResumeSelector
    - Test loading state rendering
    - Test empty state rendering
    - Test resume list rendering
    - Test selection handling
    - _Requirements: 2.2, 2.3, 6.1, 6.2_
  
  - [ ]* 8.4 Write property tests for debouncing
    - **Property 15: API Call Debouncing**
    - **Validates: Requirements 10.4**

- [x] 9. Create resume preview functionality
  - [x] 9.1 Create ResumePreview component
    - Add modal or embedded viewer for PDF display
    - Display resume metadata alongside document
    - Add close button to return to selection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 9.2 Add preview button to ResumeCard
    - Add preview button that appears when resume is selected
    - Wire up click handler to fetch and display resume
    - _Requirements: 3.1, 3.2_
  
  - [x] 9.3 Implement resume file caching
    - Add caching logic to avoid redundant fetches
    - Store fetched files in component state or context
    - _Requirements: 10.5_
  
  - [ ]* 9.4 Write unit tests for ResumePreview
    - Test modal rendering
    - Test metadata display
    - Test close functionality
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ]* 9.5 Write property tests for caching
    - **Property 16: Resume Preview Caching**
    - **Validates: Requirements 10.5**

- [x] 10. Modify BidForm component for dual input modes
  - [x] 10.1 Add input mode state and toggle buttons
    - Add state for inputMode ('upload' | 'select')
    - Add toggle buttons for switching between modes
    - Disable resume selection when tech stack is empty
    - _Requirements: 2.1, 2.6_
  
  - [x] 10.2 Implement mutual exclusivity logic
    - When resume is selected, disable file upload
    - When file is uploaded, disable resume selection
    - Clear opposite input when switching modes
    - _Requirements: 2.4, 2.5_
  
  - [x] 10.3 Add conditional rendering for input modes
    - Render FileUpload component when mode is 'upload'
    - Render ResumeSelector component when mode is 'select'
    - Update submit button to handle both resume ID and uploaded file
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 10.4 Write unit tests for BidForm
    - Test mode switching
    - Test mutual exclusivity
    - Test submit button state
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [ ]* 10.5 Write property tests for mutual exclusivity
    - **Property 4: Mutual Exclusivity of Input Modes**
    - **Validates: Requirements 2.4, 2.5**

- [x] 11. Implement backward compatibility and error handling
  - [x] 11.1 Ensure file upload flow remains unchanged
    - Verify existing file upload logic still works
    - Verify file naming convention is preserved
    - _Requirements: 9.1, 9.2_
  
  - [x] 11.2 Add graceful degradation for API failures
    - Wrap API calls in try-catch blocks
    - Fall back to upload-only mode on errors
    - Display user-friendly error messages
    - _Requirements: 9.5_
  
  - [ ]* 11.3 Write property tests for backward compatibility
    - **Property 12: Backward Compatibility for File Upload**
    - **Property 13: Resume Display Consistency**
    - **Validates: Requirements 9.1, 9.2, 9.4**
  
  - [ ]* 11.4 Write property tests for graceful degradation
    - **Property 14: Graceful Degradation on API Failure**
    - **Validates: Requirements 9.5**

- [x] 12. Add display completeness validation
  - [ ]* 12.1 Write property tests for resume display
    - **Property 5: Resume Display Completeness**
    - **Validates: Requirements 2.3**
  
  - [ ]* 12.2 Write property tests for API file retrieval
    - **Property 7: API File Retrieval Success**
    - **Validates: Requirements 4.4**

- [ ] 13. Final checkpoint - Integration testing
  - [x] 13.1 Test end-to-end flow with resume selection
    - Create test bid with selected resume
    - Verify resume is associated with bid
    - Verify no duplicate files are created
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 13.2 Test end-to-end flow with file upload
    - Create test bid with uploaded file
    - Verify file is saved with correct naming
    - Verify backward compatibility
    - _Requirements: 9.1, 9.2_
  
  - [x] 13.3 Ensure all tests pass
    - Run full test suite (unit + property tests)
    - Verify all 16 correctness properties are validated
    - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All property tests must run with minimum 100 iterations
- Each property test must include a comment tag: `// Feature: resume-selection-from-history, Property {number}: {property_text}`
