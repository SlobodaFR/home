import { Session, SessionExpiredError, User } from '../../../domain/index';
import type { UserRepository, SessionRepository, TokenPort } from '../../ports/index';
import type { RefreshSessionCommand } from './refresh-session-command';
import type { RefreshSessionResult } from './refresh-session-result';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class RefreshSession {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly tokenPort: TokenPort,
  ) {}

  async handle(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    const tokenHash = this.tokenPort.hashToken(command.refreshToken);
    const session = await this.loadSession(tokenHash);
    if (session.isExpired()) throw new SessionExpiredError();

    const user = await this.loadUser(session.snapshot().userId);
    user.assertActive();

    const refreshToken = this.tokenPort.generateRefreshToken();
    const refreshHash = this.tokenPort.hashToken(refreshToken);
    const rotated = session.rotate(refreshHash, new Date(Date.now() + SESSION_TTL_MS));
    await this.sessionRepository.save(rotated);

    const { id, role } = user.snapshot();
    return {
      accessToken: this.tokenPort.generateAccessToken(id, role),
      refreshToken,
    };
  }

  private async loadSession(tokenHash: string): Promise<Session> {
    const session = await this.sessionRepository.findByTokenHash(tokenHash);
    if (session === undefined) {
      throw new SessionExpiredError();
    }
    return session;
  }

  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (user === undefined) {
      throw new SessionExpiredError();
    }
    return user;
  }
}
