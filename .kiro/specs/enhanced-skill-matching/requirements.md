# Requirements Document

## Introduction

The Enhanced Skill Matching System is the core feature of the job bid management system that evaluates resume reusability based on **JD-to-JD correlation**. Instead of directly matching resumes to job descriptions, the system recognizes that each resume is optimized for its original JD. Therefore, the key question becomes: "How similar is the current JD to past JDs?" This approach enables intelligent resume reuse, stable scoring, and explainable match rates.

The system uses a layered, weighted skill architecture where job descriptions are normalized into canonical specifications with six technical layers (frontend, backend, database, cloud, devops, others). Each layer has weighted skills, and correlation is calculated using a deterministic formula that respects layer importance.

## Glossary

- **Canonical_Skill**: A standardized, authoritative representation of a skill in the system's dictionary (e.g., "react", "nodejs", "postgresql")
- **Skill_Variation**: An alternative name or synonym for a canonical skill (e.g., "React.js" → "react", "Node" → "nodejs")
- **JD**: Job Description - the text describing a job opportunity and its requirements
- **Canonical_JD_Spec**: A normalized, layer-complete representation of a JD with weighted skills across all six layers
- **Layer**: One of six technical categories: frontend, backend, database, cloud, devops, others
- **Layer_Weight**: A decimal value (0-1) indicating the importance of a layer for a specific role; all layer weights sum to 1
- **Skill_Weight**: A decimal value (0-1) indicating the importance of a skill within its layer; skill weights within each layer sum to 1
- **JD_Correlation**: A numerical value (0-1) representing how similar two JDs are based on weighted layer and skill comparison
- **Resume_Match_Rate**: The JD correlation score between the current JD and the JD that a resume was originally created for
- **Dictionary_Version**: A timestamped version identifier for the canonical skills dictionary (format: YYYY.N)
- **Unknown_Skill**: A skill extracted from a JD that does not exist in the current canonical dictionary
- **Skill_Review_Queue**: A collection of unknown skills awaiting human review and approval
- **ChatGPT_JD_Normalizer**: The AI service that converts raw JD text into canonical JD specifications
- **Skill_Mapper**: The component that maps skill variations to their canonical forms

## Requirements

### Requirement 1: Canonical JD Specification Structure

**User Story:** As a system, I want to represent every job description as a normalized, layer-complete specification, so that JD-to-JD correlation can be calculated deterministically.

#### Acceptance Criteria

1. THE System SHALL represent every JD using exactly six layers: frontend, backend, database, cloud, devops, others
2. WHEN a JD is normalized, THE System SHALL ensure all six layers are present even if minimally weighted
3. THE System SHALL store layer weights as decimal values where the sum equals exactly 1.0
4. WHEN skills are assigned to a layer, THE System SHALL ensure skill weights within that layer sum to exactly 1.0
5. THE System SHALL use only canonical skill identifiers in the JD specification
6. THE System SHALL persist JD specifications in the following JSON format:
```json
{
  "_id": "jd_123",
  "role": "string",
  "layerWeights": {
    "frontend": 0.0-1.0,
    "backend": 0.0-1.0,
    "database": 0.0-1.0,
    "cloud": 0.0-1.0,
    "devops": 0.0-1.0,
    "others": 0.0-1.0
  },
  "skills": {
    "frontend": [{"skill": "canonical_id", "weight": 0.0-1.0}],
    "backend": [...],
    "database": [...],
    "cloud": [...],
    "devops": [...],
    "others": [...]
  }
}
```
7. THE System SHALL validate that layer weights sum to 1.0 (±0.001 tolerance)
8. THE System SHALL validate that skill weights within each layer sum to 1.0 (±0.001 tolerance)

### Requirement 2: Canonical Skills Dictionary Management

**User Story:** As a system administrator, I want to manage a canonical skills dictionary, so that skill normalization is consistent and accurate across all job descriptions.

#### Acceptance Criteria

1. THE System SHALL maintain a canonical skills dictionary with 300-500 initial seed skills
2. WHEN a new canonical skill is added, THE System SHALL store the skill name, category, and creation timestamp
3. WHEN a skill variation is added, THE System SHALL map it to exactly one canonical skill
4. THE System SHALL support CRUD operations (create, read, update, delete) for canonical skills
5. WHEN a canonical skill is deleted, THE System SHALL handle all associated skill variations appropriately
6. THE System SHALL persist the dictionary across application restarts

### Requirement 3: Dictionary Versioning

**User Story:** As a system administrator, I want the skills dictionary to be versioned, so that JD normalization and correlation scores remain stable and auditable over time.

#### Acceptance Criteria

1. THE System SHALL assign a version identifier to the dictionary using format "YYYY.N" where YYYY is the year and N is an incrementing number
2. WHEN the dictionary is modified (skills added, removed, or updated), THE System SHALL increment the version number
3. WHEN a JD is normalized, THE System SHALL record which dictionary version was used
4. THE System SHALL maintain a history of all dictionary versions with timestamps
5. THE System SHALL allow querying historical dictionary versions
6. WHEN viewing a historical JD correlation, THE System SHALL display which dictionary version was used

### Requirement 4: ChatGPT JD Normalization

**User Story:** As a user, I want job descriptions to be automatically normalized into canonical JD specifications, so that I don't have to manually structure the technical requirements.

#### Acceptance Criteria

1. WHEN a raw JD text is provided, THE ChatGPT_JD_Normalizer SHALL extract the primary role
2. WHEN normalizing a JD, THE ChatGPT_JD_Normalizer SHALL assign layer weights based on role importance
3. WHEN normalizing a JD, THE ChatGPT_JD_Normalizer SHALL extract canonical technical skills for all six layers
4. WHEN normalizing a JD, THE ChatGPT_JD_Normalizer SHALL assign skill weights within each layer
5. THE ChatGPT_JD_Normalizer SHALL use the following system prompt:
```
You are an expert technical recruiter and job architecture analyst.
Your task is to convert job descriptions into a strict, normalized, layer-complete technical specification used for correlation analysis.
You must:
- Identify the primary role.
- Always include all layers: frontend, backend, database, cloud, devops, others.
- Assign layer weights based on role importance.
- Extract canonical technical skills only.
- Assign skill weights so that each layer sums to 1.
- Output valid JSON only.
- Do not include explanations or comments.
```
6. THE ChatGPT_JD_Normalizer SHALL use a user prompt that enforces the canonical JD specification format
7. WHEN an extracted skill exists in the dictionary, THE Skill_Mapper SHALL map it to its canonical form
8. WHEN an extracted skill does not exist in the dictionary, THE System SHALL flag it as an unknown skill
9. WHEN normalization fails, THE System SHALL return a descriptive error message
10. THE System SHALL validate the output JSON structure before persisting

### Requirement 5: Unknown Skill Review Workflow

**User Story:** As a system administrator, I want to review and approve unknown skills, so that the dictionary grows accurately over time.

#### Acceptance Criteria

1. WHEN an unknown skill is detected, THE System SHALL add it to the Skill_Review_Queue
2. THE System SHALL prevent duplicate entries in the Skill_Review_Queue for the same skill name
3. WHEN viewing the review queue, THE System SHALL display the skill name, frequency of occurrence, and first detection date
4. WHEN a skill is approved, THE System SHALL add it to the canonical dictionary as a new canonical skill
5. WHEN a skill is approved as a variation, THE System SHALL map it to an existing canonical skill
6. WHEN a skill is rejected, THE System SHALL remove it from the review queue and mark it as rejected
7. THE System SHALL maintain an audit trail of all review decisions

### Requirement 6: JD-to-JD Correlation Algorithm

**User Story:** As a user, I want accurate correlation scores between job descriptions, so that I can identify which past resumes are most reusable for a new opportunity.

#### Acceptance Criteria

1. WHEN calculating correlation between two JDs, THE System SHALL use a deterministic, weighted formula
2. THE System SHALL calculate layer correlation for each of the six layers using the formula:
```
layerCorrelation(L) = Σ (weightCurrent(skill) × weightPast(skill) × similarity(skillCurrent, skillPast))
```
Where:
- Exact skill match → similarity = 1.0
- Similar skill (from skill graph) → similarity ∈ (0, 1)
- Missing skill → similarity = 0.0
3. THE System SHALL calculate overall JD correlation using the formula:
```
JD_Correlation = Σ (layerCorrelation(L) × layerWeightCurrent(L))
```
4. THE System SHALL use the current JD's layer weights (not the past JD's weights)
5. THE System SHALL ensure JD_Correlation result is in the range [0, 1]
6. WHEN a skill exists in one JD but not the other, THE System SHALL treat it as similarity = 0
7. THE System SHALL record the dictionary version used for each correlation calculation
8. WHEN recalculating correlation with a different dictionary version, THE System SHALL produce potentially different scores

### Requirement 7: Resume Match Rate Calculation

**User Story:** As a user, I want to see how well past resumes match a new job description, so that I can select the most appropriate resume to reuse.

#### Acceptance Criteria

1. WHEN calculating a resume match rate, THE System SHALL use the JD-to-JD correlation between the current JD and the resume's original JD
2. THE System SHALL assign resumeMatchRate = JD_Correlation
3. THE System SHALL assume that the resume was optimized for its original JD (implicit match = 1.0)
4. THE System SHALL rank resumes by their match rate in descending order
5. WHEN displaying match rates, THE System SHALL show the score as a percentage (0-100%)
6. THE System SHALL provide explainability by showing which layers contributed most to the correlation
7. THE System SHALL display which skills matched and which skills are missing per layer

### Requirement 8: Skill Weighting and Layer Importance

**User Story:** As a system, I want to respect the importance of different technical layers and skills within those layers, so that correlation scores accurately reflect role requirements.

#### Acceptance Criteria

1. THE System SHALL support layer weights that sum to exactly 1.0 for each JD
2. THE System SHALL support skill weights within each layer that sum to exactly 1.0
3. WHEN calculating correlation, THE System SHALL weight layer contributions by the current JD's layer weights
4. WHEN calculating layer correlation, THE System SHALL weight skill contributions by both JDs' skill weights
5. WHEN a layer has zero weight in the current JD, THE System SHALL not penalize missing skills in that layer
6. THE System SHALL validate weight constraints during JD normalization
7. THE System SHALL reject JD specifications where weights do not sum to 1.0 (±0.001 tolerance)

### Requirement 9: JD Specification API Operations

**User Story:** As a developer, I want programmatic access to JD specification operations, so that I can integrate JD normalization and correlation into other system components.

#### Acceptance Criteria

1. THE System SHALL provide an API endpoint to normalize a raw JD text into a canonical JD specification
2. THE System SHALL provide an API endpoint to retrieve a stored JD specification by ID
3. THE System SHALL provide an API endpoint to calculate correlation between two JD specifications
4. THE System SHALL provide an API endpoint to retrieve all JD specifications
5. THE System SHALL provide an API endpoint to update a JD specification
6. THE System SHALL provide an API endpoint to delete a JD specification
7. THE System SHALL provide an API endpoint to retrieve the current dictionary version
8. THE System SHALL provide an API endpoint to retrieve all canonical skills
9. THE System SHALL provide an API endpoint to retrieve all skill variations for a canonical skill
10. THE System SHALL provide an API endpoint to add a new canonical skill
11. THE System SHALL provide an API endpoint to add a skill variation
12. THE System SHALL provide an API endpoint to retrieve the skill review queue
13. THE System SHALL provide an API endpoint to approve or reject skills from the review queue
14. WHEN API operations fail, THE System SHALL return appropriate HTTP status codes and error messages

### Requirement 10: Dictionary Import and Export

**User Story:** As a system administrator, I want to export and import the skills dictionary, so that I can backup, share, or migrate dictionary data.

#### Acceptance Criteria

1. THE System SHALL export the dictionary in JSON format including version, skills, and variations
2. THE System SHALL export the dictionary with all metadata (timestamps, categories, audit trail)
3. WHEN importing a dictionary, THE System SHALL validate the JSON structure
4. WHEN importing a dictionary, THE System SHALL prevent overwriting a newer version with an older version
5. THE System SHALL support merging imported skills with the existing dictionary
6. WHEN import fails validation, THE System SHALL return descriptive error messages

### Requirement 11: Skill Usage Statistics

**User Story:** As a system administrator, I want to view skill usage statistics, so that I can understand which skills are most common in job descriptions.

#### Acceptance Criteria

1. THE System SHALL track how many times each canonical skill appears in job descriptions
2. THE System SHALL track how many times each canonical skill appears in resumes
3. WHEN viewing statistics, THE System SHALL display skills sorted by frequency
4. THE System SHALL display the date range for the statistics
5. THE System SHALL support filtering statistics by date range
6. THE System SHALL display which skill variations are most commonly used for each canonical skill

### Requirement 12: JD Normalization Validation

**User Story:** As a developer, I want the ChatGPT normalization results to be validated, so that malformed or invalid data doesn't corrupt the system.

#### Acceptance Criteria

1. WHEN ChatGPT returns a JD specification, THE System SHALL validate the JSON structure
2. THE System SHALL validate that all six layers are present in layerWeights
3. THE System SHALL validate that all six layers are present in skills
4. THE System SHALL validate that layer weights sum to 1.0 (±0.001 tolerance)
5. THE System SHALL validate that skill weights within each layer sum to 1.0 (±0.001 tolerance)
6. THE System SHALL reject skill names that are empty or contain only whitespace
7. THE System SHALL reject skill names longer than 100 characters
8. THE System SHALL normalize skill names by trimming whitespace and standardizing case
9. THE System SHALL validate that all skill identifiers exist in the canonical dictionary or are flagged as unknown
10. WHEN validation fails, THE System SHALL log the error with specific details about which constraint was violated
11. WHEN validation fails, THE System SHALL return a descriptive error message to the user

### Requirement 13: Resume-to-JD Association

**User Story:** As a system, I want to track which JD each resume was created for, so that JD-to-JD correlation can be used to calculate resume match rates.

#### Acceptance Criteria

1. WHEN a resume is created for a bid, THE System SHALL associate the resume with the bid's JD specification
2. THE System SHALL store the JD specification ID with each resume record
3. WHEN calculating resume match rates, THE System SHALL retrieve the resume's original JD specification
4. THE System SHALL calculate correlation between the current JD and the resume's original JD
5. WHEN a resume's original JD is not found, THE System SHALL return a match rate of 0
6. THE System SHALL persist the JD-resume association across application restarts
