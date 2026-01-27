# Contributing Guide

Thank you for contributing to the Job Bid and Interview Management System!

## Development Principles

This project follows **Clean Architecture** and **Domain-Driven Design** principles:

1. **Domain Layer**: Pure business logic with NO infrastructure dependencies
2. **Application Layer**: Use cases that orchestrate domain objects
3. **Infrastructure Layer**: Implements interfaces defined by application layer
4. **Presentation Layer**: UI components that interact with application layer

### Key Rules

- Domain code must be pure TypeScript with no framework dependencies
- No persistence annotations in domain models
- Business logic lives ONLY in the domain layer
- Infrastructure depends on domain, never the reverse
- Use dependency inversion for all external dependencies

## Code Style

We use ESLint and Prettier to maintain consistent code style.

### Before Committing

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

### TypeScript Guidelines

- Use strict mode (already configured)
- Prefer interfaces for public contracts
- Use types for unions and intersections
- Avoid `any` - use `unknown` if type is truly unknown
- Use explicit return types for public methods

### Naming Conventions

- **Classes**: PascalCase (e.g., `BidAggregate`, `CreateBidUseCase`)
- **Interfaces**: PascalCase with `I` prefix for infrastructure interfaces (e.g., `IBidRepository`)
- **Functions/Methods**: camelCase (e.g., `createBid`, `markAsRejected`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Files**: kebab-case (e.g., `bid-aggregate.ts`, `create-bid-use-case.ts`)

## Testing

### Test Types

1. **Unit Tests**: Test individual functions and classes in isolation
2. **Property-Based Tests**: Test universal properties with fast-check
3. **Integration Tests**: Test infrastructure components with real dependencies
4. **End-to-End Tests**: Test complete workflows

### Writing Tests

#### Unit Tests

```typescript
describe('BidAggregate', () => {
  it('should initialize with NEW status', () => {
    const bid = Bid.create({
      link: 'https://example.com/job',
      company: 'Acme Corp',
      // ... other fields
    });
    
    expect(bid.bidStatus).toBe(BidStatus.NEW);
  });
});
```

#### Property-Based Tests

```typescript
import * as fc from 'fast-check';

describe('Property: Bid Creation Date Initialization', () => {
  it('should set date to today for any valid bid creation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (link, company) => {
          const today = new Date();
          const bid = Bid.create({ link, company, /* ... */ });
          
          const bidDate = new Date(bid.date);
          return (
            bidDate.getFullYear() === today.getFullYear() &&
            bidDate.getMonth() === today.getMonth() &&
            bidDate.getDate() === today.getDate()
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
src/
├── domain/
│   ├── bid/
│   │   ├── bid.ts
│   │   ├── bid.test.ts           # Unit tests
│   │   └── bid.property.test.ts  # Property tests
│   └── ...
├── application/
│   ├── use-cases/
│   │   ├── create-bid.ts
│   │   └── create-bid.test.ts
│   └── ...
└── infrastructure/
    ├── repositories/
    │   ├── mongodb-bid-repository.ts
    │   └── mongodb-bid-repository.integration.test.ts
    └── ...
```

## Git Workflow

### Branch Naming

- `feature/task-X-description` - For new features
- `fix/issue-description` - For bug fixes
- `refactor/description` - For refactoring
- `test/description` - For adding tests

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks

Examples:
```
feat(domain): implement Bid aggregate with state transitions

- Add BidStatus enum
- Implement create() factory method
- Add state transition methods
- Enforce invariants

Validates: Requirements 1.1, 1.2, 1.4
```

## Pull Request Process

1. Create a feature branch from `main`
2. Implement your changes following the task list
3. Write tests for your changes
4. Ensure all tests pass: `npm test`
5. Format and lint: `npm run format && npm run lint`
6. Create a pull request with:
   - Clear description of changes
   - Reference to task number
   - List of requirements validated
7. Wait for code review
8. Address review comments
9. Merge after approval

## Task Implementation Order

Follow the task list in `.kiro/specs/job-bid-management-system/tasks.md`:

1. Implement domain layer first (pure business logic)
2. Then application layer (use cases)
3. Then infrastructure layer (repositories, controllers)
4. Finally presentation layer (React components)

This ensures dependencies flow in the correct direction.

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Domain model with persistence annotations
class Bid {
  @Column()  // ❌ Infrastructure concern in domain
  private link: string;
}

// Use case with HTTP concerns
class CreateBidUseCase {
  execute(req: Request, res: Response) {  // ❌ HTTP in application layer
    // ...
  }
}
```

### ✅ Do This

```typescript
// Pure domain model
class Bid {
  private link: string;  // ✅ No infrastructure dependencies
  
  constructor(link: string) {
    this.link = link;
  }
}

// Use case with domain types
class CreateBidUseCase {
  execute(request: CreateBidRequest): CreateBidResponse {  // ✅ Domain types
    // ...
  }
}
```

## Questions?

If you have questions about:
- Architecture decisions → Check the design document
- Requirements → Check the requirements document
- Implementation order → Check the tasks document
- Specific issues → Open a GitHub issue

## Resources

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Property-Based Testing with fast-check](https://github.com/dubzzz/fast-check)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
