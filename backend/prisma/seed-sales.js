import { prisma, Prisma } from '../src/prisma/client.js';
import { withTransaction } from '../src/utilities/transaction.js';
import { hashValue } from '../src/utilities/hash.js';
import { businessDate } from '../src/utilities/business-time.js';
import { quoteSale } from '../src/modules/sales/sales.service.js';
import { recordSale } from '../src/modules/invoices/invoices.service.js';

const seedPrefix = 'seed:demo-v1:';

export async function seedDemoSales() {
  // Preserve a database already used for real checkout rather than inserting backdated movements.
  if (
    await prisma.invoice.count({ where: { NOT: { idempotencyKey: { startsWith: seedPrefix } } } })
  )
    return 0;
  const manager = await prisma.user.findUnique({
    where: { email: process.env.SEED_MANAGER_EMAIL.toLowerCase() },
  });
  const staff = await prisma.user.findUnique({
    where: { email: process.env.SEED_STAFF_EMAIL.toLowerCase() },
  });
  const products = await prisma.product.findMany({
    where: { sku: { startsWith: 'VP-' }, isActive: true, category: { isActive: true } },
    orderBy: { sku: 'asc' },
  });
  const customers = await prisma.customer.findMany({
    where: { isActive: true, phone: { startsWith: '090100000' } },
    orderBy: { phone: 'asc' },
  });
  if (!manager?.isActive || !staff?.isActive || products.length < 2) return 0;
  const manualMovements = await prisma.stockMovement.count({
    where: {
      productId: { in: products.map((product) => product.id) },
      kind: 'ADJUSTMENT',
      NOT: { operationKey: { startsWith: seedPrefix } },
    },
  });
  if (manualMovements) return 0;
  const first = await prisma.invoice.findFirst({
    where: { idempotencyKey: `${seedPrefix}000` },
    select: { paidAt: true },
  });
  const anchor = first
    ? new Date(`${businessDate(first.paidAt)}T00:00:00+07:00`)
    : new Date(new Date(`${businessDate()}T00:00:00+07:00`).getTime() - 90 * 86400000);
  const openingTime = new Date(anchor.getTime() - 86400000);
  await prisma.stockMovement.updateMany({
    where: {
      kind: 'OPENING',
      operationKey: { startsWith: 'seed:opening:' },
      createdAt: { gt: openingTime },
    },
    data: { createdAt: openingTime },
  });
  let created = 0;
  for (let index = 0; index < 270; index += 1) {
    const key = `${seedPrefix}${String(index).padStart(3, '0')}`;
    const paidAt = new Date(
      anchor.getTime() +
        Math.floor(index / 3) * 86400000 +
        (9 + (index % 3) * 4) * 3600000 +
        15 * 60000,
    );
    const actor = index % 5 === 0 ? manager : staff;
    const firstProduct = products[index % products.length];
    const secondProduct = products[(index + 5) % products.length];
    const items = [{ productId: firstProduct.id, quantity: 1 + (index % 3) }];
    if (secondProduct.id !== firstProduct.id)
      items.push({ productId: secondProduct.id, quantity: 1 });
    const inserted = await withTransaction(async (transaction) => {
      if (await transaction.invoice.findFirst({ where: { idempotencyKey: key } })) return false;
      for (const item of items) {
        const product = await transaction.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await transaction.stockMovement.create({
          data: {
            actorId: actor.id,
            productId: item.productId,
            delta: item.quantity,
            quantityAfter: product.stock,
            kind: 'ADJUSTMENT',
            reason: 'Nhập hàng cho giao dịch dữ liệu demo',
            operationKey: `${key}:${item.productId}`,
            createdAt: new Date(paidAt.getTime() - 1),
          },
        });
      }
      const input = {
        items,
        customerId:
          index % 4 !== 0 && customers.length ? customers[index % customers.length].id : null,
      };
      let quote = await quoteSale(input, transaction, paidAt);
      if (index % 3 === 0 && quote.eligiblePromotions.length)
        quote = await quoteSale(
          { ...input, promotionId: quote.eligiblePromotions[0].id },
          transaction,
          paidAt,
        );
      const amount = new Prisma.Decimal(quote.total);
      const payment =
        index % 2 === 0
          ? { method: 'CASH', amount, cashReceived: amount, change: '0' }
          : { method: 'BANK_TRANSFER', amount, change: '0', transferReference: `DEMO-${index}` };
      await recordSale(transaction, {
        actor,
        quote,
        payment,
        idempotencyKey: key,
        requestHash: hashValue({ seed: 'demo-v1', key }),
        paidAt,
      });
      return true;
    });
    if (inserted) created += 1;
  }
  return created;
}
