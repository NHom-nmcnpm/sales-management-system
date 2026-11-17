import { afterAll, beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma/client.js';
import { clearDatabase, createUser, createProduct } from './helpers.js';
import { loginAs } from './api-helpers.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

it('enforces manager writes, staff visibility and validated sorting/pagination', async () => {
  const manager = await createUser();
  const staff = await createUser('STAFF');
  const product = await createProduct(manager);
  const managerApi = await loginAs(manager);
  const staffApi = await loginAs(staff);
  expect(
    (await staffApi.agent.post('/api/v1/products').set(staffApi.headers).send({})).status,
  ).toBe(403);
  expect((await staffApi.agent.get('/api/v1/inventory')).status).toBe(403);
  const result = await staffApi.agent.get('/api/v1/products?sortBy=price&sortOrder=asc&pageSize=1');
  expect(result.body.pagination.total).toBe(1);
  expect(result.body.data[0].price).toBe('100000');
  expect(
    (await managerApi.agent.get('/api/v1/products?stockStatus=low')).body.pagination.total,
  ).toBe(1);
  const edited = await managerApi.agent
    .patch(`/api/v1/products/${product.id}`)
    .set(managerApi.headers)
    .send({ price: '125000' });
  expect(edited.body.data.unit).toBe('Quyển');
  expect((await managerApi.agent.get('/api/v1/products?sortBy=unsafe')).status).toBe(400);
  expect(
    (
      await managerApi.agent
        .patch(`/api/v1/products/${product.id}`)
        .set(managerApi.headers)
        .send({ stock: -1 })
    ).status,
  ).toBe(400);
  await managerApi.agent
    .patch(`/api/v1/categories/${product.categoryId}`)
    .set(managerApi.headers)
    .send({ isActive: false });
  expect((await staffApi.agent.get(`/api/v1/products/${product.id}`)).status).toBe(404);
  expect(
    (
      await managerApi.agent
        .patch(`/api/v1/products/${product.id}`)
        .set(managerApi.headers)
        .send({ name: 'Sổ đã sửa', categoryId: product.categoryId })
    ).status,
  ).toBe(200);
});

it('prevents concurrent adjustments from removing the last unit twice', async () => {
  const actor = await createUser();
  const product = await createProduct(actor, 1);
  const { agent, headers } = await loginAs(actor);
  const responses = await Promise.all(
    [1, 2].map(() =>
      agent
        .post('/api/v1/inventory/adjustments')
        .set(headers)
        .set('Idempotency-Key', randomUUID())
        .send({ productId: product.id, delta: -1, reason: 'Xuất điều chỉnh' }),
    ),
  );
  expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(0);
});

it('records a stock adjustment once for repeated and concurrent requests', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const { agent, headers } = await loginAs(actor);
  const key = randomUUID();
  const data = { productId: product.id, delta: 4, reason: 'Nhập bổ sung' };
  const responses = await Promise.all(
    [1, 2].map(() =>
      agent
        .post('/api/v1/inventory/adjustments')
        .set(headers)
        .set('Idempotency-Key', key)
        .send(data),
    ),
  );
  expect(responses.map((response) => response.status)).toEqual([201, 201]);
  expect(responses[0].body.data.id).toBe(responses[1].body.data.id);
  expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(14);
  expect(await prisma.stockMovement.count({ where: { kind: 'ADJUSTMENT' } })).toBe(1);
  expect(
    (
      await agent
        .post('/api/v1/inventory/adjustments')
        .set(headers)
        .set('Idempotency-Key', key)
        .send({ ...data, delta: 5 })
    ).status,
  ).toBe(409);
  expect(
    (
      await agent
        .post('/api/v1/inventory/adjustments')
        .set(headers)
        .set('Idempotency-Key', randomUUID())
        .send({ ...data, delta: -20 })
    ).status,
  ).toBe(409);
});
