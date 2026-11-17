import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'Mật khẩu cần ít nhất 10 ký tự.')
  .refine((value) => Buffer.byteLength(value) <= 72, 'Mật khẩu tối đa 72 byte.');
export const emailSchema = z
  .email('Email không hợp lệ.')
  .max(254)
  .transform((value) => value.toLowerCase());
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value) <= 72),
});
export const profileSchema = z.strictObject({
  name: z.string().trim().min(2, 'Nhập họ tên ít nhất 2 ký tự.').max(100),
});
export const changePasswordSchema = z.strictObject({
  currentPassword: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value) <= 72),
  newPassword: passwordSchema,
});
