import { Permission } from '../../../domain/index';
import type { UserRepository } from '../../ports/index';
import type { PromoteUserCommand } from './promote-user-command';

export class PromoteUser {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(command: PromoteUserCommand): Promise<void> {
    const caller = await this.userRepository.findById(command.callerUserId);
    if (caller === undefined || !caller.hasPermission(Permission.USERS_PROMOTE)) {
      throw new Error('Caller lacks permission to promote users');
    }

    const target = await this.userRepository.findById(command.targetUserId);
    await this.userRepository.save(target!.promote());
  }
}
