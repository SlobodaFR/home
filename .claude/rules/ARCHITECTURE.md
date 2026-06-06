# Clean Architecture Rules

## The Dependency Rule

**THE OVERRIDING RULE**: Dependencies can ONLY point inward.

```
External World (Infrastructure)
    ↓
Adapters (Primary & Secondary)
    ↓
Application (Use Cases)
    ↓
Domain (Core Business)
```

### Non-Negotiable Principles

1. **Domain has ZERO external dependencies**
   - No framework imports
   - No infrastructure concepts
   - No external libraries
   - Pure business logic only

2. **Dependencies point inward ALWAYS**
   - Outer layers depend on inner layers
   - Inner layers know nothing about outer layers
   - No circular dependencies

3. **Infrastructure adapts to domain**
   - Domain defines ports (interfaces)
   - Infrastructure implements adapters
   - Never the reverse

4. **Use cases orchestrate, don't contain business logic**
   - Business rules live in domain
   - Use cases coordinate domain objects
   - Transaction boundaries at use case level

## Layer Responsibilities

### Domain Layer (Innermost)
- Pure business logic
- Aggregates, Entities, Value Objects
- Domain Events
- Repository Interfaces (Ports)

### Application Layer
- Use Cases / Application Services
- Domain Services (complex isolated logic that coordinates domain objects)
- Commands and Queries (CQRS)
- Input/Output Ports
- Orchestration logic
- Transaction management

### Adapters Layer (Outermost)
- **Primary adapters** (driving): Web Controllers, CLI, GraphQL resolvers
- **Secondary adapters** (driven): Repository implementations, External service clients, Message publishers/consumers
- Framework-specific code (NestJS modules, Prisma clients)

## Boundary Crossing Rules

### Data Crossing Boundaries
✅ **DO**: Use simple DTOs, Value Objects, or primitives
❌ **DON'T**: Pass entities, framework objects, or database rows

### Dependency Inversion
- Inner layers define interfaces
- Outer layers implement them
- Flow of control can oppose dependency direction

### Port and Adapter Pattern
- **Ports**: Interfaces defined by domain/application
- **Adapters**: Implementations in infrastructure
- Primary Adapters: Drive the application (Controllers, CLI)
- Secondary Adapters: Driven by application (Repositories, External APIs)

## Testing Implications

- **Domain tests**: No external dependencies — domain objects tested through use cases (see `tdd-core-patterns`)
- **Application tests**: Fake only secondary ports (repository interfaces) — real domain collaborators
- **Adapter tests**: Test with real infrastructure (Testcontainers) for secondary adapters; HTTP black-box for primary adapters

## Common Violations to Reject

❌ Prisma/TypeORM decorators or configuration in domain entities
❌ NestJS dependencies in use cases or domain
❌ HTTP concepts in application layer
❌ Database queries in domain layer
❌ Business logic in controllers (primary adapters)
❌ Framework exceptions in domain
❌ Importing through deep paths instead of layer barrel files (`index.ts`)

## The Litmus Test

Before writing any code, ask:
- Can I test this without a framework?
- Can I swap the database without changing domain?
- Can I change the web framework without touching use cases?
- Is my domain expressing business concepts only?

If any answer is "no", the architecture is compromised.