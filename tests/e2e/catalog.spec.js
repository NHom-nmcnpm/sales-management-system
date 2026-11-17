import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test('manager creates category/product, searches and adjusts stock', async ({ page }) => {
  const suffix = Date.now();
  await login(page);
  await page.goto('/danh-muc');
  await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).click();
  await page.getByLabel('Tên danh mục', { exact: true }).fill(`E2E ${suffix}`);
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/san-pham');
  await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click();
  await page.getByLabel('Tên sản phẩm', { exact: true }).fill(`Sổ E2E ${suffix}`);
  await page.getByLabel('Mã SKU', { exact: true }).fill(`E2E-${suffix}`);
  await page.getByLabel('Danh mục', { exact: true }).last().selectOption({ label: `E2E ${suffix}` });
  await page.getByLabel('Giá bán (VND)', { exact: true }).fill('45000');
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Tìm kiếm', exact: true }).fill(`E2E-${suffix}`);
  await expect(page.getByRole('cell', { name: `Sổ E2E ${suffix} E2E-${suffix}` })).toBeVisible();
  await page.goto(`/ton-kho?q=E2E-${suffix}`);
  await page.getByRole('button', { name: 'Điều chỉnh', exact: true }).click();
  await page.getByLabel('Số lượng điều chỉnh', { exact: true }).fill('12');
  await page.getByLabel('Lý do điều chỉnh', { exact: true }).fill('Nhập hàng kiểm thử E2E');
  await page.getByRole('button', { name: 'Xác nhận điều chỉnh', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '12 Cái' })).toBeVisible();
});

test('staff browses products and is denied manager inventory UI', async ({ page }) => {
  await login(page, 'STAFF');
  await page.goto('/san-pham');
  await expect(page.getByRole('heading', { name: 'Tra cứu sản phẩm' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm sản phẩm', exact: true })).toHaveCount(0);
  await page.goto('/ton-kho');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có quyền truy cập' })).toBeVisible();
});
