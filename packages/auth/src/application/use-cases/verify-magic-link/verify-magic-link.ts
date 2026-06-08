import { MagicLink, MagicLinkInvalidError, Session, User } from '../../../domain/index';
import type {
  MagicLinkRepository,
  SessionRepository,
  TokenPort,
  UserRepository,
} from '../../ports/index';
import type { VerifyMagicLinkCommand } from './verify-magic-link-command';
import type { VerifyMagicLinkResult } from './verify-magic-link-result';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class VerifyMagicLink {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly magicLinkRepository: MagicLinkRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly tokenPort: TokenPort,
  ) {}

  async handle(command: VerifyMagicLinkCommand): Promise<VerifyMagicLinkResult> {
    const tokenHash = this.tokenPort.hashToken(command.token);
    const magicLink = await this.loadMagicLink(tokenHash);
    magicLink.verify(tokenHash);

    const user = await this.loadOrCreateUser(magicLink);
    await this.userRepository.save(user);
    await this.magicLinkRepository.save(magicLink.consume());

    const refreshToken = await this.createSession(user);
    const { id, role } = user.snapshot();

    return {
      accessToken: this.tokenPort.generateAccessToken(id, role),
      refreshToken,
    };
  }

  private async loadMagicLink(tokenHash: string): Promise<MagicLink> {
    const magicLink = await this.magicLinkRepository.findByTokenHash(tokenHash);
    if (magicLink === undefined) {
      throw new MagicLinkInvalidError();
    }
    return magicLink;
  }

  private async loadOrCreateUser(magicLink: MagicLink): Promise<User> {
    const email = magicLink.snapshot().email;
    const existing = await this.userRepository.findByEmail(email);
    if (existing !== undefined) {
      return existing;
    }

    const user = User.create(this.tokenPort.hashToken(email), email);
    const adminCount = await this.userRepository.countAdmins();
    return adminCount === 0 ? user.promote() : user;
  }

  private async createSession(user: User): Promise<string> {
    const refreshToken = this.tokenPort.generateRefreshToken();
    const refreshHash = this.tokenPort.hashToken(refreshToken);
    const session = Session.create(
      refreshHash,
      user.snapshot().id,
      refreshHash,
      new Date(Date.now() + SESSION_TTL_MS),
    );
    await this.sessionRepository.save(session);
    return refreshToken;
  }
}
