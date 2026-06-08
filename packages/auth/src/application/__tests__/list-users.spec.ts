import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../adapters/in-memory/index';
import { ListUsers } from '../use-cases/list-users/list-users';
import { ListUsersCommand } from '../use-cases/list-users/list-users-command';
import { UserMother } from './mothers/user-mother';

describe('ListUsers', () => {
  let userRepository: InMemoryUserRepository;
  let listUsers: ListUsers;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    listUsers = new ListUsers(userRepository);
  });

  it('should reject listing when caller is not an admin', async () => {
    // Given
    const caller = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(caller);

    const command = new ListUsersCommand('user-1');

    // When
    const attempt = listUsers.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Caller must be an admin to list users');
  });

  it('should return a paginated list of users when caller is an admin', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    await userRepository.save(UserMother.aUser({ id: 'user-2', email: 'user2@example.com' }));
    await userRepository.save(UserMother.aUser({ id: 'user-3', email: 'user3@example.com' }));
    await userRepository.save(UserMother.aUser({ id: 'user-4', email: 'user4@example.com' }));

    const command = new ListUsersCommand('admin-1', 1, 2);

    // When
    const result = await listUsers.handle(command);

    // Then
    expect(result.total).toBe(4);
    expect(result.users).toHaveLength(2);
    expect(result.users.map((u) => u.snapshot().id)).toEqual(['user-2', 'user-3']);
  });
});
