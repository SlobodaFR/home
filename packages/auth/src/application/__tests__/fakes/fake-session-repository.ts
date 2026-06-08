import { Session } from '../../../domain/index.js';
import type { SessionRepository } from '../../ports/index.js';

export class FakeSessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async save(session: Session): Promise<void> {
    this.sessions.set(session.snapshot().id, session);
  }

  getAll(): ReadonlyArray<Session> {
    return [...this.sessions.values()];
  }
}
