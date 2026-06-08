import { Permission, UserRevoked } from '../../../domain/index';
import type { SessionRepository, UserRepository } from '../../ports/index';
import type { RevokeUserCommand } from './revoke-user-command';

export class RevokeUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async handle(command: RevokeUserCommand): Promise<UserRevoked> {
    const caller = await this.userRepository.findById(command.callerUserId);
    if (caller === undefined || !caller.hasPermission(Permission.USERS_REVOKE)) {
      throw new Error('Caller lacks permission to revoke users');
    }

    const target = await this.userRepository.findById(command.targetUserId);
    await this.userRepository.save(target!.revoke());
    await this.sessionRepository.deleteAllByUserId(command.targetUserId);

    return new UserRevoked(command.targetUserId);
  }
}
