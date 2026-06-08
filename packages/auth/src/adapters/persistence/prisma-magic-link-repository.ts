import type { MagicLink as MagicLinkRow, PrismaClient } from '@prisma/client';
import { MagicLink, type MagicLinkSnapshot } from '../../domain/index';
import type { MagicLinkRepository } from '../../application/index';

export class PrismaMagicLinkRepository implements MagicLinkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTokenHash(hash: string): Promise<MagicLink | undefined> {
    const row = await this.prisma.magicLink.findUnique({ where: { tokenHash: hash } });
    return row ? MagicLink.fromSnapshot(toSnapshot(row)) : undefined;
  }

  async save(magicLink: MagicLink): Promise<void> {
    const snapshot = magicLink.snapshot();
    await this.prisma.magicLink.upsert({
      where: { id: snapshot.id },
      create: { ...snapshot, usedAt: snapshot.usedAt ?? null },
      update: {
        tokenHash: snapshot.tokenHash,
        expiresAt: snapshot.expiresAt,
        usedAt: snapshot.usedAt ?? null,
      },
    });
  }
}

function toSnapshot(row: MagicLinkRow): MagicLinkSnapshot {
  return {
    id: row.id,
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    ...(row.usedAt ? { usedAt: row.usedAt } : {}),
    createdAt: row.createdAt,
  };
}
