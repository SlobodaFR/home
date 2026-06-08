import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository, InMemoryUserRepository } from '../../adapters/in-memory/index';
import { Session, UserStatus } from '../../domain/index';
import { RevokeUser } from '../use-cases/revoke-user/revoke-user';
import { RevokeUserCommand } from '../use-cases/revoke-user/revoke-user-command';
import { UserMother } from './mothers/user-mother';

const future = (ms: number): Date => new Date(Date.now() + ms);

describe('RevokeUser', () => {
  let userRepository: InMemoryUserRepository;
  let sessionRepository: InMemorySessionRepository;
  let revokeUser: RevokeUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    sessionRepository = new InMemorySessionRepository();
    revokeUser = new RevokeUser(userRepository, sessionRepository);
  });

  it('should reject revocation when caller lacks permission', async () => {
    // Given
    const caller = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new RevokeUserCommand('user-1', 'user-2');

    // When
    const attempt = revokeUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Caller lacks permission to revoke users');
    const stored = await userRepository.findById('user-2');
    expect(stored?.snapshot().status).toBe(UserStatus.ACTIVE);
  });

  it('should revoke the target user and invalidate their active sessions when caller has permission', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);
    const session = Session.fromSnapshot({
      id: 'session-1',
      userId: 'user-2',
      refreshHash: 'hashed-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(session);
    const otherSession = Session.fromSnapshot({
      id: 'session-2',
      userId: 'admin-1',
      refreshHash: 'other-hashed-refresh-token',
      expiresAt: future(60_000),
      createdAt: new Date(),
    });
    await sessionRepository.save(otherSession);

    const command = new RevokeUserCommand('admin-1', 'user-2');

    // When
    const event = await revokeUser.handle(command);

    // Then
    const stored = await userRepository.findById('user-2');
    expect(stored?.snapshot().status).toBe(UserStatus.REVOKED);

    const remainingSessions = sessionRepository.getAll();
    expect(remainingSessions).toHaveLength(1);
    expect(remainingSessions[0]?.snapshot().userId).toBe('admin-1');

    expect(event.userId).toBe('user-2');
  });
});
