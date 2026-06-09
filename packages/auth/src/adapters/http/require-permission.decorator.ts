import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../../domain/index';
import { REQUIRED_PERMISSION_KEY } from './permissions-guard';

export const RequirePermission = (permission: Permission): MethodDecorator =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
