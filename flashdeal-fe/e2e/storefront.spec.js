import { test, expect } from '@playwright/test';
import { expectImagesLoaded, expectNoHorizontalScroll, watchConsole } from './helpers';

test.describe('Cửa hàng', () => {
  test('trang chủ hiển thị flash sale, danh mục và sản phẩm', async ({ page }) => {
    const con = watchConsole(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/FlashDeal/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flash sale đang mở' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mua theo dòng sản phẩm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'MacBook', exact: true })).toBeVisible();
    // one h1 only
    await expect(page.locator('h1')).toHaveCount(1);
    await expectImagesLoaded(page);
    await expectNoHorizontalScroll(page);
    con.expectClean();
  });

  test('trang chủ có thẻ SEO và dữ liệu có cấu trúc', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.locator('meta[name="description"]').first()).toHaveAttribute('content', /MacBook/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join(' ')).toContain('"@type":"WebSite"');
  });

  test('robots.txt và sitemap.xml truy cập được', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap:');
    const sitemap = await request.get('/sitemap.xml');
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/san-pham/');
  });

  test('trang danh mục lọc theo giá và giữ bộ lọc trên URL', async ({ page }) => {
    const con = watchConsole(page);
    await page.goto('/danh-muc/iphone');
    await expect(page.getByRole('heading', { level: 1, name: 'iPhone' })).toBeVisible();
    await expect(page.locator('article')).not.toHaveCount(0);
    await page.getByLabel('Khoảng giá').selectOption('15000000-30000000');
    await expect(page).toHaveURL(/gia=15000000-30000000/);
    const prices = await page.locator('article p.text-lg').allTextContents();
    expect(prices.length).toBeGreaterThan(0);
    await page.getByLabel('Sắp xếp').selectOption('price-asc');
    await expect(page).toHaveURL(/sort=price-asc/);
    con.expectClean();
  });

  test('ô tìm kiếm gợi ý và mở trang kết quả', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('combobox').first();
    await box.fill('macbook');
    await expect(page.getByRole('option').first()).toBeVisible();
    await box.press('Enter');
    await expect(page).toHaveURL(/\/tim-kiem\?q=macbook/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('macbook');
    await expect(page.locator('article')).not.toHaveCount(0);
  });

  test('trang sản phẩm có giá, JSON-LD Product và breadcrumb', async ({ page }) => {
    const con = watchConsole(page);
    await page.goto('/san-pham/macbook-air-13-inch-m2-8gb-256gb');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('MacBook Air 13 inch M2 8GB 256GB');
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('MacBook');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/san-pham\/macbook-air-13-inch-m2-8gb-256gb$/);
    await expect(page).toHaveTitle(/MacBook Air 13 inch M2/);
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(' ');
    expect(ld).toContain('"@type":"Product"');
    expect(ld).toContain('"priceCurrency":"VND"');
    await expect(page.getByRole('button', { name: 'Mua giá flash sale' })).toBeVisible();
    await expectImagesLoaded(page);
    con.expectClean();
  });

  test('trang flash sale liệt kê đợt đang mở và sắp mở', async ({ page }) => {
    await page.goto('/flash-sale');
    await expect(page.getByRole('heading', { level: 1, name: /Lịch flash sale/ })).toBeVisible();
    await expect(page.getByText('Đang mở bán')).toBeVisible();
    await expect(page.getByText('Sắp mở bán')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chưa mở bán' }).first()).toBeDisabled();
  });

  test('đường dẫn sai hiện trang 404 có noindex', async ({ page }) => {
    await page.goto('/san-pham/khong-ton-tai-123');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang này' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').last()).toHaveAttribute('content', /noindex/);
  });

  test('trang nguồn ảnh liệt kê giấy phép', async ({ page }) => {
    await page.goto('/nguon-anh');
    await expect(page.getByRole('row')).not.toHaveCount(1);
    await expect(page.getByRole('cell', { name: /CC BY/ }).first()).toBeVisible();
  });
});
