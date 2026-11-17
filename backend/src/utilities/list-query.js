import { z } from 'zod';

export const idParams = z.object({ id: z.uuid('Mã dữ liệu không hợp lệ.') });
export const moneySchema = z.string().regex(/^\d{1,18}$/, 'Nhập số tiền nguyên không âm.');
export const activeSchema = z.enum(['true', 'false']).optional();

export function listQuerySchema(sortFields, defaultSort = 'createdAt') {
  return z.object({
    q: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(sortFields).default(defaultSort),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  });
}

export function listOptions(query) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] };
}
export function listResult(data, total, query) {
  return { data, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}
