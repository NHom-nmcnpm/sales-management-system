import { z } from 'zod';
import { listQuerySchema } from '../../utilities/list-query.js';
export const adjustmentSchema = z.strictObject({
  productId: z.uuid(),
  delta: z
    .number()
    .int()
    .min(-1000000)
    .max(1000000)
    .refine((value) => value !== 0, 'Số lượng điều chỉnh phải khác 0.'),
  reason: z.string().trim().min(3).max(500),
});
export const movementQuery = listQuerySchema(['createdAt', 'delta', 'quantityAfter']).extend({
  productId: z.uuid().optional(),
});
