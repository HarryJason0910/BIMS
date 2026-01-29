# Requirements Document

## Introduction

The Resume Selection from History feature enables users to reuse previously saved resumes when bidding on jobs, rather than uploading new files each time. The system already stores resumes organized by company, role, and tech stack in the backend uploads folder. This feature will allow users to search and select from hundreds of saved resumes based on tech stack matching, improving efficiency and ensuring the most relevant resume is used for each application.

## Glossary

- **Bid**: A job application tracked in the system
- **Resume**: A PDF document tailored to a specific job application
- **Tech_Stack**: A collection of technologies, frameworks, and skills required for a job
- **Resume_Metadata**: Information about a saved resume including company, role, tech stack, and file path
- **Stack_Match_Score**: A numerical value (0-100) indicating how well a resume's tech stack matches the target job's tech stack
- **BidForm**: The React component where users create new job bids
- **Resume_Repository**: Infrastructure component responsible for retrieving and managing resume files
- **Upload_Directory**: The backend folder structure: packages/backend/uploads/{company}_{role}_{stack}/resume.pdf

## Requirements

### Requirement 1: Resume Metadata Retrieval

**User Story:** As a user, I want to see a list of my previously saved resumes that match the job's tech stack, so that I can reuse relevant resumes instead of uploading new ones.

#### Acceptance Criteria

1. WHEN a user provides a tech stack for a new bid, THE Resume_Repository SHALL retrieve all resume metadata from the Upload_Directory
2. WHEN retrieving resume metadata, THE Resume_Repository SHALL parse the directory structure to extract company, role, and tech stack information
3. WHEN resume metadata is retrieved, THE System SHALL calculate a Stack_Match_Score for each resume based on the target tech stack
4. WHEN calculating Stack_Match_Score, THE System SHALL assign 100 for exact matches, 50-99 for partial matches based on overlap percentage, and 0 for no matches
5. WHEN returning resume metadata, THE System SHALL sort results by Stack_Match_Score in descending order

### Requirement 2: Resume Selection Interface

**User Story:** As a user, I want to choose between uploading a new resume or selecting from my saved resumes, so that I have flexibility in how I submit my application.

#### Acceptance Criteria

1. WHEN the BidForm loads, THE System SHALL display both a file upload option and a resume selection option
2. WHEN a user clicks the resume selection option, THE System SHALL fetch and display available resumes filtered by the entered tech stack
3. WHEN displaying saved resumes, THE System SHALL show company name, role, tech stack, and Stack_Match_Score for each resume
4. WHEN a user selects a saved resume, THE System SHALL disable the file upload option
5. WHEN a user uploads a new file, THE System SHALL disable the resume selection option
6. WHEN no tech stack is entered, THE System SHALL disable the resume selection option and display a message prompting tech stack entry

### Requirement 3: Resume Preview

**User Story:** As a user, I want to preview a selected resume before submitting my bid, so that I can verify it's the correct document.

#### Acceptance Criteria

1. WHEN a user selects a saved resume from the list, THE System SHALL display a preview button
2. WHEN a user clicks the preview button, THE System SHALL fetch the resume file from the backend
3. WHEN the resume file is fetched, THE System SHALL display it in a modal or embedded viewer
4. WHEN displaying the preview, THE System SHALL show the resume metadata (company, role, tech stack) alongside the document
5. WHEN the preview is open, THE System SHALL allow the user to close it and return to the selection interface

### Requirement 4: Resume File Retrieval

**User Story:** As a developer, I want a backend API endpoint to retrieve resume files, so that the frontend can display and submit selected resumes.

#### Acceptance Criteria

1. THE System SHALL provide an API endpoint at GET /api/resumes/metadata that accepts tech stack as a query parameter
2. WHEN the metadata endpoint is called, THE System SHALL return a JSON array of resume metadata objects sorted by Stack_Match_Score
3. THE System SHALL provide an API endpoint at GET /api/resumes/file/:resumeId that retrieves a specific resume file
4. WHEN the file endpoint is called with a valid resumeId, THE System SHALL return the PDF file with appropriate content-type headers
5. IF the file endpoint is called with an invalid resumeId, THEN THE System SHALL return a 404 error with a descriptive message

### Requirement 5: Tech Stack Matching Logic

**User Story:** As a user, I want the system to intelligently match resumes to job requirements, so that I see the most relevant resumes first.

#### Acceptance Criteria

1. WHEN comparing tech stacks, THE System SHALL perform case-insensitive matching
2. WHEN calculating partial matches, THE System SHALL compute the percentage of target stack technologies present in the resume stack
3. WHEN multiple resumes have the same Stack_Match_Score, THE System SHALL sort them by most recent creation date
4. WHEN a resume stack contains all target technologies plus additional ones, THE System SHALL assign a score of 100
5. WHEN a resume stack contains a subset of target technologies, THE System SHALL assign a score proportional to the overlap percentage

### Requirement 6: Empty State Handling

**User Story:** As a user, I want clear feedback when no matching resumes are found, so that I know to upload a new resume.

#### Acceptance Criteria

1. WHEN no resumes match the entered tech stack, THE System SHALL display a message indicating no matches were found
2. WHEN the Upload_Directory is empty, THE System SHALL display a message indicating no saved resumes exist
3. WHEN no matching resumes are found, THE System SHALL keep the file upload option enabled and prominent
4. WHEN displaying empty state messages, THE System SHALL provide actionable guidance (e.g., "Upload a new resume" or "Try a different tech stack")

### Requirement 7: Bid Submission with Selected Resume

**User Story:** As a user, I want to submit a bid using a selected resume, so that I can complete my application without re-uploading files.

#### Acceptance Criteria

1. WHEN a user submits a bid with a selected resume, THE System SHALL include the resume file path in the bid data
2. WHEN processing a bid with a selected resume, THE System SHALL copy or reference the existing resume file rather than creating a duplicate
3. WHEN a bid is submitted with a selected resume, THE System SHALL validate that the resume file still exists in the Upload_Directory
4. IF the selected resume file no longer exists, THEN THE System SHALL return an error and prevent bid submission
5. WHEN a bid is successfully submitted with a selected resume, THE System SHALL store the association between the bid and the resume file path

### Requirement 8: Domain Layer Purity

**User Story:** As a developer, I want the domain logic to remain pure and infrastructure-independent, so that the system maintains clean architecture principles.

#### Acceptance Criteria

1. WHEN implementing resume matching logic, THE Domain_Layer SHALL contain pure functions without file system dependencies
2. WHEN calculating Stack_Match_Score, THE Domain_Layer SHALL operate on in-memory data structures only
3. WHEN the Infrastructure_Layer retrieves resume files, THE Application_Layer SHALL orchestrate the interaction without domain objects depending on infrastructure
4. WHEN domain objects reference resumes, THE Domain_Layer SHALL use value objects or identifiers rather than file paths
5. WHEN testing domain logic, THE Tests SHALL not require file system access or infrastructure setup

### Requirement 9: Backward Compatibility

**User Story:** As a user, I want the existing file upload functionality to continue working unchanged, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN a user chooses to upload a new resume, THE System SHALL process it exactly as before this feature was added
2. WHEN a bid is submitted with an uploaded file, THE System SHALL save it to the Upload_Directory using the existing naming convention
3. WHEN the BidForm is used without selecting a saved resume, THE System SHALL behave identically to the previous version
4. WHEN existing bids are viewed, THE System SHALL display resume information correctly regardless of whether it was uploaded or selected from history
5. WHEN the resume selection feature is unavailable (e.g., API error), THE System SHALL fall back to file upload only without breaking the form

### Requirement 10: Performance and Scalability

**User Story:** As a user with hundreds of saved resumes, I want the resume selection interface to load quickly, so that I can efficiently find the right resume.

#### Acceptance Criteria

1. WHEN retrieving resume metadata for hundreds of files, THE System SHALL return results within 2 seconds
2. WHEN calculating Stack_Match_Score for multiple resumes, THE System SHALL use efficient algorithms that scale linearly with the number of resumes
3. WHEN displaying resume lists in the frontend, THE System SHALL implement pagination or virtual scrolling for lists exceeding 50 items
4. WHEN a user types in the tech stack field, THE System SHALL debounce API calls to avoid excessive requests
5. WHEN resume files are previewed, THE System SHALL cache the file data to avoid redundant fetches
