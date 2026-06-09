import jwt from 'jsonwebtoken';
import type { Role } from '../../domain/index';

export class JwtTokenAdapter {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '15m',
  ) {}

  generateAccessToken(userId: string, role: Role): string {
    return jwt.sign({ userId, role }, this.secret, {
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): { userId: string; role: Role } {
    const payload = jwt.verify(token, this.secret) as { userId: string; role: Role };
    return { userId: payload.userId, role: payload.role };
  }
}
