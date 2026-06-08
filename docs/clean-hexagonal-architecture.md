# Clean / Hexagonal Architecture Guide

A comprehensive guide for developers to understand and apply Clean Architecture (also known as Hexagonal Architecture or Ports & Adapters).

---

## Table of Contents

1. [Introduction](#introduction)
2. [The Core Problem: Why Architecture Matters](#the-core-problem-why-architecture-matters)
3. [The Hexagon: Your Business Logic Fortress](#the-hexagon-your-business-logic-fortress)
4. [The Dependency Rule](#the-dependency-rule)
5. [Layers in Detail](#layers-in-detail)
6. [Ports & Adapters Explained](#ports--adapters-explained)
7. [Real Examples from Our Codebase](#real-examples-from-our-codebase)
8. [Testing Strategy](#testing-strategy)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
10. [Summary](#summary)

---

## Introduction

Clean Architecture (coined by Robert C. Martin) and Hexagonal Architecture (coined by Alistair Cockburn) are essentially the same concept with different visualizations:

- **Hexagonal Architecture** visualizes the application as a hexagon with ports on its edges
- **Clean Architecture** visualizes it as concentric circles with dependencies pointing inward

Both aim to achieve the same goal: **isolate business logic from technical concerns**.

### Project Structure

```
packages/<bounded-context>/src/
├── domain/                             # THE HEXAGON — innermost ring
│   ├── (aggregates, value objects)     # Pure business logic
│   └── index.ts                        # Barrel
│
├── application/                        # THE HEXAGON — use cases
│   ├── (use cases, ports/interfaces)
│   └── index.ts                        # Barrel
│
└── adapters/                           # OUTSIDE THE HEXAGON
    ├── http/                           # Primary adapters (NestJS controllers)
    ├── persistence/                    # Secondary adapters (Prisma repositories)
    └── email/                          # Secondary adapters (email providers)

apps/api/src/
├── app.module.ts                       # Composes BC modules
└── main.ts                             # Bootstrap (telemetry → logger → NestJS)
```

---

## The Core Problem: Why Architecture Matters

### The Problem with Traditional Layered Architecture

In traditional applications, business logic often becomes entangled with:

```
❌ BAD: Business logic mixed with technical concerns

class BookRideService {
  async bookRide(rideData: RideDTO) {
    // Direct database call - coupled to PostgreSQL
    const rider = await this.db.query('SELECT * FROM riders WHERE id = $1', [rideData.riderId]);

    // Business logic buried in framework code
    if (rider.plan === 'premium') {
      // ...pricing logic...
    }

    // Direct external API call - coupled to specific service
    const distance = await axios.get(`https://maps.api.com/distance?from=${from}&to=${to}`);

    // More business logic mixed with persistence
    await this.db.query('INSERT INTO rides...', [...]);
  }
}
```

**Problems:**

- Cannot test business logic without a database
- Cannot switch databases without rewriting business logic
- Cannot replace the maps API without touching business code
- Business rules are hidden among technical code

### The Solution: Hexagonal Architecture

```
✅ GOOD: Business logic isolated in the hexagon

// Use Case - pure orchestration, no technical details
class BookRideUseCase {
  constructor(
    private rideRepository: RideRepository,        // Interface, not implementation
    private riderRepository: RiderRepository,      // Interface, not implementation
    private tripScanner: TripScanner,              // Interface, not implementation
    private dateTimeProvider: DateTimeProvider,    // Interface, not implementation
  ) {}

  execute(pickUp: Position, dropOff: Position): void {
    const rider = this.riderRepository.byId('456def');
    const distance = this.tripScanner.distanceBetween(pickUp, dropOff);

    if (distance < 3) {
      throw new UberXNotAvailableError(distance);  // Domain exception
    }

    const trip = Trip.create(pickUp, dropOff, distance);
    const price = rider.totalRidePrice(this.dateTimeProvider.now(), distance);

    this.rideRepository.save(new Ride('123abc', '456def', true, trip, price, 'PENDING'));
  }
}
```

**Benefits:**

- Business logic is testable in isolation (with fake implementations)
- Can switch databases by providing a different adapter
- Can replace the maps API without touching business code
- Business rules are explicit and centralized

---

## The Hexagon: Your Business Logic Fortress

The hexagon is the core of your application. It contains:

1. **Domain Layer** - The heart: entities, value objects, business rules
2. **Secondary Ports** - Interfaces defining what the domain needs
3. **Application Layer** - Use cases that orchestrate the domain

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE HEXAGON                              │
│                    (domain/ + application/)                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    USE CASES                             │  │
│   │  Orchestrates domain objects, enforces application flow  │  │
│   │                                                          │  │
│   │   BookRideUseCase                                        │  │
│   │     → coordinates Rider, Trip, Ride                      │  │
│   │     → uses ports for external operations                 │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                            │ uses                               │
│   ┌────────────────────────▼────────────────────────────────┐  │
│   │                    DOMAIN MODELS                         │  │
│   │  Pure business logic, no external dependencies           │  │
│   │                                                          │  │
│   │   Rider     → pricing rules, birthday logic              │  │
│   │   Ride      → aggregate root with Trip                   │  │
│   │   Trip      → value object (pickup, dropoff, distance)   │  │
│   │   Position  → value object (latitude, longitude)         │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                            │ defines                            │
│   ┌────────────────────────▼────────────────────────────────┐  │
│   │                  SECONDARY PORTS                         │  │
│   │  Interfaces (contracts) for external dependencies        │  │
│   │                                                          │  │
│   │   RideRepository     → save(ride)                        │  │
│   │   RiderRepository    → byId(riderId)                     │  │
│   │   TripScanner        → distanceBetween(from, to)         │  │
│   │   DateTimeProvider   → now()                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Golden Rule

**The hexagon must NOT depend on anything outside itself.**

- No imports from `adapters/`
- No imports from frameworks (NestJS, Express, TypeORM)
- No imports from external libraries (axios, pg, mongodb)
- Only pure TypeScript/JavaScript

---

## The Dependency Rule

**All dependencies point INWARD toward the hexagon.**

```
                    ┌──────────────────┐
                    │  Primary Adapter │
                    │   (Controller)   │
                    └────────┬─────────┘
                             │ calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        THE HEXAGON                              │
│                                                                 │
│    Use Case ◄──── depends on ──── Secondary Port (Interface)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ implements
                    ┌────────┴─────────┐
                    │ Secondary Adapter│
                    │ (Implementation) │
                    └──────────────────┘
```

### In Code

```typescript
// ✅ CORRECT: Use case depends on INTERFACE (port)
// File: application/ride-booking/bookRideUseCase.ts

import { RideRepository } from '../../domain/ (ports)rideRepository'; // Interface
import { RiderRepository } from '../../domain/ (ports)riderRepository'; // Interface
import { TripScanner } from '../../domain/ (ports)tripScanner'; // Interface
import { DateTimeProvider } from '../../domain/ (ports)dateTimeProvider'; // Interface

export class BookRideUseCase {
  constructor(
    private readonly rideRepository: RideRepository,
    private readonly riderRepository: RiderRepository,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly tripScanner: TripScanner,
  ) {}
  // ...
}
```

```typescript
// ❌ WRONG: Use case depends on IMPLEMENTATION
import { PostgresRideRepository } from '../../../adapters/secondary/postgres/rideRepository';
import { GoogleMapsScanner } from '../../../adapters/secondary/google-maps/tripScanner';

export class BookRideUseCase {
  constructor(
    private readonly rideRepository: PostgresRideRepository, // Concrete class!
    private readonly tripScanner: GoogleMapsScanner, // Concrete class!
  ) {}
  // ...
}
```

---

## Layers in Detail

### 1. Domain Layer (`domain/`)

The innermost layer. Contains pure business logic with no external dependencies.

#### Entities

Objects with identity that persist over time:

```typescript
// File: domain/ride.ts

import { Position } from './position';
import { Trip } from './trip';

export type RideSnapshot = {
  id: string;
  riderId: string;
  isUberX: boolean;
  pickUpPosition: Position;
  dropOffPosition: Position;
  distanceInKm: number;
  price: number;
  status: string;
};

export class Ride {
  constructor(
    public readonly id: string, // Identity
    private readonly riderId: string,
    public readonly isUberX: boolean,
    public readonly trip: Trip,
    public readonly price: number,
    public readonly status: string,
  ) {}

  static fromSnapshot(snapshot: RideSnapshot): Ride {
    return new Ride(
      snapshot.id,
      snapshot.riderId,
      snapshot.isUberX,
      Trip.create(snapshot.pickUpPosition, snapshot.dropOffPosition, snapshot.distanceInKm),
      snapshot.price,
      snapshot.status,
    );
  }

  toSnapshot(): RideSnapshot {
    return {
      id: this.id,
      riderId: this.riderId,
      isUberX: this.isUberX,
      pickUpPosition: this.trip.pickUpPosition,
      dropOffPosition: this.trip.dropOffPosition,
      distanceInKm: this.trip.distanceInKm,
      price: this.price,
      status: this.status,
    };
  }
}
```

#### Value Objects

Immutable objects defined by their attributes, not identity:

```typescript
// File: domain/position.ts

export type Position = {
  latitude: number;
  longitude: number;
};
```

```typescript
// File: domain/trip.ts

import { Position } from './position';

export class Trip {
  private constructor(
    // Private constructor
    public readonly pickUpPosition: Position,
    public readonly dropOffPosition: Position,
    public readonly distanceInKm: number,
  ) {}

  static create(
    // Factory method
    pickUpPosition: Position,
    dropOffPosition: Position,
    distanceInKm: number,
  ): Trip {
    return new Trip(pickUpPosition, dropOffPosition, distanceInKm);
  }
}
```

#### Domain Services (Entities with Business Rules)

```typescript
// File: domain/rider.ts

export class Rider {
  constructor(
    private readonly id: string,
    private readonly birthdate: Date,
    private readonly plan: string,
  ) {}

  // Business rule: Calculate total price based on plan and conditions
  totalRidePrice(date: Date, distance: number) {
    return this.rideBasePrice() + this.uberXFees(date) + this.kilometerFees(distance);
  }

  // Business rule: Premium plan has lower base price
  private rideBasePrice() {
    return this.plan === 'premium' ? 3 : 5;
  }

  // Business rule: No UberX fees on birthday
  private uberXFees(currentDate: Date) {
    return this.isBirthday(currentDate) ? 0 : 10;
  }

  // Business rule: Premium plan has free km up to 5km
  private kilometerFees(distance: number) {
    if (this.plan === 'premium') {
      return distance > 5 ? 0.5 : 0;
    }
    return distance * 0.5;
  }

  private isBirthday(currentDate: Date) {
    return (
      currentDate.getDate() === this.birthdate.getDate() &&
      currentDate.getMonth() === this.birthdate.getMonth()
    );
  }
}
```

#### Domain Exceptions

```typescript
// File: domain/uberXNotAvailableError.ts

export class UberXNotAvailableError extends Error {
  constructor(distance: number) {
    super(`UberX is not available for trips under 3 kilometers. Distance: ${distance}km`);
    this.name = 'UberXNotAvailableError';
  }
}
```

### 2. Secondary Ports (`domain/ (ports)`)

Interfaces that define what the hexagon needs from the outside world.

```typescript
// File: domain/ (ports)rideRepository.ts

import { Ride } from '../models/ride';

export interface RideRepository {
  save(ride: Ride): void;
}
```

```typescript
// File: domain/ (ports)riderRepository.ts

import { Rider } from '../models/rider';

export interface RiderRepository {
  byId(riderId: string): Rider;
}
```

```typescript
// File: domain/ (ports)tripScanner.ts

import { Position } from '../models/position';

export interface TripScanner {
  distanceBetween(pickupLocation: Position, dropOffLocation: Position): number;
}
```

```typescript
// File: domain/ (ports)dateTimeProvider.ts

export interface DateTimeProvider {
  now(): Date;
}
```

### 3. Application Layer (`application/`)

Orchestrates domain objects to fulfill use cases. Contains NO business rules.

```typescript
// File: application/ride-booking/bookRideUseCase.ts

import { DateTimeProvider } from '../../domain/ (ports)dateTimeProvider';
import { Ride } from '../../models/ride';
import { RideRepository } from '../../domain/ (ports)rideRepository';
import { RiderRepository } from '../../domain/ (ports)riderRepository';
import { TripScanner } from '../../domain/ (ports)tripScanner';
import { Trip } from '../../models/trip';
import { Position } from '../../models/position';
import { UberXNotAvailableError } from '../../models/uberXNotAvailableError';

export class BookRideUseCase {
  constructor(
    private readonly rideRepository: RideRepository,
    private readonly riderRepository: RiderRepository,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly tripScanner: TripScanner,
  ) {}

  execute(pickUpPosition: Position, dropOffPosition: Position): void {
    // Step 1: Get the rider
    const rider = this.riderRepository.byId('456def');

    // Step 2: Calculate distance (delegated to external service via port)
    const distance = this.tripScanner.distanceBetween(pickUpPosition, dropOffPosition);

    // Step 3: Validate business rule
    if (distance < 3) {
      throw new UberXNotAvailableError(distance);
    }

    // Step 4: Create domain objects
    const trip = Trip.create(pickUpPosition, dropOffPosition, distance);

    // Step 5: Calculate price (business logic in Rider entity)
    const price = rider.totalRidePrice(this.dateTimeProvider.now(), trip.distanceInKm);

    // Step 6: Persist (delegated to repository via port)
    this.rideRepository.save(new Ride('123abc', '456def', true, trip, price, 'PENDING'));
  }
}
```

**Key points:**

- The use case orchestrates but doesn't contain business rules
- Pricing logic is in `Rider.totalRidePrice()`
- Distance calculation is delegated to `TripScanner` port
- Persistence is delegated to `RideRepository` port

### 4. Adapters (`adapters/`)

Implementations that live OUTSIDE the hexagon.

#### Secondary Adapters (`adapters/secondary/`)

Implement the ports defined in the hexagon:

```typescript
// File: adapters/in-memory/in-memory-ride-repository.ts

import { Ride } from '../../../domain/ride';
import { RideRepository } from '../../../domain/ (ports)rideRepository';

export class InMemoryRideRepository implements RideRepository {
  public allRides: Ride[] = [];

  save(ride: Ride) {
    this.allRides.push(ride);
  }
}
```

```typescript
// File: adapters/in-memory/in-memory-rider-repository.ts

import { Rider } from '../../../domain/rider';
import { RiderRepository } from '../../../domain/ (ports)riderRepository';

export class InMemoryRiderRepository implements RiderRepository {
  private allRiders: Record<string, Rider> = {};

  byId(riderId: string): Rider {
    return this.allRiders[riderId];
  }

  public addRider(rider: Rider): void {
    this.allRiders[rider['id']] = rider;
  }
}
```

```typescript
// File: adapters/secondary/in-memory/fixedDateTimeProvider.ts

import { DateTimeProvider } from '../../../domain/ (ports)dateTimeProvider';

export class FixedDateTimeProvider implements DateTimeProvider {
  public currentDate: Date | undefined;

  now(): Date {
    if (!this.currentDate) {
      throw new Error('Current date is not set in FixedDateTimeProvider');
    }
    return this.currentDate;
  }
}
```

#### Primary Adapters (`adapters/primary/`)

Drive the application (controllers, CLI, GraphQL resolvers):

```typescript
// File: adapters/primary/ride.controller.ts (example)

@Controller('rides')
export class RideController {
  constructor(private readonly bookRideUseCase: BookRideUseCase) {}

  @Post()
  bookRide(@Body() dto: BookRideDto) {
    this.bookRideUseCase.execute(dto.pickUp, dto.dropOff);
    return { status: 'booked' };
  }
}
```

---

## Ports & Adapters Explained

### Primary Ports (Driving)

Entry points INTO the hexagon. In TypeScript, these are typically:

- The public methods of use cases
- Input DTOs (Data Transfer Objects)

```typescript
// The execute() method is a primary port - it drives the hexagon
bookRideUseCase.execute(pickUpPosition, dropOffPosition);
```

### Secondary Ports (Driven)

Interfaces for things the hexagon NEEDS from outside:

- Repositories (data persistence)
- External services (maps API, payment gateway)
- Infrastructure services (time, random, file system)

```typescript
// Interfaces in domain/ (ports) are secondary ports
export interface RideRepository {
  save(ride: Ride): void;
}
```

### Primary Adapters

Implementations that CALL the primary ports:

- REST Controllers
- GraphQL Resolvers
- CLI Commands
- Message Queue Consumers

### Secondary Adapters

Implementations of secondary ports:

- Database Repositories (PostgreSQL, MongoDB)
- External API Clients (Google Maps, Stripe)
- In-Memory Implementations (for testing)

---

## Real Examples from Our Codebase

### Flow: Booking a Ride

```
[HTTP Request]
      │
      ▼
┌─────────────────────────────────────────┐
│           Primary Adapter               │
│         (RideController)                │
│  POST /rides { pickUp, dropOff }        │
└─────────────────┬───────────────────────┘
                  │ calls
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         THE HEXAGON                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    BookRideUseCase                         │ │
│  │                                                            │ │
│  │  1. rider = riderRepository.byId('456def')                 │ │
│  │  2. distance = tripScanner.distanceBetween(pickUp,dropOff) │ │
│  │  3. if (distance < 3) throw UberXNotAvailableError         │ │
│  │  4. trip = Trip.create(pickUp, dropOff, distance)          │ │
│  │  5. price = rider.totalRidePrice(now, distance)            │ │
│  │  6. rideRepository.save(new Ride(...))                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ uses ports
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Postgres      │  │ Google Maps   │  │ System Clock  │
│ RideRepo      │  │ TripScanner   │  │ DateProvider  │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Business Rules Location

| Rule                        | Location                | Why                          |
| --------------------------- | ----------------------- | ---------------------------- |
| "UberX requires min 3km"    | `BookRideUseCase`       | Application-level validation |
| "Premium base price = 3"    | `Rider.rideBasePrice()` | Domain entity behavior       |
| "No UberX fees on birthday" | `Rider.uberXFees()`     | Domain entity behavior       |
| "Premium: free km if < 5km" | `Rider.kilometerFees()` | Domain entity behavior       |

---

## Testing Strategy

### Sociable Unit Tests

Test the hexagon using fake adapters:

```typescript
// File: application/ride-booking/bookRideUseCase.spec.ts

import { InMemoryRideRepository } from '../../../adapters/in-memory/in-memory-ride-repository';
import { InMemoryRiderRepository } from '../../../adapters/in-memory/in-memory-rider-repository';
import { FixedDateTimeProvider } from '../../../adapters/secondary/in-memory/fixedDateTimeProvider';
import { MockTripScanner } from '../../../adapters/secondary/in-memory/mockTripScanner';
import { Rider } from '../../models/rider';
import { BookRideUseCase } from './bookRideUseCase';

describe('Ride Booking Use Case', () => {
  let rideRepository: InMemoryRideRepository;
  let riderRepository: InMemoryRiderRepository;
  let dateTimeProvider: FixedDateTimeProvider;
  let tripScanner: MockTripScanner;
  let bookRideUseCase: BookRideUseCase;

  const pickUpPosition = { latitude: 37.7749, longitude: -122.4194 };
  const dropOffPosition = { latitude: 37.7849, longitude: -122.4094 };

  beforeEach(() => {
    // Arrange: Setup fake adapters
    rideRepository = new InMemoryRideRepository();
    riderRepository = new InMemoryRiderRepository();
    dateTimeProvider = new FixedDateTimeProvider();
    tripScanner = new MockTripScanner();

    // Inject fakes into use case
    bookRideUseCase = new BookRideUseCase(
      rideRepository,
      riderRepository,
      dateTimeProvider,
      tripScanner,
    );

    // Setup test data
    riderRepository.addRider(new Rider('456def', new Date('2000-06-15'), 'premium'));
    dateTimeProvider.currentDate = new Date('2024-06-14');
  });

  it('should book a ride with premium pricing', () => {
    // Given
    tripScanner.setSupposedDistance(pickUpPosition, dropOffPosition, 5);

    // When
    bookRideUseCase.execute(pickUpPosition, dropOffPosition);

    // Then
    expect(rideRepository.allRides[0].toSnapshot()).toEqual({
      id: '123abc',
      riderId: '456def',
      isUberX: true,
      pickUpPosition,
      dropOffPosition,
      distanceInKm: 5,
      price: 13, // base(3) + uberX(10) + km(0) = 13
      status: 'PENDING',
    });
  });

  it('should reject ride when distance is below 3km', () => {
    // Given
    tripScanner.setSupposedDistance(pickUpPosition, dropOffPosition, 2);

    // When/Then
    expect(() => bookRideUseCase.execute(pickUpPosition, dropOffPosition)).toThrow(
      UberXNotAvailableError,
    );
  });
});
```

### Test Types by Layer

| Test Type       | What It Tests      | Adapters Used                        |
| --------------- | ------------------ | ------------------------------------ |
| Unit (Sociable) | Use cases + domain | Fake/Mock adapters                   |
| Integration     | Secondary adapters | Real infrastructure (Testcontainers) |
| E2E             | Full application   | Real adapters, HTTP requests         |

---

## Common Mistakes to Avoid

### 1. Leaking Infrastructure into the Hexagon

```typescript
// ❌ WRONG: Framework annotation in domain
import { Entity, Column } from 'typeorm';

@Entity()
export class Ride {
  @Column()
  id: string;
}

// ✅ CORRECT: Pure domain object
export class Ride {
  constructor(public readonly id: string) {}
}
```

### 2. Business Logic in Adapters

```typescript
// ❌ WRONG: Business rule in controller
@Post()
bookRide(@Body() dto: BookRideDto) {
  if (dto.distance < 3) {  // Business rule!
    throw new BadRequestException('Minimum 3km');
  }
  // ...
}

// ✅ CORRECT: Business rule in domain
// In use case or domain entity
if (distance < 3) {
  throw new UberXNotAvailableError(distance);
}
```

### 3. Direct Dependencies on Implementations

```typescript
// ❌ WRONG: Depending on concrete implementation
import { TypeOrmRideRepository } from './typeorm.repository';

class BookRideUseCase {
  constructor(private repo: TypeOrmRideRepository) {}
}

// ✅ CORRECT: Depending on interface
import { RideRepository } from '../domain/ (ports)rideRepository';

class BookRideUseCase {
  constructor(private repo: RideRepository) {}
}
```

### 4. Anemic Domain Model

```typescript
// ❌ WRONG: All logic in use case, entity is just data
class Rider {
  id: string;
  plan: string;
  birthdate: Date;
}

class BookRideUseCase {
  execute() {
    const basePrice = rider.plan === 'premium' ? 3 : 5;
    const kmFees = rider.plan === 'premium' && distance > 5 ? 0.5 : distance * 0.5;
    // ...all pricing logic here
  }
}

// ✅ CORRECT: Business logic in entity
class Rider {
  totalRidePrice(date: Date, distance: number) {
    return this.rideBasePrice() + this.uberXFees(date) + this.kilometerFees(distance);
  }

  private rideBasePrice() {
    return this.plan === 'premium' ? 3 : 5;
  }
  // ...
}
```

---

## Summary

### Key Principles

1. **The Hexagon is Sacred**: `domain/ + application/` must have zero dependencies on adapters or frameworks

2. **Dependencies Point Inward**: Adapters depend on the hexagon, never the reverse

3. **Ports are Interfaces**: Secondary ports are TypeScript interfaces, not classes

4. **Adapters are Interchangeable**: You can swap PostgreSQL for MongoDB by changing adapters, not business logic

5. **Test Through Fakes**: Unit test the hexagon using in-memory/fake adapters

6. **Rich Domain Model**: Put business logic in entities, not use cases

### File Organization Rules

```
domain/ + application/          → NO imports from adapters/, NO framework imports
  models/                → Pure TypeScript classes/types
  domain/ (ports)       → TypeScript interfaces only
  use-cases/             → Orchestration, imports only from models/ and domain/ (ports)

adapters/                → CAN import from domain/ + application/
  primary/               → Controllers, CLI - calls use cases
  secondary/             → Implements interfaces from domain/ (ports)
```

### Quick Reference

| I want to...                    | Put it in...                    |
| ------------------------------- | ------------------------------- |
| Define a business entity        | `domain/`                       |
| Define what I need from outside | `domain/ (ports)`               |
| Orchestrate a business workflow | `application/`                  |
| Handle HTTP requests            | `adapters/primary/`             |
| Store data in a database        | `adapters/secondary/`           |
| Create a test double            | `adapters/secondary/in-memory/` |
