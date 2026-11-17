import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.url(), DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(64),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform(value => value === 'true')
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Cấu hình môi trường thiếu hoặc không hợp lệ: ${parsed.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
export const env = parsed.data;
