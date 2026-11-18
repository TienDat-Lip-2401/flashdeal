import { test, expect } from '@playwright/test';
import { ADMIN, login, watchConsole } from './helpers';

test.describe('Quản trị', () => {
  test('khách thường không vào được trang quản trị', async ({ page }) => {
    await login(page);
    await page.goto('/quan-tri');
    await expect(page.getByRole('heading', { name: 'Bạn không có quyền vào trang quản trị' })).toBeVisible();
  });

  test('quản trị viên xem tổng quan, đơn hàng, flash sale, sản phẩm, danh mục', async ({ page }) => {
    const con = watchConsole(page);
    await login(page, ADMIN);
    await page.goto('/quan-tri');
    await expect(page.getByRole('heading', { level: 1, name: 'Tổng quan' })).toBeVisible();
    await expect(page.getByText('Doanh thu đã thanh toán')).toBeVisible();

    await page.getByRole('navigation', { name: 'Quản trị' }).getByRole('link', { name: 'Đơn hàng' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Đơn hàng' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Quản trị' }).getByRole('link', { name: 'Flash sale' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Flash sale cuối tuần' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Quản trị' }).getByRole('link', { name: 'Sản phẩm' }).click();
    await expect(page.getByRole('row')).not.toHaveCount(1);

    await page.getByRole('navigation', { name: 'Quản trị' }).getByRole('link', { name: 'Danh mục' }).click();
    await expect(page.getByRole('cell', { name: 'MacBook', exact: true })).toBeVisible();
    con.expectClean();
  });

  test('form sản phẩm báo lỗi khi thiếu dữ liệu', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/quan-tri/san-pham');
    await page.getByRole('button', { name: 'Thêm sản phẩm' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Thêm sản phẩm' }).click();
    await expect(page.getByText('Nhập tên sản phẩm.')).toBeVisible();
    await expect(page.getByText('Chọn danh mục.')).toBeVisible();
  });
});
