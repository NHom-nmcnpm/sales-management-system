import { z } from 'zod';
export const saleInput = z.strictObject({
  items: z
    .array(z.strictObject({ productId: z.uuid(), quantity: z.number().int().min(1).max(1000000) }))
    .min(1)
    .max(100)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      'Mỗi sản phẩm chỉ được xuất hiện một dòng.',
    ),
  customerId: z.uuid().nullable().optional(),
  promotionId: z.uuid().nullable().optional(),
});
