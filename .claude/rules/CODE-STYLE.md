# Code Style Rules

## Naming Conventions

### Domain Objects
- **Aggregates**: Noun (Order, Customer, Subscription)
- **Value Objects**: Descriptive noun (Money, EmailAddress, OrderId)
- **Domain Services**: Verb phrase or policy (PricingPolicy, InventoryChecker)
- **Domain Events**: Past tense (OrderPlaced, PaymentReceived)

### Application Layer
- **Use Cases**: Imperative verb (PlaceOrder, CancelSubscription)
- **Commands**: Action + "Command" (CreateOrderCommand)
- **Queries**: Query + "Query" (GetOrderByIdQuery)

### Tests
- **Test methods**: should [expected] when [condition]
- **Test files**: [classUnderTest].spec.ts

## TypeScript Principles

### Null Safety
- **NEVER** use null where avoidable
- Use `T | undefined` or `T | null` for maybe-present values
- Enable strict mode in `tsconfig.json` (`"strict": true`)
- Validate in constructors, only when a test proves necessity

### Immutability
- Immutable by default
- Use `readonly` properties for value objects and entities
- Collections are immutable (`ReadonlyArray<T>`, `Readonly<T>`)
- State changes return new instances

### Visibility
- Use `private` for internal implementation details
- Use `public` for the class API
- Use `protected` rarely (only for controlled extension)
- Prefer encapsulation over exposing internal state

### Object Construction
- Constructor validation ensures objects are always valid
- Use static factory methods for complex creation
- Builder pattern only when truly needed

### Aggregates: Two Construction Paths
Aggregates expose two distinct static factories:

- **`create(...)`** — enforces business invariants. Called by use cases on the creation path (new aggregates entering the system).
- **`fromSnapshot(snapshot)`** — reconstitutes pre-validated state. Called by secondary adapters (persistence) and test Object Mothers.

Rationale:
- Persistence adapters rehydrate state that was already valid when saved — re-running `create` would re-validate invariants that may have since evolved and wrongly reject legitimate stored data.
- Test Mothers must be able to produce arbitrary aggregate states without coupling every fixture to current business rules.
- `create` is a domain behavior, covered by its own tests. It is NOT a fixture helper.

```typescript
class RideRequest {
  static create(id: RideId, trip: Trip, price: Price): RideRequest { /* enforces invariants */ }
  static fromSnapshot(snapshot: RideSnapshot): RideRequest { /* reconstitutes */ }
  snapshot(): RideSnapshot { /* exports state */ }
}
```

See `tdd-testing-patterns` skill for the corresponding testing rule.

## Code Organization

### File / Folder Structure
- One aggregate per folder
- Organize by feature, not by layer within bounded context
- Clear boundaries between contexts
- Use kebab-case for file names (e.g., `ride-booking.ts`)
- **Barrel files (`index.ts`)**: every layer folder (`domain/`, `application/`, `adapters/`) and every feature folder (e.g. `use-cases/payment/`) exposes its public API through an `index.ts`. External code imports through barrels only — never via deep paths.

### Class Size
- Single Responsibility Principle
- Maximum ~100 lines per class (excluding imports)
- Extract when cohesion drops

### Method Size
- Maximum 10-15 lines
- Single level of abstraction
- Extract method if you need comments to explain a block

## Domain Specific Rules

### No Anemic Models
- Behavior lives with data
- Rich domain objects with business methods
- No public setters

### Tell, Don't Ask
- Objects do things, they don't expose data
- No getter chains
- Encapsulate decisions

### No Primitive Obsession
- Wrap primitives in value objects
- Type safety over convenience