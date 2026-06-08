import { Session } from '../../domain/index';
import type { SessionRepository } from '../../application/index';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async save(session: Session): Promise<void> {
    this.sessions.set(session.snapshot().id, session);
  }

  getAll(): ReadonlyArray<Session> {
    return [...this.sessions.values()];
  }
}
