import { test, expect } from '@playwright/test';
import { expectNoHorizontalScroll, watchConsole } from './helpers';

test.describe('Điện thoại', () => {
  for (const path of ['/', '/flash-sale', '/danh-muc/macbook', '/san-pham/iphone-15-pro-128gb-titan-tu-nhien', '/dang-nhap']) {
    test(`không tràn ngang: ${path}`, async ({ page }) => {
      const con = watchConsole(page);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page);
      con.expectClean();
    });
  }

  test('menu danh mục mở toàn màn hình và dẫn tới danh mục', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mở danh mục' }).click();
    const menu = page.getByRole('dialog', { name: 'Danh mục' });
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'iPad', exact: true }).click();
    await expect(page).toHaveURL(/\/danh-muc\/ipad/);
    await expect(menu).toBeHidden();
  });

  test('nút và liên kết chính đủ lớn để chạm', async ({ page }) => {
    await page.goto('/san-pham/iphone-15-pro-128gb-titan-tu-nhien');
    const box = await page.getByRole('button', { name: 'Mua giá flash sale' }).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
