import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository, InMemoryTokenPort } from '../../adapters/in-memory/index';
import { Session } from '../../domain/index';
import { RevokeSession } from '../use-cases/revoke-session/revoke-session';
import { RevokeSessionCommand } from '../use-cases/revoke-session/revoke-session-command';

const future = (ms: number): Date => new Date(Date.now() + ms);

describe('RevokeSession', () => {
  let sessionRepository: InMemorySessionRepository;
  let tokenPort: InMemoryTokenPort;
  let revokeSession: RevokeSession;

  beforeEach(() => {
    sessionRepository = new InMemorySessionRepository();
    tokenPort = new InMemoryTokenPort();
    revokeSession = new RevokeSession(sessionRepository, tokenPort);
  });

  it('should delete the session matching the refresh token', async () => {
    // Given
    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-1',
      refreshHash: 'hashed-the-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(session);

    const command = new RevokeSessionCommand('the-refresh-token');

    // When
    await revokeSession.handle(command);

    // Then
    const sessions = sessionRepository.getAll();
    expect(sessions).toHaveLength(0);
  });

  it('should do nothing when no session matches the refresh token', async () => {
    // Given
    const command = new RevokeSessionCommand('unknown-refresh-token');

    // When
    const attempt = revokeSession.handle(command);

    // Then
    await expect(attempt).resolves.toBeUndefined();
    expect(sessionRepository.getAll()).toHaveLength(0);
  });
});
