# Canonical Skill Normalization

## Overview

The system uses **canonical skill normalization** to ensure consistent and accurate resume matching. This approach maps different variations of the same technology to a single canonical form, eliminating false negatives caused by naming variations.

## How It Works

### 1. Skill Variations → Canonical Form

Different representations of the same skill are mapped to a canonical name:

```
".NET Core" → "dotnet"
"ASP.NET"   → "dotnet"
".net"      → "dotnet"

"Spring Boot" → "springboot"
"spring boot" → "springboot"

"React"    → "react"
"ReactJS"  → "react"
"react.js" → "react"
```

### 2. Matching Process

When comparing job requirements with resume skills:

1. **Input**: Job requires `[".NET Core", "React", "AWS Lambda"]`
2. **Normalization**: Converts to `["dotnet", "react", "lambda"]`
3. **Resume**: Has `["ASP.NET", "ReactJS", "Lambda"]`
4. **Normalization**: Converts to `["dotnet", "react", "lambda"]`
5. **Result**: **100% match** ✅

Without canonical normalization, this would be 0% match ❌

### 3. Benefits

- **Accurate Matching**: "Spring Boot" matches "spring boot" and "springboot"
- **No False Negatives**: Different naming conventions don't prevent matches
- **Deterministic**: Same input always produces same output
- **Explainable**: Every match can be traced to specific canonical skills
- **No AI Required**: Pure rule-based mapping, no API keys needed

## Implementation

### Domain Layer

**`CanonicalSkillMapper`** - Maps skill variations to canonical forms
- 200+ canonical skills with variations
- Case-insensitive matching
- Deduplication after normalization

**`TechStackValue`** - Uses canonical normalization for matching
- Stores both original and canonical forms
- Provides `getMatchingTechnologies()` and `getMissingTechnologies()`

### Application Layer

**`GetMatchingResumesUseCase`** - Returns matched and missing skills
- Calculates match percentage using canonical skills
- Returns which skills matched and which are missing

### Presentation Layer

**`ResumeCard`** - Visual display of skill matching
- ✅ Green chips for matched skills
- ❌ Red chips for missing skills
- Gray chips for all resume skills

## Example

### Job Requirements
```
["Java", "Spring Boot", "AWS", "Kubernetes"]
```

### Resume A
```
["java", "springboot", "aws", "docker"]
```

### Match Result
- **Score**: 75% (3 out of 4 matched)
- **Matched**: `["java", "springboot", "aws"]` ✅
- **Missing**: `["kubernetes"]` ❌
- **Extra**: `["docker"]` (shown in resume tech stack)

## Adding New Canonical Mappings

To add a new canonical skill mapping, edit `CanonicalSkillMapper.ts`:

```typescript
["newcanonical", ["variation1", "variation 2", "var3"]],
```

Example:
```typescript
["vuejs", ["vue", "vuejs", "vue.js", "vue 3"]],
```

## Testing

Run canonical skill tests:
```bash
npm test CanonicalSkillMapper.test.ts
```

## Design Principles

1. **Canonical Matching Only** - No embeddings, no AI, no black-box scoring
2. **Human-in-the-Loop** - System ranks, user decides
3. **Explainability** - Every match is traceable
4. **Offline-Friendly** - No API keys required
5. **Deterministic** - Same input = same output

## Future Enhancements

- User-defined canonical mappings
- Skill synonym suggestions
- Canonical skill analytics
- Import/export canonical mappings
