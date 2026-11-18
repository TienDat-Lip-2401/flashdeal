#!/usr/bin/env node
/*
  Writes public/sitemap.xml (home, flash sale, every category and every active product) and
  points public/robots.txt at it, using the site's public URL.

    SITE_URL=https://flashdeal.vn node scripts/generate-sitemap.mjs [--api http://localhost:8090/api]
*/
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const API = args.includes('--api') ? args[args.indexOf('--api') + 1] : process.env.VITE_API_GATEWAY_URL || 'http://localhost:8090/api';
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const PUBLIC = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'public');

const get = async (url) => (await (await fetch(API + url)).json()).data ?? [];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const day = (v) => (v ? String(v).slice(0, 10) : new Date().toISOString().slice(0, 10));

const [categories, products] = await Promise.all([get('/categories'), get('/products?size=1000&status=ACTIVE')]);

const urls = [
  { loc: '/', changefreq: 'hourly', priority: '1.0' },
  { loc: '/flash-sale', changefreq: 'hourly', priority: '0.9' },
  ...categories.map((c) => ({ loc: `/danh-muc/${c.slug}`, changefreq: 'daily', priority: '0.8' })),
  ...products.map((p) => ({ loc: `/san-pham/${p.slug}`, lastmod: day(p.updatedAt), changefreq: 'daily', priority: '0.7', image: p.imageUrl })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(SITE + u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.image ? `\n    <image:image><image:loc>${esc(/^https?:/.test(u.image) ? u.image : SITE + u.image)}</image:loc></image:image>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>
`;

await writeFile(path.join(PUBLIC, 'sitemap.xml'), xml);
const robotsPath = path.join(PUBLIC, 'robots.txt');
const robots = (await readFile(robotsPath, 'utf8')).replace(/^Sitemap:.*$/m, `Sitemap: ${SITE}/sitemap.xml`);
await writeFile(robotsPath, robots);
console.log(`sitemap.xml: ${urls.length} URLs for ${SITE}`);
