import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma/client.js';
import { createUser, createProduct, clearDatabase } from './helpers.js';
import { seedDatabase } from '../prisma/seed.js';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe('Database integrity', () => {
  it('rejects duplicate SKU and negative inventory, retains referenced records', async () => {
    const actor = await createUser();
    const product = await createProduct(actor);
    await expect(
      prisma.product.create({
        data: { sku: product.sku, name: 'Trùng', categoryId: product.categoryId, price: '1' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await expect(
      prisma.product.update({ where: { id: product.id }, data: { stock: -1 } }),
    ).rejects.toThrow();
    await expect(
      prisma.category.delete({ where: { id: product.categoryId } }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rolls back all writes when a later write fails', async () => {
    const actor = await createUser();
    const product = await createProduct(actor);
    await expect(
      prisma.$transaction(async (transaction) => {
        await transaction.product.update({ where: { id: product.id }, data: { stock: 5 } });
        await transaction.stockMovement.create({
          data: {
            actorId: actor.id,
            productId: randomUUID(),
            delta: -5,
            quantityAfter: 5,
            kind: 'SALE',
            reason: 'Fail fixture',
          },
        });
      }),
    ).rejects.toThrow();
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(10);
  });

  it('seeds idempotently and preserves edited records and matching stock ledger', async () => {
    await seedDatabase();
    const product = await prisma.product.findUnique({ where: { sku: 'VP-B001' } });
    await prisma.product.update({ where: { id: product.id }, data: { name: 'Tên đã chỉnh sửa' } });
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.stockMovement.count(),
    ]);
    await seedDatabase();
    expect(
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.stockMovement.count(),
      ]),
    ).toEqual(counts);
    expect((await prisma.product.findUnique({ where: { id: product.id } })).name).toBe(
      'Tên đã chỉnh sửa',
    );
    for (const row of await prisma.product.findMany({ include: { movements: true } })) {
      expect(row.movements.reduce((sum, movement) => sum + movement.delta, 0)).toBe(row.stock);
    }
  });
});
