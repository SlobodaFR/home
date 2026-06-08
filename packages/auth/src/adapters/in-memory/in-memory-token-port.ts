import type { Role } from '../../domain/index';
import type { TokenPort } from '../../application/index';

export class InMemoryTokenPort implements TokenPort {
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
