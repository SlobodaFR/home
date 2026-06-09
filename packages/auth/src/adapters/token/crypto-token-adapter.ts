import { randomBytes, createHash } from 'node:crypto';

export class CryptoTokenAdapter {
  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  generateMagicToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
