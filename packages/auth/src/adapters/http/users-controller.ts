import { Controller, Get, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ListUsers,
  ListUsersCommand,
  GetUser,
  GetUserCommand,
  RevokeUser,
  RevokeUserCommand,
  PromoteUser,
  PromoteUserCommand,
  DemoteUser,
  DemoteUserCommand,
} from '../../application/index';
import { JwtAuthGuard } from './jwt-auth-guard';
import type { UserSnapshot } from '../../domain/index';

interface AuthenticatedRequest {
  user: { userId: string; role: string };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @Inject('ListUsers') private readonly listUsers: ListUsers,
    @Inject('GetUser') private readonly getUser: GetUser,
    @Inject('RevokeUser') private readonly revokeUser: RevokeUser,
    @Inject('PromoteUser') private readonly promoteUser: PromoteUser,
    @Inject('DemoteUser') private readonly demoteUser: DemoteUser,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest): Promise<unknown> {
    return this.listUsers.handle(new ListUsersCommand(request.user.userId));
  }

  @Get(':id')
  async getOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<UserSnapshot | undefined> {
    const user = await this.getUser.handle(new GetUserCommand(request.user.userId, id));
    return user?.snapshot();
  }

  @Post(':id/revoke')
  @HttpCode(200)
  async revoke(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    await this.revokeUser.handle(new RevokeUserCommand(request.user.userId, id));
  }

  @Post(':id/promote')
  @HttpCode(200)
  async promote(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    await this.promoteUser.handle(new PromoteUserCommand(request.user.userId, id));
  }

  @Post(':id/demote')
  @HttpCode(200)
  async demote(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    await this.demoteUser.handle(new DemoteUserCommand(request.user.userId, id));
  }
}
