---
name: tdd-e2e-patterns
description: E2E testing patterns for NestJS with HTTP-boundary black-box testing
---

# Skill: TDD E2E Patterns

## Purpose

Defines End-to-End testing patterns for NestJS applications, emphasizing **HTTP-boundary testing** and **black-box validation**. E2E tests verify the full architecture traversal from HTTP request to response, without directly accessing domain internals.

**Key Insight:** E2E tests validate the **complete stack through HTTP**, not individual components.

## Core Principle: HTTP Boundary Only

### Golden Rule

```
Tests interact ONLY via HTTP requests/responses.
NO direct import of domain entities, value objects, or aggregates in tests.
Importing port interfaces and fake adapters for test wiring IS allowed.
Repository access in tests only for assertions when using fakes.
```

### Architecture Traversal

```
┌─────────────┐     HTTP      ┌─────────────┐     Call     ┌─────────────┐
│   Test      │ ──────────▶   │  Controller │ ──────────▶  │  Use Case   │
│ (supertest) │               │ (NestJS)    │              │             │
└─────────────┘               └─────────────┘              └─────────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │   Domain    │
                                                           │   Models    │
                                                           └─────────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │  Secondary  │
                                                           │  Adapters   │
                                                           └─────────────┘
                                                           (In-Memory or Real)
```

### What This Means

| Allowed | Forbidden |
|---------|-----------|
| `await request(app.getHttpServer()).post('/rides/123/bookings').send(body)` | `import { Passenger } from '../domain/models'` |
| `expect(response.status).toBe(201)` | `new Passenger(...)` |
| `response.body.bookingId` | `bookRide.handle(command)` |
| `import { RideRepository } from '...secondary-ports/...'` (for wiring) | `import { RideId } from '...models/...'` |
| `import { InMemoryRideRepository } from '...in-memory/...'` (for test setup) | Direct domain entity construction |

## Test Modes

### Mode: `in-memory` (Default)

Fast, isolated, deterministic testing with in-memory adapters.

```typescript
// packages/ride-booking-context/src/adapters/primary/ride-booking.controller.e2e.spec.ts

describe('BookRide E2E', () => {
  let app: INestApplication;
  let rideRepository: InMemoryRideRepository;
  let customerRepository: InMemoryCustomerRepository;
  let bookingRepository: InMemoryBookingRepository;

  beforeAll(async () => {
    rideRepository = new InMemoryRideRepository();
    customerRepository = new InMemoryCustomerRepository();
    bookingRepository = new InMemoryBookingRepository();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('RideRepository')
      .useValue(rideRepository)
      .overrideProvider('CustomerRepository')
      .useValue(customerRepository)
      .overrideProvider('BookingRepository')
      .useValue(bookingRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup existing data
    rideRepository.addRide(existingRide);
    customerRepository.addCustomer(existingCustomer);
  });

  afterAll(async () => {
    await app.close();
  });

  // tests...
});
```

**Characteristics:**
- In-memory adapters for all secondary ports
- < 100ms per test
- Ideal for rapid TDD cycles
- Deterministic behavior

### Mode: `database`

Realistic testing with real infrastructure via testcontainers.

```typescript
describe('BookRide Database E2E', () => {
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .start();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_URL')
      .useValue(postgresContainer.getConnectionUri())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  // tests...
});
```

## NestJS Testing Patterns

### Basic Test Structure

```typescript
describe('BookRide E2E', () => {
  // ... setup above ...

  it('should book ride when valid data is provided', async () => {
    // Given
    const requestBody = {
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
      fareAmount: 4500,
      distanceKm: 12,
    };

    // When
    const response = await request(app.getHttpServer())
      .post(`/rides/${rideId}/bookings`)
      .send(requestBody);

    // Then
    expect(response.status).toBe(201);
    expect(response.body.bookingId).toBeDefined();
    expect(response.body.passengerId).toBeDefined();
  });

  it('should return 400 when missing required customer id', async () => {
    // Given
    const requestBody = { fareAmount: 4500 };

    // When
    const response = await request(app.getHttpServer())
      .post(`/rides/${rideId}/bookings`)
      .send(requestBody);

    // Then
    expect(response.status).toBe(400);
  });
});
```

### Request Patterns

```typescript
// POST with JSON body and auth
const response = await request(app.getHttpServer())
  .post(`/rides/${rideId}/bookings`)
  .set('Authorization', `Bearer ${token}`)
  .send({ customerId, fareAmount: 4500, distanceKm: 12 });
expect(response.status).toBe(201);

// GET with path parameter
const response = await request(app.getHttpServer())
  .get(`/rides/${rideId}`);
expect(response.status).toBe(200);

// GET with query parameters
const response = await request(app.getHttpServer())
  .get(`/rides?tenantId=${tenantId}`);
expect(response.status).toBe(200);
```

## Verification Patterns

### State Verification via API (Preferred)

```typescript
it('should persist booking and retrieve it', async () => {
  // Given
  const requestBody = { customerId, fareAmount: 4500, distanceKm: 12 };

  // When - Create
  const response = await request(app.getHttpServer())
    .post(`/rides/${rideId}/bookings`)
    .send(requestBody);
  expect(response.status).toBe(201);

  const bookingId = response.body.bookingId;

  // Then - Verify via API (not direct DB access)
  const getResponse = await request(app.getHttpServer())
    .get(`/bookings/${bookingId}`);
  expect(getResponse.status).toBe(200);
  expect(getResponse.body.fareAmount).toBe(4500);
});
```

### Database Verification (When Necessary)

```typescript
it('should persist booking with all fields', async () => {
  // Given
  const requestBody = { customerId, fareAmount: 4500, distanceKm: 12 };

  // When
  const response = await request(app.getHttpServer())
    .post(`/rides/${rideId}/bookings`)
    .send(requestBody);
  expect(response.status).toBe(201);

  const bookingId = response.body.bookingId;

  // Then - Verify database state via Prisma
  const prisma = app.get(PrismaClient);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  expect(booking).not.toBeNull();
  expect(booking!.tenantId).toBe(tenantId);
  expect(booking!.rideId).toBe(rideId);
  expect(booking!.fareAmount).toBe(4500);
  expect(booking!.distanceKm).toBe(12);
});
```

## Test File Organization

```
packages/{bc}-context/src/adapters/primary/
├── index.ts
├── ride-booking.controller.ts
├── ride-booking.controller.e2e.spec.ts            # E2E tests for booking endpoints
├── ride-management.controller.ts
└── ride-management.controller.e2e.spec.ts
```

### File Naming Convention

- `{resource}.controller.e2e.spec.ts`
- Examples: `ride-booking.controller.e2e.spec.ts`, `ride-management.controller.e2e.spec.ts`

## Anti-Patterns

### NO Direct Domain Access

```typescript
// WRONG - Importing domain entities/value objects in E2E test
import { Ride } from '../domain/models/ride';
import { BookRide } from '../application/use-cases/book-ride';

it('test booking', () => {
  const result = bookRide.handle(command);   // Direct use case access!
  const ride = Ride.create(...);             // Domain entity import!
});

// CORRECT - HTTP only
it('should book ride when valid data', async () => {
  const response = await request(app.getHttpServer())
    .post(`/rides/${rideId}/bookings`)
    .send(requestBody);
  expect(response.status).toBe(201);
});
```

### NO Shared Mutable State

```typescript
// WRONG - Tests share state
describe('Ride Booking API E2E', () => {
  const rideRepository = new InMemoryRideRepository(); // Shared!
});

// CORRECT - Fresh state per test via beforeAll/beforeEach
describe('Ride Booking API E2E', () => {
  let rideRepository: InMemoryRideRepository;

  beforeAll(async () => {
    rideRepository = new InMemoryRideRepository(); // Fresh per test suite
  });
});
```

## RED Phase for E2E Tests

### Example

```typescript
it('should return 201 when booking ride with valid data', async () => {
  // Write test as if endpoint exists
  const requestBody = {
    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    fareAmount: 4500,
    distanceKm: 12,
  };

  const response = await request(app.getHttpServer())
    .post(`/rides/${rideId}/bookings`)  // Endpoint doesn't exist yet
    .send(requestBody);

  expect(response.status).toBe(201);
  expect(response.body.bookingId).toBeDefined();
  expect(response.body.passengerId).toBeDefined();
});
```

### Scaffold Example

```typescript
// adapters/primary/ride-booking.controller.ts

@Controller('rides/:rideId/bookings')
export class RideBookingController {
  @Post()
  bookRide(
    @Param('rideId') rideId: string,
    @Body() request: BookRideRequest,
  ) {
    // Scaffold - returns empty for behavioral failure
    return { bookingId: '', passengerId: '' };
  }
}
```

## Performance Guidelines

| Mode | Target | Notes |
|------|--------|-------|
| fake | < 100ms per test | In-memory adapters |
| database | < 5s per test | Testcontainers overhead |
| Total suite | < 60s | Minimize E2E count |

## Related Skills

- **`tdd-workflow-engine`** — TDD Sequence, enforcement rules
- `tdd-testing-patterns` — Test doubles, fixtures, assertions
- `tdd-core-patterns` — Unit testing for hexagon
- `tdd-integration-patterns` — Integration testing for adapters
