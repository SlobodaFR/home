import { Role, type User } from '../../../domain/index';
import type { UserRepository } from '../../ports/index';
import type { GetUserCommand } from './get-user-command';

export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(command: GetUserCommand): Promise<User | undefined> {
    const caller = await this.userRepository.findById(command.callerUserId);
    if (caller === undefined || caller.snapshot().role !== Role.ADMIN) {
      throw new Error('Caller must be an admin to get users');
    }

    return this.userRepository.findById(command.targetUserId);
  }
}
