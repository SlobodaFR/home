import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../adapters/in-memory/index';
import { Role } from '../../domain/index';
import { DemoteUser } from '../use-cases/demote-user/demote-user';
import { DemoteUserCommand } from '../use-cases/demote-user/demote-user-command';
import { UserMother } from './mothers/user-mother';

describe('DemoteUser', () => {
  let userRepository: InMemoryUserRepository;
  let demoteUser: DemoteUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    demoteUser = new DemoteUser(userRepository);
  });

  it('should reject demotion when caller lacks permission', async () => {
    // Given
    const caller = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(caller);
    const target = UserMother.anAdmin({ id: 'admin-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new DemoteUserCommand('user-1', 'admin-2');

    // When
    const attempt = demoteUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Caller lacks permission to demote users');
    const stored = await userRepository.findById('admin-2');
    expect(stored?.snapshot().role).toBe(Role.ADMIN);
  });

  it('should demote the target user to USER when caller has permission', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    const target = UserMother.anAdmin({ id: 'admin-2', email: 'target@example.com' });
    await userRepository.save(target);
    const other = UserMother.anAdmin({ id: 'admin-3', email: 'other@example.com' });
    await userRepository.save(other);

    const command = new DemoteUserCommand('admin-1', 'admin-2');

    // When
    await demoteUser.handle(command);

    // Then
    const stored = await userRepository.findById('admin-2');
    expect(stored?.snapshot().role).toBe(Role.USER);
  });

  it('should reject demotion of the last remaining admin', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);

    const command = new DemoteUserCommand('admin-1', 'admin-1');

    // When
    const attempt = demoteUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Cannot demote the last remaining admin');
    const stored = await userRepository.findById('admin-1');
    expect(stored?.snapshot().role).toBe(Role.ADMIN);
  });
});
