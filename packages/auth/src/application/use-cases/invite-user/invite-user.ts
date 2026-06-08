import { MagicLink, Permission } from '../../../domain/index.js';
import type {
  MagicLinkRepository,
  EmailPort,
  TokenPort,
  UserRepository,
} from '../../ports/index.js';
import type { InviteUserCommand } from './invite-user-command.js';

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export class InviteUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly magicLinkRepository: MagicLinkRepository,
    private readonly tokenPort: TokenPort,
    private readonly emailPort: EmailPort,
  ) {}

  async handle(command: InviteUserCommand): Promise<void> {
    await this.ensureInviterIsAuthorized(command.inviterUserId);

    const token = this.tokenPort.generateRefreshToken();
    const tokenHash = this.tokenPort.hashToken(token);

    const magicLink = MagicLink.create(
      tokenHash,
      command.email,
      tokenHash,
      new Date(Date.now() + MAGIC_LINK_TTL_MS),
    );
    await this.magicLinkRepository.save(magicLink);

    await this.emailPort.sendMagicLink(command.email, token);
  }

  private async ensureInviterIsAuthorized(inviterUserId: string | undefined): Promise<void> {
    if (inviterUserId === undefined) {
      return;
    }

    const inviter = await this.userRepository.findById(inviterUserId);
    if (inviter === undefined || !inviter.hasPermission(Permission.USERS_INVITE)) {
      throw new Error('Inviter lacks permission to invite users');
    }
  }
}
