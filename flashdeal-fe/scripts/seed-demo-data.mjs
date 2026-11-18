#!/usr/bin/env node
/*
  Seeds categories, products (with licensed photos from Wikimedia Commons) and flash sale
  campaigns through the public API, logged in as the admin account.

    node scripts/seed-demo-data.mjs [--api http://localhost:8090/api] [--skip-images] [--only-campaigns]

  Photos are saved to public/images/products/<slug>.jpg and listed with author and licence in
  public/images/products/credits.json (shown on the /nguon-anh page).
*/
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const API = arg('--api', process.env.SEED_API || 'http://localhost:8090/api');
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@flashdeal.vn';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const SKIP_IMAGES = args.includes('--skip-images');
const ONLY_CAMPAIGNS = args.includes('--only-campaigns');

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IMG_DIR = path.join(ROOT, 'public', 'images', 'products');
const CREDITS_FILE = path.join(IMG_DIR, 'credits.json');
const UA = 'FlashDealDemoSeed/1.0 (local demo data)';

const CATEGORIES = [
  { name: 'MacBook', slug: 'macbook', displayOrder: 1 },
  { name: 'iPhone', slug: 'iphone', displayOrder: 2 },
  { name: 'iPad', slug: 'ipad', displayOrder: 3 },
  { name: 'iMac và Mac mini', slug: 'imac-mac-mini', displayOrder: 4 },
  { name: 'Apple Watch', slug: 'apple-watch', displayOrder: 5 },
  { name: 'Tai nghe và loa', slug: 'tai-nghe-loa', displayOrder: 6 },
  { name: 'Màn hình', slug: 'man-hinh', displayOrder: 7 },
  { name: 'Phụ kiện', slug: 'phu-kien', displayOrder: 8 },
];

// q: Commons search words; pick: index among raster results when the first is a poor fit.
// Photos already in public/images/products are kept, so re-running never replaces a reviewed photo.
const PRODUCTS = [
  // MacBook
  { cat: 'macbook', name: 'MacBook Air 13 inch M2 8GB 256GB', price: 18990000, stock: 60, q: 'M2 Macbook Air Midnight model', desc: 'Chip Apple M2 8 nhân CPU, 8 nhân GPU. Màn hình Liquid Retina 13,6 inch, sạc MagSafe 3, pin tới 18 giờ, nặng 1,24 kg.' },
  { cat: 'macbook', name: 'MacBook Air 13 inch M2 Starlight 16GB 512GB', price: 27490000, stock: 35, q: 'M2 Macbook Air Starlight model', desc: 'Bản RAM 16GB, SSD 512GB cho người làm ảnh và lập trình. Màn hình 13,6 inch, bàn phím Magic Keyboard có Touch ID.' },
  { cat: 'macbook', name: 'MacBook Air 13 inch M1 8GB 256GB', price: 16490000, stock: 80, q: 'MacBook Air M1 2020', desc: 'Chip Apple M1, không quạt tản nhiệt nên chạy im lặng. Màn hình Retina 13,3 inch, pin tới 18 giờ.' },
  { cat: 'macbook', name: 'MacBook Pro 14 inch M3 Pro 18GB 512GB', price: 49990000, stock: 25, q: 'MacBook Pro 14 inch 2023', desc: 'Chip M3 Pro 11 nhân CPU. Màn hình Liquid Retina XDR 14,2 inch 120Hz, cổng HDMI, khe thẻ SD, pin tới 18 giờ.' },
  { cat: 'macbook', name: 'MacBook Pro 16 inch M2 Max 32GB 1TB', price: 69990000, stock: 12, q: 'Apple MacBook Pro 16 M2 Max', desc: 'Chip M2 Max 12 nhân CPU, 38 nhân GPU cho dựng phim và đồ họa 3D. Màn hình XDR 16,2 inch, 3 cổng Thunderbolt 4.' },

  // iPhone
  { cat: 'iphone', name: 'iPhone 15 Pro 128GB Titan tự nhiên', price: 24990000, stock: 70, q: 'Apple iPhone 15 Pro', desc: 'Khung titan, chip A17 Pro, camera chính 48MP, cổng USB-C hỗ trợ USB 3. Nút Tác vụ thay cho cần gạt im lặng.' },
  { cat: 'iphone', name: 'iPhone 15 128GB', price: 19290000, stock: 90, q: 'iPhone 15 pink', desc: 'Dynamic Island, camera chính 48MP, chip A16 Bionic và cổng USB-C. Mặt lưng kính pha màu.' },
  { cat: 'iphone', name: 'iPhone 14 128GB', price: 15990000, stock: 75, q: 'iPhone 14 smartphone', desc: 'Chip A15 Bionic 5 nhân GPU, camera kép 12MP, tính năng Phát hiện va chạm và SOS khẩn cấp qua vệ tinh.' },
  { cat: 'iphone', name: 'iPhone 13 128GB', price: 12990000, stock: 100, q: 'iPhone 13 smartphone', desc: 'Chip A15 Bionic, màn hình Super Retina XDR 6,1 inch, chế độ Điện ảnh quay video xóa phông.' },
  { cat: 'iphone', name: 'iPhone SE 2022 64GB', price: 9490000, stock: 50, q: 'iPhone SE 3rd generation', desc: 'Thân máy nhỏ 4,7 inch với nút Home Touch ID, chip A15 Bionic và kết nối 5G.' },

  // iPad
  { cat: 'ipad', name: 'iPad Pro 11 inch M2 Wi-Fi 128GB', price: 21990000, stock: 40, q: 'iPad Pro 11 inch 2022', desc: 'Chip M2, màn hình Liquid Retina 120Hz ProMotion, hỗ trợ Apple Pencil 2 với tính năng di bút.' },
  { cat: 'ipad', name: 'iPad Air 5 M1 Wi-Fi 64GB', price: 13990000, stock: 55, q: 'iPad Air 5th generation', desc: 'Chip M1, màn hình 10,9 inch, Touch ID trên nút nguồn, cổng USB-C và hỗ trợ Magic Keyboard.' },
  { cat: 'ipad', name: 'iPad mini 6 Wi-Fi 64GB', price: 11990000, stock: 45, q: 'iPad mini 6th generation', desc: 'Màn hình 8,3 inch cầm một tay, chip A15 Bionic, cổng USB-C và Apple Pencil 2.' },
  { cat: 'ipad', name: 'iPad Gen 10 Wi-Fi 64GB', price: 8990000, stock: 85, q: 'iPad 10th generation', desc: 'Màn hình Liquid Retina 10,9 inch, chip A14 Bionic, camera trước đặt ở cạnh ngang cho gọi video.' },

  // iMac và Mac mini
  { cat: 'imac-mac-mini', name: 'iMac 24 inch M1 8GB 256GB', price: 29990000, stock: 20, q: 'iMac M1 2021 desktop computer', desc: 'Màn hình Retina 4.5K 24 inch, thân máy dày 11,5 mm, camera 1080p và hệ thống 6 loa.' },
  { cat: 'imac-mac-mini', name: 'Mac mini M2 8GB 256GB', price: 13990000, stock: 40, q: 'Apple Mac mini computer', desc: 'Máy bàn nhỏ gọn chip M2, 2 cổng Thunderbolt 4, HDMI xuất 4K, Wi-Fi 6E.' },
  { cat: 'imac-mac-mini', name: 'Mac Studio M2 Max 32GB 512GB', price: 52990000, stock: 10, q: 'Mac Studio computer', desc: 'Chip M2 Max cho phòng dựng hậu kỳ, 4 cổng Thunderbolt 4, khe SD và cổng 10Gb Ethernet.' },

  // Apple Watch
  { cat: 'apple-watch', name: 'Apple Watch Series 7 GPS 45mm', price: 8490000, stock: 60, q: 'Apple Watch Series 7', desc: 'Màn hình lớn hơn 20% so với Series 6, sạc nhanh từ 0 lên 80% trong 45 phút, đo oxy trong máu và điện tâm đồ.' },
  { cat: 'apple-watch', name: 'Apple Watch Ultra 2 49mm', price: 20990000, stock: 25, q: 'Apple Watch Ultra', desc: 'Vỏ titan 49mm, pin tới 36 giờ, GPS hai tần số và chống nước tới 100 m cho lặn biển giải trí.' },
  { cat: 'apple-watch', name: 'Apple Watch SE 2 GPS 40mm', price: 6290000, stock: 70, q: 'Apple Watch SE second generation', desc: 'Phát hiện té ngã và va chạm, theo dõi giấc ngủ, chống nước 50 m. Lựa chọn dễ tiếp cận nhất.' },

  // Tai nghe và loa
  { cat: 'tai-nghe-loa', name: 'AirPods Pro 2 cổng USB-C', price: 5790000, stock: 120, q: 'AirPods Pro 2nd generation', desc: 'Chống ồn chủ động gấp đôi thế hệ trước, chế độ Âm thanh thích ứng, hộp sạc có loa tìm kiếm.' },
  { cat: 'tai-nghe-loa', name: 'AirPods 2', price: 2990000, stock: 90, q: 'AirPods cropped', desc: 'Chip H1 kết nối nhanh với iPhone, gọi Siri bằng giọng nói, pin nghe tới 5 giờ, hộp sạc cho thêm hơn 24 giờ.' },
  { cat: 'tai-nghe-loa', name: 'AirPods Max', price: 12990000, stock: 20, q: 'AirPods Max headphones', desc: 'Tai nghe chụp tai khung thép, đệm vải lưới, chống ồn chủ động và núm Digital Crown.' },
  { cat: 'tai-nghe-loa', name: 'Sony WH-1000XM3', price: 4990000, stock: 40, q: 'Sony-WH-1000XM3 kabellose', desc: 'Chống ồn chủ động với chip QN1, pin 30 giờ, sạc nhanh 10 phút nghe 5 giờ, điều khiển cảm ứng trên chụp tai.' },
  { cat: 'tai-nghe-loa', name: 'Loa Marshall Stanmore II', price: 8490000, stock: 35, q: 'Marshall Speaker', desc: 'Loa để bàn bluetooth, núm chỉnh âm trầm và âm cao trên mặt loa, kết nối Bluetooth 5.0 và cổng 3,5 mm.' },

  // Màn hình
  { cat: 'man-hinh', name: 'Apple Studio Display 27 inch', price: 39990000, stock: 10, q: 'Apple Studio Display', desc: 'Màn hình Retina 5K 27 inch, camera 12MP có Trung tâm màn hình, sáu loa và cổng Thunderbolt 3.' },
  { cat: 'man-hinh', name: 'LG UltraFine 5K 27 inch', price: 29990000, stock: 8, q: 'LG UltraFine 5K display', desc: 'Màn hình 5K độ phân giải 5120 x 2880, kết nối Thunderbolt 3 một dây với MacBook.' },

  // Phụ kiện
  { cat: 'phu-kien', name: 'Magic Keyboard Touch ID', price: 3790000, stock: 50, q: 'Apple Magic Keyboard', desc: 'Bàn phím không dây có Touch ID cho Mac chip Apple, sạc qua cổng Lightning, pin dùng khoảng một tháng.' },
  { cat: 'phu-kien', name: 'Magic Mouse', price: 2190000, stock: 60, q: 'Apple Magic Mouse', desc: 'Chuột không dây mặt cảm ứng đa điểm, vuốt chuyển trang và cuộn mượt trên macOS.' },
  { cat: 'phu-kien', name: 'Apple Pencil 2', price: 2990000, stock: 70, q: 'Apple Pencil second generation', desc: 'Gắn nam châm vào cạnh iPad để sạc và ghép đôi, chạm hai lần để đổi công cụ vẽ.' },
  { cat: 'phu-kien', name: 'AirTag 1 cái', price: 790000, stock: 150, q: 'Apple AirTag', desc: 'Định vị đồ vật qua mạng Tìm, tìm chính xác với iPhone có chip U1, pin CR2032 thay được.' },
  { cat: 'phu-kien', name: 'Logitech MX Master 3S', price: 2490000, stock: 45, q: 'Logitech MX Master 3', desc: 'Chuột công thái học, cuộn MagSpeed, cảm biến 8000 DPI dùng được trên kính, kết nối 3 máy.' },
  { cat: 'phu-kien', name: 'Sạc dự phòng Anker 10000mAh', price: 690000, stock: 120, q: 'Anker power bank', desc: 'Dung lượng 10000mAh, sạc nhanh 20W cho iPhone, nhỏ gọn bỏ túi.' },
];

// Flash sale campaigns: offsets in hours from now, products by slug with sale price ratio.
const CAMPAIGNS = [
  {
    title: 'Flash sale cuối tuần',
    startOffsetH: -2,
    endOffsetH: 72,
    items: [
      ['macbook-air-13-inch-m2-8gb-256gb', 0.84, 20],
      ['iphone-15-pro-128gb-titan-tu-nhien', 0.88, 15],
      ['airpods-pro-2-cong-usb-c', 0.79, 40],
      ['ipad-air-5-m1-wi-fi-64gb', 0.83, 18],
      ['apple-watch-series-7-gps-45mm', 0.81, 25],
      ['sony-wh-1000xm3', 0.75, 12],
      ['magic-mouse', 0.82, 30],
      ['mac-mini-m2-8gb-256gb', 0.86, 10],
    ],
  },
  {
    title: 'Giờ vàng iPhone',
    startOffsetH: 26,
    endOffsetH: 30,
    items: [
      ['iphone-15-128gb', 0.87, 20],
      ['iphone-13-128gb', 0.84, 30],
      ['iphone-se-2022-64gb', 0.8, 25],
    ],
  },
];

async function api(method, url, body, token) {
  const res = await fetch(API + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`);
  return json;
}

const stripTags = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function commonsPhoto(query, pick = 0) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '12',
    gsrsearch: query, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '900',
  });
  let json;
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(1500 + attempt * 4000);
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } });
    const text = await res.text();
    try { json = JSON.parse(text); break; } catch { console.warn('commons busy, retrying', query); }
  }
  if (!json) return null;
  const pages = Object.values(json?.query?.pages || {}).sort((a, b) => a.index - b.index);
  const raster = pages.filter((p) => {
    const ii = p.imageinfo?.[0];
    return ii && /image\/(jpeg|png)/.test(ii.mime) && ii.width >= 700;
  });
  const chosen = raster[pick] || raster[0];
  if (!chosen) return null;
  const ii = chosen.imageinfo[0];
  const m = ii.extmetadata || {};
  return {
    title: chosen.title.replace(/^File:/, ''),
    thumb: ii.thumburl,
    page: ii.descriptionurl,
    author: stripTags(m.Artist?.value) || 'Không rõ',
    license: m.LicenseShortName?.value || 'Không rõ',
    licenseUrl: m.LicenseUrl?.value || '',
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, file) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      return;
    }
    await sleep(3000 + attempt * 5000);
  }
  throw new Error(`download failed ${url}`);
}

const toSlug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

async function main() {
  const login = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const token = login.data.accessToken;
  console.log('Logged in as', ADMIN_EMAIL);

  const existingProducts = (await api('GET', '/products?size=200')).data || [];
  const bySlug = new Map(existingProducts.map((p) => [p.slug, p]));

  if (!ONLY_CAMPAIGNS) {
    const existingCats = (await api('GET', '/categories')).data || [];
    const catId = new Map(existingCats.map((c) => [c.slug, c.id]));
    for (const c of CATEGORIES) {
      if (catId.has(c.slug)) continue;
      const res = await api('POST', '/categories', c, token);
      catId.set(c.slug, res.data.id);
      console.log('category', c.slug, res.data.id);
    }

    await mkdir(IMG_DIR, { recursive: true });
    const credits = existsSync(CREDITS_FILE) ? JSON.parse(await readFile(CREDITS_FILE, 'utf8')) : {};

    for (const p of PRODUCTS) {
      const slug = toSlug(p.name);
      const file = path.join(IMG_DIR, `${slug}.jpg`);
      if (!SKIP_IMAGES && !existsSync(file)) {
        const photo = await commonsPhoto(p.q, p.pick || 0);
        if (photo) {
          await download(photo.thumb, file);
          credits[slug] = { product: p.name, ...photo };
          console.log('photo', slug, '<-', photo.title);
        } else {
          console.warn('no photo for', slug);
        }
      }
      if (bySlug.has(slug)) continue;
      const res = await api('POST', '/products', {
        name: p.name,
        slug,
        categoryId: catId.get(p.cat),
        originalPrice: p.price,
        totalStock: p.stock,
        description: p.desc,
        imageUrl: existsSync(file) ? `/images/products/${slug}.jpg` : null,
        status: 'ACTIVE',
      }, token);
      bySlug.set(slug, res.data);
      console.log('product', slug, res.data.id);
    }
    await writeFile(CREDITS_FILE, JSON.stringify(credits, null, 2));
  }

  const existingCampaigns = (await api('GET', '/flash-sales/campaigns')).data || [];
  for (const c of CAMPAIGNS) {
    if (existingCampaigns.some((e) => e.title === c.title && e.status !== 'ENDED')) continue;
    const now = Date.now();
    const created = await api('POST', '/flash-sales/campaigns', {
      title: c.title,
      startTime: localIso(new Date(now + c.startOffsetH * 3600e3)),
      endTime: localIso(new Date(now + c.endOffsetH * 3600e3)),
    }, token);
    const campaignId = created.data.id;
    console.log('campaign', c.title, campaignId, created.data.status);
    for (const [slug, ratio, qty] of c.items) {
      const prod = bySlug.get(slug);
      if (!prod) { console.warn('campaign product missing', slug); continue; }
      const original = Number(prod.originalPrice);
      const sale = Math.round((original * ratio) / 10000) * 10000 - 10000;
      await api('POST', `/flash-sales/campaigns/${campaignId}/products`, {
        productId: prod.id,
        productName: prod.name,
        originalPrice: original,
        flashSalePrice: sale,
        flashSaleStock: qty,
      }, token);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
