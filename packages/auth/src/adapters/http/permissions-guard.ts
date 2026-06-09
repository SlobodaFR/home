import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '../../domain/index';
import type { UserRepository } from '../../application/index';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<Permission>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler(),
    );
    if (!requiredPermission) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { userId: string; role: string } }>();
    const userId = request.user?.userId;
    if (!userId) throw new ForbiddenException();

    const user = await this.userRepository.findById(userId);
    if (!user || !user.hasPermission(requiredPermission)) throw new ForbiddenException();

    return true;
  }
}
