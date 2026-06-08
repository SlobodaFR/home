import { Role } from '../../../domain/index';
import type { UserRepository } from '../../ports/index';
import type { ListUsersCommand } from './list-users-command';
import type { ListUsersResult } from './list-users-result';

export class ListUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(command: ListUsersCommand): Promise<ListUsersResult> {
    const caller = await this.userRepository.findById(command.callerUserId);
    if (caller === undefined || caller.snapshot().role !== Role.ADMIN) {
      throw new Error('Caller must be an admin to list users');
    }

    return this.userRepository.findPage(command.offset, command.limit);
  }
}
