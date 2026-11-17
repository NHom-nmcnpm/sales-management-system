import { z } from 'zod';
import { Prisma } from '../../prisma/client.js';
import { activeSchema, listQuerySchema, moneySchema } from '../../utilities/list-query.js';

const fields = z.strictObject({
  code: z.string().trim().min(2).max(40).transform(value => value.toUpperCase()).pipe(z.string().regex(/^[A-Z0-9_-]+$/)),
  name: z.string().trim().min(2).max(150),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
  minSubtotal: moneySchema, maxDiscount: moneySchema.nullable(),
  startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }),
  isActive: z.boolean()
});
export const promotionCreate = fields.extend({ minSubtotal: moneySchema.default('0'), maxDiscount: moneySchema.nullable().default(null), isActive: z.boolean().default(true) }).superRefine((data, context) => {
  const value = new Prisma.Decimal(data.discountValue);
  if (value.lte(0) || (data.discountType === 'PERCENT' && value.gt(100)) || (data.discountType === 'FIXED' && !value.isInteger())) context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Mức giảm cần lớn hơn 0, phần trăm tối đa 100, số tiền cố định phải nguyên.' });
  if (new Date(data.endsAt) <= new Date(data.startsAt)) context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.' });
});
export const promotionUpdate = fields.partial().refine(value => Object.keys(value).length > 0);
export const promotionQuery = listQuerySchema(['name', 'code', 'startsAt', 'endsAt', 'createdAt']).extend({ isActive: activeSchema });
