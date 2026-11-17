import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

async function addProduct(page, sku) {
  await page.getByRole('textbox', { name: 'Tìm sản phẩm', exact: true }).fill(sku);
  await page.getByRole('button', { name: /^Thêm / }).filter({ hasText: sku }).click();
  await expect(page.getByRole('button', { name: 'Thanh toán', exact: true })).toBeEnabled();
}

test('cash guest sale, receipt print and mobile layout', async ({ page }) => {
  await login(page, 'STAFF');
  await page.goto('/ban-hang');
  await addProduct(page, 'VP-B001');
  await page.getByLabel('Số lượng Bút bi Thiên Long TL-027', { exact: true }).fill('2');
  await expect(page.locator('.grand-total strong')).toHaveText('10.000 ₫');
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await page.getByLabel('Tiền khách đưa (VND)', { exact: true }).fill('20000');
  await page.getByRole('button', { name: 'Xác nhận và lập hóa đơn', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Hóa đơn HD-/ })).toBeVisible();
  await expect(page.locator('.invoice-payment')).toContainText('10.000');
  await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
  await page.getByRole('button', { name: 'In hóa đơn', exact: true }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.invoice-sheet')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/ban-hang');
  await expect(page.getByRole('heading', { name: 'Bán hàng', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('customer and promotion sale with explicitly confirmed transfer', async ({ page }) => {
  await login(page, 'STAFF');
  await page.goto('/ban-hang');
  await addProduct(page, 'VP-S001');
  await page.getByLabel('Số lượng Sổ tay bìa da A5', { exact: true }).fill('2');
  await expect(page.getByRole('button', { name: 'Thanh toán', exact: true })).toBeEnabled();
  await page.getByLabel('Tìm khách hàng', { exact: true }).fill('Nguyễn Thu Hà');
  await page.getByRole('button', { name: /Nguyễn Thu Hà/ }).click();
  const promotionOption = page.getByLabel('Khuyến mại', { exact: true }).locator('option').filter({ hasText: 'CHAO10' });
  await expect(promotionOption).toHaveCount(1);
  await page.getByLabel('Khuyến mại', { exact: true }).selectOption(await promotionOption.getAttribute('value'));
  await expect(page.locator('.grand-total strong')).toHaveText('160.200 ₫');
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await page.getByLabel('Hình thức thanh toán', { exact: true }).selectOption('BANK_TRANSFER');
  await expect(page.getByRole('button', { name: 'Xác nhận và lập hóa đơn', exact: true })).toBeDisabled();
  await page.getByLabel('Mã tham chiếu chuyển khoản', { exact: true }).fill('E2E-TRANSFER');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận và lập hóa đơn', exact: true }).click();
  await expect(page.locator('.invoice-sheet')).toContainText('Nguyễn Thu Hà');
  await expect(page.locator('.invoice-sheet')).toContainText('E2E-TRANSFER');
});

test('recovers a committed sale after losing the response and reloading', async ({ page }) => {
  await login(page, 'STAFF');
  await page.goto('/ban-hang');
  await addProduct(page, 'VP-B002');
  let recordedId;
  await page.route('**/api/v1/invoices', async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    const response = await route.fetch();
    recordedId = (await response.json()).data.id;
    await route.abort('connectionreset');
  });
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận và lập hóa đơn', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không thể kết nối');
  await page.reload();
  await expect(page.locator('.pending-banner')).toBeVisible();
  await page.getByRole('button', { name: 'Kiểm tra giao dịch', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/hoa-don/${recordedId}$`));
  await expect(page.locator('.invoice-sheet')).toBeVisible();
});
