import type { Role } from '../../../domain/index.js';
import type { TokenPort } from '../../ports/index.js';

export class FakeTokenPort implements TokenPort {
  private tokenCounter = 0;

  generateAccessToken(userId: string, role: Role): string {
    return `access-token-for-${userId}-${role}`;
  }

  generateRefreshToken(): string {
    return `generated-token-${++this.tokenCounter}`;
  }

  hashToken(token: string): string {
    return `hashed-${token}`;
  }
}
