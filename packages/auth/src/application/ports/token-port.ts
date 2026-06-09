import type { Role } from '../../domain/index';

export interface TokenPort {
  generateAccessToken(userId: string, role: Role): string;
  verifyAccessToken(token: string): { userId: string; role: Role };
  generateRefreshToken(): string;
  generateMagicToken(): string;
  hashToken(token: string): string;
}
