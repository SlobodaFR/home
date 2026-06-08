import type { Session } from '../../domain/index.js';

export interface SessionRepository {
  save(session: Session): Promise<void>;
}
