import type { PrismaClient, Session as SessionRow } from '@prisma/client';
import { Session, type SessionSnapshot } from '../../domain/index';
import type { SessionRepository } from '../../application/index';

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTokenHash(hash: string): Promise<Session | undefined> {
    const row = await this.prisma.session.findUnique({ where: { refreshHash: hash } });
    return row ? Session.fromSnapshot(toSnapshot(row)) : undefined;
  }

  async save(session: Session): Promise<void> {
    const snapshot = session.snapshot();
    await this.prisma.session.upsert({
      where: { id: snapshot.id },
      create: snapshot,
      update: { refreshHash: snapshot.refreshHash, expiresAt: snapshot.expiresAt },
    });
  }

  async deleteByTokenHash(hash: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { refreshHash: hash } });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}

function toSnapshot(row: SessionRow): SessionSnapshot {
  return {
    id: row.id,
    userId: row.userId,
    refreshHash: row.refreshHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}
