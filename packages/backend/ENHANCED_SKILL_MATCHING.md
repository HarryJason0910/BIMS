# Enhanced Skill Matching Feature

## Overview

The Enhanced Skill Matching feature implements a sophisticated JD-to-JD correlation engine with a 6-layer weighted architecture, canonical skills dictionary management, and property-based testing for correctness validation.

## Architecture

### Domain Layer (Pure Business Logic)

#### Aggregates

1. **CanonicalJDSpec** - Job Description Specification
   - Represents a normalized JD with weighted skills across 6 tech layers
   - Validates that layer weights sum to 1.0
   - Validates that skill weights per layer sum to 1.0
   - Tracks dictionary version used for normalization

2. **SkillDictionary** - Canonical Skills Repository
   - Manages canonical skills and their variations
   - Supports versioning for tracking changes
   - Provides skill mapping (variation → canonical)
   - Organized by 6 tech layers: frontend, backend, database, cloud, devops, others

3. **SkillReviewQueue** - Unknown Skills Management
   - Queues unknown skills detected during JD creation
   - Tracks frequency and sources
   - Supports approval (as canonical or variation) and rejection workflows
   - Maintains audit trail of decisions

#### Domain Services

1. **JDCorrelationCalculator**
   - Calculates similarity between two JD specifications
   - Uses weighted layer-by-layer comparison
   - Returns overall score (0-1) and detailed breakdown
   - Formula: `correlation = Σ(layer_weight × layer_similarity)`

### Application Layer (Use Cases)

#### JD Specification Management
- `CreateJDSpecUseCase` - Create and normalize JD specifications
- `CalculateCorrelationUseCase` - Calculate JD-to-JD correlation
- `CalculateResumeMatchRateUseCase` - Calculate resume match rates

#### Dictionary Management
- `ManageSkillDictionaryUseCase` - CRUD operations for skills
- `ExportDictionaryUseCase` - Export dictionary to JSON
- `ImportDictionaryUseCase` - Import dictionary with merge/replace modes

#### Skill Review
- `ReviewUnknownSkillsUseCase` - Review and approve/reject unknown skills

#### Analytics
- `SkillUsageStatisticsUseCase` - Track skill usage across JDs and resumes

### Infrastructure Layer

#### Repositories (MongoDB)
- `MongoDBJDSpecRepository` - Persist JD specifications
- `MongoDBSkillDictionaryRepository` - Persist skill dictionary with versioning
- `MongoDBSkillReviewQueueRepository` - Persist review queue

#### Controllers (REST API)
- `JDSpecController` - JD specification endpoints
- `SkillDictionaryController` - Dictionary management endpoints
- `SkillReviewController` - Skill review endpoints
- `ResumeMatchController` - Match rate calculation endpoints
- `SkillStatisticsController` - Statistics endpoints

## API Endpoints

### JD Specification Endpoints

#### POST /api/jd/create
Create a new JD specification.

**Request Body:**
```json
{
  "role": "Full Stack Engineer",
  "layerWeights": {
    "frontend": 0.3,
    "backend": 0.3,
    "database": 0.2,
    "cloud": 0.1,
    "devops": 0.05,
    "others": 0.05
  },
  "skills": {
    "frontend": [
      { "skill": "React", "weight": 0.5 },
      { "skill": "TypeScript", "weight": 0.5 }
    ],
    "backend": [
      { "skill": "Node.js", "weight": 0.6 },
      { "skill": "Express", "weight": 0.4 }
    ],
    ...
  }
}
```

**Response:**
```json
{
  "jdSpec": {
    "id": "...",
    "role": "Full Stack Engineer",
    "layerWeights": {...},
    "skills": {...},
    "dictionaryVersion": "2024.1",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "unknownSkills": ["NextJS", "Prisma"]
}
```

#### GET /api/jd/:id
Get a JD specification by ID.

#### GET /api/jd
Get all JD specifications.

#### PUT /api/jd/:id
Update a JD specification.

#### DELETE /api/jd/:id
Delete a JD specification.

#### GET /api/jd/correlation?currentJDId=xxx&historicalJDId=yyy
Calculate correlation between two JD specifications.

**Response:**
```json
{
  "overallScore": 0.75,
  "layerBreakdown": [
    {
      "layer": "frontend",
      "score": 0.8,
      "weight": 0.3,
      "matchingSkills": ["React", "TypeScript"],
      "missingSkills": ["Vue"]
    },
    ...
  ],
  "dictionaryVersion": "2024.1"
}
```

### Skill Dictionary Endpoints

#### GET /api/dictionary/current
Get the current skill dictionary.

#### GET /api/dictionary/version/:version
Get a specific dictionary version.

#### GET /api/dictionary/skills
Get all canonical skills.

#### POST /api/dictionary/skills
Add a canonical skill.

**Request Body:**
```json
{
  "name": "React",
  "category": "frontend"
}
```

#### DELETE /api/dictionary/skills/:name
Remove a canonical skill.

#### POST /api/dictionary/variations
Add a skill variation.

**Request Body:**
```json
{
  "variation": "reactjs",
  "canonicalName": "React"
}
```

#### GET /api/dictionary/variations/:canonical
Get variations for a canonical skill.

#### POST /api/dictionary/export
Export the dictionary to JSON.

**Request Body:**
```json
{
  "version": "2024.1"  // optional
}
```

#### POST /api/dictionary/import
Import a dictionary from JSON.

**Request Body:**
```json
{
  "dictionaryData": {...},
  "mode": "replace",  // or "merge"
  "allowOlderVersion": false
}
```

### Skill Review Endpoints

#### GET /api/skills/review-queue
Get unknown skills pending review.

**Response:**
```json
{
  "items": [
    {
      "name": "NextJS",
      "frequency": 5,
      "firstSeen": "2024-01-10T08:00:00Z",
      "lastSeen": "2024-01-15T14:30:00Z",
      "sources": ["JD-123", "JD-456"]
    },
    ...
  ]
}
```

#### POST /api/skills/review-queue/approve
Approve a skill.

**Request Body:**
```json
{
  "skillName": "NextJS",
  "approvalType": "variation",  // or "canonical"
  "canonicalName": "Next.js",   // required for variation
  "category": "frontend"         // required for canonical
}
```

#### POST /api/skills/review-queue/reject
Reject a skill.

**Request Body:**
```json
{
  "skillName": "InvalidSkill",
  "reason": "Not a valid technology skill"
}
```

### Resume Match Rate Endpoints

#### GET /api/resume/match-rate?currentJDId=xxx
Calculate match rates for all resumes against a JD.

**Response:**
```json
{
  "matchRates": [
    {
      "resumeId": "resume-123",
      "matchRate": 75.5,
      "correlation": {
        "overallScore": 0.755,
        "layerBreakdown": [...],
        "dictionaryVersion": "2024.1"
      }
    },
    ...
  ]
}
```

#### GET /api/resume/:id/match-rate?currentJDId=xxx
Get match rate for a specific resume.

### Skill Statistics Endpoints

#### GET /api/statistics/skills
Get skill usage statistics.

**Query Parameters:**
- `category` - Filter by tech layer
- `sortBy` - Sort by 'frequency' or 'name'
- `sortOrder` - 'asc' or 'desc'
- `dateFrom` - Filter by date range
- `dateTo` - Filter by date range

**Response:**
```json
{
  "statistics": [
    {
      "skillName": "React",
      "category": "frontend",
      "jdCount": 25,
      "resumeCount": 40,
      "totalUsage": 65,
      "firstSeen": "2024-01-01T00:00:00Z",
      "lastSeen": "2024-01-15T14:30:00Z",
      "variations": ["reactjs", "react.js"]
    },
    ...
  ]
}
```

#### GET /api/statistics/skills/:name
Get statistics for a specific skill.

## Correlation Algorithm

### Overview
The correlation algorithm calculates similarity between two JD specifications using a weighted layer-by-layer comparison.

### Formula

```
Overall Correlation = Σ(layer_weight_current × layer_similarity)

where:
  layer_similarity = Σ(min(skill_weight_current, skill_weight_past)) / max(Σ skill_weights)
```

### Example

**Current JD:**
- Frontend (weight: 0.4): React (0.6), TypeScript (0.4)
- Backend (weight: 0.6): Node.js (0.7), Express (0.3)

**Past JD:**
- Frontend (weight: 0.5): React (0.5), Vue (0.5)
- Backend (weight: 0.5): Node.js (0.8), Python (0.2)

**Calculation:**

Frontend similarity:
- React: min(0.6, 0.5) = 0.5
- TypeScript: min(0.4, 0) = 0
- Vue: min(0, 0.5) = 0
- Sum: 0.5 / max(1.0, 1.0) = 0.5

Backend similarity:
- Node.js: min(0.7, 0.8) = 0.7
- Express: min(0.3, 0) = 0
- Python: min(0, 0.2) = 0
- Sum: 0.7 / max(1.0, 1.0) = 0.7

Overall correlation:
- (0.4 × 0.5) + (0.6 × 0.7) = 0.2 + 0.42 = 0.62 (62%)

## Dictionary Management Workflows

### Initial Setup

1. **Seed Dictionary**
   ```bash
   npm run seed-dictionary
   ```
   This populates the dictionary with 300+ canonical skills across all layers.

2. **Verify Dictionary**
   - Navigate to Dictionary page in UI
   - Browse skills by category
   - Check version number

### Adding New Skills

1. **Manual Addition**
   - Go to Dictionary page
   - Click "Add Skill"
   - Enter skill name and select category
   - Click "Add"

2. **From Review Queue**
   - Go to Review page
   - Select unknown skill
   - Click "Approve"
   - Choose "As Canonical Skill"
   - Select category
   - Click "Approve"

### Managing Variations

1. **Add Variation**
   - Go to Dictionary page
   - Find canonical skill
   - Click "Add Variation"
   - Enter variation name
   - Click "Add"

2. **From Review Queue**
   - Go to Review page
   - Select unknown skill
   - Click "Approve"
   - Choose "As Variation"
   - Enter canonical skill name
   - Click "Approve"

### Export/Import

1. **Export**
   - Go to Dictionary page
   - Click "Export"
   - Save JSON file

2. **Import**
   - Go to Dictionary page
   - Click "Import"
   - Choose mode (Replace or Merge)
   - Paste JSON data
   - Click "Import"

## Skill Review Process

### Workflow

1. **Detection**
   - Unknown skills are automatically detected when creating JD specifications
   - Skills not in dictionary are queued for review

2. **Review**
   - Navigate to Review page
   - View unknown skills with frequency and sources
   - Sort by frequency or name

3. **Approval**
   - **As Canonical**: Creates new canonical skill
   - **As Variation**: Maps to existing canonical skill

4. **Rejection**
   - Provide reason for rejection
   - Skill is removed from queue

### Best Practices

- Review skills regularly to maintain dictionary quality
- Approve high-frequency skills first
- Use variations for common misspellings or alternate names
- Reject invalid or non-technical terms

## Testing

### Property-Based Tests

The feature includes 51 property-based tests using fast-check library:
- JD specification validation (Properties 1-5)
- Skill dictionary operations (Properties 6-13)
- Unknown skill queue (Properties 14-20)
- Correlation calculation (Properties 21-29)
- Weight validation (Property 30)
- Resume matching (Properties 31-38)
- Dictionary export/import (Properties 39-42)
- Skill statistics (Properties 43-48)
- Skill name validation (Properties 49-51)

### Running Tests

```bash
# Run all backend tests
cd packages/backend
npm test

# Run specific test file
npm test -- CanonicalJDSpec.property.test.ts

# Run with coverage
npm test -- --coverage
```

## Frontend Components

### JD Specification Management
- **JDSpecForm** - Create/edit JD specifications
- **JDSpecDisplay** - View JD specifications
- **JDSpecificationPage** - Full page with CRUD operations

### Dictionary Management
- **SkillDictionaryManager** - Manage canonical skills and variations
- **SkillDictionaryPage** - Dictionary management page

### Skill Review
- **SkillReviewQueue** - Review unknown skills
- **SkillReviewPage** - Skill review page

### Resume Matching
- **ResumeMatchSelector** - Select resumes with match rates
- Shows match percentage, layer breakdown, and skill details

### Statistics
- **SkillStatisticsDashboard** - View skill usage statistics
- **SkillStatisticsPage** - Statistics page

## Configuration

### Environment Variables

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=job-bid-manager

# API configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Dictionary Versioning

Dictionary versions follow semantic versioning: `YYYY.MAJOR`
- Year indicates the year of creation
- Major indicates significant changes

Example: `2024.1`, `2024.2`, `2025.1`

## Troubleshooting

### Common Issues

1. **Unknown skills not appearing in queue**
   - Check that JD creation was successful
   - Verify MongoDB connection
   - Check skill review queue repository

2. **Correlation calculation returns 0**
   - Verify both JD specifications exist
   - Check that skills are properly normalized
   - Ensure dictionary versions match

3. **Dictionary import fails**
   - Validate JSON structure
   - Check version compatibility
   - Verify allowVersionDowngrade flag

4. **Match rates not displaying**
   - Ensure JD specification has associated resumes
   - Check that resume metadata includes jdSpecId
   - Verify correlation calculation is working

## Performance Considerations

- Dictionary lookups are O(1) using hash maps
- Correlation calculation is O(n×m) where n and m are skill counts
- Statistics queries use MongoDB indexes for efficiency
- Frontend components use pagination for large datasets

## Security

- All API endpoints validate input data
- Dictionary import validates JSON structure
- Skill names are sanitized to prevent injection
- MongoDB queries use parameterized statements

## Future Enhancements

- Machine learning for skill similarity
- Automatic skill variation detection
- Skill taxonomy and hierarchies
- Historical trend analysis
- Skill demand forecasting
