import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Role, Session, User, UserStatus } from '../../../domain/index';
import { PrismaSessionRepository } from '../prisma-session-repository';
import { PrismaUserRepository } from '../prisma-user-repository';
import { createMigratedTestDatabase } from './prisma-test-database';

const future = (ms: number): Date => new Date(Date.now() + ms);

describe('PrismaSessionRepository Integration', () => {
  let prisma: PrismaClient;
  let repository: PrismaSessionRepository;
  let userRepository: PrismaUserRepository;
  let disconnect: () => Promise<void>;

  beforeAll(async () => {
    ({ prisma, disconnect } = await createMigratedTestDatabase());
    repository = new PrismaSessionRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  const aUser = async (id: string): Promise<void> => {
    await userRepository.save(
      User.fromSnapshot({
        id,
        email: `${id}@example.com`,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
    );
  };

  it('should roundtrip a session snapshot through save and findByTokenHash', async () => {
    // Given
    await aUser('user-1');
    const session = Session.create('session-1', 'user-1', 'hashed-refresh-token', future(60_000));

    // When
    await repository.save(session);
    const found = await repository.findByTokenHash('hashed-refresh-token');

    // Then
    expect(found?.snapshot()).toEqual(session.snapshot());
  });

  it('should persist the rotated hash and expiry when updating an existing session', async () => {
    // Given
    await aUser('user-1');
    const session = Session.create('session-1', 'user-1', 'hashed-old-token', future(60_000));
    await repository.save(session);

    // When
    const rotated = session.rotate('hashed-new-token', future(120_000));
    await repository.save(rotated);

    // Then
    expect(await repository.findByTokenHash('hashed-old-token')).toBeUndefined();
    const found = await repository.findByTokenHash('hashed-new-token');
    expect(found?.snapshot()).toEqual(rotated.snapshot());
    await expect(prisma.session.count()).resolves.toBe(1);
  });

  it('should return undefined when no session matches the token hash', async () => {
    await expect(repository.findByTokenHash('unknown-hash')).resolves.toBeUndefined();
  });

  it('should delete a session by its refresh token hash', async () => {
    // Given
    await aUser('user-1');
    await repository.save(Session.create('session-1', 'user-1', 'hashed-token', future(60_000)));

    // When
    await repository.deleteByTokenHash('hashed-token');

    // Then
    await expect(repository.findByTokenHash('hashed-token')).resolves.toBeUndefined();
  });

  it('should be a no-op when deleting a session by an unknown token hash', async () => {
    await expect(repository.deleteByTokenHash('unknown-hash')).resolves.toBeUndefined();
  });

  it('should delete every session belonging to a user without touching other users sessions', async () => {
    // Given
    await aUser('user-1');
    await aUser('user-2');
    await repository.save(Session.create('session-1', 'user-1', 'hashed-token-1', future(60_000)));
    await repository.save(Session.create('session-2', 'user-1', 'hashed-token-2', future(60_000)));
    await repository.save(Session.create('session-3', 'user-2', 'hashed-token-3', future(60_000)));

    // When
    await repository.deleteAllByUserId('user-1');

    // Then
    await expect(repository.findByTokenHash('hashed-token-1')).resolves.toBeUndefined();
    await expect(repository.findByTokenHash('hashed-token-2')).resolves.toBeUndefined();
    await expect(repository.findByTokenHash('hashed-token-3')).resolves.not.toBeUndefined();
  });
});
