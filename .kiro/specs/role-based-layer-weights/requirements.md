# Requirements Document: Role-Based Layer Weights

## Introduction

This feature enhances the job role system to support structured job titles with levels and specializations, and associates predefined layer weights with each role type. The system will enable more accurate skill matching by weighting different technology layers (frontend, backend, database, cloud, DevOps, others) according to the role's focus area.

## Glossary

- **Role**: A structured job title consisting of a level and main title (e.g., "Senior Backend Engineer")
- **Level**: The seniority level of a position (Junior, Mid, Senior, Lead/Staff)
- **Main_Title**: The primary job function (e.g., Backend Engineer, Frontend Developer)
- **Full_Stack_Modifier**: A prefix for Full Stack Engineer roles indicating specialization (Balanced, Frontend Heavy, Backend Heavy)
- **Layer_Weights**: A set of numerical weights (summing to 1.0) representing the importance of each technology layer for a role
- **Technology_Layer**: A category of technical skills (Frontend, Backend, Database, Cloud, DevOps, Others)
- **Main_Stack**: A two-dimensional array structure organizing skills by technology layer
- **Match_Rate**: A calculated score representing how well a candidate's skills align with a job's requirements
- **Bid**: A job application tracked in the system
- **JD_Specification**: A job description specification defining required skills and role details
- **System**: The Job Bid and Interview Management System

## Requirements

### Requirement 1: Structured Role Titles

**User Story:** As a user, I want job titles to have structured levels and main titles, so that I can consistently categorize and analyze positions.

#### Acceptance Criteria

1. THE System SHALL support role titles composed of a Level and Main_Title
2. THE System SHALL support the following Level values: Junior, Mid, Senior, Lead, Staff
3. THE System SHALL support the following Main_Title values: Full Stack Engineer, Backend Engineer, Frontend Developer, QA Automation Engineer, DevOps Engineer
4. WHEN a user creates a Bid or JD_Specification, THE System SHALL require both Level and Main_Title to be specified
5. THE System SHALL allow additional Main_Title values to be added in the future

### Requirement 2: Full Stack Engineer Modifiers

**User Story:** As a user, I want to specify the focus area for Full Stack Engineer roles, so that I can distinguish between frontend-heavy, backend-heavy, and balanced positions.

#### Acceptance Criteria

1. WHERE the Main_Title is "Full Stack Engineer", THE System SHALL support a Full_Stack_Modifier
2. THE System SHALL support the following Full_Stack_Modifier values: Balanced, Frontend Heavy, Backend Heavy
3. WHERE the Main_Title is "Full Stack Engineer", THE System SHALL require a Full_Stack_Modifier to be specified
4. WHERE the Main_Title is not "Full Stack Engineer", THE System SHALL NOT allow a Full_Stack_Modifier to be specified
5. THE System SHALL display the complete role title including the Full_Stack_Modifier (e.g., "Senior Frontend Heavy Full Stack Engineer")

### Requirement 3: Layer Weights Definition

**User Story:** As a system designer, I want each role type to have predefined layer weights, so that skill matching reflects the actual technology focus of different roles.

#### Acceptance Criteria

1. THE System SHALL define Layer_Weights as a set of six numerical values for Frontend, Backend, Database, Cloud, DevOps, and Others
2. THE System SHALL ensure that all Layer_Weights for a role sum to exactly 1.0
3. THE System SHALL provide default Layer_Weights for each combination of Main_Title and Full_Stack_Modifier
4. THE System SHALL store Layer_Weights with precision sufficient to represent values like 0.03 and 0.45
5. WHEN Layer_Weights are modified, THE System SHALL validate that they sum to 1.0 before accepting them

### Requirement 4: Default Layer Weights

**User Story:** As a user, I want sensible default layer weights for each role type, so that I don't have to manually configure weights for common roles.

#### Acceptance Criteria

1. THE System SHALL provide default Layer_Weights for Backend Engineer as: {backend: 0.5, database: 0.25, cloud: 0.15, devops: 0.05, frontend: 0.03, others: 0.02}
2. THE System SHALL provide default Layer_Weights for Frontend Developer as: {frontend: 0.6, backend: 0.15, cloud: 0.1, devops: 0.05, database: 0.05, others: 0.05}
3. THE System SHALL provide default Layer_Weights for Balanced Full Stack Engineer as: {frontend: 0.3, backend: 0.3, database: 0.2, cloud: 0.1, devops: 0.05, others: 0.05}
4. THE System SHALL provide default Layer_Weights for Frontend Heavy Full Stack Engineer as: {frontend: 0.45, backend: 0.25, database: 0.15, cloud: 0.08, devops: 0.04, others: 0.03}
5. THE System SHALL provide default Layer_Weights for Backend Heavy Full Stack Engineer as: {backend: 0.45, frontend: 0.25, database: 0.15, cloud: 0.08, devops: 0.04, others: 0.03}
6. THE System SHALL provide default Layer_Weights for QA Automation Engineer
7. THE System SHALL provide default Layer_Weights for DevOps Engineer

### Requirement 5: User-Modifiable Layer Weights

**User Story:** As a user, I want to modify layer weights when creating a bid or JD specification, so that I can customize the matching algorithm for non-standard roles.

#### Acceptance Criteria

1. WHEN a user creates a Bid, THE System SHALL display the default Layer_Weights for the selected role
2. WHEN a user creates a JD_Specification, THE System SHALL display the default Layer_Weights for the selected role
3. THE System SHALL allow users to modify any of the six Layer_Weights values
4. WHEN a user modifies Layer_Weights, THE System SHALL validate that the sum equals 1.0
5. IF the sum of Layer_Weights does not equal 1.0, THEN THE System SHALL prevent saving and display an error message
6. THE System SHALL persist the modified Layer_Weights with the Bid or JD_Specification

### Requirement 6: Two-Dimensional Main Stack Structure

**User Story:** As a user, I want to organize skills by technology layer, so that the system can accurately calculate weighted match rates.

#### Acceptance Criteria

1. THE System SHALL accept Main_Stack as a two-dimensional array with six sub-arrays
2. THE System SHALL organize Main_Stack sub-arrays in the order: [Frontend, Backend, Database, Cloud, DevOps, Others]
3. WHEN a user inputs Main_Stack, THE System SHALL allow any number of skills in each sub-array (including zero)
4. THE System SHALL validate that each skill is a non-empty string
5. THE System SHALL allow duplicate skills across different sub-arrays

### Requirement 7: Weighted Match Rate Calculation

**User Story:** As a user, I want match rates to reflect the role's technology focus, so that I can prioritize opportunities that align with my skills in the most important areas.

#### Acceptance Criteria

1. WHEN calculating Match_Rate, THE System SHALL compute a separate match score for each Technology_Layer
2. WHEN calculating Match_Rate, THE System SHALL multiply each layer's match score by the corresponding Layer_Weights value
3. WHEN calculating Match_Rate, THE System SHALL sum all weighted layer scores to produce the overall Match_Rate
4. THE System SHALL calculate layer match scores as the ratio of matched skills to total required skills in that layer
5. WHERE a Technology_Layer has zero required skills, THE System SHALL treat that layer's match score as 1.0

### Requirement 8: Bid Creation Integration

**User Story:** As a user, I want to use the new role structure and layer weights when creating bids, so that my applications are accurately tracked and matched.

#### Acceptance Criteria

1. WHEN creating a Bid, THE System SHALL require the user to select a Level
2. WHEN creating a Bid, THE System SHALL require the user to select a Main_Title
3. WHERE the Main_Title is "Full Stack Engineer", THE System SHALL require the user to select a Full_Stack_Modifier
4. WHEN creating a Bid, THE System SHALL display the default Layer_Weights for the selected role
5. WHEN creating a Bid, THE System SHALL allow the user to modify Layer_Weights
6. WHEN creating a Bid, THE System SHALL accept Main_Stack in the two-dimensional array format
7. THE System SHALL persist the complete role structure and Layer_Weights with the Bid

### Requirement 9: JD Specification Integration

**User Story:** As a user, I want to use role-based layer weights in JD specifications, so that job requirements are consistently structured.

#### Acceptance Criteria

1. WHEN creating a JD_Specification, THE System SHALL require the user to select a Level
2. WHEN creating a JD_Specification, THE System SHALL require the user to select a Main_Title
3. WHERE the Main_Title is "Full Stack Engineer", THE System SHALL require the user to select a Full_Stack_Modifier
4. WHEN creating a JD_Specification, THE System SHALL display the default Layer_Weights for the selected role
5. WHEN creating a JD_Specification, THE System SHALL allow the user to modify Layer_Weights
6. WHEN creating a JD_Specification, THE System SHALL accept Main_Stack in the two-dimensional array format
7. THE System SHALL persist the complete role structure and Layer_Weights with the JD_Specification

### Requirement 10: Resume Match Rate Integration

**User Story:** As a user, I want resume match rate calculations to use layer weights, so that matches reflect the role's actual requirements.

#### Acceptance Criteria

1. WHEN calculating resume Match_Rate, THE System SHALL use the Layer_Weights from the associated Bid or JD_Specification
2. WHEN calculating resume Match_Rate, THE System SHALL compare candidate skills against the two-dimensional Main_Stack structure
3. THE System SHALL apply the weighted match rate calculation algorithm defined in Requirement 7
4. THE System SHALL display the overall Match_Rate as a percentage
5. THE System SHALL optionally display individual layer match scores

### Requirement 11: Analytics Integration

**User Story:** As a user, I want to analyze my application performance by role type and level, so that I can identify which positions I'm most successful with.

#### Acceptance Criteria

1. THE System SHALL provide analytics showing success rates grouped by Main_Title
2. THE System SHALL provide analytics showing success rates grouped by Level
3. THE System SHALL provide analytics showing success rates grouped by Full_Stack_Modifier (for Full Stack Engineer roles)
4. THE System SHALL calculate average Match_Rate by role type
5. THE System SHALL display the number of applications per role type and level

### Requirement 12: Backward Compatibility

**User Story:** As a user with existing data, I want my current bids and JD specifications to continue working, so that I don't lose historical information.

#### Acceptance Criteria

1. THE System SHALL continue to display existing Bids that use the old role format
2. THE System SHALL continue to display existing JD_Specifications that use the old role format
3. THE System SHALL continue to calculate Match_Rate for existing Bids using the old algorithm
4. WHEN viewing an existing Bid with old format, THE System SHALL clearly indicate it uses the legacy format
5. THE System SHALL allow users to edit existing Bids and convert them to the new format

### Requirement 13: Data Migration

**User Story:** As a user, I want a clear path to migrate my existing data to the new structure, so that I can benefit from the enhanced matching algorithm.

#### Acceptance Criteria

1. THE System SHALL provide a migration utility to convert existing Bids to the new role structure
2. THE System SHALL provide a migration utility to convert existing JD_Specifications to the new role structure
3. WHEN migrating data, THE System SHALL attempt to infer Level and Main_Title from the old role string
4. WHEN migrating data, THE System SHALL assign default Layer_Weights based on the inferred role
5. WHEN migrating data, THE System SHALL attempt to organize existing Main_Stack skills into the two-dimensional structure
6. THE System SHALL allow users to review and correct migrated data before finalizing
7. THE System SHALL preserve the original data until migration is confirmed
