import '../src/config/env.js';
import { Client } from 'pg';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || testUrl === process.env.DATABASE_URL)
  throw new Error('TEST_DATABASE_URL phải trỏ database test riêng.');
const parsed = new URL(testUrl);
const databaseName = parsed.pathname.slice(1);
if (!/^[a-zA-Z0-9_]+_test$/.test(databaseName))
  throw new Error('Tên database test phải kết thúc bằng _test.');
parsed.pathname = '/postgres';
const admin = new Client({ connectionString: parsed.toString() });
try {
  await admin.connect();
  const result = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (result.rowCount === 0) await admin.query(`CREATE DATABASE "${databaseName}"`);
} finally {
  await admin.end();
}

const prismaCli = fileURLToPath(
  new URL('../../node_modules/prisma/build/index.js', import.meta.url),
);
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: testUrl },
});
if (result.status !== 0) process.exit(result.status ?? 1);
