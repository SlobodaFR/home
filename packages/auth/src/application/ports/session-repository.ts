import type { Session } from '../../domain/index';

export interface SessionRepository {
  save(session: Session): Promise<void>;
}
