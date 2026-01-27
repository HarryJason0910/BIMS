# NPM Scripts Reference

This document describes all available npm scripts in the project.

## Root Level Scripts

Run these from the project root directory:

### Installation

```bash
npm run install:all
```
Installs dependencies for all packages in the monorepo.

### Building

```bash
npm run build
```
Builds all packages (backend and frontend).

### Testing

```bash
npm test
```
Runs tests for all packages.

### Code Quality

```bash
npm run lint
```
Lints all packages.

```bash
npm run format
```
Formats all code using Prettier.

```bash
npm run format:check
```
Checks if code is formatted correctly (useful for CI).

## Backend Scripts

Run these from `packages/backend/`:

### Development

```bash
npm run dev
```
Starts the backend server in development mode with hot-reload using tsx.

### Building

```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory.

### Production

```bash
npm start
```
Starts the backend server in production mode (requires build first).

### Testing

```bash
npm test
```
Runs all tests once.

```bash
npm run test:watch
```
Runs tests in watch mode (re-runs on file changes).

```bash
npm run test:coverage
```
Runs tests with coverage report.

### Code Quality

```bash
npm run lint
```
Lints TypeScript files in the src directory.

```bash
npm run lint:fix
```
Lints and automatically fixes issues.

## Frontend Scripts

Run these from `packages/frontend/`:

### Development

```bash
npm run dev
```
Starts the Vite dev server (web only, no Tauri).

```bash
npm run tauri:dev
```
Starts the Tauri desktop application in development mode with hot-reload.

### Building

```bash
npm run build
```
Builds the frontend for production (web bundle).

```bash
npm run tauri:build
```
Builds the complete Tauri desktop application (creates installers).

### Preview

```bash
npm run preview
```
Previews the production build locally.

### Testing

```bash
npm test
```
Runs Vitest tests.

```bash
npm run test:ui
```
Runs Vitest with UI interface.

### Code Quality

```bash
npm run lint
```
Lints TypeScript and TSX files.

```bash
npm run lint:fix
```
Lints and automatically fixes issues.

### Tauri Commands

```bash
npm run tauri
```
Runs Tauri CLI commands. Examples:

```bash
npm run tauri -- info          # Show Tauri environment info
npm run tauri -- icon          # Generate app icons
npm run tauri -- build --debug # Build in debug mode
```

## Common Workflows

### Starting Development

```bash
# Terminal 1: Start backend
cd packages/backend
npm run dev

# Terminal 2: Start frontend
cd packages/frontend
npm run tauri:dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
cd packages/backend
npm test

# Run frontend tests only
cd packages/frontend
npm test

# Run tests with coverage
cd packages/backend
npm run test:coverage
```

### Building for Production

```bash
# Build everything
npm run build

# Build desktop application
cd packages/frontend
npm run tauri:build
```

The desktop application installers will be in:
- Windows: `packages/frontend/src-tauri/target/release/bundle/msi/`
- macOS: `packages/frontend/src-tauri/target/release/bundle/dmg/`
- Linux: `packages/frontend/src-tauri/target/release/bundle/deb/` or `appimage/`

### Code Quality Checks

```bash
# Format all code
npm run format

# Check formatting (CI)
npm run format:check

# Lint all code
npm run lint

# Fix linting issues
cd packages/backend && npm run lint:fix
cd packages/frontend && npm run lint:fix
```

## Environment-Specific Commands

### Development Environment

```bash
# Backend with hot-reload
cd packages/backend
npm run dev

# Frontend with hot-reload
cd packages/frontend
npm run tauri:dev
```

### Production Environment

```bash
# Build backend
cd packages/backend
npm run build

# Start backend
npm start

# Build desktop app
cd packages/frontend
npm run tauri:build
```

## Troubleshooting

### Clear Build Artifacts

```bash
# Backend
cd packages/backend
rm -rf dist node_modules
npm install
npm run build

# Frontend
cd packages/frontend
rm -rf dist node_modules src-tauri/target
npm install
npm run build
```

### Reset Everything

```bash
# From root
rm -rf node_modules packages/*/node_modules packages/frontend/src-tauri/target
npm run install:all
```

### Update Dependencies

```bash
# Check for outdated packages
npm outdated --workspaces

# Update all packages
npm update --workspaces
```

## CI/CD Scripts

For continuous integration, use these commands:

```bash
# Install
npm run install:all

# Lint
npm run lint

# Format check
npm run format:check

# Test
npm test

# Build
npm run build
```

## Performance Tips

### Faster Builds

```bash
# Backend: Use tsx for development (already configured)
cd packages/backend
npm run dev

# Frontend: Vite is already optimized
cd packages/frontend
npm run dev
```

### Faster Tests

```bash
# Run specific test file
cd packages/backend
npx jest src/domain/bid/bid.test.ts

# Run tests matching pattern
npx jest --testNamePattern="Bid creation"
```

### Parallel Execution

```bash
# Run tests in parallel (Jest does this by default)
npm test

# Build packages in parallel (npm workspaces does this)
npm run build
```
