import { beforeEach, describe, expect, it } from 'vitest';
import {
  InMemorySessionRepository,
  InMemoryTokenPort,
  InMemoryUserRepository,
} from '../../adapters/in-memory/index';
import { Session, SessionExpiredError, UserStatus } from '../../domain/index';
import { RefreshSession } from '../use-cases/refresh-session/refresh-session';
import { RefreshSessionCommand } from '../use-cases/refresh-session/refresh-session-command';
import { UserMother } from './mothers/user-mother';

const future = (ms: number): Date => new Date(Date.now() + ms);
const past = (ms: number): Date => new Date(Date.now() - ms);

describe('RefreshSession', () => {
  let userRepository: InMemoryUserRepository;
  let sessionRepository: InMemorySessionRepository;
  let tokenPort: InMemoryTokenPort;
  let refreshSession: RefreshSession;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    sessionRepository = new InMemorySessionRepository();
    tokenPort = new InMemoryTokenPort();
    refreshSession = new RefreshSession(userRepository, sessionRepository, tokenPort);
  });

  it('should return a new token pair and persist a rotated session when refresh token is valid', async () => {
    // Given
    const user = UserMother.aUser({ id: 'user-1', email: 'alice@example.com' });
    await userRepository.save(user);

    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-1',
      refreshHash: 'hashed-the-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(session);

    const command = new RefreshSessionCommand('the-refresh-token');

    // When
    const result = await refreshSession.handle(command);

    // Then
    expect(result).toEqual({
      accessToken: 'access-token-for-user-1-USER',
      refreshToken: 'generated-token-1',
    });

    const sessions = sessionRepository.getAll();
    const rotated = sessions.find((s) => s.snapshot().refreshHash === 'hashed-generated-token-1');
    expect(rotated?.snapshot()).toMatchObject({
      userId: 'user-1',
      refreshHash: 'hashed-generated-token-1',
    });
  });

  it('should invalidate the old refresh token when a session is rotated', async () => {
    // Given
    const user = UserMother.aUser({ id: 'user-1', email: 'alice@example.com' });
    await userRepository.save(user);

    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-1',
      refreshHash: 'hashed-the-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(session);

    const command = new RefreshSessionCommand('the-refresh-token');

    // When
    await refreshSession.handle(command);

    // Then
    const sessionsForUser = sessionRepository
      .getAll()
      .filter((s) => s.snapshot().userId === 'user-1');
    expect(sessionsForUser).toHaveLength(1);
    expect(sessionsForUser[0]?.snapshot().refreshHash).toBe('hashed-generated-token-1');
  });

  it('should throw a SessionExpiredError and not rotate when the session has expired', async () => {
    // Given
    const user = UserMother.aUser({ id: 'user-1', email: 'alice@example.com' });
    await userRepository.save(user);

    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-1',
      refreshHash: 'hashed-the-refresh-token',
      expiresAt: past(1),
      createdAt: past(60_000),
    });
    await sessionRepository.save(session);

    const command = new RefreshSessionCommand('the-refresh-token');

    // When
    const attempt = refreshSession.handle(command);

    // Then
    await expect(attempt).rejects.toThrow(SessionExpiredError);
    const sessions = sessionRepository.getAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.snapshot().refreshHash).toBe('hashed-the-refresh-token');
  });

  it('should reject the refresh and not rotate the session when the user has been revoked', async () => {
    // Given
    const user = UserMother.aUser({
      id: 'user-1',
      email: 'alice@example.com',
      status: UserStatus.REVOKED,
    });
    await userRepository.save(user);

    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-1',
      refreshHash: 'hashed-the-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(session);

    const command = new RefreshSessionCommand('the-refresh-token');

    // When
    const attempt = refreshSession.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('User has been revoked');
    const sessions = sessionRepository.getAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.snapshot().refreshHash).toBe('hashed-the-refresh-token');
  });
});
