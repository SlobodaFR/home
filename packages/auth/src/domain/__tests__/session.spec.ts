import { describe, expect, it } from 'vitest';
import { Session, SessionExpiredError } from '../session.js';

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 1);

describe('Session', () => {
  describe('create', () => {
    it('should create a session with the given properties', () => {
      const session = Session.create('session-1', 'user-1', 'refresh-hash', future);

      expect(session.snapshot()).toMatchObject({
        id: 'session-1',
        userId: 'user-1',
        refreshHash: 'refresh-hash',
        expiresAt: future,
      });
    });
  });

  describe('isExpired', () => {
    it('should return false when session is not yet expired', () => {
      const session = Session.create('session-1', 'user-1', 'hash', future);

      expect(session.isExpired()).toBe(false);
    });

    it('should return true when session is past expiry', () => {
      const session = Session.create('session-1', 'user-1', 'hash', past);

      expect(session.isExpired()).toBe(true);
    });
  });

  describe('rotate', () => {
    it('should return a new session with updated hash and expiry', () => {
      const session = Session.create('session-1', 'user-1', 'old-hash', future);
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const rotated = session.rotate('new-hash', newExpiry);

      expect(rotated.snapshot()).toMatchObject({
        id: 'session-1',
        userId: 'user-1',
        refreshHash: 'new-hash',
        expiresAt: newExpiry,
      });
    });

    it('should throw SessionExpiredError when rotating an expired session', () => {
      const session = Session.create('session-1', 'user-1', 'hash', past);

      expect(() => session.rotate('new-hash', future)).toThrow(SessionExpiredError);
    });
  });

  describe('fromSnapshot', () => {
    it('should reconstitute from snapshot without re-validating', () => {
      const session = Session.create('session-1', 'user-1', 'hash', future);
      const snap = session.snapshot();

      expect(Session.fromSnapshot(snap).snapshot()).toEqual(snap);
    });
  });
});
