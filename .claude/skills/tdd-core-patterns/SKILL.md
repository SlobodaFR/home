---
name: tdd-core-patterns
description: Strategic testing philosophy for application core (hexagon) - sociable tests, outside-in TDD, and core testing decisions
---

# Skill: TDD Core Patterns

## Purpose

Strategic testing philosophy for implementing the application core (hexagon) using TDD with Martin Fowler's **sociable tests** approach. This skill defines **what to test** and **how to approach** unit testing through Application Services (Use Cases) using real domain collaborators and fake external dependencies.

**For implementation details** (test doubles, fixtures, assertions, snapshot rules, Result patterns), see `tdd-testing-patterns`.

## Testing Philosophy: Outside-In with Sociable Tests and Wishful Thinking

We combine **Outside-In TDD** with Martin Fowler's **sociable tests** approach and **Programming by Wishful Thinking**:

**Programming by Wishful Thinking:** See the `tdd-workflow-engine` skill for the canonical TEST FIRST sequence.

**Outside-In TDD (Our Process):**
- Start from the primary port (use case) with business scenarios
- Let domain models emerge from use case behavior needs
- Begin with simple types, evolve to rich domain objects
- Test business behavior first, implementation structure second

**Sociable Tests (Our Implementation Style):**
- System Under Test works with real collaborators within the same layer
- Use real domain objects (aggregates, entities, value objects) together
- Fake only external dependencies (repositories, external services)
- Test business scenarios through natural object interactions
- Higher confidence, easier maintenance, realistic behavior validation

**What We Avoid:**
- **Inside-out approach**: Starting with domain objects before understanding behavior
- **Solitary tests**: Mocking domain objects and value objects
- **Implementation-first**: Designing aggregates before testing use cases
- **Creating before testing**: Writing production code before test

**Decision Rule:** Wishful thinking first, outside-in process, sociable within the core hexagon, isolated from infrastructure.

## Core Principles

**Unit Tests for Core (< 10ms per test):**
- Test domain logic and use case orchestration
- Use real domain objects (aggregates, entities, value objects)
- Custom fake implementations for secondary ports
- No mocking frameworks — hand-written test doubles only
- Focus on business behavior, not implementation details
- **NEVER add defensive code (null checks, parameter validations) unless driven by failing test**
- **NEVER generate setters/getters/properties unless absolutely required by failing test**

## Test Categories for Core

### Primary Target: Application Services (Use Cases)
**Location:** `packages/{bc}-context/src/application/use-cases/`
**Target:** Application Services (Use Cases) that orchestrate business scenarios
**Strategy:** Test through business use cases using real domain collaborators
**Why:** Validates complete business scenarios, maintains behavioral focus, reduces test maintenance

### Secondary Target: Domain Services (When Justified)
**Location:** `packages/{bc}-context/src/application/domain-services`
**Target:** Domain Services with complex isolated logic
**When to Test Directly:**
- Complex calculations or algorithms
- Cross-aggregate business rules
- Logic that benefits from isolated specification
**Strategy:** Test with real value objects and domain primitives

### What We Don't Test Directly: Aggregates/Entities/Value Objects
**Validation Strategy:** Their behavior is validated through Use Case tests
**Rationale:**
- Aggregates are tested through business scenarios, not in isolation
- Value object behavior emerges through use case execution
- Entity invariants are verified through realistic business flows
- Reduces over-specification and brittle tests

## Primary Testing Through Use Cases — Full Example

```typescript
// packages/ride-booking-context/src/application/use-cases/ride-booking/bookRide.spec.ts

describe('BookRide', () => {
  let rideRepository: InMemoryRideRepository;
  let customerRepository: InMemoryCustomerRepository;
  let bookingRepository: InMemoryBookingRepository;
  let passengerRepository: InMemoryPassengerRepository;
  let entityIdGenerator: StubEntityIdGenerator;
  let bookRide: BookRide;

  beforeEach(() => {
    rideRepository = new InMemoryRideRepository();
    customerRepository = new InMemoryCustomerRepository();
    bookingRepository = new InMemoryBookingRepository();
    passengerRepository = new InMemoryPassengerRepository();
    entityIdGenerator = new StubEntityIdGenerator();

    bookRide = new BookRide(
      rideRepository,
      customerRepository,
      bookingRepository,
      passengerRepository,
      entityIdGenerator,
    );

    // Setup existing data
    rideRepository.addRide(existingRide);
  });

  it('should create booking and passenger when valid ride data', () => {
    // Given
    customerRepository.addCustomer(existingCustomer);

    const command = new BookRideCommand(
      rideId,
      tenantId,
      customerId,
      4500,   // fareAmount
      12,     // distanceKm
    );

    // When
    const result = bookRide.handle(command);

    // Then
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(
      new BookRideResult(
        'generated-id-1',
        'generated-id-2',
        'test-customer-id',
      ),
    );

    // Verify booking snapshot
    const bookings = bookingRepository.getAll();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].toSnapshot()).toEqual({
      id: 'generated-id-1',
      tenantId: 'tenant-1',
      rideId: 'ride-123',
      customerId: 'test-customer-id',
      fareAmount: 4500,
      distanceKm: 12,
      note: undefined,
      deleted: false,
    });

    // Verify passenger snapshot
    const passengers = passengerRepository.getAll();
    expect(passengers).toHaveLength(1);
    expect(passengers[0].toSnapshot()).toEqual({
      id: 'generated-id-2',
      tenantId: 'tenant-1',
      bookingId: 'generated-id-1',
      customerId: 'test-customer-id',
      status: PassengerStatus.Standard,
    });
  });

  it('should prevent booking for non existent ride', () => {
    // Given
    customerRepository.addCustomer(existingCustomer);

    const command = new BookRideCommand(
      new RideId('non-existent-ride'),
      tenantId,
      customerId,
    );

    // When
    const result = bookRide.handle(command);

    // Then
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(RideNotFound);

    // No side effects
    expect(bookingRepository.getAll()).toEqual([]);
    expect(passengerRepository.getAll()).toEqual([]);
  });
});
```

## Secondary Testing — Domain Services (When Justified)

```typescript
describe('PassengerCategoryResolver', () => {
  const resolver = new PassengerCategoryResolver();

  it('should resolve to standard when no loyalty tier and no explicit status', () => {
    // Given - Complex business rule that benefits from isolated specification
    const customer = Customer.create({
      ...defaultCustomerProps,
      loyaltyTier: LoyaltyTier.None,
    });

    // When
    const status = resolver.resolveDefault(customer, undefined);

    // Then
    expect(status).toBe(PassengerStatus.Standard);
  });

  it('should resolve to premium when customer has gold loyalty tier', () => {
    // Given
    const customer = Customer.create({
      ...defaultCustomerProps,
      loyaltyTier: LoyaltyTier.Gold,
    });

    // When
    const status = resolver.resolveDefault(customer, undefined);

    // Then
    expect(status).toBe(PassengerStatus.Premium);
  });
});
```

## What We Don't Test Directly

```typescript
// BAD - Over-testing domain objects in isolation
describe('Booking', () => { /* tests all validation rules */ });
describe('Passenger', () => { /* tests all state transitions */ });
describe('CustomerId', () => { /* tests all validation */ });

// GOOD - Test domain behavior through business scenarios
describe('BookRide', () => {
  it('should prevent booking when customer does not belong to tenant', () => {
    // Tenant isolation emerges through use case
    // Entity invariants validated through business flow
  });
});
```

## Event Testing Patterns

### Event Accumulation Through Use Cases

```typescript
it('should publish ride booked event when booking is confirmed', () => {
  // Given
  const command = validBookRideCommand();

  // When
  bookRide.handle(command);

  // Then - Domain event validated through repository fake
  const events = bookingRepository.getPersistedEvents();
  expect(events).toHaveLength(1);

  const event = events[0];
  expect(event.eventType).toBe('RideBooked');
  expect(event.bookingId).toBe(command.bookingId);
  expect(event.rideId).toBe(command.rideId);
  expect(event.tenantId).toBe(command.tenantId);
});
```

## Sociable Testing Strategy for Core

### Real Collaborators Within Core
- **Use Real Objects:** Aggregates, entities, value objects work together naturally
- **Natural Interactions:** Domain objects collaborate as they would in production
- **Business Scenario Focus:** Tests validate complete business flows
- **Authentic Behavior:** Real domain logic execution provides higher confidence

### Test Double Strategy: Isolated from Infrastructure

**Core-Specific Approach:**
- **Use Real Domain Objects:** Ride, Booking, Passenger, Customer work together naturally
- **Fake External Dependencies:** Repositories, external services, transaction management
- **Focus on Business Scenarios:** Test complete business flows through use cases

**For comprehensive test doubles guide, see `tdd-testing-patterns`.**

## Enforcement: No Direct Aggregate/Entity/Value Object Testing

**MANDATORY RULE**: Core tests MUST target Use Cases (Application Services), NEVER aggregates, entities, or value objects directly.

**Detection:**
```
IF (test_class_SUT is Aggregate OR Entity OR ValueObject) {
    VIOLATION: "Direct domain object testing"
    ACTION: Rewrite test to go through a Use Case
}
```

**Indicators of violation:**
- Test instantiates an aggregate and calls its methods directly as SUT
- Test class has no Use Case / Application Service dependency
- No fake repository or secondary port in test setup
- SUT is a domain object instead of an Application Service

**Only exception:** Domain Services with complex isolated logic (see "Secondary Target" above).

## Anti-Patterns

### Don't Use Solitary Tests for Domain Objects

```typescript
// BAD - Isolating domain objects with mocks
const ride = vi.mocked<Ride>();
const customer = vi.mocked<Customer>();

it('should create booking', () => {
  bookRide.handle(command);  // Too isolated
});

// GOOD - Sociable tests with real domain collaborators
it('should create booking and passenger when valid ride data', () => {
  rideRepository.addRide(existingRide);
  customerRepository.addCustomer(existingCustomer);

  const result = bookRide.handle(command);  // Real collaboration
  expect(result.isSuccess).toBe(true);
});
```

### Don't Mock What You Own (Domain Layer)

```typescript
// BAD - Mocking domain objects you control
const ride = vi.mocked<Ride>();
const resolver = vi.mocked<PassengerCategoryResolver>();

// GOOD - Use real domain objects, fake only external dependencies
const rideRepository = new InMemoryRideRepository();
const resolver = new PassengerCategoryResolver();  // Real domain service
```

### Don't Use Real Infrastructure in Unit Tests

```typescript
// BAD - Real database/network in unit tests
const prisma = new PrismaClient();  // Too slow, not unit test

// GOOD - Fake external dependencies
const rideRepository = new InMemoryRideRepository();
const bookingRepository = new InMemoryBookingRepository();
```

## Performance Guidelines

### Speed Requirements
- **Target**: < 10ms per test
- **Total suite**: < 1 second for all core tests
- **No I/O**: No database, network, file system access
- **Memory only**: Use in-memory collections for fakes

### Test Organization
```
packages/{bc}-context/src/application/use-cases/
├── ride-booking/
│   ├── index.ts
│   ├── bookRide.ts
│   └── bookRide.spec.ts                         # PRIMARY: Use case tests
├── ride-cancellation/
│   ├── index.ts
│   ├── cancelRide.ts
│   └── cancelRide.spec.ts                       # PRIMARY: Use case tests
└── passenger-category/
    ├── index.ts
    ├── passengerCategoryResolver.ts
    └── passengerCategoryResolver.spec.ts        # SECONDARY: Domain service tests
```

## Quick Checklist

Before writing core test:
- [ ] **Primary Target**: Testing through Use Cases (Application Services)
- [ ] Test name describes business scenario (`should [businessOutcome] when [businessCondition]`)
- [ ] Uses **real domain objects** working together (sociable approach)
- [ ] Uses **fake implementations** only for secondary ports (repositories, external services)
- [ ] Tests complete **business scenarios**, not isolated object behavior
- [ ] Runs in < 10ms (unit test speed with in-memory fakes)
- [ ] **No mocking of domain objects** (aggregates, entities, value objects)
- [ ] Follows Given-When-Then structure with business context
- [ ] **Domain behavior emerges** through use case execution, not direct testing
- [ ] Only test Domain Services directly when complex isolated logic justified
- [ ] **NEVER add defensive code unless required by failing test**
- [ ] **NEVER generate setters/getters/properties unless absolutely required by failing test**
- [ ] **For snapshot and Result assertion rules, see `tdd-testing-patterns`**

## Related Skills

- **`tdd-workflow-engine`** — TDD Sequence, TPP, violations, test type detection
- **`tdd-testing-patterns`** — Test doubles, fixtures, snapshot assertions, Result assertions
