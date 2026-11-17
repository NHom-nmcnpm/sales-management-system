import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test('responsive dashboard, tables, POS and receipt have no page overflow or runtime errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  for (const width of [1440, 1280, 768, 375]) {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1000 });
    await page.goto('/tong-quan');
    await expect(page.locator('.stat-card').first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width < 800) {
      await page.getByRole('button', { name: 'Mở menu' }).click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Mở menu' })).toBeFocused();
      await expect
        .poll(() =>
          page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().right),
        )
        .toBeLessThanOrEqual(1);
    }
    await page.goto('/san-pham');
    await expect(page.getByRole('table')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.goto('/ban-hang');
    await expect(page.locator('.product-card').first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  const invoices = (await (await page.request.get('/api/v1/invoices?pageSize=1')).json()).data;
  await page.goto(`/hoa-don/${invoices[0].id}`);
  await expect(page.locator('.invoice-sheet')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
