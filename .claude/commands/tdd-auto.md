---
description: Autonomous TDD workflow (migrated to tdd-auto agent)
---

# /tdd-auto -> TDD Auto Agent

The autonomous TDD workflow uses the **`tdd-auto` custom agent** for continuous RED-GREEN execution without human-in-the-loop gates.

## How to use

The `tdd-auto` agent flows through RED → GREEN for each test automatically, only pausing at CYCLE_COMPLETE. You can explicitly invoke it:

```
"use the tdd-auto agent to implement: rider should receive a ride confirmation after booking"
"use the tdd-auto agent for: e2e: expose ride booking via REST API"
"use the tdd-auto agent for: integration: ride repository should persist to PostgreSQL"
```

## Test type prefixes

| Prefix | Test Type |
|--------|-----------|
| (none) | Unit test (default) |
| `unit:` | Unit test (explicit) |
| `e2e:` | E2E test |
| `integration:` | Integration test |

The agent auto-detects test type from keywords. Use prefixes to override.

## When to use tdd-auto vs tdd

| Agent | Gate behavior | Best for |
|-------|--------------|----------|
| `tdd` | Pauses at RED and GREEN for review | Learning, complex requirements, when you want control |
| `tdd-auto` | Runs continuously, pauses only at CYCLE_COMPLETE | Well-understood requirements, fast iteration |
