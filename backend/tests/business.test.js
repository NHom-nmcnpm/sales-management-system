import { afterAll, beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma, Prisma } from '../src/prisma/client.js';
import { clearDatabase, createUser, createProduct } from './helpers.js';
import { loginAs } from './api-helpers.js';
import { calculateDiscount, quoteSale } from '../src/modules/sales/sales.service.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

it.each([
  ['101', { discountType: 'PERCENT', discountValue: '12.5', maxDiscount: null }, '13'],
  ['100000', { discountType: 'PERCENT', discountValue: '50', maxDiscount: '10000' }, '10000'],
  ['9000', { discountType: 'FIXED', discountValue: '20000', maxDiscount: null }, '9000'],
  ['0', { discountType: 'PERCENT', discountValue: '100', maxDiscount: null }, '0'],
])('calculates exact discount for subtotal %s', (subtotal, promotion, expected) => {
  expect(calculateDiscount(new Prisma.Decimal(subtotal), promotion).toFixed(0)).toBe(expected);
});

it('locks staff sessions and prevents editing manager accounts or privilege assignment', async () => {
  const manager = await createUser();
  const staff = await createUser('STAFF');
  const managerApi = await loginAs(manager);
  const staffApi = await loginAs(staff);
  expect((await staffApi.agent.get('/api/v1/employees')).status).toBe(403);
  expect(
    (
      await managerApi.agent
        .patch(`/api/v1/employees/${manager.id}`)
        .set(managerApi.headers)
        .send({ isActive: false })
    ).status,
  ).toBe(404);
  expect(
    (
      await managerApi.agent
        .patch(`/api/v1/employees/${staff.id}`)
        .set(managerApi.headers)
        .send({ role: 'MANAGER' })
    ).status,
  ).toBe(400);
  expect(
    (
      await managerApi.agent
        .patch(`/api/v1/employees/${staff.id}`)
        .set(managerApi.headers)
        .send({ isActive: false })
    ).status,
  ).toBe(200);
  expect((await staffApi.agent.get('/api/v1/auth/me')).status).toBe(401);
});

it('allows staff to create customers and prevents updates or duplicate normalized phones', async () => {
  const staffApi = await loginAs(await createUser('STAFF'));
  const created = await staffApi.agent
    .post('/api/v1/customers')
    .set(staffApi.headers)
    .send({ name: 'Khách thử nghiệm', phone: '+84 901 234 567' });
  expect(created.status).toBe(201);
  expect(created.body.data.phone).toBe('0901234567');
  expect(
    (
      await staffApi.agent
        .post('/api/v1/customers')
        .set(staffApi.headers)
        .send({ name: 'Khách trùng', phone: '0901234567' })
    ).status,
  ).toBe(409);
  expect(
    (
      await staffApi.agent
        .patch(`/api/v1/customers/${created.body.data.id}`)
        .set(staffApi.headers)
        .send({ name: 'Tên mới' })
    ).status,
  ).toBe(403);
});

it('uses database prices, validates promotion boundaries and changes quote when price changes', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const now = new Date('2026-11-18T03:00:00.000Z');
  const promotion = await prisma.promotion.create({
    data: {
      code: 'TEST',
      name: 'Ưu đãi thử',
      discountType: 'PERCENT',
      discountValue: '10',
      minSubtotal: '100000',
      startsAt: now,
      endsAt: new Date(now.getTime() + 1000),
    },
  });
  const input = { items: [{ productId: product.id, quantity: 1 }], promotionId: promotion.id };
  const quote = await quoteSale(input, prisma, now);
  expect(quote.total).toBe('90000');
  await expect(quoteSale(input, prisma, new Date(now.getTime() - 1))).rejects.toMatchObject({
    code: 'PROMOTION_UNAVAILABLE',
  });
  await expect(quoteSale(input, prisma, new Date(now.getTime() + 1000))).rejects.toMatchObject({
    code: 'PROMOTION_UNAVAILABLE',
  });
  await prisma.product.update({ where: { id: product.id }, data: { price: '120000' } });
  expect((await quoteSale(input, prisma, now)).quoteHash).not.toBe(quote.quoteHash);
  const { agent, headers } = await loginAs(actor);
  expect(
    (await agent.post('/api/v1/sales/quote').set(headers).send({ items: input.items, total: '1' }))
      .status,
  ).toBe(400);
  expect(
    (
      await agent
        .post('/api/v1/sales/quote')
        .set(headers)
        .send({ items: [...input.items, ...input.items] })
    ).status,
  ).toBe(400);
  expect(
    (
      await agent
        .post('/api/v1/sales/quote')
        .set(headers)
        .send({ items: [{ productId: randomUUID(), quantity: 1 }] })
    ).status,
  ).toBe(409);
});

it('validates both new and partially updated promotion configurations', async () => {
  const { agent, headers } = await loginAs(await createUser());
  const base = {
    code: 'VALID',
    name: 'Khuyến mại kiểm thử',
    discountType: 'PERCENT',
    discountValue: '15',
    startsAt: '2026-01-01T00:00:00+07:00',
    endsAt: '2027-01-01T00:00:00+07:00',
  };
  const created = await agent.post('/api/v1/promotions').set(headers).send(base);
  expect(created.status).toBe(201);
  expect(
    (
      await agent
        .patch(`/api/v1/promotions/${created.body.data.id}`)
        .set(headers)
        .send({ discountValue: '101' })
    ).status,
  ).toBe(400);
  expect(
    (
      await agent
        .patch(`/api/v1/promotions/${created.body.data.id}`)
        .set(headers)
        .send({ endsAt: '2025-01-01T00:00:00+07:00' })
    ).status,
  ).toBe(400);
  const disabled = await agent
    .patch(`/api/v1/promotions/${created.body.data.id}`)
    .set(headers)
    .send({ isActive: false });
  expect(disabled.body.data.discountValue).toBe('15');
});
