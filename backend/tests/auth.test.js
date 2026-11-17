import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';
import { env } from '../src/config/env.js';
import { clearDatabase, createUser, testPassword } from './helpers.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe('Authentication and session protection', () => {
  it('logs in with HttpOnly cookie, protects writes with CSRF and revokes logout', async () => {
    const user = await createUser();
    const agent = request.agent(app);
    const login = await agent.post('/api/v1/auth/login').set('Origin', env.APP_ORIGIN).send({ email: user.email, password: testPassword });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(login.body.data.user.passwordHash).toBeUndefined();
    expect((await agent.patch('/api/v1/auth/profile').set('Origin', env.APP_ORIGIN).send({ name: 'Tên mới' })).status).toBe(403);
    const csrf = login.body.data.csrfToken;
    const updated = await agent.patch('/api/v1/auth/profile').set('Origin', env.APP_ORIGIN).set('X-CSRF-Token', csrf).send({ name: 'Tên mới' });
    expect(updated.body.data.name).toBe('Tên mới');
    const logout = await agent.post('/api/v1/auth/logout').set('Origin', env.APP_ORIGIN).set('X-CSRF-Token', csrf).send({});
    expect(logout.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects foreign origins, malformed JSON and inactive or expired sessions', async () => {
    const user = await createUser('STAFF');
    expect((await request(app).post('/api/v1/auth/login').set('Origin', 'https://foreign.example').send({ email: user.email, password: testPassword })).status).toBe(403);
    expect((await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{invalid')).status).toBe(400);
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').set('Origin', env.APP_ORIGIN).send({ email: user.email, password: testPassword });
    await prisma.authSession.updateMany({ data: { expiresAt: new Date(0) } });
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    expect((await agent.post('/api/v1/auth/login').set('Origin', env.APP_ORIGIN).send({ email: user.email, password: testPassword })).status).toBe(401);
  });

  it('rejects privilege fields and revokes all sessions after password change', async () => {
    const user = await createUser('STAFF');
    const agent = request.agent(app);
    const login = await agent.post('/api/v1/auth/login').set('Origin', env.APP_ORIGIN).send({ email: user.email, password: testPassword });
    const headers = { Origin: env.APP_ORIGIN, 'X-CSRF-Token': login.body.data.csrfToken };
    expect((await agent.patch('/api/v1/auth/profile').set(headers).send({ name: 'Tên mới', role: 'MANAGER' })).status).toBe(400);
    const changed = await agent.post('/api/v1/auth/change-password').set(headers).send({ currentPassword: testPassword, newPassword: randomBytes(18).toString('hex') });
    expect(changed.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    expect(await prisma.authSession.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
  });

  it('rate limits repeated login attempts before password processing', async () => {
    let response;
    for (let attempt = 0; attempt < 21; attempt += 1) {
      response = await request(app).post('/api/v1/auth/login').set('Origin', env.APP_ORIGIN).send({});
    }
    expect(response.status).toBe(429);
    expect(response.body.code).toBe('RATE_LIMIT');
  });
});
