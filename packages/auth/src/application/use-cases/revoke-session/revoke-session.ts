import type { SessionRepository, TokenPort } from '../../ports/index';
import type { RevokeSessionCommand } from './revoke-session-command';

export class RevokeSession {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenPort: TokenPort,
  ) {}

  async handle(command: RevokeSessionCommand): Promise<void> {
    const tokenHash = this.tokenPort.hashToken(command.refreshToken);
    await this.sessionRepository.deleteByTokenHash(tokenHash);
  }
}
