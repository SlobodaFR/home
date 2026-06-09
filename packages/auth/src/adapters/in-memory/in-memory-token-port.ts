import type { Role } from '../../domain/index';
import type { TokenPort } from '../../application/index';

export class InMemoryTokenPort implements TokenPort {
  private tokenCounter = 0;

  generateAccessToken(userId: string, role: Role): string {
    return `access-token-for-${userId}-${role}`;
  }

  verifyAccessToken(token: string): { userId: string; role: Role } {
    const match = token.match(/^access-token-for-(.+)-(.+)$/);
    if (!match) throw new Error('Invalid token');
    return { userId: match[1]!, role: match[2]! as Role };
  }

  generateRefreshToken(): string {
    return `generated-token-${++this.tokenCounter}`;
  }

  generateMagicToken(): string {
    return `generated-magic-token-${++this.tokenCounter}`;
  }

  hashToken(token: string): string {
    return `hashed-${token}`;
  }

  clear(): void {
    this.tokenCounter = 0;
  }
}
