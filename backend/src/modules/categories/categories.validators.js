import { z } from 'zod';
import { activeSchema, listQuerySchema } from '../../utilities/list-query.js';

const categoryFields = z.strictObject({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000) });
export const categoryCreate = categoryFields.extend({ description: categoryFields.shape.description.default('') });
export const categoryUpdate = categoryFields.partial().extend({ isActive: z.boolean().optional() }).refine(value => Object.keys(value).length > 0, 'Cần ít nhất một thông tin thay đổi.');
export const categoryQuery = listQuerySchema(['name', 'createdAt'], 'name').extend({ isActive: activeSchema });
