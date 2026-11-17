import { test, expect } from '@playwright/test';

for (const role of ['MANAGER', 'STAFF']) {
  test(`${role} login, profile and logout`, async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByLabel('Email', { exact: true }).fill(process.env[`SEED_${role}_EMAIL`]);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env[`SEED_${role}_PASSWORD`]);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    expect(await page.context().cookies()).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'sales_session' })]));
  });
}

test('mobile login and keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/dang-nhap');
  await page.getByLabel('Email', { exact: true }).focus();
  await page.keyboard.type(process.env.SEED_STAFF_EMAIL);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeFocused();
  await page.keyboard.type(process.env.SEED_STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
