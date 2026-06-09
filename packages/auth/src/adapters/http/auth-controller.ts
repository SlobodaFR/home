import { Body, Controller, Delete, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import {
  InviteUser,
  InviteUserCommand,
  VerifyMagicLink,
  VerifyMagicLinkCommand,
  RefreshSession,
  RefreshSessionCommand,
  RevokeSession,
  RevokeSessionCommand,
} from '../../application/index';
import { JwtAuthGuard } from './jwt-auth-guard';

interface InviteBody {
  email: string;
  inviterUserId?: string;
}

interface VerifyBody {
  token: string;
}

interface RefreshBody {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('InviteUser') private readonly inviteUser: InviteUser,
    @Inject('VerifyMagicLink') private readonly verifyMagicLink: VerifyMagicLink,
    @Inject('RefreshSession') private readonly refreshSession: RefreshSession,
    @Inject('RevokeSession') private readonly revokeSession: RevokeSession,
  ) {}

  @Post('invite')
  @HttpCode(201)
  async invite(@Body() body: InviteBody): Promise<void> {
    await this.inviteUser.handle(new InviteUserCommand(body.inviterUserId, body.email));
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: VerifyBody): Promise<{ accessToken: string; refreshToken: string }> {
    return this.verifyMagicLink.handle(new VerifyMagicLinkCommand(body.token));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshBody): Promise<{ accessToken: string; refreshToken: string }> {
    return this.refreshSession.handle(new RefreshSessionCommand(body.refreshToken));
  }

  @Delete('session')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async revokeSessionRoute(@Body() body: RefreshBody): Promise<void> {
    await this.revokeSession.handle(new RevokeSessionCommand(body.refreshToken));
  }
}
