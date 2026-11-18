import { expect } from '@playwright/test';

export const API = process.env.E2E_API_URL || 'http://localhost:8090/api';
export const CUSTOMER = { email: process.env.E2E_CUSTOMER_EMAIL || 'customer@flashdeal.vn', password: process.env.E2E_CUSTOMER_PASSWORD || 'Password@123' };
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@flashdeal.vn', password: process.env.E2E_ADMIN_PASSWORD || 'Admin@123' };

/* Fails the test on any console error or uncaught exception the page raises. */
export function watchConsole(page) {
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return {
    problems,
    expectClean: (ignore = []) => {
      const left = problems.filter((p) => !ignore.some((re) => re.test(p)));
      expect(left, left.join('\n')).toEqual([]);
    },
  };
}

export async function login(page, user = CUSTOMER) {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/dang-nhap/);
  await expect(page.locator('header button[aria-haspopup="menu"]')).toBeVisible();
}

export async function apiLogin(request, user) {
  const res = await request.post(`${API}/auth/login`, { data: user });
  return (await res.json()).data.accessToken;
}

/* Every <img> that finished loading has real pixels (no broken product photos). */
export async function expectImagesLoaded(page) {
  await page.waitForLoadState('networkidle');
  const broken = await page.$$eval('img', (imgs) =>
    imgs.filter((i) => i.complete && i.loading !== 'lazy' && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  );
  expect(broken, `broken images: ${broken.join(', ')}`).toEqual([]);
}

export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
