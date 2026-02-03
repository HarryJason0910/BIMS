# Design Document: Role-Based Layer Weights for Match Rate Calculation

## Overview

This feature simplifies match rate calculation by storing layer weights directly in bids based on the selected role. No separate JD specification entity is needed.

### Key Concepts

1. **Role Determines Layer Weights**: Each role has predefined layer weights
2. **2D Skill Array**: Skills organized by layer `[[frontend], [backend], [database], [cloud], [devops], [others]]`
3. **User Customization**: Users can modify layer weights if defaults don't fit
4. **Simple Count-Based Matching**: Match rate = (matching skills) / (current skills) per layer

### Benefits

- **No JD Spec Entity**: Everything stored in the bid
- **Efficient Workflow**: Select role → paste 2D array from ChatGPT → done
- **Simple Matching**: Count-based skill overlap
- **Flexible**: Modify layer weights when needed

## Role Structure

### Format

**Standard Roles**: `{Seniority} {Basic Title}`
- Examples: "Lead Software Engineer", "Junior Frontend Developer", "Senior Backend Engineer"

**Full Stack Roles**: `{Seniority} {Modifier} Full Stack Engineer`
- Examples: "Senior Balanced Full Stack Engineer", "Mid Frontend Heavy Full Stack Engineer"

### Seniority Levels
- Junior
- Mid
- Senior
- Lead
- Staff

### Basic Titles
- Software Engineer
- Frontend Developer
- Backend Engineer
- Full Stack Engineer (requires modifier)
- QA Automation Engineer
- DevOps Engineer
- Data Engineer
- Mobile Developer

### Full Stack Modifiers (only for Full Stack Engineer)
- Balanced
- Frontend Heavy
- Backend Heavy

### Predefined Layer Weights by Role

```typescript
const ROLE_LAYER_WEIGHTS: Record<string, LayerWeights> = {
  // Software Engineer (general)
  'Software Engineer': {
    frontend: 0.25,
    backend: 0.40,
    database: 0.15,
    cloud: 0.10,
    devops: 0.05,
    others: 0.05
  },
  
  // Backend roles
  'Backend Engineer': {
    frontend: 0.05,
    backend: 0.60,
    database: 0.20,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Frontend roles
  'Frontend Developer': {
    frontend: 0.70,
    backend: 0.10,
    database: 0.05,
    cloud: 0.05,
    devops: 0.05,
    others: 0.05
  },
  
  // Full Stack - Balanced
  'Balanced Full Stack Engineer': {
    frontend: 0.35,
    backend: 0.35,
    database: 0.15,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Full Stack - Frontend Heavy
  'Frontend Heavy Full Stack Engineer': {
    frontend: 0.50,
    backend: 0.25,
    database: 0.10,
    cloud: 0.10,
    devops: 0.05,
    others: 0.00
  },
  
  // Full Stack - Backend Heavy
  'Backend Heavy Full Stack Engineer': {
    frontend: 0.25,
    backend: 0.50,
    database: 0.15,
    cloud: 0.05,
    devops: 0.05,
    others: 0.00
  },
  
  // QA roles
  'QA Automation Engineer': {
    frontend: 0.20,
    backend: 0.30,
    database: 0.10,
    cloud: 0.10,
    devops: 0.20,
    others: 0.10
  },
  
  // DevOps roles
  'DevOps Engineer': {
    frontend: 0.00,
    backend: 0.15,
    database: 0.10,
    cloud: 0.40,
    devops: 0.35,
    others: 0.00
  },
  
  // Data roles
  'Data Engineer': {
    frontend: 0.00,
    backend: 0.30,
    database: 0.50,
    cloud: 0.15,
    devops: 0.05,
    others: 0.00
  },
  
  // Mobile roles
  'Mobile Developer': {
    frontend: 0.60,
    backend: 0.15,
    database: 0.10,
    cloud: 0.10,
    devops: 0.00,
    others: 0.05
  }
};

// Note: Seniority level doesn't affect layer weights
// "Junior Backend Engineer" and "Senior Backend Engineer" use the same weights
```

## Input Format: Skills Object with Weights

Users provide skills organized by layer from ChatGPT as a JSON object with skill weights:

```typescript
// Format: Object with layer keys, each containing array of {skill, weight} objects
const mainStacks = {
  "frontend": [
    { "skill": "react", "weight": 0.5 },
    { "skill": "typescript", "weight": 0.3 },
    { "skill": "javascript", "weight": 0.2 }
  ],
  "backend": [
    { "skill": "python", "weight": 0.4 },
    { "skill": "fastapi", "weight": 0.3 },
    { "skill": "node.js", "weight": 0.3 }
  ],
  "database": [
    { "skill": "postgresql", "weight": 0.6 },
    { "skill": "nosql", "weight": 0.4 }
  ],
  "cloud": [
    { "skill": "aws", "weight": 0.6 },
    { "skill": "gcp", "weight": 0.2 },
    { "skill": "azure", "weight": 0.2 }
  ],
  "devops": [
    { "skill": "docker", "weight": 0.4 },
    { "skill": "ci/cd", "weight": 0.4 },
    { "skill": "git", "weight": 0.2 }
  ],
  "others": [
    { "skill": "web scraping", "weight": 0.4 },
    { "skill": "rest api design", "weight": 0.3 },
    { "skill": "automated testing", "weight": 0.2 },
    { "skill": "tdd", "weight": 0.1 }
  ]
};
```

**Rules**:
- Must be an object with exactly 6 keys: frontend, backend, database, cloud, devops, others
- Each key maps to an array of skill objects: `{ skill: string, weight: number }`
- Skill weights within each layer must sum to 1.0 (±0.001 tolerance)
- Any layer can be an empty array `[]`
- Skill names are case-insensitive for matching
- Keys must be lowercase

## Match Rate Calculation

### Weighted Product Formula

For each layer, calculate the sum of products for matching skills:

```
layerMatchScore = Σ (currentWeight × matchedWeight) for all matching skills
```

### Example

**Current JD** (Frontend layer):
```json
[
  { "skill": "react", "weight": 0.5 },
  { "skill": "typescript", "weight": 0.3 },
  { "skill": "javascript", "weight": 0.2 }
]
```
Weights sum: 0.5 + 0.3 + 0.2 = 1.0 ✓

**Matched JD** (Frontend layer):
```json
[
  { "skill": "react", "weight": 0.7 },
  { "skill": "vue", "weight": 0.3 }
]
```
Weights sum: 0.7 + 0.3 = 1.0 ✓

**Calculation**:
- React matches: 0.5 × 0.7 = 0.35
- TypeScript: no match in matched JD = 0
- JavaScript: no match in matched JD = 0
- Vue: exists in matched JD but not in current JD = not counted
- **Frontend layer score = 0.35**

**Another Example (Reverse)**:

**Current JD** (Frontend layer):
```json
[
  { "skill": "react", "weight": 0.7 },
  { "skill": "vue", "weight": 0.3 }
]
```

**Matched JD** (Frontend layer):
```json
[
  { "skill": "react", "weight": 0.5 },
  { "skill": "typescript", "weight": 0.3 },
  { "skill": "javascript", "weight": 0.2 }
]
```

**Calculation**:
- React matches: 0.7 × 0.5 = 0.35
- Vue: no match in matched JD = 0
- **Frontend layer score = 0.35**

Note: The score is the same in both directions when only React matches!

### Overall Match Rate

```
overallMatchRate = Σ (layerScore × layerWeight)
```

**Complete Example**:

Role: Senior Balanced Full Stack Engineer
- Frontend weight: 0.35, layer score: 0.35
- Backend weight: 0.35, layer score: 0.60
- Database weight: 0.15, layer score: 1.0
- Cloud weight: 0.10, layer score: 0.36
- DevOps weight: 0.05, layer score: 0.0
- Others weight: 0.00, layer score: 0.0

**Overall** = (0.35 × 0.35) + (0.60 × 0.35) + (1.0 × 0.15) + (0.36 × 0.10) + (0 × 0.05) + (0 × 0)
= 0.1225 + 0.21 + 0.15 + 0.036 + 0 + 0
= **0.5185 = 51.85%**

## Domain Model

### Updated Bid Entity

```typescript
interface SkillWeight {
  skill: string;
  weight: number;
}

interface LayerSkills {
  frontend: SkillWeight[];
  backend: SkillWeight[];
  database: SkillWeight[];
  cloud: SkillWeight[];
  devops: SkillWeight[];
  others: SkillWeight[];
}

class Bid {
  private readonly id: string;
  private readonly date: Date;
  private readonly link: string;
  private readonly company: string;
  private readonly client: string;
  private readonly role: string; // e.g., "Senior Balanced Full Stack Engineer"
  private readonly mainStacks: LayerSkills; // Object with layer keys, each containing weighted skills
  private readonly layerWeights: LayerWeights; // Stored with bid, can be customized
  private readonly jobDescriptionPath: string;
  private readonly resumePath: string;
  private bidStatus: BidStatus;
  // ... other fields
  
  // Helper methods
  getSkillsForLayer(layer: TechLayer): SkillWeight[];
  getAllSkills(): string[]; // Flattens all layers (skill names only)
  validateSkillWeights(): boolean; // Ensures weights sum to 1.0 per layer
}

interface LayerWeights {
  frontend: number;
  backend: number;
  database: number;
  cloud: number;
  devops: number;
  others: number;
}
```

### Role Service (Domain Service)

```typescript
class RoleService {
  /**
   * Get default layer weights for a role
   * Extracts the basic title from the full role string
   * 
   * Examples:
   * - "Senior Backend Engineer" → "Backend Engineer" → weights
   * - "Junior Frontend Heavy Full Stack Engineer" → "Frontend Heavy Full Stack Engineer" → weights
   */
  getDefaultLayerWeights(role: string): LayerWeights {
    // Extract basic title (remove seniority)
    const basicTitle = this.extractBasicTitle(role);
    
    const weights = ROLE_LAYER_WEIGHTS[basicTitle];
    if (!weights) {
      throw new Error(`Unknown role: ${basicTitle}`);
    }
    
    return weights;
  }
  
  private extractBasicTitle(role: string): string {
    // Remove seniority prefix
    const seniorities = ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'];
    for (const seniority of seniorities) {
      if (role.startsWith(seniority + ' ')) {
        return role.substring(seniority.length + 1);
      }
    }
    return role;
  }
  
  validateRole(role: string): boolean {
    try {
      this.getDefaultLayerWeights(role);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Match Rate Calculator

```typescript
class WeightedMatchRateCalculator {
  /**
   * Calculate match rate between two bids using weighted skill matching
   * 
   * @param currentBid - The current job description
   * @param matchedBid - The past job description to compare
   * @returns Match rate (0-1) and layer breakdown
   */
  calculate(currentBid: Bid, matchedBid: Bid): MatchResult {
    const layerBreakdown = new Map<TechLayer, LayerMatchResult>();
    let overallScore = 0;
    
    for (const layer of ALL_LAYERS) {
      const currentSkills = currentBid.getSkillsForLayer(layer);
      const matchedSkills = matchedBid.getSkillsForLayer(layer);
      const layerWeight = currentBid.getLayerWeight(layer);
      
      // Weighted product matching
      const layerScore = this.calculateLayerScore(currentSkills, matchedSkills);
      
      layerBreakdown.set(layer, {
        score: layerScore,
        matchingSkills: this.getMatchingSkills(currentSkills, matchedSkills),
        missingSkills: this.getMissingSkills(currentSkills, matchedSkills),
        layerWeight
      });
      
      overallScore += layerScore * layerWeight;
    }
    
    return {
      overallMatchRate: overallScore,
      layerBreakdown
    };
  }
  
  /**
   * Calculate layer score using weighted product formula
   * 
   * layerScore = Σ (currentWeight × matchedWeight) for matching skills
   */
  private calculateLayerScore(
    currentSkills: SkillWeight[], 
    matchedSkills: SkillWeight[]
  ): number {
    if (currentSkills.length === 0) return 0;
    
    // Create map for O(1) lookup
    const matchedMap = new Map<string, number>();
    for (const { skill, weight } of matchedSkills) {
      matchedMap.set(skill.toLowerCase(), weight);
    }
    
    let layerScore = 0;
    for (const { skill, weight: currentWeight } of currentSkills) {
      const matchedWeight = matchedMap.get(skill.toLowerCase());
      if (matchedWeight !== undefined) {
        layerScore += currentWeight * matchedWeight;
      }
    }
    
    return layerScore;
  }
  
  private getMatchingSkills(
    current: SkillWeight[], 
    matched: SkillWeight[]
  ): string[] {
    const matchedSet = new Set(matched.map(s => s.skill.toLowerCase()));
    return current
      .filter(s => matchedSet.has(s.skill.toLowerCase()))
      .map(s => s.skill);
  }
  
  private getMissingSkills(
    current: SkillWeight[], 
    matched: SkillWeight[]
  ): string[] {
    const matchedSet = new Set(matched.map(s => s.skill.toLowerCase()));
    return current
      .filter(s => !matchedSet.has(s.skill.toLowerCase()))
      .map(s => s.skill);
  }
}
```

## API Changes

### Create Bid (Enhanced)

```typescript
POST /api/bids
{
  link: string;
  company: string;
  client: string;
  role: string; // "Senior Balanced Full Stack Engineer"
  mainStacks: {
    frontend: Array<{ skill: string, weight: number }>;
    backend: Array<{ skill: string, weight: number }>;
    database: Array<{ skill: string, weight: number }>;
    cloud: Array<{ skill: string, weight: number }>;
    devops: Array<{ skill: string, weight: number }>;
    others: Array<{ skill: string, weight: number }>;
  };
  layerWeights?: LayerWeights; // Optional - defaults from role
  jobDescription: string;
  resumeFile: File;
  origin: BidOrigin;
  recruiter?: string;
}

Response:
{
  bid: Bid; // Contains role, mainStacks, and layerWeights
}
```

### Calculate Match Rate

```typescript
GET /api/bids/match-rate?currentBidId=X

// Compares current bid against all other bids
// Uses layerWeights from current bid

Response:
{
  matchRates: [
    {
      bidId: string;
      company: string;
      role: string;
      matchRate: number; // 0-1
      matchRatePercentage: number; // 0-100
      layerBreakdown: {
        frontend: { matchRate: 0.8, matchingSkills: [...], missingSkills: [...], weight: 0.35 },
        backend: { matchRate: 0.6, matchingSkills: [...], missingSkills: [...], weight: 0.35 },
        ...
      }
    }
  ]
}
```

## Frontend Changes

### Role Selector Component

```typescript
// Seniority dropdown
<FormControl fullWidth>
  <InputLabel>Seniority</InputLabel>
  <Select value={seniority} onChange={handleSeniorityChange}>
    <MenuItem value="Junior">Junior</MenuItem>
    <MenuItem value="Mid">Mid</MenuItem>
    <MenuItem value="Senior">Senior</MenuItem>
    <MenuItem value="Lead">Lead</MenuItem>
    <MenuItem value="Staff">Staff</MenuItem>
  </Select>
</FormControl>

// Basic title dropdown
<FormControl fullWidth>
  <InputLabel>Title</InputLabel>
  <Select value={basicTitle} onChange={handleBasicTitleChange}>
    <MenuItem value="Software Engineer">Software Engineer</MenuItem>
    <MenuItem value="Backend Engineer">Backend Engineer</MenuItem>
    <MenuItem value="Frontend Developer">Frontend Developer</MenuItem>
    <MenuItem value="Full Stack Engineer">Full Stack Engineer</MenuItem>
    <MenuItem value="QA Automation Engineer">QA Automation Engineer</MenuItem>
    <MenuItem value="DevOps Engineer">DevOps Engineer</MenuItem>
    <MenuItem value="Data Engineer">Data Engineer</MenuItem>
    <MenuItem value="Mobile Developer">Mobile Developer</MenuItem>
  </Select>
</FormControl>

// Full Stack modifier (only shown when basicTitle === 'Full Stack Engineer')
{basicTitle === 'Full Stack Engineer' && (
  <FormControl fullWidth>
    <InputLabel>Full Stack Type</InputLabel>
    <Select value={fullStackModifier} onChange={handleModifierChange}>
      <MenuItem value="Balanced">Balanced</MenuItem>
      <MenuItem value="Frontend Heavy">Frontend Heavy</MenuItem>
      <MenuItem value="Backend Heavy">Backend Heavy</MenuItem>
    </Select>
  </FormControl>
)}

// Computed role display
<Typography variant="body2">
  Role: {seniority} {fullStackModifier} {basicTitle}
  {/* e.g., "Senior Balanced Full Stack Engineer" */}
</Typography>
```

### Layer Weights Editor (Optional Customization)

```typescript
<Accordion>
  <AccordionSummary>
    <Typography>Customize Layer Weights (Optional)</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Frontend"
          type="number"
          value={layerWeights.frontend}
          onChange={(e) => handleWeightChange('frontend', e.target.value)}
          inputProps={{ min: 0, max: 1, step: 0.05 }}
        />
      </Grid>
      {/* Repeat for other layers */}
    </Grid>
    <Typography variant="caption" color={weightsSum === 1.0 ? 'success' : 'error'}>
      Total: {weightsSum.toFixed(2)} (must equal 1.0)
    </Typography>
  </AccordionDetails>
</Accordion>
```

### Main Stacks Input

```typescript
<TextField
  fullWidth
  label="Main Stacks (JSON Object with Weights from ChatGPT)"
  multiline
  rows={15}
  value={mainStacksInput}
  onChange={handleMainStacksChange}
  placeholder={`Paste JSON object from ChatGPT:
{
  "frontend": [
    { "skill": "react", "weight": 0.5 },
    { "skill": "typescript", "weight": 0.3 },
    { "skill": "javascript", "weight": 0.2 }
  ],
  "backend": [
    { "skill": "python", "weight": 0.4 },
    { "skill": "fastapi", "weight": 0.6 }
  ],
  "database": [
    { "skill": "postgresql", "weight": 1.0 }
  ],
  "cloud": [
    { "skill": "aws", "weight": 1.0 }
  ],
  "devops": [],
  "others": []
}`}
  helperText="Format: JSON object with weighted skills. Weights per layer must sum to 1.0"
/>
```

## Migration Strategy

### Backward Compatibility

1. **Existing Bids**: Keep flat `mainStacks` array (string[])
2. **New Bids**: Use object `mainStacks` with weighted skills
3. **Detection**: Check if `mainStacks` is an object or array

```typescript
function isLegacyBid(bid: Bid): boolean {
  return Array.isArray(bid.mainStacks);
}

function migrateBid(bid: Bid): Bid {
  if (isLegacyBid(bid)) {
    // Convert flat array to weighted object (all skills go to "others" layer with equal weights)
    const skills = bid.mainStacks as string[];
    const weight = skills.length > 0 ? 1.0 / skills.length : 0;
    
    return {
      ...bid,
      mainStacks: {
        frontend: [],
        backend: [],
        database: [],
        cloud: [],
        devops: [],
        others: skills.map(skill => ({ skill, weight }))
      }
    };
  }
  return bid;
}
```

## Correctness Properties

### Property 1: Layer Weights Sum to 1.0
```
∀ role ∈ Roles: sum(layerWeights(role)) = 1.0 (±0.001)
```

### Property 2: Match Rate Bounds
```
∀ currentJD, matchedJD: 0 ≤ matchRate(currentJD, matchedJD) ≤ 1.0
```

### Property 3: Perfect Match
```
∀ JD: matchRate(JD, JD) = 1.0
```

### Property 4: Subset Match
```
If currentJD.skills ⊆ matchedJD.skills for all layers:
  matchRate(currentJD, matchedJD) = 1.0
```

### Property 5: Disjoint Match
```
If currentJD.skills ∩ matchedJD.skills = ∅ for all layers:
  matchRate(currentJD, matchedJD) = 0.0
```

### Property 6: Symmetry Not Required
```
matchRate(A, B) ≠ matchRate(B, A) in general
```

### Property 7: Skills Object Structure with Weights
```
∀ bid: bid.mainStacks has keys {frontend, backend, database, cloud, devops, others} ∧ 
       ∀ key: Array.isArray(bid.mainStacks[key]) ∧
       ∀ skill ∈ bid.mainStacks[key]: skill has {skill: string, weight: number}
```

### Property 8: Skill Weights Sum to 1.0 Per Layer
```
∀ bid, ∀ layer: sum(skill.weight for skill in bid.mainStacks[layer]) = 1.0 (±0.001)
  OR bid.mainStacks[layer].length = 0
```

## Implementation Tasks

See `tasks.md` for detailed implementation checklist.
