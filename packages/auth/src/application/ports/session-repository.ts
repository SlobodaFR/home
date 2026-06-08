import type { Session } from '../../domain/index';

export interface SessionRepository {
  findByTokenHash(hash: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  deleteByTokenHash(hash: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
