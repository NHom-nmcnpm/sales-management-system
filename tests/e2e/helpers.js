import { expect } from '@playwright/test';
export async function login(page, role = 'MANAGER') {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email', { exact: true }).fill(process.env[`SEED_${role}_EMAIL`]);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env[`SEED_${role}_PASSWORD`]);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}
