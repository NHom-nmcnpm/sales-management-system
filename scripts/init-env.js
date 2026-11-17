import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

if (existsSync('.env')) {
  console.log('.env đã tồn tại, giữ cấu hình hiện có.');
} else {
  const databasePassword = randomBytes(24).toString('hex');
  const values = {
    NODE_ENV: 'development', PORT: '3000', APP_ORIGIN: 'http://localhost:5173', COOKIE_SECURE: 'false',
    POSTGRES_USER: 'sales', POSTGRES_PASSWORD: databasePassword, POSTGRES_DB: 'sales', POSTGRES_PORT: '15432',
    DATABASE_URL: `postgresql://sales:${databasePassword}@localhost:15432/sales`,
    TEST_DATABASE_URL: `postgresql://sales:${databasePassword}@localhost:15432/sales_test`,
    JWT_SECRET: randomBytes(48).toString('hex'),
    SEED_MANAGER_EMAIL: 'manager@example.test', SEED_STAFF_EMAIL: 'staff@example.test',
    SEED_MANAGER_PASSWORD: randomBytes(18).toString('base64url'),
    SEED_STAFF_PASSWORD: randomBytes(18).toString('base64url')
  };
  writeFileSync('.env', Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx' });
  console.log('Đã tạo .env với secret ngẫu nhiên. Mở file local để xem hoặc đặt mật khẩu demo.');
}
