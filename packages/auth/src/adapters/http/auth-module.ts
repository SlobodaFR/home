import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InviteUser,
  VerifyMagicLink,
  RefreshSession,
  RevokeSession,
  ListUsers,
  GetUser,
  RevokeUser,
  PromoteUser,
  DemoteUser,
} from '../../application/index';
import {
  InMemoryUserRepository,
  InMemoryMagicLinkRepository,
  InMemorySessionRepository,
  InMemoryTokenPort,
  InMemoryEmailPort,
} from '../in-memory/index';
import { AuthController } from './auth-controller';
import { UsersController } from './users-controller';
import { JwtAuthGuard } from './jwt-auth-guard';
import { PermissionsGuard } from './permissions-guard';

@Module({
  controllers: [AuthController, UsersController],
  providers: [
    Reflector,
    // Repositories & ports (default in-memory, overridable in tests/prod)
    { provide: 'UserRepository', useClass: InMemoryUserRepository },
    { provide: 'MagicLinkRepository', useClass: InMemoryMagicLinkRepository },
    { provide: 'SessionRepository', useClass: InMemorySessionRepository },
    { provide: 'TokenPort', useClass: InMemoryTokenPort },
    { provide: 'EmailPort', useClass: InMemoryEmailPort },
    // Guards
    JwtAuthGuard,
    PermissionsGuard,
    // Use cases
    {
      provide: 'InviteUser',
      useFactory: (
        userRepo: unknown,
        magicLinkRepo: unknown,
        tokenPort: unknown,
        emailPort: unknown,
      ) =>
        new InviteUser(
          userRepo as InMemoryUserRepository,
          magicLinkRepo as InMemoryMagicLinkRepository,
          tokenPort as InMemoryTokenPort,
          emailPort as InMemoryEmailPort,
        ),
      inject: ['UserRepository', 'MagicLinkRepository', 'TokenPort', 'EmailPort'],
    },
    {
      provide: 'VerifyMagicLink',
      useFactory: (
        userRepo: unknown,
        magicLinkRepo: unknown,
        sessionRepo: unknown,
        tokenPort: unknown,
      ) =>
        new VerifyMagicLink(
          userRepo as InMemoryUserRepository,
          magicLinkRepo as InMemoryMagicLinkRepository,
          sessionRepo as InMemorySessionRepository,
          tokenPort as InMemoryTokenPort,
        ),
      inject: ['UserRepository', 'MagicLinkRepository', 'SessionRepository', 'TokenPort'],
    },
    {
      provide: 'RefreshSession',
      useFactory: (userRepo: unknown, sessionRepo: unknown, tokenPort: unknown) =>
        new RefreshSession(
          userRepo as InMemoryUserRepository,
          sessionRepo as InMemorySessionRepository,
          tokenPort as InMemoryTokenPort,
        ),
      inject: ['UserRepository', 'SessionRepository', 'TokenPort'],
    },
    {
      provide: 'RevokeSession',
      useFactory: (sessionRepo: unknown, tokenPort: unknown) =>
        new RevokeSession(sessionRepo as InMemorySessionRepository, tokenPort as InMemoryTokenPort),
      inject: ['SessionRepository', 'TokenPort'],
    },
    {
      provide: 'ListUsers',
      useFactory: (userRepo: unknown) => new ListUsers(userRepo as InMemoryUserRepository),
      inject: ['UserRepository'],
    },
    {
      provide: 'GetUser',
      useFactory: (userRepo: unknown) => new GetUser(userRepo as InMemoryUserRepository),
      inject: ['UserRepository'],
    },
    {
      provide: 'RevokeUser',
      useFactory: (userRepo: unknown, sessionRepo: unknown) =>
        new RevokeUser(
          userRepo as InMemoryUserRepository,
          sessionRepo as InMemorySessionRepository,
        ),
      inject: ['UserRepository', 'SessionRepository'],
    },
    {
      provide: 'PromoteUser',
      useFactory: (userRepo: unknown) => new PromoteUser(userRepo as InMemoryUserRepository),
      inject: ['UserRepository'],
    },
    {
      provide: 'DemoteUser',
      useFactory: (userRepo: unknown) => new DemoteUser(userRepo as InMemoryUserRepository),
      inject: ['UserRepository'],
    },
  ],
  exports: [JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
