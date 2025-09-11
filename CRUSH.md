# Slangroom Development Guide for Agentic Coding

## Build Commands
- Install dependencies: `pnpm i`
- Build all packages: `pnpm build`
- Clean builds: `pnpm clean`

## Lint/Format Commands
- Lint code: `pnpm lint` (uses ESLint with TypeScript rules)
- Format code: `pnpm format` (uses Prettier)
- Type check: Run `pnpm build` (tsc performs type checking)

## Test Commands
- Run all tests: `pnpm test`
- Run single package tests: `pnpm -F @slangroom/timestamp exec ava --verbose build/esm/test`
- Run with coverage: `pnpm coverage`

## Code Style Guidelines
- Use tabs for indentation (Prettier config)
- Use single quotes for strings (Prettier config)
- Print width set to 100 characters (Prettier config)
- Prefer `type` over `interface` for type definitions (ESLint rule)
- Unused vars/args should start with underscore (ESLint rule)
- No control regex linting (disabled)

## Import Conventions
- Use ES modules with `.js` extensions in imports
- Organize imports in logical groups (external, internal, type-only)
- Import from `src/` directories using relative paths
- Use named imports when possible

## Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_CASE for constants
- Use descriptive names for variables and functions

## Error Handling
- Prefer explicit error handling over try/catch when possible
- Use Result/Option patterns where applicable
- Log errors with context
- Fail fast - validate inputs early

## Development Workflow
1. Branch from main
2. Make changes following style guidelines
3. Run lint, build, and tests before committing
4. Commit with conventional commits format
5. Create pull request for review