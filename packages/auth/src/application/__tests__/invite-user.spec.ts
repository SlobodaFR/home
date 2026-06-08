import { beforeEach, describe, expect, it } from 'vitest';
import { InviteUser } from '../use-cases/invite-user/invite-user';
import { InviteUserCommand } from '../use-cases/invite-user/invite-user-command';
import { FakeUserRepository } from './fakes/fake-user-repository';
import { FakeMagicLinkRepository } from './fakes/fake-magic-link-repository';
import { FakeTokenPort } from './fakes/fake-token-port';
import { FakeEmailPort } from './fakes/fake-email-port';
import { UserMother } from './mothers/user-mother';

describe('InviteUser', () => {
  let userRepository: FakeUserRepository;
  let magicLinkRepository: FakeMagicLinkRepository;
  let tokenPort: FakeTokenPort;
  let emailPort: FakeEmailPort;
  let inviteUser: InviteUser;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    magicLinkRepository = new FakeMagicLinkRepository();
    tokenPort = new FakeTokenPort();
    emailPort = new FakeEmailPort();
    inviteUser = new InviteUser(userRepository, magicLinkRepository, tokenPort, emailPort);
  });

  it('should send a magic link to the invitee when no users exist yet', async () => {
    // Given
    const command = new InviteUserCommand(undefined, 'alice@example.com');

    // When
    await inviteUser.handle(command);

    // Then
    const magicLinks = magicLinkRepository.getAll();
    expect(magicLinks).toHaveLength(1);
    expect(magicLinks[0]!.snapshot()).toMatchObject({
      email: 'alice@example.com',
      tokenHash: 'hashed-generated-token-1',
    });

    expect(emailPort.getSentLinks()).toEqual([
      { to: 'alice@example.com', link: 'generated-token-1' },
    ]);
  });

  it('should reject invitation when inviter lacks permission', async () => {
    // Given
    const member = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(member);

    const command = new InviteUserCommand('user-1', 'bob@example.com');

    // When
    const attempt = inviteUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Inviter lacks permission to invite users');
    expect(magicLinkRepository.getAll()).toHaveLength(0);
    expect(emailPort.getSentLinks()).toEqual([]);
  });
});
