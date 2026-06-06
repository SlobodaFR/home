# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

NPM workspace exposing a collection of TypeScript tools for daily personal and professional use, deployed to a personal VPS.

## Architecture & Principles

See `.claude/rules/` for canonical references:
- **IDENTITY.md** — Senior craftsman identity, domain-first philosophy
- **ARCHITECTURE.md** — Hexagonal Architecture, Dependency Rule, layer responsibilities
- **CODE-STYLE.md** — Naming conventions, immutability, no anemic models
- **ANTI-PATTERNS.md** — Domain, architecture, testing, and integration anti-patterns to reject
- **ENFORCEMENT.md** — DIP violations (HIGHEST priority), no defensive programming without failing test


## Stack

- **Language**: TypeScript (strict, ESM)
- **Package manager**: npm workspaces
- **Tests**: Vitest
- **Lint/format**: ESLint + Prettier
- **Git hooks**: Husky — lint-staged (`pre-commit`), commitlint (`commit-msg`)
- **Commit convention**: Conventional Commits (`type(scope): message`)
- **Releases**: semantic-release — bumps version, generates changelog, publishes GitHub release
- **CI/CD**: GitHub Actions → VPS via SSH
- **Secrets**: 1Password (op CLI / GitHub Actions 1Password integration)

## Workspace structure

Each tool lives in its own package under `packages/`. A shared utilities package (`packages/shared` or similar) holds cross-cutting code. Root `package.json` declares the workspace and houses shared dev-dependencies (TypeScript, ESLint, Prettier, Vitest).

## Common commands

```bash
# Install all workspace packages
npm install

# Build all packages
npm run build -ws

# Build a single package
npm run build -w packages/<name>

# Run all tests
npm test

# Run tests for a single package
npm test -w packages/<name>

# Run a single test file
npx vitest run packages/<name>/src/__tests__/foo.test.ts

# Lint
npm run lint

# Format
npm run format
```

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) SSHs into the VPS and runs the deployment script. Secrets (SSH key, host, 1Password service-account token) are stored in the GitHub repository secrets and injected at runtime via the [1Password GitHub Action](https://github.com/1Password/load-secrets-action).

All application-level secrets (API keys, tokens) are stored in 1Password and loaded at runtime via `op run --` or the 1Password SDK — never hardcoded or committed.

## TypeScript conventions

- `"moduleResolution": "bundler"` (or `"node16"`) with `"module": "ESNext"`
- Each package has its own `tsconfig.json` extending a root `tsconfig.base.json`
- Package entry points declared via `exports` field in `package.json`

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout — `CONTEXT-MAP.md` at the root points to per-package `CONTEXT.md` files under `packages/`. See `docs/agents/domain.md`.

### Available agents

| Agent | Trigger | Purpose |
|---|---|---|
| `tdd` | `/tdd` or "write feature TDD" | Interactive TDD (RED-GREEN-CLEAN) with human-in-the-loop gates. Pauses at each cycle step awaiting explicit user confirmation. |
| `tdd-auto` | `/tdd-auto` or "autonomous TDD" | Autonomous TDD — continuous RED-GREEN-CLEAN with no gates. Only pauses at CYCLE_COMPLETE. |
| `tdd-analyze` | `/tdd-analyze` or "analyze requirement" | Analysis-only agent: produces TPP-ordered, FLFI-labeled test list from requirement. Writes to `workspace/tdd.md`. |
| `bdd-workshop` | "BDD workshop" / "tres amigos" / "scenario discovery" / "example mapping" | Simulates a Tres Amigos session — refines specs through concrete scenario elaboration and acceptance criteria. |

### Available skills

| Skill | Trigger | Purpose |
|---|---|---|
| `caveman` | `/caveman` or "less tokens" | Ultra-compressed comms mode, ~75% token reduction. Levels: lite / full / ultra / wenyan variants. |
| `grill-me` | `/grill-me` or "grill me" | Relentless interview on plan/design until shared understanding + decision tree resolved. |
| `to-issues` | `/to-issues` | Break plan/spec/PRD into independently-grabbable GitHub issues (tracer-bullet vertical slices). |
| `to-prd` | `/to-prd` | Turn current conversation into PRD and publish to GitHub Issues. |
| `triage` | `/triage` | Move issues through triage state machine (needs-triage → ready-for-agent / ready-for-human / wontfix). |
| `excalidraw-diagram-generator` | "create a diagram" / "make a flowchart" / "visualize" / "draw architecture" | Generate Excalidraw diagrams from natural language. Outputs `.excalidraw` JSON. |
| `scaffold-bc` | `/scaffold-bc <name>` | Scaffold a new Bounded Context following Clean Architecture in the monorepo. |
| `tdd` | `/tdd` | Invoke the `tdd` agent (interactive TDD with gates). |
| `tdd-analyze` | `/tdd-analyze` | Invoke the `tdd-analyze` agent (requirement → test list). |
| `tdd-auto` | `/tdd-auto` | Invoke the `tdd-auto` agent (autonomous TDD, no gates). |

### Internal TDD support skills

Used automatically by `tdd`, `tdd-auto`, and `tdd-analyze` agents — not invoked directly by users.

| Skill | Purpose |
|---|---|
| `tdd-workflow-engine` | Core TDD state machine and enforcement rules shared by `tdd` and `tdd-auto`. |
| `tdd-core-patterns` | Testing philosophy for the application core (hexagon) — sociable tests, outside-in TDD. |
| `tdd-e2e-patterns` | E2E testing patterns for NestJS with HTTP-boundary black-box testing. |
| `tdd-integration-patterns` | Integration testing patterns for secondary adapters with Testcontainers. |
| `tdd-testing-patterns` | Test patterns, doubles, fixtures, and assertions for Clean Architecture. |
