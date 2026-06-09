import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthModule } from '../auth-module';
import {
  InMemoryUserRepository,
  InMemoryMagicLinkRepository,
  InMemorySessionRepository,
  InMemoryTokenPort,
  InMemoryEmailPort,
} from '../../in-memory/index';

describe('AuthModule E2E', () => {
  let app: NestFastifyApplication;
  const userRepository = new InMemoryUserRepository();
  const magicLinkRepository = new InMemoryMagicLinkRepository();
  const sessionRepository = new InMemorySessionRepository();
  const tokenPort = new InMemoryTokenPort();
  const emailPort = new InMemoryEmailPort();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider('UserRepository')
      .useValue(userRepository)
      .overrideProvider('MagicLinkRepository')
      .useValue(magicLinkRepository)
      .overrideProvider('SessionRepository')
      .useValue(sessionRepository)
      .overrideProvider('TokenPort')
      .useValue(tokenPort)
      .overrideProvider('EmailPort')
      .useValue(emailPort)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    userRepository.clear();
    magicLinkRepository.clear();
    sessionRepository.clear();
    tokenPort.clear();
    emailPort.clear();
  });

  describe('POST /auth/invite', () => {
    it('should return 201 when invite is sent successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('POST /auth/verify', () => {
    it('should return 200 with access and refresh tokens when magic link is verified', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });

      const sentLinks = emailPort.getSentLinks();
      const magicToken = sentLinks[0]!.link;

      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: magicToken },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ accessToken: string; refreshToken: string }>();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 with new tokens when refresh token is valid', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const magicToken = emailPort.getSentLinks()[0]!.link;
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: magicToken },
      });
      const { refreshToken } = verifyResponse.json<{ accessToken: string; refreshToken: string }>();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ accessToken: string; refreshToken: string }>();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });
  });

  describe('DELETE /auth/session', () => {
    it('should return 204 when session is revoked by authenticated user', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const magicToken = emailPort.getSentLinks()[0]!.link;
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: magicToken },
      });
      const { accessToken, refreshToken } = verifyResponse.json<{
        accessToken: string;
        refreshToken: string;
      }>();

      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/session',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(204);
    });
  });

  describe('GET /users', () => {
    it('should return 200 with user list when admin requests it', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const magicToken = emailPort.getSentLinks()[0]!.link;
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: magicToken },
      });
      const { accessToken } = verifyResponse.json<{ accessToken: string; refreshToken: string }>();

      const response = await app.inject({
        method: 'GET',
        url: '/users',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ users: unknown[]; total: number }>();
      expect(Array.isArray(body.users)).toBe(true);
      expect(typeof body.total).toBe('number');
    });
  });

  describe('GET /users/:id', () => {
    it('should return 200 with user snapshot when admin gets user by id', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const magicToken = emailPort.getSentLinks()[0]!.link;
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: magicToken },
      });
      const { accessToken } = verifyResponse.json<{ accessToken: string; refreshToken: string }>();
      const adminId = userRepository.getAll()[0]!.snapshot().id;

      const response = await app.inject({
        method: 'GET',
        url: `/users/${adminId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ id: string; email: string; role: string }>();
      expect(body.id).toBe(adminId);
      expect(body.email).toBe('admin@example.com');
    });
  });

  describe('POST /users/:id/revoke', () => {
    it('should return 200 when admin revokes a user', async () => {
      // Create admin (first user becomes admin)
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const adminMagicToken = emailPort.getSentLinks()[0]!.link;
      const adminVerifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: adminMagicToken },
      });
      const { accessToken: adminToken } = adminVerifyResponse.json<{ accessToken: string }>();

      // Create regular user to be revoked
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const userMagicToken = emailPort.getSentLinks()[1]!.link;
      await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: userMagicToken },
      });
      const targetUser = userRepository
        .getAll()
        .find((u) => u.snapshot().email === 'user@example.com')!;

      const response = await app.inject({
        method: 'POST',
        url: `/users/${targetUser.snapshot().id}/revoke`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /users/:id/promote', () => {
    it('should return 200 when admin promotes a user', async () => {
      // Create admin
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const adminMagicToken = emailPort.getSentLinks()[0]!.link;
      const adminVerifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: adminMagicToken },
      });
      const { accessToken: adminToken } = adminVerifyResponse.json<{ accessToken: string }>();

      // Create regular user to be promoted
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const userMagicToken = emailPort.getSentLinks()[1]!.link;
      await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: userMagicToken },
      });
      const targetUser = userRepository
        .getAll()
        .find((u) => u.snapshot().email === 'user@example.com')!;

      const response = await app.inject({
        method: 'POST',
        url: `/users/${targetUser.snapshot().id}/promote`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /users/:id/demote', () => {
    it('should return 200 when admin demotes another admin', async () => {
      // Create first admin
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const adminMagicToken = emailPort.getSentLinks()[0]!.link;
      const adminVerifyResponse = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: adminMagicToken },
      });
      const { accessToken: adminToken } = adminVerifyResponse.json<{ accessToken: string }>();

      // Create second user and promote to admin
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const userMagicToken = emailPort.getSentLinks()[1]!.link;
      await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: userMagicToken },
      });
      const targetUser = userRepository
        .getAll()
        .find((u) => u.snapshot().email === 'user@example.com')!;
      await app.inject({
        method: 'POST',
        url: `/users/${targetUser.snapshot().id}/promote`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      // Demote the second admin
      const response = await app.inject({
        method: 'POST',
        url: `/users/${targetUser.snapshot().id}/demote`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('RBAC — user role is forbidden on admin routes', () => {
    async function setupAdminAndUser(): Promise<{
      adminAccessToken: string;
      userAccessToken: string;
      userId: string;
    }> {
      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'admin@example.com' },
      });
      const adminMagicToken = emailPort.getSentLinks()[0]!.link;
      const adminVerifyRes = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: adminMagicToken },
      });
      const { accessToken: adminAccessToken } = adminVerifyRes.json<{
        accessToken: string;
        refreshToken: string;
      }>();

      await app.inject({
        method: 'POST',
        url: '/auth/invite',
        payload: { email: 'user@example.com' },
      });
      const userMagicToken = emailPort.getSentLinks()[1]!.link;
      const userVerifyRes = await app.inject({
        method: 'POST',
        url: '/auth/verify',
        payload: { token: userMagicToken },
      });
      const { accessToken: userAccessToken } = userVerifyRes.json<{
        accessToken: string;
        refreshToken: string;
      }>();

      const userId = userRepository
        .getAll()
        .find((u) => u.snapshot().email === 'user@example.com')!
        .snapshot().id;

      return { adminAccessToken, userAccessToken, userId };
    }

    it('should return 403 when user role calls GET /users', async () => {
      const { userAccessToken } = await setupAdminAndUser();

      const response = await app.inject({
        method: 'GET',
        url: '/users',
        headers: { authorization: `Bearer ${userAccessToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 when user role calls GET /users/:id', async () => {
      const { userAccessToken, userId } = await setupAdminAndUser();

      const response = await app.inject({
        method: 'GET',
        url: `/users/${userId}`,
        headers: { authorization: `Bearer ${userAccessToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 when user role calls POST /users/:id/revoke', async () => {
      const { userAccessToken, userId } = await setupAdminAndUser();

      const response = await app.inject({
        method: 'POST',
        url: `/users/${userId}/revoke`,
        headers: { authorization: `Bearer ${userAccessToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 when user role calls POST /users/:id/promote', async () => {
      const { userAccessToken, userId } = await setupAdminAndUser();

      const response = await app.inject({
        method: 'POST',
        url: `/users/${userId}/promote`,
        headers: { authorization: `Bearer ${userAccessToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 when user role calls POST /users/:id/demote', async () => {
      const { userAccessToken, userId } = await setupAdminAndUser();

      const response = await app.inject({
        method: 'POST',
        url: `/users/${userId}/demote`,
        headers: { authorization: `Bearer ${userAccessToken}` },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
