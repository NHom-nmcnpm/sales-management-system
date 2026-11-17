import { prisma, Prisma } from '../../prisma/client.js';
import { businessDate, businessDateRange } from '../../utilities/business-time.js';
import { listResult } from '../../utilities/list-query.js';
import { HttpError } from '../../utilities/http-error.js';

function reportRange(query) {
  const today = businessDate();
  const from = query.from ?? `${today.slice(0, 7)}-01`;
  const to = query.to ?? today;
  const range = businessDateRange(from, to);
  if (range.lt.getTime() - range.gte.getTime() > 3660 * 86400000) throw new HttpError(400, 'RANGE_TOO_LARGE', 'Mỗi lần báo cáo hỗ trợ tối đa 10 năm.');
  return { from, to, range };
}

export async function overview(query) {
  const { from, to, range } = reportRange(query);
  const where = { status: 'PAID', payment: { isNot: null }, paidAt: range };
  const [totals, units, lowStockCount, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({ where, _sum: { total: true, discount: true }, _count: true }),
    prisma.$queryRaw`SELECT COALESCE(SUM(ii.quantity), 0)::text AS value FROM "InvoiceItem" ii JOIN "Invoice" i ON i.id=ii."invoiceId" JOIN "Payment" p ON p."invoiceId"=i.id WHERE i.status='PAID' AND i."paidAt">=${range.gte} AND i."paidAt"<${range.lt}`,
    prisma.product.count({ where: { isActive: true, category: { isActive: true }, stock: { gt: 0, lte: prisma.product.fields.lowStockThreshold } } }),
    prisma.invoice.findMany({ where, take: 5, orderBy: [{ paidAt: 'desc' }, { id: 'asc' }], select: { id: true, number: true, paidAt: true, total: true, customerSnapshot: true, createdBy: { select: { name: true } }, payment: { select: { method: true } } } })
  ]);
  return { from, to, revenue: totals._sum.total?.toFixed(0) ?? '0', discount: totals._sum.discount?.toFixed(0) ?? '0', invoiceCount: totals._count, unitsSold: units[0].value, lowStockCount, recentInvoices };
}

export async function revenueReport(query) {
  const { from, to, range } = reportRange(query);
  const groupBy = query.groupBy;
  const rows = await prisma.$queryRaw`
    SELECT to_char(date_trunc(${groupBy}, i."paidAt" AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS period,
      SUM(i.total)::text AS revenue, COUNT(*)::int AS "invoiceCount"
    FROM "Invoice" i JOIN "Payment" p ON p."invoiceId"=i.id
    WHERE i.status='PAID' AND i."paidAt">=${range.gte} AND i."paidAt"<${range.lt}
    GROUP BY 1 ORDER BY 1`;
  const lookup = new Map(rows.map(row => [row.period, row]));
  const cursor = new Date(`${from}T00:00:00Z`);
  const last = new Date(`${to}T00:00:00Z`);
  if (groupBy !== 'day') cursor.setUTCDate(1);
  if (groupBy === 'year') cursor.setUTCMonth(0);
  const data = [];
  while (cursor <= last) {
    const period = cursor.toISOString().slice(0, 10);
    data.push(lookup.get(period) ?? { period, revenue: '0', invoiceCount: 0 });
    if (groupBy === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (groupBy === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
  }
  return { from, to, groupBy, data };
}

export async function productReport(query) {
  const { range } = reportRange(query);
  const search = `%${query.q}%`;
  const sort = { quantity: Prisma.sql`SUM(ii.quantity)`, subtotal: Prisma.sql`SUM(ii.subtotal)`, name: Prisma.sql`p.name` }[query.sortBy];
  const direction = query.sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const condition = Prisma.sql`i.status='PAID' AND i."paidAt">=${range.gte} AND i."paidAt"<${range.lt} AND (p.name ILIKE ${search} OR p.sku ILIKE ${search})`;
  const [rows, counts] = await Promise.all([
    prisma.$queryRaw`SELECT p.id, p.name, p.sku, SUM(ii.quantity)::text AS quantity, SUM(ii.subtotal)::text AS subtotal
      FROM "InvoiceItem" ii JOIN "Invoice" i ON i.id=ii."invoiceId" JOIN "Payment" pay ON pay."invoiceId"=i.id JOIN "Product" p ON p.id=ii."productId"
      WHERE ${condition} GROUP BY p.id ORDER BY ${sort} ${direction}, p.id ASC LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`,
    prisma.$queryRaw`SELECT COUNT(DISTINCT p.id)::int AS total
      FROM "InvoiceItem" ii JOIN "Invoice" i ON i.id=ii."invoiceId" JOIN "Payment" pay ON pay."invoiceId"=i.id JOIN "Product" p ON p.id=ii."productId" WHERE ${condition}`
  ]);
  return listResult(rows, counts[0].total, query);
}
