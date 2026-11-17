import { afterAll, beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma/client.js';
import { clearDatabase, createUser, createProduct } from './helpers.js';
import { loginAs } from './api-helpers.js';
import { createInvoice } from '../src/modules/invoices/invoices.service.js';
import { quoteSale } from '../src/modules/sales/sales.service.js';
import { revenueReport, overview, productReport } from '../src/modules/reports/reports.service.js';
import { getCustomer } from '../src/modules/customers/customers.service.js';
import { seedDatabase } from '../prisma/seed.js';
import { seedDemoSales } from '../prisma/seed-sales.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

it('groups Vietnam midnight/month/year boundaries, fills zero dates and excludes missing payments', async () => {
  const actor = await createUser();
  const product = await createProduct(actor);
  const customer = await prisma.customer.create({ data: { name: 'Khách báo cáo' } });
  const input = { items: [{ productId: product.id, quantity: 1 }], customerId: customer.id };
  for (const paidAt of ['2026-12-31T16:59:59.999Z', '2026-12-31T17:00:00.000Z']) {
    const quote = await quoteSale(input);
    const result = await createInvoice(actor.id, randomUUID(), { ...input, quoteHash: quote.quoteHash, payment: { method: 'CASH', cashReceived: '100000' } });
    await prisma.invoice.update({ where: { id: result.invoice.id }, data: { paidAt: new Date(paidAt) } });
  }
  await prisma.invoice.create({ data: { createdById: actor.id, customerId: customer.id, customerSnapshot: { name: 'Không có thanh toán' }, subtotal: '999999', discount: '0', total: '999999', idempotencyKey: randomUUID(), requestHash: 'fixture', paidAt: new Date('2026-12-31T18:00:00Z') } });
  const daily = await revenueReport({ from: '2027-01-01', to: '2027-01-03', groupBy: 'day' });
  expect(daily.data.map(row => row.revenue)).toEqual(['100000', '0', '0']);
  expect((await revenueReport({ from: '2026-12-01', to: '2027-01-31', groupBy: 'month' })).data.map(row => row.revenue)).toEqual(['100000', '100000']);
  expect((await revenueReport({ from: '2026-01-01', to: '2027-12-31', groupBy: 'year' })).data.map(row => row.revenue)).toEqual(['100000', '100000']);
  expect((await overview({ from: '2027-01-01', to: '2027-01-03' })).invoiceCount).toBe(1);
  expect((await getCustomer(customer.id, actor)).summary.totalSpent).toBe('200000');
  const products = await productReport({ from: '2026-12-01', to: '2027-01-31', q: '', page: 1, pageSize: 20, sortBy: 'quantity', sortOrder: 'desc' });
  expect(products.data[0].quantity).toBe('2');
  expect(products.data[0].subtotal).toBe('200000');
});

it('denies staff reports and customer history while retaining their invoice scope', async () => {
  const manager = await createUser();
  const staff = await createUser('STAFF');
  const customer = await prisma.customer.create({ data: { name: 'Khách bảo mật' } });
  const { agent } = await loginAs(staff);
  expect((await agent.get('/api/v1/reports/overview')).status).toBe(403);
  expect((await agent.get(`/api/v1/customers/${customer.id}/invoices`)).status).toBe(403);
  expect((await agent.get(`/api/v1/customers/${customer.id}`)).body.data.summary).toBeUndefined();
  const managerApi = await loginAs(manager);
  expect((await managerApi.agent.get('/api/v1/reports/revenue?from=2027-01-02&to=2027-01-01')).status).toBe(400);
});

it('seeds historical invoices once with matching payments and inventory ledger', { timeout: 60000 }, async () => {
  await seedDatabase();
  expect(await seedDemoSales()).toBe(270);
  const count = await prisma.invoice.count();
  expect(await seedDemoSales()).toBe(0);
  expect(await prisma.invoice.count()).toBe(count);
  expect(await prisma.payment.count()).toBe(count);
  for (const product of await prisma.product.findMany({ include: { movements: true } })) {
    expect(product.movements.reduce((sum, movement) => sum + movement.delta, 0)).toBe(product.stock);
    expect(product.stock).toBeGreaterThanOrEqual(0);
  }
});
