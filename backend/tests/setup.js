import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL === process.env.DATABASE_URL || !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error('Integration tests yêu cầu TEST_DATABASE_URL riêng kết thúc bằng _test.');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
const { env } = await import('../src/config/env.js');
if (env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Test configuration resolved the wrong database.');
