# Design Document: Resume Selection from History

## Overview

The Resume Selection from History feature extends the existing bid creation workflow by enabling users to select previously saved resumes based on tech stack matching. The design follows clean architecture principles with clear separation between domain logic (tech stack matching), application orchestration (use cases), infrastructure (file system access), and presentation (React UI).

The core innovation is a tech stack matching algorithm that calculates relevance scores, allowing users to quickly identify the most suitable resume from potentially hundreds of saved files. The system maintains backward compatibility by treating resume selection as an alternative input method alongside the existing file upload.

## Architecture

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components: BidForm,            │
│   ResumeSelector, ResumePreview)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Application Layer                │
│  (Use Cases: GetMatchingResumes,        │
│   GetResumeFile, CreateBidWithResume)   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Domain Layer                   │
│  (TechStack, ResumeMetadata,            │
│   StackMatchCalculator)                 │
└─────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Infrastructure Layer               │
│  (FileSystemResumeRepository,           │
│   ResumeController)                     │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Tech Stack Matching in Domain Layer**: The matching algorithm is pure domain logic, operating on in-memory data structures without file system dependencies.

2. **Resume Metadata as Value Object**: Resume metadata (company, role, stack, path) is represented as an immutable value object in the domain layer.

3. **Repository Pattern for File Access**: File system operations are abstracted behind a repository interface, allowing for in-memory implementations during testing.

4. **Dual Input Strategy**: The BidForm supports both file upload and resume selection as mutually exclusive options, maintaining backward compatibility.

5. **Lazy Loading**: Resume files are only fetched when previewed or submitted, not during the initial metadata retrieval.

## Components and Interfaces

### Domain Layer

#### TechStack (Existing)

```typescript
class TechStack {
  constructor(private readonly technologies: string[]) {}
  
  getTechnologies(): string[] {
    return [...this.technologies];
  }
  
  contains(technology: string): boolean {
    return this.technologies
      .map(t => t.toLowerCase())
      .includes(technology.toLowerCase());
  }
  
  overlapWith(other: TechStack): number {
    const otherTechs = other.getTechnologies();
    const matches = otherTechs.filter(tech => this.contains(tech));
    return matches.length;
  }
}
```

#### ResumeMetadata (New)

```typescript
class ResumeMetadata {
  constructor(
    private readonly id: string,
    private readonly company: string,
    private readonly role: string,
    private readonly techStack: TechStack,
    private readonly filePath: string,
    private readonly createdAt: Date
  ) {}
  
  getId(): string { return this.id; }
  getCompany(): string { return this.company; }
  getRole(): string { return this.role; }
  getTechStack(): TechStack { return this.techStack; }
  getFilePath(): string { return this.filePath; }
  getCreatedAt(): Date { return this.createdAt; }
}
```

#### StackMatchCalculator (New)

```typescript
class StackMatchCalculator {
  calculateScore(targetStack: TechStack, resumeStack: TechStack): number {
    const targetTechs = targetStack.getTechnologies();
    const resumeTechs = resumeStack.getTechnologies();
    
    if (targetTechs.length === 0)