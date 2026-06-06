---
name: tdd-integration-patterns
description: Integration testing patterns for secondary adapters with testcontainers and real infrastructure
---

# Skill: TDD Integration Patterns

## Purpose

Defines patterns for integration tests that validate **secondary adapter implementations** against real infrastructure. Integration tests verify that adapters correctly implement their interfaces (ports) using actual databases, message queues, and external services.

**Key Insight:** Integration tests validate the **adapter layer**, not business logic. Business logic is tested through unit tests in the hexagon.

## When to Use Integration Tests

### Primary Targets

| Adapter Type | Examples | Test Focus |
|--------------|----------|------------|
| Repository Adapters | `PrismaRideRepository`, `PrismaBookingRepository` | CRUD operations, queries, transactions |
| External Service Adapters | `S3FileStorageService`, `PdfGenerationService` | API integration, error handling |
| File Storage Adapters | `S3FileStorageService` | Upload, download, signed URLs |

### NOT for Integration Tests

- Business logic (use unit tests with fakes)
- Domain invariants (use unit tests through use cases)
- API contracts (use E2E tests)
- Cross-aggregate business rules (use unit tests)

## Testcontainers Setup

### PostgreSQL Container

```typescript
// packages/{bc}-context/src/adapters/secondary/postgresql/prismaRideRepository.integration.spec.ts

describe('PrismaRideRepository Integration', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .start();

    prisma = new PrismaClient({
      datasources: {
        db: { url: postgresContainer.getConnectionUri() },
      },
    });

    await prisma.$connect();
    // Run migrations
    execSync(`DATABASE_URL=${postgresContainer.getConnectionUri()} npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: postgresContainer.getConnectionUri() },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await postgresContainer.stop();
  });

  // tests...
});
```

### Container Lifecycle Strategy

| Scope | When to Use | Example |
|-------|-------------|---------|
| `beforeAll` / `afterAll` | Container startup (expensive) | PostgreSQL containers |
| `beforeEach` / `afterEach` | Test isolation | Clean state between tests |
| Transaction rollback | Data isolation | Auto-rollback per test |

## Repository Adapter Testing

### Pattern: Interface Compliance Testing

Test that the Prisma adapter correctly implements the repository interface.

```typescript
describe('PrismaRideRepository Integration', () => {
  let repository: RideRepository;

  beforeAll(async () => {
    // ... container setup ...
    repository = new PrismaRideRepository(prisma);
  });

  it('should save and retrieve ride when valid', async () => {
    // Given
    const ride = Ride.create(
      new RideId('ride-123'),
      new RiderId('rider-456'),
      'Paris, 1 rue de Rivoli',
      'Lyon, 5 place Bellecour',
      new Date(),
    );

    // When
    await repository.save(ride);
    const retrieved = await repository.findById(ride.id);

    // Then
    expect(retrieved).toBeDefined();
    expect(retrieved!.toSnapshot()).toEqual(ride.toSnapshot());
  });

  it('should return undefined when ride not found', async () => {
    // Given
    const nonExistentId = new RideId('non-existent-id');

    // When
    const result = await repository.findById(nonExistentId);

    // Then
    expect(result).toBeUndefined();
  });

  it('should update existing ride when saved again', async () => {
    // Given
    const ride = Ride.create(
      new RideId('ride-123'),
      new RiderId('rider-456'),
      'Paris, 1 rue de Rivoli',
      'Lyon, 5 place Bellecour',
      new Date(),
    );
    await repository.save(ride);

    // When - modify and update
    ride.updateDestination('Marseille, 10 rue de la République');
    await repository.save(ride);

    // Then
    const retrieved = await repository.findById(ride.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.toSnapshot().dropOffLocation).toBe('Marseille, 10 rue de la République');
  });
});
```

### Key Testing Principles

1. **Test interface compliance** — Verify all interface methods work correctly
2. **Use real domain objects** — Sociable within domain, real infrastructure
3. **Verify snapshot roundtrip** — `save()` → `findById()` → compare snapshots
4. **Test edge cases** — Not found, soft delete, tenant isolation
5. **Isolate per test** — Clean database between tests (via transaction rollback or manual cleanup)

### Snapshot Roundtrip Pattern

```typescript
it('should preserve all booking fields through persistence', async () => {
  // Given - Domain object with all fields populated
  const booking = Booking.create(
    new BookingId('booking-1'),
    new TenantId('tenant-1'),
    new RideId('ride-456'),
    new CustomerId('customer-1'),
    4500,           // fareAmount (cents)
    12,             // distanceKm
    25,             // durationMin
    'Airport pickup',  // note
    new Date(),
    new Date(),
  );
  const originalSnapshot = booking.toSnapshot();

  // When - Save and retrieve
  await repository.save(booking);
  const retrieved = await repository.findById(booking.id);

  // Then - All fields preserved
  expect(retrieved).toBeDefined();
  expect(retrieved!.toSnapshot()).toEqual(originalSnapshot);
});
```

## File Storage Adapter Testing

### Pattern: S3 with LocalStack

```typescript
describe('S3FileStorageService Integration', () => {
  let localstackContainer: StartedLocalStackContainer;
  let s3Client: S3Client;
  let service: S3FileStorageService;

  beforeAll(async () => {
    localstackContainer = await new LocalStackContainer('localstack/localstack:latest')
      .start();

    s3Client = new S3Client({
      endpoint: localstackContainer.getConnectionUri(),
      region: 'us-east-1',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      forcePathStyle: true,
    });

    await s3Client.send(new CreateBucketCommand({ Bucket: 'test-bucket' }));
    service = new S3FileStorageService(s3Client, 'test-bucket');
  });

  afterAll(async () => {
    s3Client.destroy();
    await localstackContainer.stop();
  });

  it('should upload and retrieve file', async () => {
    // Given
    const fileContent = Buffer.from('logo-content');
    const key = 'organizations/org-123/logo.png';

    // When
    await service.upload(key, fileContent, 'image/png');
    const retrieved = await service.download(key);

    // Then
    expect(retrieved).not.toBeNull();
    expect(retrieved!.toString()).toBe('logo-content');
  });
});
```

## Test Organization

```
packages/{bc}-context/src/adapters/secondary/postgresql/
├── index.ts
├── prismaRideRepository.ts
├── prismaRideRepository.integration.spec.ts
├── prismaBookingRepository.ts
└── prismaBookingRepository.integration.spec.ts
```

## Performance Guidelines

| Metric | Target | Strategy |
|--------|--------|----------|
| Per-test time | < 100ms | Transaction rollback, no data cleanup |
| Container startup | ~5s once | Shared container via beforeAll |
| Total suite | < 30s | Parallel with Jest workers |

### Optimization Techniques

1. **Shared containers** — Start expensive containers once per test class with `beforeAll`
2. **Transaction rollback** — Automatic cleanup via transaction scope rollback
3. **Parallel execution** — Vitest parallel test execution
4. **Lazy test data** — Create only necessary data per test

## Anti-Patterns

### NO Business Logic in Integration Tests

```typescript
// WRONG - Testing business rules in integration test
it('should prevent double-booking a ride', async () => {
  // This tests business logic - belongs in unit tests!
});

// RIGHT - Testing adapter persistence behavior
it('should persist booking with all fare fields', async () => {
  // Tests that numeric fields correctly map to database columns
  const booking = Booking.create({
    ...defaultProps,
    fareAmount: 4500,
    distanceKm: 12,
    durationMin: 25,
  });
  await repository.save(booking);
  const retrieved = await repository.findById(booking.id);
  expect(retrieved!.toSnapshot().fareAmount).toBe(4500);
});
```

### NO Fake Infrastructure in Integration Tests

```typescript
// WRONG - Using fakes defeats the purpose
it('test repository', () => {
  const repository = new FakeTrainingRepository();  // Not an integration test!
});

// RIGHT - Real infrastructure
it('test repository', async () => {
  // repository is PrismaRideRepository backed by real PostgreSQL
  await repository.save(ride);
});
```

### NO Shared Mutable State

```typescript
// WRONG - Tests affect each other
describe('RideRepository Integration', () => {
  const repository = new PrismaRideRepository(prisma);  // Shared across files!
});

// CORRECT - Fresh state per test suite (via beforeAll or beforeEach)
describe('RideRepository Integration', () => {
  let repository: RideRepository;
  // Each test gets a fresh state
});
```

## RED Phase for Integration Tests

### Example

```typescript
it('should save and retrieve ride', async () => {
  // Write test as if adapter exists
  const ride = Ride.create(
    new RideId('ride-123'),
    new RiderId('rider-456'),
    'Paris, 1 rue de Rivoli',
    'Lyon, 5 place Bellecour',
    new Date(),
  );

  await repository.save(ride);  // Method doesn't exist yet
  const retrieved = await repository.findById(ride.id);

  expect(retrieved).toBeDefined();
  expect(retrieved!.toSnapshot()).toEqual(ride.toSnapshot());
});
```

### Scaffold Example

```typescript
// adapters/secondary/postgresql/prismaRideRepository.ts

export class PrismaRideRepository implements RideRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(ride: Ride): Promise<void> {
    // Scaffold - behavioral failure
  }

  async findById(id: RideId): Promise<Ride | undefined> {
    return undefined;  // Scaffold - behavioral failure
  }
}
```

## Related Skills

- **`tdd-workflow-engine`** — TDD Sequence, enforcement rules
- `tdd-testing-patterns` — Test doubles, fixtures, assertions
- `tdd-core-patterns` — Unit testing for hexagon (use fakes there)
- `tdd-e2e-patterns` — E2E testing through HTTP boundary
