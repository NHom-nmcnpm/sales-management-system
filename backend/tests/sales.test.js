import { afterAll, beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma/client.js';
import { clearDatabase, createUser, createProduct } from './helpers.js';
import { loginAs } from './api-helpers.js';
import { quoteSale } from '../src/modules/sales/sales.service.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

async function cashPayload(product, quantity = 1) {
  const input = { items: [{ productId: product.id, quantity }] };
  const quote = await quoteSale(input);
  return { ...input, quoteHash: quote.quoteHash, payment: { method: 'CASH', cashReceived: '500000' } };
}

it('atomically records invoice/payment/stock and keeps historic snapshots', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const { agent, headers } = await loginAs(actor);
  const response = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', randomUUID()).send(await cashPayload(product, 2));
  expect(response.status).toBe(201);
  expect(response.body.data.total).toBe('200000');
  expect(response.body.data.payment.change).toBe('300000');
  expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(8);
  expect(await prisma.stockMovement.count({ where: { kind: 'SALE' } })).toBe(1);
  await prisma.product.update({ where: { id: product.id }, data: { name: 'Tên sau thay đổi', price: '200000', isActive: false } });
  const detail = await agent.get(`/api/v1/invoices/${response.body.data.id}`);
  expect(detail.body.data.items[0].name).toBe(product.name);
  expect(detail.body.data.items[0].unitPrice).toBe('100000');
  expect(detail.body.data.requestHash).toBeUndefined();
  expect((await agent.get('/api/v1/invoices?q=Khách')).body.pagination.total).toBe(1);
});

it('replays concurrent identical requests and enforces ownership by both ID and key', async () => {
  const staff = await createUser('STAFF');
  const other = await createUser('STAFF');
  const manager = await createUser();
  const product = await createProduct(manager);
  const ownerApi = await loginAs(staff);
  const otherApi = await loginAs(other);
  const managerApi = await loginAs(manager);
  const payload = await cashPayload(product);
  const key = randomUUID();
  const responses = await Promise.all([1, 2].map(() => ownerApi.agent.post('/api/v1/invoices').set(ownerApi.headers).set('Idempotency-Key', key).send(payload)));
  expect(responses.map(response => response.status).sort()).toEqual([200, 201]);
  const id = responses[0].body.data.id;
  expect(responses[1].body.data.id).toBe(id);
  expect(await prisma.invoice.count()).toBe(1);
  expect((await otherApi.agent.get(`/api/v1/invoices/${id}`)).status).toBe(404);
  expect((await otherApi.agent.get(`/api/v1/invoices/by-request/${key}`)).status).toBe(404);
  expect((await managerApi.agent.get(`/api/v1/invoices/${id}`)).status).toBe(200);
  expect((await managerApi.agent.get(`/api/v1/invoices/by-request/${key}`)).status).toBe(404);
  expect((await ownerApi.agent.get(`/api/v1/invoices/by-request/${key}`)).body.data.id).toBe(id);
  expect((await ownerApi.agent.post('/api/v1/invoices').set(ownerApi.headers).set('Idempotency-Key', key).send({ ...payload, payment: { method: 'CASH', cashReceived: '600000' } })).status).toBe(409);
});

it('allows only one of two staff to sell the last unit', async () => {
  const first = await createUser('STAFF');
  const second = await createUser('STAFF');
  const product = await createProduct(first, 1);
  const payload = await cashPayload(product);
  const firstApi = await loginAs(first);
  const secondApi = await loginAs(second);
  const responses = await Promise.all([firstApi, secondApi].map(({ agent, headers }) => agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', randomUUID()).send(payload)));
  expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
  expect(await prisma.invoice.count()).toBe(1);
  expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(0);
});

it('rejects stale quote and insufficient cash without changing inventory', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const { agent, headers } = await loginAs(actor);
  const payload = await cashPayload(product);
  await prisma.product.update({ where: { id: product.id }, data: { price: '110000' } });
  const stale = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', randomUUID()).send(payload);
  expect(stale.body.code).toBe('QUOTE_CHANGED');
  const fresh = await cashPayload(product);
  const insufficient = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', randomUUID()).send({ ...fresh, payment: { method: 'CASH', cashReceived: '1' } });
  expect(insufficient.body.code).toBe('INSUFFICIENT_PAYMENT');
  expect(await prisma.invoice.count()).toBe(0);
  expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(10);
});

it('rolls back an invoice when a database write fails during payment creation', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const { agent, headers } = await loginAs(actor);
  await prisma.$executeRawUnsafe(`CREATE FUNCTION test_payment_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected test payment failure'; END; $$`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER test_payment_failure BEFORE INSERT ON "Payment" FOR EACH ROW EXECUTE FUNCTION test_payment_failure()`);
  try {
    const response = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', randomUUID()).send(await cashPayload(product));
    expect(response.status).toBe(500);
    expect(await prisma.invoice.count()).toBe(0);
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.stockMovement.count({ where: { kind: 'SALE' } })).toBe(0);
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(10);
  } finally {
    await prisma.$executeRawUnsafe('DROP TRIGGER test_payment_failure ON "Payment"');
    await prisma.$executeRawUnsafe('DROP FUNCTION test_payment_failure()');
  }
});

it('records a confirmed bank transfer and replays despite later promotion changes', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const promotion = await prisma.promotion.create({ data: { code: 'SALE10', name: 'Ưu đãi 10%', discountType: 'PERCENT', discountValue: '10', startsAt: new Date(Date.now() - 10000), endsAt: new Date(Date.now() + 60000) } });
  const input = { items: [{ productId: product.id, quantity: 1 }], promotionId: promotion.id };
  const quote = await quoteSale(input);
  const { agent, headers } = await loginAs(actor);
  const key = randomUUID();
  const payload = { ...input, quoteHash: quote.quoteHash, payment: { method: 'BANK_TRANSFER', confirmed: true, transferReference: 'REF-TEST' } };
  const created = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', key).send(payload);
  expect(created.status).toBe(201);
  expect(created.body.data.payment.amount).toBe('90000');
  await prisma.promotion.update({ where: { id: promotion.id }, data: { isActive: false } });
  const replay = await agent.post('/api/v1/invoices').set(headers).set('Idempotency-Key', key).send(payload);
  expect(replay.status).toBe(200);
  expect(replay.body.data.id).toBe(created.body.data.id);
  expect(await prisma.invoice.count()).toBe(1);
});
