---
name: tdd-testing-patterns
description: Test patterns, doubles, fixtures, and assertions for Clean Architecture
---

# Skill: TDD Testing Patterns

**Focus:** HOW to write tests — patterns, doubles, fixtures, assertions.

## Canonical Reference

**For the mandatory TEST FIRST sequence, state machine, and wishful thinking workflow, see:** the `tdd-workflow-engine` skill.

This skill focuses on implementation patterns for test code.

## Test Naming

**Pattern:** `should [outcome] when [condition]`

```typescript
// GOOD
it('should prevent booking for non existent ride', () => { });

it('should create booking and passenger when valid ride data', () => { });

// BAD
it('test booking', () => { });   // What behavior?

it('create passenger', () => { });  // What outcome?
```

## Test Doubles (No Mocking Frameworks)

**Decision tree:**
```
What dependency?
├── Repository → Fake (in-memory)
├── External service → Spy or Fake
├── Domain object → Real object
├── Value object → Real object
└── Unit of Work → Fake transaction
```

**Types:**
- **Fake:** Working implementation with shortcuts
- **Spy:** Records calls for verification
- **Stub:** Returns canned responses

**NEVER mock domain objects. Use real objects.**

## Snapshot Pattern (Mandatory for Repository Fakes)

```typescript
export interface BookingRepository {
  save(booking: Booking): void;
  findById(id: BookingId): Booking | undefined;
}

export class FakeBookingRepository implements BookingRepository {
  private readonly bookings = new Map<string, Booking>();
  private readonly persistedEvents: DomainEvent[] = [];

  save(booking: Booking): void {
    // Extract and persist domain events from the aggregate
    const events = booking.domainEvents;
    this.persistedEvents.push(...events);
    booking.clearDomainEvents();

    this.bookings.set(booking.id.value, booking);
  }

  findById(id: BookingId): Booking | undefined {
    const booking = this.bookings.get(id.value);
    if (!booking) return undefined;

    return Booking.fromSnapshot(booking.toSnapshot()); // Returns copy
  }

  getPersistedEvents(): ReadonlyArray<DomainEvent> {
    return [...this.persistedEvents];
  }
}
```

**Why snapshots?**
- Enforces explicit `save()` on the repository in use cases
- Prevents accidental mutations
- Returns copies, not references

## Assertions on Snapshots (Canonical Reference)

**MANDATORY: Assert on snapshots, not domain objects**

```typescript
// WRONG - Entity equality might only compare ID
expect(actualBooking).toEqual(expectedBooking);

// CORRECT - Snapshot comparison
expect(actualBooking.toSnapshot()).toEqual(expectedBooking.toSnapshot());

// For specific fields
const snapshot = booking.toSnapshot();
expect(snapshot.fareAmount).toBe(4500);
expect(snapshot.distanceKm).toBe(12);
expect(snapshot.note).toBeUndefined();
```

**Event verification:**
```typescript
const events = bookingRepository.getPersistedEvents();
expect(events).toHaveLength(1);
expect(events[0].eventType).toBe('RideBooked');
```

## Result Type Assertions

The project uses a Result type for use case results. All use cases return a result with success or error.

### Asserting Success

```typescript
const result = bookRide.handle(command);

// Check success
expect(result.isSuccess).toBe(true);

// Extract and assert on the success value
expect(result.value).toEqual(
  new BookRideResult(
    'generated-id-1',
    'generated-id-2',
    'test-customer-id',
  ),
);
```

### Asserting Errors

```typescript
const result = bookRide.handle(command);

// Check error
expect(result.isFailure).toBe(true);

// Assert on error type
expect(result.error).toBeInstanceOf(RideNotFound);
```

### Error Type Discrimination

Error types use a base class or discriminated union:

```typescript
export abstract class BookRideError {}

export class RideNotFound extends BookRideError {}
export class TenantMismatch extends BookRideError {}
export class CustomerNotFound extends BookRideError {}
export class PassengerAlreadyBooked extends BookRideError {}
```

Assert on the specific error type:

```typescript
// Specific error type
expect(result.error).toBeInstanceOf(TenantMismatch);

// Verify no side effects on error
expect(bookingRepository.getAll()).toEqual([]);
expect(passengerRepository.getAll()).toEqual([]);
```

## Spy Pattern

```typescript
export class SpyEventPublisher implements EventPublisher {
  private readonly events: DomainEvent[] = [];

  publish(event: DomainEvent): void {
    this.events.push(event);
  }

  wasEventPublished(eventType: string): boolean {
    return this.events.some((e) => e.eventType === eventType);
  }

  get publishedEvents(): ReadonlyArray<DomainEvent> {
    return [...this.events];
  }
}
```

## Stub Pattern (Predictable IDs)

```typescript
// Stub EntityIdGenerator for deterministic test IDs
export class StubEntityIdGenerator implements EntityIdGenerator {
  private counter = 0;

  generate(): string {
    return `generated-id-${++this.counter}`;
  }
}
```

## Test Fixtures

### Rule: Mothers reconstitute, they don't create

**Tests (unit, integration, e2e) and fixtures MUST NOT call aggregate business constructors** (`AggregateRoot.create(...)`).

- **Mothers reconstitute via `fromSnapshot` / `fromPrimitives`** — bypassing business invariants.
- **`create(...)` is a domain behavior** — covered by its own tests, not reused as a fixture builder.

**Why:**
1. Tests must set up arbitrary state independent of current invariants (including invalid-but-historically-valid states).
2. Invariant evolution doesn't cascade-break every fixture in the codebase.
3. `create` and `fromSnapshot` have different responsibilities — coupling them via Mothers blurs the boundary.

**Required aggregate API:**
```typescript
class RideRequest {
  static create(...): RideRequest { /* enforces invariants */ }
  static fromSnapshot(snapshot: RideSnapshot): RideRequest { /* reconstitutes */ }
  snapshot(): RideSnapshot { /* exports state */ }
}
```

`fromSnapshot` is also the canonical reconstitution path for **persistence adapters** (DB row → snapshot → aggregate). Mothers and adapters share the same path — both reconstitute pre-validated state.

### Object Mother Pattern

```typescript
export class RideMother {
  static aDefaultRide(): Ride {
    return Ride.fromSnapshot(RideMother.aDefaultRideSnapshot());
  }

  static aDefaultRideSnapshot(): RideSnapshot {
    return {
      id: 'ride-123',
      tenantId: 'tenant-456',
      pickUpLocation: 'Paris, 1 rue de Rivoli',
      dropOffLocation: 'Lyon, 5 place Bellecour',
      status: RideStatus.Pending,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static aCompletedRide(): Ride {
    return Ride.fromSnapshot({
      ...RideMother.aDefaultRideSnapshot(),
      id: 'ride-completed',
      status: RideStatus.Completed,
    });
  }
}
```

### Builder Pattern

```typescript
RideMother.aRide()
  .withStatus(RideStatus.Completed)
  .withPickUpLocation('Paris, CDG Airport')
  .build();
```

## Testing with Snapshots Example

```typescript
it('should require explicit save for booking updates', () => {
  // Given
  const repository = new FakeBookingRepository();
  const booking = BookingMother.aBookingWith({
    id: 'booking-1',
    tenantId: 'tenant-1',
    rideId: 'ride-1',
    fareAmount: 4500,
  });
  repository.save(booking);

  // When - Retrieve and modify copy
  const retrieved = repository.findById(booking.id);
  expect(retrieved).toBeDefined();
  // Modifications to retrieved copy do NOT affect stored version

  // Then - Changes not persisted without save()
  const fresh = repository.findById(booking.id);
  expect(fresh).toBeDefined();
  expect(fresh!.toSnapshot().fareAmount).toBe(4500);
});
```

## Anti-Patterns

### Mocking Domain Objects

```typescript
// WRONG
const ride = vi.mocked<Ride>();

// RIGHT - use a Mother, which reconstitutes via fromSnapshot
const ride = RideMother.aDefaultRide();
```

### Aggregate business constructor in tests or fixtures

```typescript
// WRONG - couples the fixture to current invariants; breaks every test
// when business rules evolve
return RideRequest.create(new RideId(id), new Trip(...), new Price(price));

// WRONG - same anti-pattern inlined in a test body
const ride = RideRequest.create(new RideId('r-1'), new Trip(...), new Price(205));

// RIGHT - Mother reconstitutes from a snapshot
return RideRequest.fromSnapshot({ id, pickUpLocation, dropOffLocation, distance, price });

// RIGHT - test body uses the Mother
const ride = aRideRequestWith({ id: 'r-1', price: 205 });
```

### Multiple Behaviors Per Test

```typescript
// WRONG - Tests 3 behaviors
bookRide.handle(command1);
cancelRide.handle(command2);
rateRide.handle(command3);

// RIGHT - One behavior
const result = bookRide.handle(command);
expect(result.isSuccess).toBe(true);
```

### Direct Entity Comparison

```typescript
// WRONG
expect(actualBooking).toEqual(expectedBooking);

// RIGHT
expect(actualBooking.toSnapshot()).toEqual(expectedBooking.toSnapshot());
```

## Quick Checklist

- [ ] Test name: `should [outcome] when [condition]`
- [ ] No mocking frameworks for domain objects
- [ ] Assert on snapshots, not domain objects
- [ ] Assert Result with `.isSuccess` / `.isFailure`
- [ ] Repository fakes use snapshot pattern
- [ ] Explicit save() required for persistence
- [ ] Vitest `it()` / `describe()` / `expect()` matchers
- [ ] < 10ms per unit test

## Related Skills

- **`tdd-workflow-engine`** — TDD Sequence, TPP, violations, test type detection
- `tdd-core-patterns` — What to test (sociable testing)
