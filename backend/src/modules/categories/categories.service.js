import { prisma } from '../../prisma/client.js';
import { listOptions, listResult } from '../../utilities/list-query.js';

export async function listCategories(query, user) {
  const where = { name: { contains: query.q, mode: 'insensitive' } };
  if (user.role === 'STAFF') where.isActive = true;
  else if (query.isActive) where.isActive = query.isActive === 'true';
  const [rows, total] = await Promise.all([
    prisma.category.findMany({ where, ...listOptions(query), include: { _count: { select: { products: true } } } }),
    prisma.category.count({ where })
  ]);
  return listResult(rows, total, query);
}
export function createCategory(data) { return prisma.category.create({ data }); }
export function updateCategory(id, data) { return prisma.category.update({ where: { id }, data }); }
