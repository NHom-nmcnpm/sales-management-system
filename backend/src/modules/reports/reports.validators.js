import { z } from 'zod';
import { listQuerySchema } from '../../utilities/list-query.js';
const dates = { from: z.iso.date().optional(), to: z.iso.date().optional() };
export const revenueQuery = z.object({
  ...dates,
  groupBy: z.enum(['day', 'month', 'year']).default('day'),
});
export const productReportQuery = listQuerySchema(
  ['quantity', 'subtotal', 'name'],
  'quantity',
).extend(dates);
