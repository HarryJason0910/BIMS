# Project Structure Overview

This document provides a detailed overview of the project structure created for the Job Bid and Interview Management System.

## Directory Tree

```
job-bid-management-system/
├── .kiro/                          # Kiro specifications
│   └── specs/
│       └── job-bid-management-system/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── packages/                       # Monorepo packages
│   ├── backend/                    # Backend package
│   │   ├── src/
│   │   │   ├── domain/            # Domain layer (pure business logic)
│   │   │   │   └── .gitkeep
│   │   │   ├── application/       # Application layer (use cases)
│   │   │   │   └── .gitkeep
│   │   │   ├── infrastructure/    # Infrastructure layer
│   │   │   │   └── .gitkeep
│   │   │   └── index.ts           # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json          # TypeScript config (Node 22, strict mode)
│   │   ├── jest.config.js         # Jest configuration
│   │   └── .env.example           # Environment variables template
│   │
│   └── frontend/                   # Frontend package
│       ├── src/
│       │   ├── test/
│       │   │   └── setup.ts       # Test setup
│       │   ├── main.tsx           # React entry point
│       │   ├── App.tsx            # Main app component
│       │   └── index.css          # Global styles
│       ├── src-tauri/             # Tauri Rust backend
│       │   ├── src/
│       │   │   └── main.rs        # Tauri entry point
│       │   ├── icons/
│       │   │   └── .gitkeep
│       │   ├── Cargo.toml         # Rust dependencies
│       │   ├── tauri.conf.json    # Tauri configuration
│       │   └── build.rs           # Rust build script
│       ├── package.json
│       ├── tsconfig.json          # TypeScript config (React)
│       ├── tsconfig.node.json     # TypeScript config for Vite
│       ├── vite.config.ts         # Vite configuration
│       ├── vitest.config.ts       # Vitest configuration
│       ├── .eslintrc.json         # ESLint config (React-specific)
│       ├── .env.example           # Environment variables template
│       └── index.html             # HTML entry point
│
├── package.json                    # Root package.json (monorepo)
├── .gitignore                      # Git ignore rules
├── .eslintrc.json                  # Root ESLint configuration
├── .prettierrc                     # Prettier configuration
├── README.md                       # Project overview
├── SETUP.md                        # Setup instructions
├── CONTRIBUTING.md                 # Contributing guidelines
├── SCRIPTS.md                      # NPM scripts reference
└── PROJECT_STRUCTURE.md            # This file
```

## Package Details

### Backend Package (`packages/backend`)

**Purpose**: Node.js backend with Express REST API, MongoDB persistence, and Microsoft Graph API integration.

**Key Technologies**:
- **Runtime**: Node.js 22
- **Language**: TypeScript (strict mode)
- **Framework**: Express
- **Database**: MongoDB (native driver)
- **Email**: Microsoft Graph SDK
- **Testing**: Jest + fast-check (property-based testing)

**Dependencies**:
- `express`: Web framework
- `mongodb`: MongoDB driver
- `@microsoft/microsoft-graph-client`: Microsoft Graph API client
- `@azure/identity`: Azure authentication
- `cors`: CORS middleware
- `dotenv`: Environment variables

**Dev Dependencies**:
- `typescript`: TypeScript compiler
- `jest`: Testing framework
- `ts-jest`: Jest TypeScript support
- `fast-check`: Property-based testing
- `tsx`: TypeScript execution for development

**Configuration Files**:
- `tsconfig.json`: Strict TypeScript configuration targeting ES2022
- `jest.config.js`: Jest configuration with ts-jest preset
- `.env.example`: Template for environment variables

**Architecture Layers**:
1. **Domain Layer** (`src/domain/`): Pure business logic, no dependencies
2. **Application Layer** (`src/application/`): Use cases, orchestration
3. **Infrastructure Layer** (`src/infrastructure/`): Repositories, controllers, adapters

### Frontend Package (`packages/frontend`)

**Purpose**: Tauri desktop application with React frontend.

**Key Technologies**:
- **Framework**: React 18
- **Desktop**: Tauri 1.5
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

**Dependencies**:
- `react`: UI framework
- `react-dom`: React DOM renderer
- `react-router-dom`: Routing
- `@tanstack/react-query`: Server state management
- `axios`: HTTP client
- `@tauri-apps/api`: Tauri API bindings

**Dev Dependencies**:
- `@tauri-apps/cli`: Tauri CLI
- `vite`: Build tool
- `@vitejs/plugin-react`: Vite React plugin
- `vitest`: Testing framework
- `@testing-library/react`: React testing utilities
- `typescript`: TypeScript compiler

**Configuration Files**:
- `tsconfig.json`: TypeScript configuration for React
- `tsconfig.node.json`: TypeScript configuration for Vite
- `vite.config.ts`: Vite build configuration
- `vitest.config.ts`: Vitest test configuration
- `.eslintrc.json`: ESLint with React rules
- `src-tauri/tauri.conf.json`: Tauri application configuration
- `src-tauri/Cargo.toml`: Rust dependencies

**Tauri Configuration**:
- Window size: 1400x900 (min: 800x600)
- Permissions: HTTP requests to localhost:3000
- Build: Vite dev server integration

## Root Configuration

### Monorepo Setup

The project uses npm workspaces for monorepo management:

```json
{
  "workspaces": ["packages/*"]
}
```

This allows:
- Shared dependencies at root level
- Cross-package dependency management
- Unified scripts across packages

### Code Quality Tools

**ESLint** (`.eslintrc.json`):
- TypeScript support
- Recommended rules
- Prettier integration
- Configured for Node.js and ES2022

**Prettier** (`.prettierrc`):
- Single quotes
- Semicolons
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)

### Git Configuration

**`.gitignore`** includes:
- `node_modules/`
- Build outputs (`dist/`, `build/`)
- Environment files (`.env`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`)
- Tauri build artifacts (`src-tauri/target/`)
- Test coverage reports

## Environment Variables

### Backend (`.env`)

Required variables:
```env
MONGODB_URI=mongodb://localhost:27017/job-bid-system
MONGODB_DB_NAME=job-bid-system
GRAPH_CLIENT_ID=<azure-client-id>
GRAPH_CLIENT_SECRET=<azure-client-secret>
GRAPH_TENANT_ID=<azure-tenant-id>
EMAIL_POLL_INTERVAL_MS=300000
EMAIL_FILTER_KEYWORDS=job,interview,application
PORT=3000
NODE_ENV=development
```

### Frontend (`.env`)

Required variables:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Build Outputs

### Backend

- **Development**: No build required (uses `tsx`)
- **Production**: Compiled JavaScript in `dist/`

### Frontend

- **Development**: Vite dev server (no build)
- **Production Web**: Static files in `dist/`
- **Production Desktop**: Platform-specific installers in `src-tauri/target/release/bundle/`
  - Windows: `.msi` installer
  - macOS: `.dmg` disk image
  - Linux: `.deb` package or `.AppImage`

## Testing Structure

### Backend Tests

- **Unit Tests**: `*.test.ts` files co-located with source
- **Property Tests**: `*.property.test.ts` files
- **Integration Tests**: `*.integration.test.ts` files
- **Coverage**: Reports in `coverage/` directory

### Frontend Tests

- **Component Tests**: `*.test.tsx` files
- **Setup**: `src/test/setup.ts`
- **Coverage**: Reports in `coverage/` directory

## Development Workflow

1. **Install**: `npm run install:all`
2. **Backend Dev**: `cd packages/backend && npm run dev`
3. **Frontend Dev**: `cd packages/frontend && npm run tauri:dev`
4. **Test**: `npm test`
5. **Lint**: `npm run lint`
6. **Format**: `npm run format`
7. **Build**: `npm run build`

## Next Steps

After setup, implement features following the task list:

1. **Task 2-8**: Domain layer (pure business logic)
2. **Task 10-11**: Infrastructure layer (repositories)
3. **Task 12-16**: Application layer (use cases)
4. **Task 18-19**: Infrastructure layer (REST API, Email adapter)
5. **Task 22-25**: Presentation layer (React components)
6. **Task 26**: Integration and wiring

Each task includes specific requirements and property-based tests to validate correctness.

## Architecture Principles

This structure enforces:

1. **Dependency Inversion**: Domain has no dependencies on infrastructure
2. **Separation of Concerns**: Clear boundaries between layers
3. **Testability**: Pure domain logic is easily testable
4. **Maintainability**: Changes in one layer don't affect others
5. **Scalability**: Monorepo structure supports future packages

## Resources

- [README.md](./README.md): Project overview
- [SETUP.md](./SETUP.md): Detailed setup instructions
- [CONTRIBUTING.md](./CONTRIBUTING.md): Development guidelines
- [SCRIPTS.md](./SCRIPTS.md): NPM scripts reference
- [Design Document](./.kiro/specs/job-bid-management-system/design.md): Architecture details
- [Requirements](./.kiro/specs/job-bid-management-system/requirements.md): Feature requirements
- [Tasks](./.kiro/specs/job-bid-management-system/tasks.md): Implementation plan
