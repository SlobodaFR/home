import type { Role } from '../../domain/index';

export interface TokenPort {
  generateAccessToken(userId: string, role: Role): string;
  generateRefreshToken(): string;
  hashToken(token: string): string;
}
