import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JwtTokenAdapter } from '../jwt-token-adapter';
import { Role } from '../../../domain/index';

afterEach(() => {
  vi.useRealTimers();
});

describe('JwtTokenAdapter', () => {
  let adapter: JwtTokenAdapter;

  beforeEach(() => {
    adapter = new JwtTokenAdapter('test-secret');
  });

  it('should return JWT string when generating access token', () => {
    // Given
    const userId = 'user-123';
    const role = Role.USER;

    // When
    const token = adapter.generateAccessToken(userId, role);

    // Then
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should return payload when verifying valid access token', () => {
    // Given
    const userId = 'user-456';
    const role = Role.ADMIN;
    const token = adapter.generateAccessToken(userId, role);

    // When
    const payload = adapter.verifyAccessToken(token);

    // Then
    expect(payload.userId).toBe(userId);
    expect(payload.role).toBe(role);
  });

  it('should throw when verifying expired token', () => {
    // Given
    const shortLivedAdapter = new JwtTokenAdapter('test-secret', '1s');
    const token = shortLivedAdapter.generateAccessToken('user-789', Role.USER);

    // When — advance clock past expiry
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2000);

    // Then
    expect(() => shortLivedAdapter.verifyAccessToken(token)).toThrow();
  });
});
