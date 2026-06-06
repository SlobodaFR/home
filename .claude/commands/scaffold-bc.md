---
description: Scaffold a new Bounded Context following Clean Architecture in an npm monorepo
---

# /scaffold-bc — Scaffold a Bounded Context

Scaffolds a new Bounded Context (BC) in a TypeScript/NestJS npm monorepo following Clean Architecture.

**Arguments:** `$ARGUMENTS`

## Argument parsing

The arguments format is: `{BC}` — e.g., `/scaffold-bc payment`

- `{BC}` — Bounded Context name (kebab-case). Examples: `payment`, `reservation`, `billing`, `ride-booking`

If arguments are missing, ask the user. The BC name is required.

## Pre-flight checks

1. Verify `packages/{BC}-context/` does NOT already exist (abort with message if it does)
2. Check if `apps/api/src/app.module.ts` exists → sets `HOST_EXISTS = true/false`

---

## Phase A — Bootstrap API Host (ONLY if HOST_EXISTS is false)

If the API host already exists, skip entirely to Phase B.

### A1. Create API app

Path: `apps/api/`

Create a standard NestJS application with:
- `package.json` with `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/swagger`
- `src/main.ts` — Application entry point
- `src/app.module.ts` — Root NestJS module
- `nest-cli.json` — NestJS CLI configuration
- `tsconfig.json` and `tsconfig.build.json`

### A2. Create test configuration

Path: `apps/api/test/`

- `vitest-e2e.config.ts` — E2E test configuration
- `vitest-integration.config.ts` — Integration test configuration

---

## Phase B — Scaffold the Bounded Context

### Step 1 — Create the context directory structure

All files go under `packages/{BC}-context/`.

```
packages/{BC}-context/
├── package.json
├── tsconfig.json
├── vitest.config.ts                        # Unit tests
├── vitest-integration.config.ts            # Integration tests
├── vitest-e2e.config.ts                    # E2E tests
├── vitest-mutation.config.ts               # Mutation testing (Stryker)
│
├── prisma/
│   └── schema.prisma                       # Prisma schema for this BC
│
└── src/
    ├── index.ts                            # Package public API (barrel)
    │
    ├── domain/                             # THE HEXAGON (no external deps)
    │   ├── index.ts                        # Domain public API (barrel)
    │   ├── models/                         # Aggregates, entities, value objects
    │   │   └── .gitkeep
    │   └── ports/                          # Repository interfaces / gateways
    │       └── .gitkeep
    │
    ├── application/
    │   ├── index.ts                        # Application public API (barrel)
    │   ├── use-cases/                      # Application use-cases
    │   │   └── .gitkeep
    │   └── domain-services/               # Domain services with complex isolated logic
    │       └── .gitkeep
    │
    └── adapters/                           # OUTSIDE THE HEXAGON
        ├── index.ts                        # Adapters public API (barrel)
        ├── primary/                        # Driving adapters (controllers)
        │   └── .gitkeep
        └── secondary/                      # Driven adapters (implementations)
            ├── in-memory/                  # Test doubles / fake implementations
            │   └── .gitkeep
            └── postgresql/                 # Real database adapters
                └── .gitkeep
```

### Step 2 — Create package.json

Path: `packages/{BC}-context/package.json`

```json
{
  "name": "@{BC}/core",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:integration": "vitest run --config vitest-integration.config.ts",
    "test:e2e": "vitest run --config vitest-e2e.config.ts",
    "test:mutation": "stryker run",
    "test:all": "vitest run && vitest run --config vitest-integration.config.ts && vitest run --config vitest-e2e.config.ts"
  }
}
```

### Step 3 — Create tsconfig.json

Path: `packages/{BC}-context/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Step 4 — Create Vitest configurations

Create `vitest.config.ts` (unit), `vitest-integration.config.ts`, `vitest-e2e.config.ts`, and `vitest-mutation.config.ts` following the patterns in existing contexts.

### Step 5 — Create barrel files

Create one `index.ts` per layer folder and at the package root. Each barrel re-exports only what the layer makes public — external code must never import through deep paths.

`packages/{BC}-context/src/index.ts` (package root):
```typescript
// Public API for {BC} bounded context
// Re-export only what other contexts or the API host may consume
export * from './application/index.js';
```

`packages/{BC}-context/src/domain/index.ts`:
```typescript
// Domain public API — ports and key types only
```

`packages/{BC}-context/src/application/index.ts`:
```typescript
// Application public API — use cases and commands/queries
```

`packages/{BC}-context/src/adapters/index.ts`:
```typescript
// Adapters public API — NestJS modules
```

### Step 6 — Wire into API Host

#### 6a. Add workspace reference

Ensure root `package.json` `workspaces` field includes `packages/{BC}-context` (if not already covered by a glob pattern).

#### 6b. Add dependency to API

Edit `apps/api/package.json` to add:
```json
"@{BC}/core": "workspace:*"
```

#### 6c. Create NestJS module

Create a NestJS module in the BC's primary adapter that registers controllers and use cases. Import this module in `apps/api/src/app.module.ts`.

### Step 7 — Install dependencies

```bash
npm install
```

### Step 8 — Build verification

```bash
npm test -w packages/{BC}-context
```

Must succeed (even if no tests yet — should report 0 tests).

### Step 9 — Summary

Print a summary showing what was created:

```
{API host bootstrapped from scratch (if Phase A ran)}

Bounded Context '{BC}' scaffolded successfully.

Created:
  packages/{BC}-context/
  ├── src/domain/models/                  (pure domain, zero deps)
  ├── src/domain/ports/                   (interfaces only)
  ├── src/application/use-cases/          (application use cases)
  ├── src/application/domain-services/    (domain services)
  ├── src/adapters/primary/               (controllers)
  ├── src/adapters/secondary/in-memory/   (test doubles)
  └── src/adapters/secondary/postgresql/  (real adapters)

Wired into:
  apps/api/src/app.module.ts
  apps/api/package.json

Next steps:
  - Use /tdd-analyze to analyze business requirements for this BC
  - Use /tdd or /tdd-auto to implement features
```
