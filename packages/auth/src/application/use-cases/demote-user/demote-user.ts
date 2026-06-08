import { Permission, Role } from '../../../domain/index';
import type { UserRepository } from '../../ports/index';
import type { DemoteUserCommand } from './demote-user-command';

export class DemoteUser {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(command: DemoteUserCommand): Promise<void> {
    const caller = await this.userRepository.findById(command.callerUserId);
    if (caller === undefined || !caller.hasPermission(Permission.USERS_DEMOTE)) {
      throw new Error('Caller lacks permission to demote users');
    }

    const target = await this.userRepository.findById(command.targetUserId);
    if (target!.snapshot().role === Role.ADMIN && (await this.userRepository.countAdmins()) <= 1) {
      throw new Error('Cannot demote the last remaining admin');
    }

    await this.userRepository.save(target!.demote());
  }
}
