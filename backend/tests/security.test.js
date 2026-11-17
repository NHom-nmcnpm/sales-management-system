import { afterAll, beforeEach, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';
import { clearDatabase, createUser } from './helpers.js';
import { loginAs } from './api-helpers.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

it('serves OpenAPI only to managers and describes all protected business modules', async () => {
  expect((await request(app).get('/api/v1/openapi.json')).status).toBe(401);
  const staff = await loginAs(await createUser('STAFF'));
  expect((await staff.agent.get('/api/v1/openapi.json')).status).toBe(403);
  const manager = await loginAs(await createUser());
  const response = await manager.agent.get('/api/v1/openapi.json');
  expect(response.status).toBe(200);
  expect(response.body.openapi).toBe('3.1.0');
  for (const path of [
    '/auth/login',
    '/products',
    '/employees',
    '/customers/{id}/invoices',
    '/inventory/adjustments',
    '/sales/quote',
    '/invoices/by-request/{key}',
    '/reports/revenue',
  ])
    expect(response.body.paths[path]).toBeDefined();
  expect(response.body.paths['/invoices'].post.parameters).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'Idempotency-Key', required: true })]),
  );
  expect(
    response.body.paths['/invoices'].post.requestBody.content['application/json'].schema.properties
      .payment,
  ).toBeDefined();
  expect(response.body.components.schemas.User.properties.passwordHash).toBeUndefined();
});

it('returns request IDs and safe errors for malformed or oversized payloads', async () => {
  const malformed = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send('{bad');
  expect(malformed.status).toBe(400);
  expect(malformed.body.requestId).toBe(malformed.headers['x-request-id']);
  expect(malformed.body.stack).toBeUndefined();
  const large = await request(app)
    .post('/api/v1/auth/login')
    .send({ data: 'x'.repeat(110000) });
  expect(large.status).toBe(413);
  expect(large.body.code).toBe('REQUEST_TOO_LARGE');
  expect(large.headers['x-content-type-options']).toBe('nosniff');
});
