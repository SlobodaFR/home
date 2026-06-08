import { Session } from '../../domain/index';
import type { SessionRepository } from '../../application/index';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async findByTokenHash(hash: string): Promise<Session | undefined> {
    const session = [...this.sessions.values()].find((s) => s.snapshot().refreshHash === hash);
    return session ? Session.fromSnapshot(session.snapshot()) : undefined;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.snapshot().id, session);
  }

  async deleteByTokenHash(hash: string): Promise<void> {
    const session = await this.findByTokenHash(hash);
    if (session !== undefined) {
      this.sessions.delete(session.snapshot().id);
    }
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.snapshot().userId === userId) {
        this.sessions.delete(session.snapshot().id);
      }
    }
  }

  getAll(): ReadonlyArray<Session> {
    return [...this.sessions.values()];
  }
}
