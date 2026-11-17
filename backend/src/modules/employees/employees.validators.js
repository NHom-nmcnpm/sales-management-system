import { z } from 'zod';
import { emailSchema, passwordSchema } from '../auth/auth.validators.js';
import { activeSchema, listQuerySchema } from '../../utilities/list-query.js';

export const employeeCreate = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});
export const employeeUpdate = z
  .strictObject({
    name: z.string().trim().min(2).max(100).optional(),
    email: emailSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export const resetPassword = z.strictObject({ password: passwordSchema });
export const employeeQuery = listQuerySchema(['name', 'email', 'createdAt']).extend({
  isActive: activeSchema,
});
