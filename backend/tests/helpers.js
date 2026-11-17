import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../src/prisma/client.js';

export const testPassword = randomBytes(18).toString('base64url');
const passwordHash = await bcrypt.hash(testPassword, 12);

export async function clearDatabase() {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(), prisma.payment.deleteMany(), prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(), prisma.authSession.deleteMany(), prisma.promotion.deleteMany(),
    prisma.customer.deleteMany(), prisma.product.deleteMany(), prisma.category.deleteMany(), prisma.user.deleteMany()
  ]);
}

export async function createUser(role = 'MANAGER') {
  return prisma.user.create({ data: { email: `${randomUUID()}@example.test`, name: role === 'MANAGER' ? 'Quản lý thử nghiệm' : 'Nhân viên thử nghiệm', passwordHash, role } });
}

export async function createProduct(actor, stock = 10) {
  const category = await prisma.category.create({ data: { name: `Danh mục ${randomUUID()}` } });
  return prisma.product.create({ data: {
    sku: `TEST-${randomUUID()}`, name: 'Sổ tay thử nghiệm', unit: 'Quyển', price: '100000', stock, categoryId: category.id,
    movements: { create: { actorId: actor.id, delta: stock, quantityAfter: stock, kind: 'OPENING', reason: 'Test fixture' } }
  } });
}
