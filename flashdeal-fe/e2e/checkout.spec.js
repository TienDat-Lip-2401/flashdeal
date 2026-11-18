import { test, expect } from '@playwright/test';
import { API, CUSTOMER, apiLogin, login, watchConsole } from './helpers';

/* Picks a product in the live campaign that the customer has not bought yet. */
async function freshDeal(request) {
  const token = await apiLogin(request, CUSTOMER);
  const orders = (await (await request.get(`${API}/flash-sales/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })).json()).data ?? [];
  const taken = new Set(orders.filter((o) => o.status !== 'CANCELLED').flatMap((o) => o.items.map((i) => i.productId)));
  const live = ((await (await request.get(`${API}/flash-sales/campaigns/active`)).json()).data ?? [])[0];
  const products = (await (await request.get(`${API}/products?size=200`)).json()).data;
  const line = live.products.find((l) => !taken.has(l.productId) && l.availableStock > 0);
  test.skip(!line, 'khách mẫu đã mua hết các sản phẩm trong đợt đang mở');
  return { line, product: products.find((p) => p.id === line.productId) };
}

test.describe('Đặt suất flash sale', () => {
  test('khách chưa đăng nhập được đưa tới đăng nhập rồi quay lại sản phẩm', async ({ page, request }) => {
    const { product } = await freshDeal(request);
    await page.goto(`/san-pham/${product.slug}`);
    await page.getByRole('button', { name: 'Mua giá flash sale' }).click();
    await expect(page).toHaveURL(/\/dang-nhap/);
    await expect(page.getByText('Đăng nhập để đặt suất flash sale')).toBeVisible();
    await page.getByLabel('Email').fill(CUSTOMER.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(CUSTOMER.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(new RegExp(`/san-pham/${product.slug}$`));
  });

  test('đăng nhập sai báo lỗi dễ hiểu', async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByLabel('Email').fill(CUSTOMER.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email hoặc mật khẩu chưa đúng.');
  });

  test('đặt suất, thanh toán thử và đơn chuyển sang đã thanh toán', async ({ page, request }) => {
    const con = watchConsole(page);
    const { product } = await freshDeal(request);
    await login(page);
    await page.goto(`/san-pham/${product.slug}`);
    await page.getByRole('button', { name: 'Mua giá flash sale' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Đặt suất flash sale' })).toBeVisible();
    // validation errors under their own fields
    await dialog.getByLabel('Họ tên người nhận').fill('');
    await dialog.getByLabel('Số điện thoại').fill('123');
    await dialog.getByLabel('Địa chỉ nhận hàng').fill('');
    await dialog.getByRole('button', { name: /^Đặt suất giá/ }).click();
    await expect(dialog.getByText('Nhập họ tên người nhận hàng.')).toBeVisible();
    await expect(dialog.getByText(/Nhập số điện thoại 10 số/)).toBeVisible();

    await dialog.getByLabel('Họ tên người nhận').fill('Nguyễn Văn Khách');
    await dialog.getByLabel('Số điện thoại').fill('0912345678');
    await dialog.getByLabel('Địa chỉ nhận hàng').fill('12 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội');
    await dialog.getByRole('button', { name: /^Đặt suất giá/ }).click();

    await expect(page).toHaveURL(/\/tai-khoan\/don-hang\/[A-Z0-9-]+$/, { timeout: 15_000 });
    await expect(page.getByText('Chờ thanh toán').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeVisible();

    await page.getByRole('button', { name: /Thanh toán thử/ }).click();
    await expect(async () => {
      await page.reload();
      await expect(page.getByText('Đã thanh toán').first()).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    con.expectClean([/404/]);
  });

  test('bấm đặt hai lần liên tiếp chỉ tạo một đơn', async ({ page, request }) => {
    const { product, line } = await freshDeal(request);
    await login(page);
    const token = await apiLogin(request, CUSTOMER);
    const before = ((await (await request.get(`${API}/flash-sales/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })).json()).data ?? []).length;

    await page.goto(`/san-pham/${product.slug}`);
    await page.getByRole('button', { name: 'Mua giá flash sale' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Họ tên người nhận').fill('Nguyễn Văn Khách');
    await dialog.getByLabel('Số điện thoại').fill('0912345678');
    await dialog.getByLabel('Địa chỉ nhận hàng').fill('12 Đường Láng, Quận Đống Đa, Hà Nội');
    const submit = dialog.getByRole('button', { name: /^Đặt suất giá/ });
    await submit.dblclick();
    await expect(page).toHaveURL(/\/tai-khoan\/don-hang\//, { timeout: 15_000 });

    await expect(async () => {
      const after = ((await (await request.get(`${API}/flash-sales/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })).json()).data ?? []).length;
      expect(after).toBe(before + 1);
    }).toPass({ timeout: 15_000 });

    // tidy up: cancel so the unit goes back to the campaign
    await expect(page.getByRole('button', { name: 'Hủy đơn này' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Hủy đơn này' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Hủy đơn', exact: true }).click();
    await expect(page.getByText('Đã hủy').first()).toBeVisible({ timeout: 15_000 });
    expect(line.productId).toBe(product.id);
  });

  test('danh sách đơn lọc theo trạng thái', async ({ page }) => {
    await login(page);
    await page.goto('/tai-khoan/don-hang');
    await expect(page.getByRole('heading', { level: 1, name: 'Đơn hàng của tôi' })).toBeVisible();
    await page.getByRole('tab', { name: /Đã hủy/ }).click();
    await expect(page).toHaveURL(/trang-thai=CANCELLED/);
  });
});
