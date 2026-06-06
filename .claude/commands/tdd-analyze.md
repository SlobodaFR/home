---
description: Analyze a business requirement into a TPP-ordered FLFI test list
---

# /tdd-analyze -> TDD Analyze Agent

The TDD analysis workflow uses the **`tdd-analyze` custom agent**.

## How to use

The `tdd-analyze` agent is automatically delegated by Claude when you want to analyze a requirement before coding. You can also explicitly invoke it:

```
"use the tdd-analyze agent to analyze: a rider should receive a default ride type based on the service level"
"use the tdd-analyze agent to analyze: e2e: expose ride booking via REST API"
"use the tdd-analyze agent to analyze: integration: ride repository should persist to PostgreSQL"
```

## What it produces

A numbered test list with:
- **FLFI labels** — final, complete, business-language test names
- **TPP ordering** — simplest transformation first
- **Contradiction annotations** — what each test forces in the implementation
- **Design notes** — existing fakes, models, and patterns to reuse

## Next steps

Pass the test list to an execution agent:
- Interactive: `use the tdd agent to implement: [requirement + test list]`
- Autonomous: `use the tdd-auto agent to implement: [requirement + test list]`
