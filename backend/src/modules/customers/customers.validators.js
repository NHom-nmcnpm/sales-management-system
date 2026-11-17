import { z } from 'zod';
import { activeSchema, listQuerySchema } from '../../utilities/list-query.js';

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, '').replace(/^\+84/, '0'))
  .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Số điện thoại cần 8–15 chữ số.'))
  .nullable();
const fields = z.strictObject({
  name: z.string().trim().min(2).max(100),
  phone,
  email: z.email().max(254).nullable(),
  address: z.string().trim().max(500),
});
export const customerCreate = fields.extend({
  phone: phone.default(null),
  email: fields.shape.email.default(null),
  address: fields.shape.address.default(''),
});
export const customerUpdate = fields
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0);
export const customerQuery = listQuerySchema(['name', 'phone', 'createdAt']).extend({
  isActive: activeSchema,
});
