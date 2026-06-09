---
name: tdd-workflow-engine
description: Core TDD state machine and enforcement rules shared by tdd and tdd-auto agents
---

# Skill: TDD Workflow Engine

**Shared foundation** for the `tdd` and `tdd-auto` agents. Contains the TDD Sequence, TPP, Violation Handling, Test Type Detection, and Over-Implementation Prevention rules. Each agent defines its own state machine and gate behavior on top of this engine.

## The TDD Sequence

This is the single authoritative reference for test-first discipline. All enforcement
rules, violation handlers, and per-test-type phases reference this section.

**ABSOLUTE RULE A (Test Completeness): The ENTIRE test — all setup (Given), action (When),
and assertions (Then) — must be written in a SINGLE Write or Edit call before ANY production
file is created or modified. No partial-test-then-scaffold-then-more-test. The test is written
ONCE, COMPLETELY, and then left untouched until behavioral failure is achieved.**

**ABSOLUTE RULE B (Test First): The test file is the FIRST file you Write or Edit.
No production file may be created or modified before the test file is saved.
This is non-negotiable — even if you know what classes you will need.**

1. WRITE THE COMPLETE TEST using wishful thinking — call classes/methods that do not exist.
   The test defines the API.
   - Write the COMPLETE test in one pass — all Given-When-Then in a single Write/Edit call.
   - Use the Write or Edit tool to save the test file NOW.
   - Do NOT pre-create any production class, interface, or file "to avoid compilation errors."
   - Compilation errors are expected — they are step 2.
   - Test MUST NOT be modified again until scaffolding is done and behavioral failure achieved.
   - If the test needs changes during scaffolding → abort ALL scaffolding, fix the test, restart from step 2.

2. RUN THE TEST. It will fail with compilation/import errors. This is expected.

3. SCAFFOLD — create the minimum stubs to fix compilation errors IN ONE BATCH:
   - Analyze ALL compilation errors from step 2, then create ALL stubs in one pass.
   - Empty classes, methods returning null/default, bare interfaces.
   - No business logic. No constructor parameters beyond what the compiler demands.
   - This step exists ONLY to move from compilation errors to assertion failure.
   - Test file MUST NOT be edited during scaffolding.

4. RUN THE TEST AGAIN. It must now fail on an assertion (behavioral failure).
   This is valid RED.

One test per RED phase. Each test drives one transformation step (see TPP below).

## Transformation Priority Premise (GREEN Phase)

Apply Uncle Bob's TPP: as tests get more specific, code gets more generic — but only when forced by a failing test.

| Priority | Transformation | Description |
|----------|---------------|-------------|
| 1 | {} → nil | No code → return nothing |
| 2 | nil → constant | Return a hard-coded value |
| 3 | constant → variable | Replace constant with variable/parameter |
| 4 | unconditional → conditional | Add if/else branching |
| 5 | scalar → collection | Single value → array/list |
| 6 | statement → recursion | Simple statement → recursive call |
| 7 | selection → iteration | Conditional → loop |
| 8 | value → mutated value | Transform existing value |

**Rules:**
- Always prefer higher-priority transformations
- Do NOT jump to loops, recursion, or collections until a test forces you there
- First test → return a constant. Second test → add a conditional. Third test reveals a pattern → use iteration.
- If you write a loop on the first test, you are violating TPP — step back.

## Over-Implementation Prevention (GREEN Phase)

**The golden question before every line of code:** "Does this make the failing test pass?"

- Only implement what makes the failing test pass — stop immediately when it passes
- If design mentions X but test doesn't assert X, DON'T implement X
- NEVER add defensive code, getters/setters/properties, or enums unless driven by a failing test

**Enum TDD Discipline Example:**
```typescript
// WRONG - Over-implementing enum values
it('should default to standard status when no explicit status provided', () => {
  // Test only asserts Standard status
  expect(passenger.status).toBe(PassengerStatus.Standard);
});

// WRONG enum - too many values
enum PassengerStatus {
  Standard = 'Standard',   // Test demands this
  Premium = 'Premium',     // No test demands this yet
  Business = 'Business',   // No test demands this yet
}

// CORRECT - Only test-demanded enum value
enum PassengerStatus {
  Standard = 'Standard',   // Only this - test asserts it
}

// Evolution: Add enum values only when new tests demand them
// Next test: should default to premium when customer has loyalty tier
// THEN add: Premium
```

**Domain Event Over-Implementation Example:**

```typescript
// WRONG - Implementing events not tested
it('should create booking when valid ride data', () => {
  const result = bookRide.handle(command);
  expect(result.isSuccess).toBe(true);
  // Test doesn't assert events!
});

// Don't implement domain events machinery if test doesn't demand it:
// - domainEvents: DomainEvent[]
// - DomainEvents property
// - Event creation in factory
// - Event base interfaces

// CORRECT - Only what test demands
const booking = Booking.create(
  bookingId,
  command.tenantId,
  command.tripId,
  // ... only fields the test asserts
);
```

## Violation Handling

### V0: Creating Code Before Test (ZERO TOLERANCE)

Before every Write or Edit call during RED phase, verify:
"Is the file I'm about to write/edit a test file?"
If NO and no test file has been written yet in this RED phase → STOP. Write the test first.

### V0b: Multiple Tests in a Single RED Phase

**Detection:** More than one `it()` method written during a single RED_PHASE.

**Action:** STOP → keep only the first test (next in TPP progression) → DELETE all others → continue RED_PHASE.

### V0c: Interleaved Test Writing and Scaffolding (ZERO TOLERANCE)

**Detection:** The test file is edited (Write or Edit) AFTER any production file has been created or modified in the same RED phase.

**Action:** STOP → abort ALL scaffolding created so far → fix the test file → restart from step 2 (re-run the test). The test must be COMPLETE before scaffolding begins. No interleaving.

### V1: Class/Method Not Found During RED

**Precondition:** Test has already been written (otherwise this is V0).

**Action:** Create minimal scaffold (empty class/method returning null/default) → re-run test → continue until behavioral failure.

### V2: Premature Implementation

**Detection:** Production logic written before RED_PHASE achieves behavioral failure.

**Action:** Remove production code → restore scaffold state → re-run to achieve RED.

### V3: Stopping During RED_PHASE

**Detection:** Asking "Should I continue?" or waiting mid-RED.

**Action:** Continue execution without waiting. Complete the full RED phase.

### V4: Test Passes in RED Phase (BLOCKING)

**Detection:** Test passes without implementation — the assertion is likely too weak.

**Action:**
1. Present a **BLOCKING** warning: show the exact assertion that passed and suggest a stronger alternative
2. **STOP & WAIT** for user decision (both `tdd` and `tdd-auto` agents pause here)
3. If user says "continue anyway" / "go green anyway" → proceed (skip implementation since test passes)
4. If user provides a refinement → update the test, re-run, attempt behavioral failure
5. Default: stay in RED_PHASE and wait for user decision

### V5: Over-Implementation — Enum Values (GREEN Phase)

**Detection:** Adding enum values not demanded by the current failing test.

**Action:** Remove untested enum values, keep only what the test asserts.

### V6: Over-Implementation — Domain Events (GREEN Phase)

**Detection:** Implementing domain events machinery (event list, DomainEvents property, event classes) without test assertions requiring them.

**Action:** Remove event machinery not demanded by the test.

### V7: Over-Implementation — Methods/Classes (GREEN Phase)

**Detection:** Creating methods or classes not called by the current failing test.

**Action:** Remove methods/classes not required by the test.

## Test Type Detection

### Detection Algorithm (Priority Order)

**1. Explicit Prefix (Highest Priority)**

| Prefix | Test Type |
|--------|-----------|
| `unit:` | Unit Test |
| `e2e:` | E2E Test |
| `integration:` | Integration Test |

**2. E2E Indicators:** api, endpoint, http, rest, route, via api, through api, expose, status code, return 200/201/400/404, request, response, json, controller

**3. Integration Indicators:** postgresql, postgres, database, sql, persist, testcontainers, adapter implementation, repository implementation, prisma, external service, redis, real database

**4. Default:** Unit test (hexagon/core logic)

**Override:** If user responds with "actually use [unit/e2e/integration]", switch immediately.

### Phase Execution by Test Type

For RED and GREEN phase details specific to each test type, apply the corresponding skill:
- Unit tests → `tdd-core-patterns`
- E2E tests → `tdd-e2e-patterns`
- Integration tests → `tdd-integration-patterns`

All types follow The TDD Sequence. Skills provide type-specific scaffolding and implementation patterns.

## Enforcement Rules

| Rule | Description |
|------|-------------|
| **RULE 0** | The TDD Sequence (above) must be followed — test before production code |
| **RULE 4** | Test must fail behaviorally (assertion failure) — if it passes, V4 applies |
| **RULE 5** | Test type patterns must be followed (E2E = HTTP only, etc.) |
| **RULE 6** | Scaffold creation happens only after the COMPLETE test is written. No returning to edit the test during scaffolding. |

Agent-specific rules (gate behavior, pausing) are defined in each agent's own file.

## Agent Memory

After each CYCLE_COMPLETE, record concise key-value entries for:

- **Naming conventions** observed (file names, class names, test names)
- **Fake adapters** discovered (class name + file path)
- **Object Mothers / fixtures** found (class name + file path)
- **Bounded context structure** insights (which context owns what)
- **TDD violations** encountered and how they were resolved

Keep entries terse. Prioritize information that accelerates future TDD cycles.

## Error Recovery

If a test run fails due to infrastructure issues (Node.js crash, out-of-memory, Docker/testcontainers timeout):

1. Do NOT treat the failure as behavioral failure (RED). Infrastructure errors are not assertion failures.
2. Diagnose: check error output for stack traces, OOM messages, or timeout indicators.
3. If transient (Docker restart, file lock): retry the test run once.
4. If persistent: report the infrastructure error to the user and STOP. Do not attempt to fix infrastructure configuration autonomously.
5. The TDD state does not change — remain in whichever phase you were in before the failure.

## Technical Expectations Override

User technical expectations OVERRIDE default patterns while preserving core discipline:
- ✅ Assertion style, design patterns, architectural style, implementation approach → Apply as specified
- **PRESERVED:** Wishful thinking, no defensive code, DIP compliance
- **OVERRIDDEN:** Default assertion styles, standard domain patterns, typical code organization

## Additional Violation Detection

Beyond the TDD Sequence violations (V0-V7), these are enforced during TDD workflows:

| Violation | Detection | Action |
|-----------|-----------|--------|
| **Skipped User Gate** | Proceeding without user selection | Stop and wait for user input |
| **Defensive Programming** | Adding validation/checks without failing test | Remove defensive code |
| **Direct Domain Object Usage in Tests** | Using domain objects directly instead of snapshots in Given (setup) or Then (assertions) | Replace with snapshot-based hydration/assertion |
| **Value Object Constructor Nullity Checks** | Adding null checks without failing test | Remove validation not demanded by test |
| **Direct Domain Object Testing** | Test targets aggregate/entity/VO directly instead of Use Case (exception: Domain Services with complex isolated logic) | Rewrite test to go through Use Case |
| **Ignoring Technical Expectations** | Using default patterns when user provided specific expectations | Apply user-specified patterns |

## When NOT to Use TDD Agents

- **Bug fixes** on code with existing test coverage — use normal editing
- **Refactoring** under green tests — no RED phase needed
- **Configuration changes** (package.json, docker-compose, tsconfig.json)
- **Documentation** updates
- **Exploratory spikes** where throwaway code is expected

## Pre-Analyzed Input

If the requirement includes a numbered test list with TPP/FLFI annotations (from the `tdd-analyze` agent), **skip the analysis/expectations phase** and use the provided list directly as the TPP plan. Proceed immediately to RED_PHASE for the first test. The analysis has already been done — do not redo it.

## Progression Table Format

After each GREEN_PHASE, display a progression table tracking every test in the TPP plan:

```
### Progression

| # | Test | Status |
|---|------|--------|
| 1 | should [test name 1] | ✅ GREEN |
| 2 | should [test name 2] | 🔴 RED |
| 3 | should [test name 3] | ⏳ Pending |
```

**Status values:** `✅ GREEN` (passing), `🔴 RED` (behavioral failure achieved), `⏳ Pending` (not yet written)

## TDD Analysis File Update

At CYCLE_CHECK/CYCLE_COMPLETE, update the TDD analysis file: change the just-completed test status from `Pending` to `✅ GREEN`. The `✅` prefix is MANDATORY. Match on `Pending` (with or without `⏳` prefix). Detect the correct file: if `workspace/tdd-iteration-XX.md` exists, use it; otherwise, fall back to `workspace/tdd.md`.

## GREEN Phase — Common Steps

1. Implement clean solution with proper DDD/Clean Architecture patterns
2. Write clean code directly — no intermediate "make it work" step, no separate refactor phase (AI writes clean code in one pass)
3. Only implement what the failing test demands — stop when it passes
4. Run test → verify it passes
5. **Regression check:** run the full test file. If an existing test breaks, fix the regression before continuing.

## CYCLE_COMPLETE — Mandatory Build Check

After all tests in the cycle are GREEN, before reporting CYCLE_COMPLETE:

1. Run `npm run build -w <package>` (runs `tsc --noEmit`) to catch strict TypeScript errors not surfaced by Vitest (e.g. `string | undefined` narrowing, missing interface members).
2. If the build fails: fix the TypeScript error, re-run the full test suite to confirm 0 regressions, then report CYCLE_COMPLETE.
3. **Port extension rule:** if you added methods to a port interface, grep for ALL implementations (`grep -r "implements <PortName>"`) and update every one — including InMemory fakes — before the build check.

## Enforcement Priority

1. **HIGHEST:** Wishful thinking — test MUST be written first
2. **HIGHEST:** DIP violations — domain CANNOT depend on infrastructure
3. **HIGH:** Technical expectations, user gates, no defensive code
4. **MEDIUM:** State machine flow
5. **LOW:** Naming conventions

## Enforcement Checklist

- [ ] COMPLETE test written FIRST (all Given-When-Then in one Write/Edit call)
- [ ] Test calls non-existent methods/classes (wishful thinking)
- [ ] No interleaving — test file NOT edited after production file in same RED phase
- [ ] Core tests target Use Cases, NOT aggregates/entities/value objects directly
- [ ] No defensive code without failing test
- [ ] Domain layer has ZERO infrastructure dependencies (DIP)
- [ ] Technical expectations applied if provided
- [ ] `npm run build -w <package>` passes before CYCLE_COMPLETE (catches strict TS errors)
- [ ] All port implementations updated when interface is extended (including InMemory fakes)
