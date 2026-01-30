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
    
    if (targetTechs.length === 0) return 0;
    
    const overlap = targetStack.overlapWith(resumeStack);
    const overlapPercentage = (overlap / targetTechs.length) * 100;
    
    // Exact match or superset gets 100
    if (overlap === targetTechs.length) return 100;
    
    // Partial match gets proportional score (50-99)
    if (overlap > 0) return Math.max(50, Math.floor(overlapPercentage));
    
    // No match gets 0
    return 0;
  }
  
  sortByScore(
    resumes: ResumeMetadata[], 
    targetStack: TechStack
  ): Array<{ metadata: ResumeMetadata; score: number }> {
    const scored = resumes.map(resume => ({
      metadata: resume,
      score: this.calculateScore(targetStack, resume.getTechStack())
    }));
    
    // Sort by score descending, then by date descending for ties
    return scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.metadata.getCreatedAt().getTime() - a.metadata.getCreatedAt().getTime();
    });
  }
}
```

### Application Layer

#### GetMatchingResumesUseCase (New)

```typescript
interface IResumeRepository {
  getAllResumeMetadata(): Promise<ResumeMetadata[]>;
  getResumeFile(resumeId: string): Promise<Buffer>;
  fileExists(filePath: string): Promise<boolean>;
}

class GetMatchingResumesUseCase {
  constructor(
    private readonly resumeRepository: IResumeRepository,
    private readonly calculator: StackMatchCalculator
  ) {}
  
  async execute(targetTechStack: string[]): Promise<Array<{
    id: string;
    company: string;
    role: string;
    techStack: string[];
    score: number;
    createdAt: Date;
  }>> {
    const targetStack = new TechStack(targetTechStack);
    const allResumes = await this.resumeRepository.getAllResumeMetadata();
    
    const scored = this.calculator.sortByScore(allResumes, targetStack);
    
    // Return top 30 matches
    return scored
      .slice(0, 30)
      .map(item => ({
        id: item.metadata.getId(),
        company: item.metadata.getCompany(),
        role: item.metadata.getRole(),
        techStack: item.metadata.getTechStack().getTechnologies(),
        score: item.score,
        createdAt: item.metadata.getCreatedAt()
      }));
  }
}
```

#### GetResumeFileUseCase (New)

```typescript
class GetResumeFileUseCase {
  constructor(private readonly resumeRepository: IResumeRepository) {}
  
  async execute(resumeId: string): Promise<Buffer> {
    return await this.resumeRepository.getResumeFile(resumeId);
  }
}
```

#### CreateBidWithResumeUseCase (Modified)

```typescript
class CreateBidWithResumeUseCase {
  constructor(
    private readonly bidRepository: IBidRepository,
    private readonly resumeRepository: IResumeRepository
  ) {}
  
  async execute(bidData: {
    company: string;
    role: string;
    techStack: string[];
    resumeId?: string;
    uploadedFile?: Buffer;
  }): Promise<Bid> {
    // Validate that resume still exists if using selected resume
    if (bidData.resumeId) {
      const metadata = await this.resumeRepository.getAllResumeMetadata();
      const selectedResume = metadata.find(m => m.getId() === bidData.resumeId);
      
      if (!selectedResume) {
        throw new Error('Selected resume no longer exists');
      }
      
      const exists = await this.resumeRepository.fileExists(
        selectedResume.getFilePath()
      );
      
      if (!exists) {
        throw new Error('Resume file not found');
      }
    }
    
    // Create bid with resume reference or uploaded file
    const bid = new Bid(/* ... bid creation logic ... */);
    return await this.bidRepository.save(bid);
  }
}
```

### Infrastructure Layer

#### FileSystemResumeRepository (New)

```typescript
class FileSystemResumeRepository implements IResumeRepository {
  constructor(private readonly uploadDirectory: string) {}
  
  async getAllResumeMetadata(): Promise<ResumeMetadata[]> {
    const directories = await fs.readdir(this.uploadDirectory);
    const metadata: ResumeMetadata[] = [];
    
    for (const dir of directories) {
      const parsed = this.parseDirectoryName(dir);
      if (!parsed) continue;
      
      const filePath = path.join(this.uploadDirectory, dir, 'resume.pdf');
      const exists = await this.fileExists(filePath);
      if (!exists) continue;
      
      const stats = await fs.stat(filePath);
      const id = this.generateId(filePath);
      
      metadata.push(new ResumeMetadata(
        id,
        parsed.company,
        parsed.role,
        new TechStack(parsed.techStack),
        filePath,
        stats.birthtime
      ));
    }
    
    return metadata;
  }
  
  private parseDirectoryName(dirName: string): {
    company: string;
    role: string;
    techStack: string[];
  } | null {
    // Parse format: {company}_{role}_{stack}
    // Example: "Google_Senior Engineer_React,AWS,Lambda"
    const parts = dirName.split('_');
    if (parts.length < 3) return null;
    
    const company = parts[0];
    const role = parts[1];
    const stackString = parts.slice(2).join('_');
    const techStack = stackString.split(',').map(s => s.trim());
    
    return { company, role, techStack };
  }
  
  private generateId(filePath: string): string {
    // Generate deterministic ID from file path
    return Buffer.from(filePath).toString('base64');
  }
  
  async getResumeFile(resumeId: string): Promise<Buffer> {
    const filePath = Buffer.from(resumeId, 'base64').toString('utf-8');
    return await fs.readFile(filePath);
  }
  
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### ResumeController (New)

```typescript
class ResumeController {
  constructor(
    private readonly getMatchingResumes: GetMatchingResumesUseCase,
    private readonly getResumeFile: GetResumeFileUseCase
  ) {}
  
  async getMetadata(req: Request, res: Response): Promise<void> {
    try {
      const techStack = req.query.techStack as string;
      if (!techStack) {
        res.status(400).json({ error: 'Tech stack is required' });
        return;
      }
      
      const techStackArray = techStack.split(',').map(s => s.trim());
      const results = await this.getMatchingResumes.execute(techStackArray);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve resume metadata' });
    }
  }
  
  async getFile(req: Request, res: Response): Promise<void> {
    try {
      const { resumeId } = req.params;
      const fileBuffer = await this.getResumeFile.execute(resumeId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ error: 'Resume file not found' });
    }
  }
}
```

### Presentation Layer

#### ResumeSelector Component (New)

```typescript
interface ResumeSelectorProps {
  techStack: string[];
  onResumeSelected: (resumeId: string) => void;
  disabled: boolean;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  techStack,
  onResumeSelected,
  disabled
}) => {
  const [resumes, setResumes] = useState<ResumeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  useEffect(() => {
    if (techStack.length === 0 || disabled) return;
    
    const fetchResumes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/resumes/metadata?techStack=${techStack.join(',')}`
        );
        const data = await response.json();
        setResumes(data);
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchResumes, 500);
    return () => clearTimeout(debounceTimer);
  }, [techStack, disabled]);
  
  const handleSelect = (resumeId: string) => {
    setSelectedId(resumeId);
    onResumeSelected(resumeId);
  };
  
  if (disabled) {
    return <div>Enter tech stack to see matching resumes</div>;
  }
  
  if (loading) {
    return <div>Loading matching resumes...</div>;
  }
  
  if (resumes.length === 0) {
    return <div>No matching resumes found. Upload a new resume.</div>;
  }
  
  return (
    <div className="resume-selector">
      <h3>Select from {resumes.length} matching resumes</h3>
      <div className="resume-list">
        {resumes.map(resume => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            selected={selectedId === resume.id}
            onSelect={() => handleSelect(resume.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Modified BidForm Component

```typescript
const BidForm: React.FC = () => {
  const [inputMode, setInputMode] = useState<'upload' | 'select'>('upload');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const handleModeChange = (mode: 'upload' | 'select') => {
    setInputMode(mode);
    setSelectedResumeId(null);
    setUploadedFile(null);
  };
  
  const handleResumeSelected = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setUploadedFile(null);
  };
  
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setSelectedResumeId(null);
  };
  
  return (
    <form>
      {/* Existing form fields */}
      <TechStackInput value={techStack} onChange={setTechStack} />
      
      {/* Resume input mode selector */}
      <div className="resume-input-mode">
        <button
          type="button"
          onClick={() => handleModeChange('upload')}
          className={inputMode === 'upload' ? 'active' : ''}
        >
          Upload New Resume
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('select')}
          className={inputMode === 'select' ? 'active' : ''}
          disabled={techStack.length === 0}
        >
          Select from History
        </button>
      </div>
      
      {/* Conditional rendering based on mode */}
      {inputMode === 'upload' && (
        <FileUpload onFileSelected={handleFileUpload} />
      )}
      
      {inputMode === 'select' && (
        <ResumeSelector
          techStack={techStack}
          onResumeSelected={handleResumeSelected}
          disabled={techStack.length === 0}
        />
      )}
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={!selectedResumeId && !uploadedFile}
      >
        Create Bid
      </button>
    </form>
  );
};
```

## Data Models

### Resume Metadata Structure

```typescript
interface ResumeMetadataDTO {
  id: string;              // Base64 encoded file path
  company: string;         // Extracted from directory name
  role: string;            // Extracted from directory name
  techStack: string[];     // Parsed from directory name
  score: number;           // Calculated match score (0-100)
  createdAt: Date;         // File creation timestamp
}
```

### Directory Structure

```
packages/backend/uploads/
├── Google_Senior Engineer_React,TypeScript,AWS/
│   └── resume.pdf
├── Amazon_Software Developer_Java,Spring,Microservices/
│   └── resume.pdf
└── Microsoft_Frontend Engineer_React,Redux,Jest/
    └── resume.pdf
```

### API Endpoints

**GET /api/resumes/metadata**
- Query Parameters: `techStack` (comma-separated string)
- Response: Array of `ResumeMetadataDTO` sorted by score
- Status Codes: 200 (success), 400 (missing tech stack), 500 (server error)

**GET /api/resumes/file/:resumeId**
- Path Parameters: `resumeId` (base64 encoded file path)
- Response: PDF file buffer
- Headers: `Content-Type: application/pdf`, `Content-Disposition: inline`
- Status Codes: 200 (success), 404 (file not found), 500 (server error)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Metadata Retrieval Completeness

*For any* valid upload directory structure, retrieving resume metadata should return all resumes that have valid directory names and existing resume.pdf files.

**Validates: Requirements 1.1, 1.2**

### Property 2: Tech Stack Scoring Correctness

*For any* target tech stack and resume tech stack:
- If the resume stack contains all target technologies (exact match or superset), the score should be 100
- If the resume stack contains no target technologies, the score should be 0
- If the resume stack contains some target technologies, the score should be proportional to the overlap percentage (50-99)
- Scoring should be case-insensitive (e.g., "React" matches "react")

**Validates: Requirements 1.3, 1.4, 5.1, 5.2, 5.4, 5.5**

### Property 3: Result Sorting Consistency

*For any* list of resume matches, the results should be sorted by Stack_Match_Score in descending order, with ties broken by creation date (most recent first).

**Validates: Requirements 1.5, 5.3**

### Property 4: Mutual Exclusivity of Input Modes

*For any* BidForm state, when a resume is selected from history, the file upload option should be disabled, and when a file is uploaded, the resume selection option should be disabled.

**Validates: Requirements 2.4, 2.5**

### Property 5: Resume Display Completeness

*For any* resume metadata object, the rendered display should contain the company name, role, tech stack, and Stack_Match_Score.

**Validates: Requirements 2.3**

### Property 6: API Metadata Response Format

*For any* tech stack query parameter, the GET /api/resumes/metadata endpoint should return a JSON array of resume metadata objects sorted by Stack_Match_Score in descending order.

**Validates: Requirements 4.2**

### Property 7: API File Retrieval Success

*For any* valid resumeId, the GET /api/resumes/file/:resumeId endpoint should return a PDF file with Content-Type header set to "application/pdf".

**Validates: Requirements 4.4**

### Property 8: API File Retrieval Error Handling

*For any* invalid or non-existent resumeId, the GET /api/resumes/file/:resumeId endpoint should return a 404 status code with a descriptive error message.

**Validates: Requirements 4.5**

### Property 9: Bid Submission with Resume Reference

*For any* bid submitted with a selected resume, the bid data should include the resume file path, and no duplicate file should be created in the upload directory.

**Validates: Requirements 7.1, 7.2**

### Property 10: Resume Existence Validation

*For any* bid submission with a selected resume, the system should validate that the resume file still exists before completing the submission, and should return an error if the file is missing.

**Validates: Requirements 7.3, 7.4**

### Property 11: Bid-Resume Association Persistence

*For any* successfully submitted bid with a selected resume, querying the bid should return the associated resume file path.

**Validates: Requirements 7.5**

### Property 12: Backward Compatibility for File Upload

*For any* bid created using the file upload option (not resume selection), the system should save the file to the Upload_Directory using the existing naming convention: {company}_{role}_{techStack}/resume.pdf.

**Validates: Requirements 9.1, 9.2**

### Property 13: Resume Display Consistency

*For any* bid, the resume information should display correctly regardless of whether the resume was uploaded or selected from history.

**Validates: Requirements 9.4**

### Property 14: Graceful Degradation on API Failure

*For any* API error when fetching resume metadata, the BidForm should fall back to file upload mode without breaking the form functionality.

**Validates: Requirements 9.5**

### Property 15: API Call Debouncing

*For any* sequence of rapid tech stack input changes, the system should debounce API calls such that only the final value (after a delay) triggers a metadata fetch.

**Validates: Requirements 10.4**

### Property 16: Resume Preview Caching

*For any* resume file that has been previewed, subsequent preview requests for the same resume should use cached data rather than fetching from the backend again.

**Validates: Requirements 10.5**

## Error Handling

### Domain Layer Errors

1. **Invalid Tech Stack**: If an empty tech stack is provided to `StackMatchCalculator`, it should return a score of 0 for all resumes.

2. **Malformed Directory Names**: If a directory name doesn't follow the expected format, the parser should skip it and continue processing other directories.

### Application Layer Errors

1. **Resume Not Found**: If a selected resume no longer exists when submitting a bid, throw a descriptive error: "Selected resume no longer exists".

2. **File Access Errors**: If the file system cannot be accessed, throw an error: "Failed to retrieve resume metadata".

3. **Invalid Resume ID**: If a resume ID cannot be decoded or doesn't correspond to a valid file path, throw an error: "Invalid resume ID".

### Infrastructure Layer Errors

1. **File System Errors**: Wrap all file system operations in try-catch blocks and convert to domain-appropriate errors.

2. **Missing Upload Directory**: If the upload directory doesn't exist, return an empty array rather than throwing an error.

### Presentation Layer Errors

1. **API Failures**: Display user-friendly error messages when API calls fail, and fall back to file upload mode.

2. **Network Timeouts**: Show a loading state with a timeout, then display an error message if the request takes too long.

3. **Invalid File Types**: Validate that uploaded files are PDFs before allowing submission.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using fast-check

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property using a comment tag
- Tag format: `// Feature: resume-selection-from-history, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import * as fc from 'fast-check';

describe('StackMatchCalculator', () => {
  // Feature: resume-selection-from-history, Property 2: Tech Stack Scoring Correctness
  it('should score exact matches as 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (technologies) => {
          const targetStack = new TechStack(technologies);
          const resumeStack = new TechStack(technologies);
          const calculator = new StackMatchCalculator();
          
          const score = calculator.calculateScore(targetStack, resumeStack);
          
          expect(score).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

Unit tests should focus on:

1. **Specific Examples**: Test concrete scenarios like "React, AWS, Lambda" matching "React, AWS"
2. **Edge Cases**: Empty tech stacks, single-technology stacks, very long tech stacks
3. **Error Conditions**: Missing files, invalid directory names, malformed resume IDs
4. **Integration Points**: API endpoint responses, React component rendering, file system operations

### Property Testing Focus Areas

Property tests should focus on:

1. **Scoring Algorithm**: Verify scoring rules hold for all possible tech stack combinations
2. **Sorting Consistency**: Verify results are always sorted correctly regardless of input
3. **Case Insensitivity**: Verify matching works regardless of case variations
4. **Mutual Exclusivity**: Verify UI state constraints hold for all user interactions
5. **Data Integrity**: Verify bid-resume associations persist correctly
6. **Backward Compatibility**: Verify file upload flow works identically to before

### Test Organization

```
packages/backend/src/
├── domain/
│   ├── __tests__/
│   │   ├── TechStack.test.ts (unit + property tests)
│   │   ├── ResumeMetadata.test.ts (unit tests)
│   │   └── StackMatchCalculator.test.ts (unit + property tests)
├── application/
│   ├── __tests__/
│   │   ├── GetMatchingResumesUseCase.test.ts (unit + property tests)
│   │   ├── GetResumeFileUseCase.test.ts (unit tests)
│   │   └── CreateBidWithResumeUseCase.test.ts (unit + property tests)
└── infrastructure/
    └── __tests__/
        ├── FileSystemResumeRepository.test.ts (unit tests)
        └── ResumeController.test.ts (unit tests)

packages/frontend/src/
└── components/
    └── __tests__/
        ├── ResumeSelector.test.tsx (unit + property tests)
        ├── BidForm.test.tsx (unit + property tests)
        └── ResumePreview.test.tsx (unit tests)
```

### Coverage Goals

- **Domain Layer**: 100% coverage with heavy emphasis on property tests
- **Application Layer**: 90%+ coverage with mix of unit and property tests
- **Infrastructure Layer**: 80%+ coverage with focus on unit tests and error handling
- **Presentation Layer**: 80%+ coverage with focus on user interactions and state management
