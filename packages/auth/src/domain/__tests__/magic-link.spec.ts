import { describe, expect, it } from 'vitest';
import {
  MagicLink,
  MagicLinkAlreadyUsedError,
  MagicLinkExpiredError,
  MagicLinkInvalidError,
} from '../magic-link';

const VALID_HASH = 'abc123hash';
const future = new Date(Date.now() + 15 * 60 * 1000);
const past = new Date(Date.now() - 1);

describe('MagicLink', () => {
  describe('create', () => {
    it('should create an unused magic link', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future);

      const snap = link.snapshot();
      expect(snap).toMatchObject({
        id: 'link-1',
        email: 'alice@example.com',
        tokenHash: VALID_HASH,
      });
      expect(snap.usedAt).toBeUndefined();
    });
  });

  describe('verify', () => {
    it('should not throw when token hash matches and link is valid', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future);

      expect(() => link.verify(VALID_HASH)).not.toThrow();
    });

    it('should throw MagicLinkExpiredError when link is past expiry', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, past);

      expect(() => link.verify(VALID_HASH)).toThrow(MagicLinkExpiredError);
    });

    it('should throw MagicLinkAlreadyUsedError when link has been consumed', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future).consume();

      expect(() => link.verify(VALID_HASH)).toThrow(MagicLinkAlreadyUsedError);
    });

    it('should throw MagicLinkInvalidError when hash does not match', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future);

      expect(() => link.verify('wrong-hash')).toThrow(MagicLinkInvalidError);
    });
  });

  describe('consume', () => {
    it('should return a new magic link with usedAt set', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future);

      const consumed = link.consume();

      expect(consumed.snapshot().usedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromSnapshot', () => {
    it('should reconstitute from snapshot without re-validating', () => {
      const link = MagicLink.create('link-1', 'alice@example.com', VALID_HASH, future).consume();
      const snap = link.snapshot();

      expect(MagicLink.fromSnapshot(snap).snapshot()).toEqual(snap);
    });
  });
});
