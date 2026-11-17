import { spawnSync } from 'node:child_process';

export default function setup() {
  const testUrl = process.env.E2E_DATABASE_URL;
  if (!testUrl || testUrl === process.env.DATABASE_URL || !new URL(testUrl).pathname.endsWith('_e2e_test')) throw new Error('E2E requires its own database.');
  const prepared = spawnSync(process.execPath, ['backend/scripts/prepare-test-db.js'], {
    stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: testUrl }
  });
  if (prepared.status !== 0) throw new Error('Could not prepare E2E database.');
  const seeded = spawnSync(process.execPath, ['backend/prisma/seed.js'], {
    stdio: 'inherit', env: { ...process.env, DATABASE_URL: testUrl }
  });
  if (seeded.status !== 0) throw new Error('Could not seed E2E database.');
}
