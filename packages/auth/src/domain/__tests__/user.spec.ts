import { describe, expect, it } from 'vitest';
import { Permission, Role, User, UserStatus } from '../user.js';

describe('User', () => {
  describe('create', () => {
    it('should create a user with USER role by default', () => {
      const user = User.create('user-1', 'alice@example.com');

      expect(user.snapshot()).toMatchObject({
        id: 'user-1',
        email: 'alice@example.com',
        role: Role.USER,
        status: UserStatus.ACTIVE,
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true when ADMIN has USERS_INVITE permission', () => {
      const admin = User.create('admin-1', 'admin@example.com', Role.ADMIN);

      expect(admin.hasPermission(Permission.USERS_INVITE)).toBe(true);
    });

    it('should return false when USER has no permissions', () => {
      const user = User.create('user-1', 'user@example.com');

      expect(user.hasPermission(Permission.USERS_INVITE)).toBe(false);
    });
  });

  describe('promote', () => {
    it('should return a new User with ADMIN role', () => {
      const user = User.create('user-1', 'user@example.com');

      const promoted = user.promote();

      expect(promoted.snapshot().role).toBe(Role.ADMIN);
    });

    it('should throw when promoting a REVOKED user', () => {
      const user = User.create('user-1', 'user@example.com').revoke();

      expect(() => user.promote()).toThrow('Cannot promote a revoked user');
    });
  });

  describe('revoke', () => {
    it('should return a new User with REVOKED status', () => {
      const user = User.create('user-1', 'user@example.com');

      const revoked = user.revoke();

      expect(revoked.snapshot().status).toBe(UserStatus.REVOKED);
    });
  });

  describe('demote', () => {
    it('should return a new User with USER role', () => {
      const admin = User.create('admin-1', 'admin@example.com', Role.ADMIN);

      const demoted = admin.demote();

      expect(demoted.snapshot().role).toBe(Role.USER);
    });
  });

  describe('fromSnapshot', () => {
    it('should reconstitute user from snapshot without re-validating invariants', () => {
      const user = User.create('user-1', 'user@example.com', Role.ADMIN);
      const snapshot = user.snapshot();

      const reconstituted = User.fromSnapshot(snapshot);

      expect(reconstituted.snapshot()).toEqual(snapshot);
    });
  });
});
