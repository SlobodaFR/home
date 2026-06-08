import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Role, User, UserStatus } from '../../../domain/index';
import { PrismaUserRepository } from '../prisma-user-repository';
import { createMigratedTestDatabase } from './prisma-test-database';

describe('PrismaUserRepository Integration', () => {
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;
  let disconnect: () => Promise<void>;

  beforeAll(async () => {
    ({ prisma, disconnect } = await createMigratedTestDatabase());
    repository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should roundtrip a user snapshot through save and findById', async () => {
    // Given
    const user = User.fromSnapshot({
      id: 'user-1',
      email: 'alice@example.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    // When
    await repository.save(user);
    const found = await repository.findById('user-1');

    // Then
    expect(found?.snapshot()).toEqual(user.snapshot());
  });

  it('should update an existing user in place when saving by id', async () => {
    // Given
    await repository.save(User.fromSnapshot({ ...aSnapshot(), id: 'user-1', role: Role.USER }));

    // When
    await repository.save(User.fromSnapshot({ ...aSnapshot(), id: 'user-1', role: Role.ADMIN }));

    // Then
    const found = await repository.findById('user-1');
    expect(found?.snapshot().role).toBe(Role.ADMIN);
    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it('should find a user by email', async () => {
    // Given
    await repository.save(
      User.fromSnapshot({ ...aSnapshot(), id: 'user-1', email: 'alice@example.com' }),
    );

    // When
    const found = await repository.findByEmail('alice@example.com');

    // Then
    expect(found?.snapshot().id).toBe('user-1');
  });

  it('should return undefined when no user matches the id or email', async () => {
    await expect(repository.findById('unknown')).resolves.toBeUndefined();
    await expect(repository.findByEmail('unknown@example.com')).resolves.toBeUndefined();
  });

  it('should report whether any user exists', async () => {
    await expect(repository.exists()).resolves.toBe(false);

    await repository.save(User.fromSnapshot(aSnapshot()));

    await expect(repository.exists()).resolves.toBe(true);
  });

  it('should count only users with the ADMIN role', async () => {
    // Given
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'admin-1',
        email: 'admin-1@example.com',
        role: Role.ADMIN,
      }),
    );
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'admin-2',
        email: 'admin-2@example.com',
        role: Role.ADMIN,
      }),
    );
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'user-1',
        email: 'user-1@example.com',
        role: Role.USER,
      }),
    );

    // When / Then
    await expect(repository.countAdmins()).resolves.toBe(2);
  });

  it('should return a paginated, ordered slice of users with the total count', async () => {
    // Given
    const createdAt = (offsetMs: number): Date => new Date(Date.now() + offsetMs);
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'user-1',
        email: 'a@example.com',
        createdAt: createdAt(0),
      }),
    );
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'user-2',
        email: 'b@example.com',
        createdAt: createdAt(1_000),
      }),
    );
    await repository.save(
      User.fromSnapshot({
        ...aSnapshot(),
        id: 'user-3',
        email: 'c@example.com',
        createdAt: createdAt(2_000),
      }),
    );

    // When
    const page = await repository.findPage(1, 1);

    // Then
    expect(page.total).toBe(3);
    expect(page.users).toHaveLength(1);
    expect(page.users[0]?.snapshot().id).toBe('user-2');
  });
});

const aSnapshot = () => ({
  id: 'user-1',
  email: 'user@example.com',
  role: Role.USER,
  status: UserStatus.ACTIVE,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
});
