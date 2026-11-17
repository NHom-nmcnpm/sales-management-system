import { prisma, Prisma } from '../../prisma/client.js';
import { withTransaction } from '../../utilities/transaction.js';
import { HttpError } from '../../utilities/http-error.js';
import { hashValue } from '../../utilities/hash.js';
import { listOptions, listResult } from '../../utilities/list-query.js';
import { businessDate, businessDateRange } from '../../utilities/business-time.js';
import { quoteSale } from '../sales/sales.service.js';

const invoiceInclude = { items: { orderBy: { sku: 'asc' } }, payment: true, createdBy: { select: { id: true, name: true } } };

function presentInvoice(invoice) {
  const { requestHash: _requestHash, idempotencyKey: _key, ...data } = invoice;
  return { ...data, code: `HD-${String(data.number).padStart(6, '0')}` };
}

function replay(existing, requestHash) {
  if (existing.requestHash !== requestHash) throw new HttpError(409, 'KEY_CONFLICT', 'Mã giao dịch đã được dùng với nội dung khác. Hãy kiểm tra hóa đơn trước đó.');
  return { invoice: presentInvoice(existing), replayed: true };
}

export async function createInvoice(userId, idempotencyKey, input) {
  const normalized = {
    items: [...input.items].sort((first, second) => first.productId.localeCompare(second.productId)),
    customerId: input.customerId ?? null,
    promotionId: input.promotionId ?? null,
    quoteHash: input.quoteHash,
    payment: input.payment
  };
  const requestHash = hashValue(normalized);
  const unique = { createdById_idempotencyKey: { createdById: userId, idempotencyKey } };
  try {
    return await withTransaction(async transaction => {
      const existing = await transaction.invoice.findUnique({ where: unique, include: invoiceInclude });
      if (existing) return replay(existing, requestHash);
      const actor = await transaction.user.findFirst({ where: { id: userId, isActive: true } });
      if (!actor) throw new HttpError(401, 'SESSION_EXPIRED', 'Tài khoản đã ngừng hoạt động.');
      const quote = await quoteSale(normalized, transaction);
      if (quote.quoteHash !== input.quoteHash) throw new HttpError(409, 'QUOTE_CHANGED', 'Giá hoặc thông tin áp dụng đã thay đổi. Vui lòng kiểm tra và xác nhận tổng tiền mới.');
      const total = new Prisma.Decimal(quote.total);
      let payment;
      if (input.payment.method === 'CASH') {
        const received = new Prisma.Decimal(input.payment.cashReceived);
        if (received.lt(total)) throw new HttpError(400, 'INSUFFICIENT_PAYMENT', 'Tiền khách đưa chưa đủ thanh toán.', { cashReceived: 'Tiền khách đưa cần bằng hoặc lớn hơn tổng thanh toán.' });
        payment = { method: 'CASH', amount: total, cashReceived: received, change: received.sub(total) };
      } else {
        payment = { method: 'BANK_TRANSFER', amount: total, change: '0', transferReference: input.payment.transferReference || null };
      }
      const invoice = await transaction.invoice.create({ data: {
        createdById: userId, customerId: normalized.customerId, promotionId: normalized.promotionId,
        customerSnapshot: quote.customer, promotionSnapshot: quote.promotion ?? Prisma.JsonNull,
        subtotal: quote.subtotal, discount: quote.discount, total: quote.total, idempotencyKey, requestHash
      } });
      const invoiceItems = [];
      for (const item of quote.items) {
        invoiceItems.push(await transaction.invoiceItem.create({ data: { ...item, invoiceId: invoice.id } }));
        const updated = await transaction.product.updateMany({ where: { id: item.productId, isActive: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (updated.count !== 1) throw new HttpError(409, 'INSUFFICIENT_STOCK', `${item.name} không còn đủ số lượng.`);
        const product = await transaction.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
        await transaction.stockMovement.create({ data: { actorId: userId, productId: item.productId, invoiceId: invoice.id, kind: 'SALE', delta: -item.quantity, quantityAfter: product.stock, reason: `Bán hàng HD-${String(invoice.number).padStart(6, '0')}` } });
      }
      const recordedPayment = await transaction.payment.create({ data: { ...payment, invoiceId: invoice.id } });
      return { invoice: presentInvoice({ ...invoice, items: invoiceItems, payment: recordedPayment, createdBy: { id: actor.id, name: actor.name } }), replayed: false };
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.invoice.findUnique({ where: unique, include: invoiceInclude });
      if (existing) return replay(existing, requestHash);
    }
    throw error;
  }
}

export async function getInvoice(id, user) {
  const invoice = await prisma.invoice.findFirst({ where: { id, ...(user.role === 'STAFF' ? { createdById: user.id } : {}) }, include: invoiceInclude });
  if (!invoice) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hóa đơn.');
  return presentInvoice(invoice);
}

export async function getInvoiceByRequest(key, userId) {
  // Keys are scoped to their creator even when the caller is a manager.
  const invoice = await prisma.invoice.findUnique({ where: { createdById_idempotencyKey: { createdById: userId, idempotencyKey: key } }, include: invoiceInclude });
  if (!invoice) throw new HttpError(404, 'NOT_FOUND', 'Chưa tìm thấy hóa đơn của giao dịch này.');
  return presentInvoice(invoice);
}

export async function listInvoices(query, user) {
  const where = { status: 'PAID', payment: { isNot: null } };
  if (user.role === 'STAFF') where.createdById = user.id;
  else if (query.employeeId) where.createdById = query.employeeId;
  if (query.customerId) where.customerId = query.customerId;
  if (query.method) where.payment = { is: { method: query.method } };
  if (query.from || query.to) where.paidAt = businessDateRange(query.from ?? '1970-01-01', query.to ?? businessDate());
  if (query.q) {
    const number = Number(query.q.replace(/^HD-/i, ''));
    where.OR = [{ number: Number.isInteger(number) && number > 0 && number <= 2147483647 ? number : -1 }, { customerSnapshot: { path: ['name'], string_contains: query.q, mode: 'insensitive' } }, { createdBy: { name: { contains: query.q, mode: 'insensitive' } } }];
  }
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({ where, ...listOptions(query), include: { payment: true, createdBy: { select: { name: true } }, _count: { select: { items: true } } } }),
    prisma.invoice.count({ where })
  ]);
  return listResult(rows.map(presentInvoice), total, query);
}
