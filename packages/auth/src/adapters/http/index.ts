// Primary adapters — NestJS controllers, AuthModule
export { AuthModule } from './auth-module';
export { AuthController } from './auth-controller';
export { UsersController } from './users-controller';
export { JwtAuthGuard } from './jwt-auth-guard';
export { PermissionsGuard, REQUIRED_PERMISSION_KEY } from './permissions-guard';
export { RequirePermission } from './require-permission.decorator';
