import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../adapters/in-memory/index';
import { GetUser } from '../use-cases/get-user/get-user';
import { GetUserCommand } from '../use-cases/get-user/get-user-command';
import { UserMother } from './mothers/user-mother';

describe('GetUser', () => {
  let userRepository: InMemoryUserRepository;
  let getUser: GetUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    getUser = new GetUser(userRepository);
  });

  it('should reject getting a user when caller is not an admin', async () => {
    // Given
    const caller = UserMother.aUser({ id: 'user-1', email: 'user@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new GetUserCommand('user-1', 'user-2');

    // When
    const attempt = getUser.handle(command);

    // Then
    await expect(attempt).rejects.toThrow('Caller must be an admin to get users');
  });

  it('should return the target user when caller is an admin', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);
    const target = UserMother.aUser({ id: 'user-2', email: 'target@example.com' });
    await userRepository.save(target);

    const command = new GetUserCommand('admin-1', 'user-2');

    // When
    const result = await getUser.handle(command);

    // Then
    expect(result?.snapshot().id).toBe('user-2');
  });

  it('should return undefined when the target user does not exist', async () => {
    // Given
    const caller = UserMother.anAdmin({ id: 'admin-1', email: 'admin@example.com' });
    await userRepository.save(caller);

    const command = new GetUserCommand('admin-1', 'unknown-user');

    // When
    const result = await getUser.handle(command);

    // Then
    expect(result).toBeUndefined();
  });
});
