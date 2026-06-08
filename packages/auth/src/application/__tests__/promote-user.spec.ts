import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../adapters/in-memory/index';
import { Role } from '../../domain/index';
import { PromoteUser } from '../use-cases/promote-user/promote-user';
import { PromoteUserCommand } from '../use-cases/promote-user/promote-user-command';
import { UserMother } from './mothers/user-mother';

describe('PromoteUser', () => {
  let userRepository: InMemoryUserRepository;
  let promoteUser: PromoteUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    promoteUser = new PromoteUser(userRepository);
  });

  it('should reject promotion when caller lacks permission', async () => {
    // Given
    const caller = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new PromoteUserCommand('user-1', 'user-2');

    // When
    const attempt = promoteUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Caller lacks permission to promote users');
    const stored = await userRepository.findById('user-2');
    expect(stored?.snapshot().role).toBe(Role.USER);
  });

  it('should promote the target user to ADMIN when caller has permission', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new PromoteUserCommand('admin-1', 'user-2');

    // When
    await promoteUser.handle(command);

    // Then
    const stored = await userRepository.findById('user-2');
    expect(stored?.snapshot().role).toBe(Role.ADMIN);
  });

  it('should be a no-op when the target user is already an ADMIN', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    const target = UserMother.anAdmin({ id: 'admin-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new PromoteUserCommand('admin-1', 'admin-2');

    // When
    const attempt = promoteUser.handle(command);

    // Then
    await expect(attempt).resolves.toBeUndefined();
    const stored = await userRepository.findById('admin-2');
    expect(stored?.snapshot()).toEqual(target.snapshot());
  });
});
