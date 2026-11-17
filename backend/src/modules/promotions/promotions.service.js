import { prisma } from '../../prisma/client.js';
import { listOptions, listResult } from '../../utilities/list-query.js';
import { withTransaction } from '../../utilities/transaction.js';
import { HttpError } from '../../utilities/http-error.js';
import { promotionCreate } from './promotions.validators.js';

export async function listPromotions(query) {
  const where = { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { code: { contains: query.q, mode: 'insensitive' } }] };
  if (query.isActive) where.isActive = query.isActive === 'true';
  const [rows, total] = await Promise.all([prisma.promotion.findMany({ where, ...listOptions(query) }), prisma.promotion.count({ where })]);
  return listResult(rows, total, query);
}
export function createPromotion(data) { return prisma.promotion.create({ data }); }
export function updatePromotion(id, data) {
  return withTransaction(async transaction => {
    const current = await transaction.promotion.findUniqueOrThrow({ where: { id } });
    const merged = { code: current.code, name: current.name, discountType: current.discountType, discountValue: current.discountValue.toString(), minSubtotal: current.minSubtotal.toString(), maxDiscount: current.maxDiscount?.toString() ?? null, startsAt: current.startsAt.toISOString(), endsAt: current.endsAt.toISOString(), isActive: current.isActive, ...data };
    const validated = promotionCreate.safeParse(merged);
    if (!validated.success) throw new HttpError(400, 'INVALID_PROMOTION', validated.error.issues[0].message);
    return transaction.promotion.update({ where: { id }, data });
  });
}
