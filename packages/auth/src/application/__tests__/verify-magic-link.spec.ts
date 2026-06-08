import { beforeEach, describe, expect, it } from 'vitest';
import { MagicLink, Role } from '../../domain/index';
import { VerifyMagicLink } from '../use-cases/verify-magic-link/verify-magic-link';
import { VerifyMagicLinkCommand } from '../use-cases/verify-magic-link/verify-magic-link-command';
import { FakeUserRepository } from './fakes/fake-user-repository';
import { FakeMagicLinkRepository } from './fakes/fake-magic-link-repository';
import { FakeSessionRepository } from './fakes/fake-session-repository';
import { FakeTokenPort } from './fakes/fake-token-port';
import { UserMother } from './mothers/user-mother';

const future = (ms: number): Date => new Date(Date.now() + ms);
const past = (ms: number): Date => new Date(Date.now() - ms);

describe('VerifyMagicLink', () => {
  let userRepository: FakeUserRepository;
  let magicLinkRepository: FakeMagicLinkRepository;
  let sessionRepository: FakeSessionRepository;
  let tokenPort: FakeTokenPort;
  let verifyMagicLink: VerifyMagicLink;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    magicLinkRepository = new FakeMagicLinkRepository();
    sessionRepository = new FakeSessionRepository();
    tokenPort = new FakeTokenPort();
    verifyMagicLink = new VerifyMagicLink(
      userRepository,
      magicLinkRepository,
      sessionRepository,
      tokenPort,
    );
  });

  const aMagicLink = (email: string): MagicLink =>
    MagicLink.create('link-1', email, 'hashed-the-token', future(15 * 60 * 1000));

  it('should create a new user and promote it to ADMIN when no admin exists yet', async () => {
    // Given
    await magicLinkRepository.save(aMagicLink('alice@example.com'));
    const command = new VerifyMagicLinkCommand('the-token');

    // When
    const result = await verifyMagicLink.handle(command);

    // Then
    const users = userRepository.getAll();
    expect(users).toHaveLength(1);
    const [createdUser] = users;
    expect(createdUser?.snapshot()).toMatchObject({
      email: 'alice@example.com',
      role: Role.ADMIN,
    });
    const userId = createdUser?.snapshot().id;

    const sessions = sessionRepository.getAll();
    expect(sessions).toHaveLength(1);
    const [createdSession] = sessions;
    expect(createdSession?.snapshot()).toMatchObject({
      userId,
      refreshHash: 'hashed-generated-token-1',
    });

    expect(result).toEqual({
      accessToken: `access-token-for-${userId}-ADMIN`,
      refreshToken: 'generated-token-1',
    });

    const consumedLink = await magicLinkRepository.findByTokenHash('hashed-the-token');
    expect(consumedLink?.snapshot().usedAt).toBeInstanceOf(Date);
  });

  it('should reuse the existing user without promoting when an admin already exists', async () => {
    // Given
    const admin = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(admin);
    const existing = UserMother.aUser({ id: 'user-1', email: 'bob@example.com' });
    await userRepository.save(existing);

    await magicLinkRepository.save(aMagicLink('bob@example.com'));
    const command = new VerifyMagicLinkCommand('the-token');

    // When
    const result = await verifyMagicLink.handle(command);

    // Then
    const users = userRepository.getAll();
    expect(users).toHaveLength(2);
    const bob = users.find((u) => u.snapshot().email === 'bob@example.com');
    expect(bob?.snapshot()).toMatchObject({
      id: 'user-1',
      role: Role.USER,
    });

    expect(result).toEqual({
      accessToken: 'access-token-for-user-1-USER',
      refreshToken: 'generated-token-1',
    });
  });

  it('should propagate the domain error when the magic link is expired', async () => {
    // Given
    const expiredLink = MagicLink.create(
      'link-1',
      'alice@example.com',
      'hashed-the-token',
      past(1),
    );
    await magicLinkRepository.save(expiredLink);
    const command = new VerifyMagicLinkCommand('the-token');

    // When
    const attempt = verifyMagicLink.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Magic link has expired');
    expect(userRepository.getAll()).toHaveLength(0);
    expect(sessionRepository.getAll()).toHaveLength(0);
  });

  it('should propagate the domain error when the magic link has already been used', async () => {
    // Given
    const usedLink = aMagicLink('alice@example.com').consume();
    await magicLinkRepository.save(usedLink);
    const command = new VerifyMagicLinkCommand('the-token');

    // When
    const attempt = verifyMagicLink.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Magic link has already been used');
  });

  it('should propagate the domain error when no magic link matches the token', async () => {
    // Given
    const command = new VerifyMagicLinkCommand('unknown-token');

    // When
    const attempt = verifyMagicLink.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Magic link token is invalid');
  });
});
