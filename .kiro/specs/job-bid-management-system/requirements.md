# Requirements Document: Job Bid and Interview Management System

## Introduction

The Job Bid and Interview Management System is a production-quality desktop application that automates job application tracking from bidding through interviews. The system receives most information from Microsoft Outlook emails via Microsoft Graph API, automatically updating bid statuses and interview information. It provides two dashboards: one for bid management and one for interview management. The system enforces domain rules to prevent duplicate bids, validates interview eligibility based on company history with recruiters and attendees, and infers whether ATS or recruiters screen resumes. The architecture follows clean architecture and domain-driven design principles with pure domain logic separated from infrastructure concerns.

## Glossary

- **Bid**: A job application with fields for tracking from submission through interview or rejection
- **Interview**: A scheduled interview session with eligibility validation based on company history
- **Duplication_Detection**: Policy that identifies potential duplicate bids based on link or company+role matching
- **Interview_Eligibility**: Policy that determines if a candidate can interview at a company based on previous failures and recruiter/attendee history
- **Company_History**: Domain model tracking failed interviews, recruiters, and attendees per company and role
- **Resume_Checker**: Field that stores inference about whether ATS or recruiter screens resumes
- **Email_Processor**: Infrastructure service that extracts bid and interview information from emails via Microsoft Graph API
- **ATS**: Applicant Tracking System (automated resume screening software)
- **Base**: The source of an interview - either from a Bid or from LinkedIn chat
- **Agency**: A recruiting company that represents a client company
- **Interview_Winning**: Boolean field indicating whether a bid reached the HR interview stage

## Requirements

### Requirement 1: Bid Creation with Manual Fields

**User Story:** As a job seeker, I want to create a bid with necessary information, so that I can track my job application.

#### Acceptance Criteria

1. WHEN creating a new bid, THE System SHALL automatically set the date field to today's date
2. WHEN creating a new bid, THE System SHALL require manual input for link, company, client, role, mainStacks, jobDescription, and resume fields
3. THE Bid SHALL include fields: date, link, company, client, role, mainStacks, bidStatus, jobDescription, resume, interviewWinning, bidDetail, resumeChecker
4. THE System SHALL support agency scenarios where company is the agency and client is the actual employer
5. THE System SHALL initialize bidStatus, interviewWinning, bidDetail, and resumeChecker fields with default values for later automated updates

### Requirement 2: Smart Duplication Detection

**User Story:** As a job seeker, I want to be warned about potential duplicate bids, so that I avoid bidding on the same job twice.

#### Acceptance Criteria

1. WHEN creating a bid with a link identical to any previous bid's link, THE Duplication_Detection SHALL identify it as a duplicate
2. WHEN creating a bid where company and role match any previous bid's company and role, THE Duplication_Detection SHALL identify it as a duplicate
3. WHEN duplication is detected, THE System SHALL display a warning to the user
4. WHEN duplication is detected, THE System SHALL still allow bid creation if the user confirms
5. THE Duplication_Detection SHALL check link-based duplication independently from company+role-based duplication

### Requirement 3: Bid Status Automation via Email

**User Story:** As a job seeker, I want bid status automatically updated from emails, so that I don't have to manually track application progress.

#### Acceptance Criteria

1. WHEN an email indicating bid rejection is received, THE Email_Processor SHALL update the bidStatus field to rejected
2. WHEN an email indicating an HR interview is scheduled, THE Email_Processor SHALL set interviewWinning to true
3. WHEN an email indicating an HR interview is scheduled, THE Email_Processor SHALL update bidStatus to indicate interview stage
4. THE Email_Processor SHALL extract status information from email content using Microsoft Graph API
5. THE Email_Processor SHALL match emails to existing bids based on company, role, or other identifying information

### Requirement 4: Company History Warning on Bids

**User Story:** As a job seeker, I want to see warnings about previous failed interviews when creating bids, so that I'm aware of my history with that company.

#### Acceptance Criteria

1. WHEN creating a bid for a company where the candidate previously failed an interview, THE System SHALL retrieve failure history from Company_History
2. WHEN failure history exists for the company and role, THE System SHALL attach a warning to the bidDetail field
3. THE warning SHALL include information about the previous failure, recruiter, and attendees
4. THE System SHALL display the warning to the user during bid creation
5. THE System SHALL allow bid creation even when warnings exist

### Requirement 5: Rebidding Rules Based on Interview Stage

**User Story:** As a job seeker, I want to rebid on a job with a different resume if I was rejected before reaching an interview, so that I can improve my chances.

#### Acceptance Criteria

1. WHEN a bid has been rejected and interviewWinning is false, THE System SHALL allow creating a new bid for the same job with a different resume
2. WHEN a bid has interviewWinning set to true, THE System SHALL prevent rebidding on that job
3. WHEN rebidding is attempted on a job that reached interview stage, THE System SHALL display an error message explaining the restriction
4. THE System SHALL track the relationship between original bid and rebid for history purposes
5. THE Duplication_Detection SHALL recognize rebids as intentional duplicates when confirmed by the user

### Requirement 6: Resume Checker Inference

**User Story:** As a job seeker, I want to know whether ATS or recruiters screen my resume, so that I can adjust my application strategy.

#### Acceptance Criteria

1. WHEN analyzing bid rejection patterns, THE System SHALL infer whether ATS or recruiter screened the resume
2. THE System SHALL store the inference result in the resumeChecker field as either "ATS" or "RECRUITER"
3. WHEN rejection occurs quickly after submission, THE System SHALL infer ATS screening
4. WHEN rejection occurs after a longer delay, THE System SHALL infer recruiter screening
5. THE System SHALL update resumeChecker field based on rejection timing and patterns across multiple bids to the same company

### Requirement 7: Interview Creation with Manual and Automated Fields

**User Story:** As a job seeker, I want to create an interview record with necessary information, so that I can track my interview pipeline.

#### Acceptance Criteria

1. WHEN creating a new interview, THE System SHALL automatically set the date field to today's date
2. WHEN creating a new interview, THE System SHALL require selection of base as either "LinkedIn chat" or "Bid"
3. WHEN base is "Bid", THE System SHALL populate company, client, role, jobDescription, and resume from the selected bid
4. WHEN base is "LinkedIn chat", THE System SHALL require manual input for company, client, role, jobDescription, and resume
5. THE Interview SHALL include fields: date, base, company, client, interviewType, recruiter, attendees, role, jobDescription, resume, status, detail
6. THE System SHALL require manual input for recruiter, attendees, and detail fields
7. THE System SHALL allow status to be set either manually or automatically via email

### Requirement 8: Interview Eligibility Validation

**User Story:** As a job seeker, I want the system to validate if I can interview at a company based on previous failures, so that I avoid forbidden interview situations.

#### Acceptance Criteria

1. WHEN scheduling an interview at a company and role where the candidate previously failed, THE Interview_Eligibility SHALL check if the recruiter is different from previous recruiters
2. WHEN scheduling an interview at a company and role where the candidate previously failed, THE Interview_Eligibility SHALL check if all attendees are different from previous attendees
3. IF the recruiter is new OR all attendees are new, THEN THE Interview_Eligibility SHALL allow the interview
4. IF the recruiter is not new AND any attendee is not new, THEN THE Interview_Eligibility SHALL forbid the interview
5. WHEN an interview is forbidden, THE System SHALL display an error message explaining why the interview cannot proceed
6. THE Interview_Eligibility SHALL provide clear explanation for both allowed and forbidden decisions

### Requirement 9: Company History Tracking

**User Story:** As a job seeker, I want the system to remember my interview failures with each company, so that future interviews can be validated.

#### Acceptance Criteria

1. WHEN an interview fails, THE System SHALL record the failure in Company_History for that company and role
2. WHEN an interview fails, THE System SHALL record the recruiter name in Company_History
3. WHEN an interview fails, THE System SHALL record all attendee names in Company_History
4. THE Company_History SHALL support queries by company and role to retrieve failure history
5. THE Company_History SHALL maintain a list of all recruiters and attendees involved in failed interviews per company and role

### Requirement 10: Interview Status Updates via Email

**User Story:** As a job seeker, I want interview status automatically updated from emails, so that I don't have to manually track interview progress.

#### Acceptance Criteria

1. WHEN an email indicating interview scheduling is received, THE Email_Processor SHALL create or update the corresponding interview record
2. WHEN an email indicating interview completion is received, THE Email_Processor SHALL update the interview status
3. WHEN an email indicating interview failure is received, THE Email_Processor SHALL update the interview status to failed
4. THE Email_Processor SHALL extract interview information including date, company, role, and status from email content
5. THE Email_Processor SHALL match emails to existing interviews based on company, role, date, or other identifying information

### Requirement 11: Microsoft Graph API Email Integration

**User Story:** As a job seeker, I want the system to integrate with my Microsoft Outlook email, so that job-related emails are automatically processed.

#### Acceptance Criteria

1. THE Email_Integration SHALL authenticate with Microsoft Graph API using OAuth
2. THE Email_Integration SHALL retrieve email metadata including sender, subject, date, and body
3. THE Email_Integration SHALL support background polling for new emails at configurable intervals
4. THE Email_Integration SHALL handle API rate limits and errors gracefully with retry logic
5. THE Email_Integration SHALL filter emails to identify job-related messages for processing

### Requirement 12: Email Event Idempotency

**User Story:** As a developer, I want email processing to be idempotent, so that processing the same email multiple times doesn't create duplicate records or incorrect state.

#### Acceptance Criteria

1. WHEN processing an email event, THE Email_Processor SHALL check if the email has been processed before
2. WHEN an email has been processed before, THE Email_Processor SHALL skip processing and return without changes
3. THE Email_Processor SHALL use email ID or unique identifier to track processed emails
4. THE Email_Processor SHALL store processed email IDs to prevent duplicate processing
5. THE Email_Processor SHALL handle email reprocessing requests gracefully without errors

### Requirement 13: Bid Dashboard

**User Story:** As a job seeker, I want a dashboard to view and manage all my bids, so that I can track my job application pipeline.

#### Acceptance Criteria

1. THE Bid_Dashboard SHALL display a list of all bids with columns for date, company, client, role, bidStatus, and interviewWinning
2. THE Bid_Dashboard SHALL provide a form to create new bids with all required manual fields
3. THE Bid_Dashboard SHALL display duplication warnings when creating bids
4. THE Bid_Dashboard SHALL allow filtering bids by company, role, status, and date range
5. THE Bid_Dashboard SHALL allow sorting bids by any column
6. THE Bid_Dashboard SHALL display bidDetail warnings prominently for bids with company history
7. THE Bid_Dashboard SHALL show resumeChecker inference results for each bid

### Requirement 14: Interview Dashboard

**User Story:** As a job seeker, I want a dashboard to view and manage all my interviews, so that I can track my interview pipeline.

#### Acceptance Criteria

1. THE Interview_Dashboard SHALL display a list of all interviews with columns for date, company, client, role, interviewType, recruiter, and status
2. THE Interview_Dashboard SHALL provide a form to create new interviews with all required fields
3. THE Interview_Dashboard SHALL display eligibility validation results when creating interviews
4. THE Interview_Dashboard SHALL allow filtering interviews by company, role, status, and date range
5. THE Interview_Dashboard SHALL allow sorting interviews by any column
6. THE Interview_Dashboard SHALL show interview history per company and role
7. THE Interview_Dashboard SHALL allow manual status updates for interviews

### Requirement 15: MongoDB Persistence

**User Story:** As a developer, I want domain objects persisted to MongoDB without business logic in repositories, so that the architecture remains clean and testable.

#### Acceptance Criteria

1. THE MongoDB_Repositories SHALL implement application layer repository interfaces
2. THE MongoDB_Repositories SHALL map domain objects to MongoDB documents
3. THE MongoDB_Repositories SHALL map MongoDB documents to domain objects
4. THE MongoDB_Repositories SHALL NOT contain business logic or domain rules
5. THE MongoDB_Repositories SHALL provide CRUD operations for Bid and Interview entities

### Requirement 16: REST API

**User Story:** As a frontend developer, I want a REST API to interact with the system, so that I can build the user interface.

#### Acceptance Criteria

1. THE REST_API SHALL provide endpoints for creating, reading, updating, and deleting bids
2. THE REST_API SHALL provide endpoints for creating, reading, updating, and deleting interviews
3. THE REST_API SHALL provide endpoints for querying company history
4. THE REST_API SHALL validate input data format and types
5. THE REST_API SHALL delegate business logic to application layer use cases
6. THE REST_API SHALL return appropriate HTTP status codes and error messages

### Requirement 17: Domain Model Purity

**User Story:** As a developer, I want pure domain code without infrastructure concerns, so that the domain logic is testable and maintainable.

#### Acceptance Criteria

1. THE Domain_Layer SHALL NOT contain persistence annotations or database-specific code
2. THE Domain_Layer SHALL NOT contain HTTP or REST-specific code
3. THE Domain_Layer SHALL NOT contain email or external API code
4. THE Domain_Models SHALL expose behavior through methods, not setters
5. THE Domain_Models SHALL prevent illegal state transitions through encapsulation

### Requirement 18: Tauri Desktop Application

**User Story:** As a job seeker, I want a desktop application with React frontend, so that I can use the system as a native application.

#### Acceptance Criteria

1. THE Frontend SHALL be built with Tauri, React, and TypeScript
2. THE Frontend SHALL use React Query for server state management
3. THE Frontend SHALL communicate with the backend REST API
4. THE Frontend SHALL provide both bid dashboard and interview dashboard
5. THE Frontend SHALL handle loading states, errors, and background data refresh

### Requirement 19: End-to-End Flow Support

**User Story:** As a job seeker, I want to complete the full job application flow from bid to interview, so that the system supports my entire job search process.

#### Acceptance Criteria

1. THE System SHALL support creating a bid manually with all required fields
2. THE System SHALL support receiving email rejection and updating bid status automatically
3. THE System SHALL support rebidding with a different resume after rejection without interview
4. THE System SHALL support receiving email about HR interview and setting interviewWinning to true
5. THE System SHALL support creating an interview record from a bid
6. THE System SHALL support validating interview eligibility before allowing interview creation
7. THE System SHALL support recording interview failure and updating company history
