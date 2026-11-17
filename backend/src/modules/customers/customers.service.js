import { prisma } from '../../prisma/client.js';
import { listOptions, listResult } from '../../utilities/list-query.js';

export async function listCustomers(query, user) {
  const where = {
    OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { phone: { contains: query.q } }],
  };
  if (user.role === 'STAFF') where.isActive = true;
  else if (query.isActive) where.isActive = query.isActive === 'true';
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({ where, ...listOptions(query) }),
    prisma.customer.count({ where }),
  ]);
  return listResult(rows, total, query);
}
export async function getCustomer(id, user) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id, ...(user.role === 'STAFF' ? { isActive: true } : {}) },
  });
  if (user.role !== 'MANAGER') return customer;
  const totals = await prisma.invoice.aggregate({
    where: { customerId: id, status: 'PAID', payment: { isNot: null } },
    _count: true,
    _sum: { total: true },
    _max: { paidAt: true },
  });
  return {
    ...customer,
    summary: {
      invoiceCount: totals._count,
      totalSpent: totals._sum.total?.toFixed(0) ?? '0',
      lastPurchaseAt: totals._max.paidAt,
    },
  };
}
export function createCustomer(data) {
  return prisma.customer.create({ data });
}
export function updateCustomer(id, data) {
  return prisma.customer.update({ where: { id }, data });
}
