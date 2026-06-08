import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MagicLink } from '../../../domain/index';
import { PrismaMagicLinkRepository } from '../prisma-magic-link-repository';
import { createMigratedTestDatabase } from './prisma-test-database';

describe('PrismaMagicLinkRepository Integration', () => {
  let prisma: PrismaClient;
  let repository: PrismaMagicLinkRepository;
  let disconnect: () => Promise<void>;

  beforeAll(async () => {
    ({ prisma, disconnect } = await createMigratedTestDatabase());
    repository = new PrismaMagicLinkRepository(prisma);
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await prisma.magicLink.deleteMany();
  });

  it('should roundtrip an unused magic link snapshot through save and findByTokenHash', async () => {
    // Given
    const magicLink = MagicLink.create(
      'link-1',
      'alice@example.com',
      'hashed-token',
      new Date('2024-01-01T01:00:00.000Z'),
    );

    // When
    await repository.save(magicLink);
    const found = await repository.findByTokenHash('hashed-token');

    // Then
    expect(found?.snapshot()).toEqual(magicLink.snapshot());
    expect(found?.snapshot().usedAt).toBeUndefined();
  });

  it('should persist and reload the consumed (usedAt) state when updating an existing link', async () => {
    // Given
    const magicLink = MagicLink.create(
      'link-1',
      'alice@example.com',
      'hashed-token',
      new Date('2024-01-01T01:00:00.000Z'),
    );
    await repository.save(magicLink);

    // When
    const consumed = magicLink.consume();
    await repository.save(consumed);

    // Then
    const found = await repository.findByTokenHash('hashed-token');
    expect(found?.snapshot()).toEqual(consumed.snapshot());
    expect(found?.snapshot().usedAt).toBeInstanceOf(Date);
    await expect(prisma.magicLink.count()).resolves.toBe(1);
  });

  it('should return undefined when no magic link matches the token hash', async () => {
    await expect(repository.findByTokenHash('unknown-hash')).resolves.toBeUndefined();
  });
});
