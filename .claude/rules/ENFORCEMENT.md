# Global Enforcement Rules

## No Defensive Programming (MANDATORY)
**NEVER add unless driven by failing test:**
- ❌ No null checks without test requiring them
- ❌ No parameter validation without test
- ❌ No getters/setters unless absolutely required
- ✅ Add ONLY when test fails without them

## Dependency Inversion Principle (MANDATORY)
**Domain layer CANNOT depend on infrastructure.**

**Detection — critical patterns:**
- Domain models importing adapters/infrastructure packages
- Domain models depending on concrete repository implementations
- Domain models importing framework decorators (@Injectable, @Entity, @Column, @Controller, etc.)
- Use cases importing adapter or infrastructure classes
- Domain ports extending framework interfaces

**Response template:**
```
❌ VIOLATION DETECTED: Dependency Inversion Principle Broken
Domain layer [ClassName] depends on infrastructure [InfrastructureClass/Package].

CORRECTIVE ACTION:
1. Analyzing dependency direction...
2. Creating abstraction in domain ports...
3. Moving concrete implementation to adapters layer...
4. Removing infrastructure imports from domain...

Remember: Dependencies MUST point inward. Domain owns abstractions, adapters implement them.
```

## Priority
1. **HIGHEST:** DIP violations — Domain CANNOT depend on infrastructure
2. **HIGH:** No defensive code — ONLY add when test requires

For TDD-specific enforcement (state machines, gates, violation handling, response templates, checklist), see the `tdd-workflow-engine` skill — it is the single authoritative reference.
