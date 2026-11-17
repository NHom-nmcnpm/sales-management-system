import { z } from 'zod';
import { saleInput } from '../sales/sales.validators.js';
import { listQuerySchema, moneySchema } from '../../utilities/list-query.js';

const payment = z.discriminatedUnion('method', [
  z.strictObject({ method: z.literal('CASH'), cashReceived: moneySchema }),
  z.strictObject({ method: z.literal('BANK_TRANSFER'), confirmed: z.literal(true, { error: 'Cần xác nhận đã nhận chuyển khoản.' }), transferReference: z.string().trim().max(100).default('') })
]);
export const invoiceCreate = saleInput.extend({ quoteHash: z.string().regex(/^[a-f0-9]{64}$/), payment });
export const keyParams = z.object({ key: z.uuid() });
export const invoiceQuery = listQuerySchema(['paidAt', 'number', 'total'], 'paidAt').extend({
  from: z.iso.date().optional(), to: z.iso.date().optional(),
  employeeId: z.uuid().optional(), customerId: z.uuid().optional(), method: z.enum(['CASH', 'BANK_TRANSFER']).optional()
});
