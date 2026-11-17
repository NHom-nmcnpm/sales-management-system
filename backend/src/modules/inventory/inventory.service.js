import { prisma } from '../../prisma/client.js';
import { withTransaction } from '../../utilities/transaction.js';
import { hashValue } from '../../utilities/hash.js';
import { HttpError } from '../../utilities/http-error.js';
import { listOptions, listResult } from '../../utilities/list-query.js';

export async function listMovements(query) {
  const where = {
    productId: query.productId,
    OR: [
      { product: { name: { contains: query.q, mode: 'insensitive' } } },
      { product: { sku: { contains: query.q, mode: 'insensitive' } } },
      { reason: { contains: query.q, mode: 'insensitive' } },
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      ...listOptions(query),
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        actor: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return listResult(rows, total, query);
}
function checkReplay(movement, requestHash) {
  if (movement.requestHash !== requestHash)
    throw new HttpError(409, 'KEY_CONFLICT', 'Mã thao tác đã được dùng với nội dung khác.');
  return movement;
}
export async function adjustStock(actorId, operationKey, data) {
  const requestHash = hashValue(data);
  const unique = { actorId_operationKey: { actorId, operationKey } };
  try {
    return await withTransaction(async (transaction) => {
      const existing = await transaction.stockMovement.findUnique({ where: unique });
      if (existing) return checkReplay(existing, requestHash);
      const product = await transaction.product.findUnique({ where: { id: data.productId } });
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm.');
      const update = await transaction.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: Math.max(0, -data.delta), lte: 2147483647 - Math.max(0, data.delta) },
        },
        data: { stock: { increment: data.delta } },
      });
      if (update.count !== 1)
        throw new HttpError(409, 'INVALID_STOCK', 'Số lượng tồn sau điều chỉnh không hợp lệ.');
      return transaction.stockMovement.create({
        data: {
          ...data,
          actorId,
          operationKey,
          requestHash,
          kind: 'ADJUSTMENT',
          quantityAfter: product.stock + data.delta,
        },
      });
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.stockMovement.findUnique({ where: unique });
      if (existing) return checkReplay(existing, requestHash);
    }
    throw error;
  }
}
