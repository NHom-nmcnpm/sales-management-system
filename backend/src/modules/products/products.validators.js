import { z } from 'zod';
import { activeSchema, listQuerySchema, moneySchema } from '../../utilities/list-query.js';

const productFields = z.strictObject({
  sku: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^[A-Z0-9._-]+$/, 'SKU chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.'),
    ),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000),
  unit: z.string().trim().min(1).max(30),
  categoryId: z.uuid(),
  price: moneySchema.refine((value) => value.length <= 12, 'Giá tối đa 12 chữ số.'),
  lowStockThreshold: z.number().int().min(0).max(1000000),
});
export const productCreate = productFields.extend({
  description: productFields.shape.description.default(''),
  unit: productFields.shape.unit.default('Cái'),
  lowStockThreshold: productFields.shape.lowStockThreshold.default(10),
});
export const productUpdate = productFields
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0);
export const productQuery = listQuerySchema(['name', 'sku', 'price', 'stock', 'createdAt']).extend({
  categoryId: z.uuid().optional(),
  isActive: activeSchema,
  sellable: z.enum(['true']).optional(),
  stockStatus: z.enum(['low', 'out', 'available']).optional(),
});
