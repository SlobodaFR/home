import { describe, it, expect } from 'vitest';
import { CryptoTokenAdapter } from '../crypto-token-adapter';

describe('CryptoTokenAdapter', () => {
  const adapter = new CryptoTokenAdapter();

  it('should return 64-char hex string when generating refresh token', () => {
    // When
    const token = adapter.generateRefreshToken();

    // Then
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return different tokens when generating refresh token twice', () => {
    // When
    const token1 = adapter.generateRefreshToken();
    const token2 = adapter.generateRefreshToken();

    // Then
    expect(token1).not.toBe(token2);
  });

  it('should return 64-char hex string when generating magic token', () => {
    // When
    const token = adapter.generateMagicToken();

    // Then
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return SHA-256 hex when hashing token', () => {
    // Given — known SHA-256 of "hello" is a5d3... (precomputed)
    const input = 'hello';

    // When
    const hash = adapter.hashToken(input);

    // Then — 64-char lowercase hex (SHA-256 output)
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should return same hash when hashing same token twice', () => {
    // Given
    const token = 'some-refresh-token';

    // When
    const hash1 = adapter.hashToken(token);
    const hash2 = adapter.hashToken(token);

    // Then
    expect(hash1).toBe(hash2);
  });
});
