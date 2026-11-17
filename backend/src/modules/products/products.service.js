import { prisma } from '../../prisma/client.js';
import { listOptions, listResult } from '../../utilities/list-query.js';
import { HttpError } from '../../utilities/http-error.js';

export function productFilter(query, user) {
  const where = {
    OR: [
      { name: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
    ],
  };
  if (user.role === 'STAFF' || query.sellable === 'true') {
    where.isActive = true;
    where.category = { isActive: true };
  } else if (query.isActive) where.isActive = query.isActive === 'true';
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.stockStatus === 'out') where.stock = 0;
  if (query.stockStatus === 'low')
    where.stock = { gt: 0, lte: prisma.product.fields.lowStockThreshold };
  if (query.stockStatus === 'available')
    where.stock = { gt: prisma.product.fields.lowStockThreshold };
  return where;
}
export async function listProducts(query, user) {
  const where = productFilter(query, user);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, ...listOptions(query), include: { category: true } }),
    prisma.product.count({ where }),
  ]);
  return listResult(rows, total, query);
}
export async function getProduct(id, user) {
  const where = { id };
  if (user.role === 'STAFF') {
    where.isActive = true;
    where.category = { isActive: true };
  }
  const product = await prisma.product.findFirst({ where, include: { category: true } });
  if (!product) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm.');
  return product;
}
async function ensureCategory(categoryId) {
  if (!(await prisma.category.findFirst({ where: { id: categoryId, isActive: true } })))
    throw new HttpError(
      400,
      'INVALID_CATEGORY',
      'Danh mục đã ngừng hoạt động hoặc không tồn tại.',
      { categoryId: 'Chọn danh mục đang hoạt động.' },
    );
}
export async function createProduct(data) {
  await ensureCategory(data.categoryId);
  return prisma.product.create({ data, include: { category: true } });
}
export async function updateProduct(id, data) {
  if (data.categoryId) {
    const current = await prisma.product.findUniqueOrThrow({
      where: { id },
      select: { categoryId: true },
    });
    if (data.categoryId !== current.categoryId) await ensureCategory(data.categoryId);
  }
  return prisma.product.update({ where: { id }, data, include: { category: true } });
}
