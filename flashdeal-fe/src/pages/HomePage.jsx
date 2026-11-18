import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Seo, SITE_URL, absoluteUrl } from '../lib/seo';
import { useCategories, useFlashSale, useProductIndex } from '../lib/queries';
import { discountPercent, formatPrice, formatShortTime } from '../lib/format';
import { Countdown } from '../components/ui/Countdown';
import { ProductCard, ProductCardSkeleton, ProductGrid } from '../components/ui/ProductCard';
import { ProductImage } from '../components/ui/ProductImage';
import { SectionHeading } from '../components/ui/States';
import { PromiseStrip } from '../components/layout/SiteFooter';

function HeroDeal({ campaign }) {
  const lines = campaign.products.filter((l) => l.product).sort((a, b) => b.originalPrice - a.originalPrice);
  const lead = lines[0];
  if (!lead) return null;
  const pct = discountPercent(lead.originalPrice, lead.flashSalePrice);
  return (
    <Link
      to={`/san-pham/${lead.product.slug}`}
      className="lift group relative grid overflow-hidden rounded-3xl bg-surface md:grid-cols-[1.05fr_1fr] lg:min-h-[420px]"
    >
      <div className="relative z-10 flex flex-col justify-center gap-4 p-6 sm:p-10">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sale px-3 py-1 text-sm font-semibold text-white">
          <Zap className="h-4 w-4" aria-hidden="true" /> {campaign.title}
        </p>
        <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-4xl lg:text-[44px]">
          {lead.product.name} giá flash sale {formatPrice(lead.flashSalePrice)}
        </h1>
        <p className="text-[17px] text-ink-2">
          Giảm {pct}% so với giá niêm yết {formatPrice(lead.originalPrice)}. Còn {lead.availableStock} suất, mỗi tài khoản mua 1 suất.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[15px] text-ink-2">
          <span>Kết thúc sau</span>
          <Countdown to={campaign.endTime} boxed />
        </div>
        <span className="btn btn-sale mt-2 w-fit">
          Mua giá flash sale <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <ProductImage
          src={lead.product.imageUrl}
          alt={lead.product.name}
          loading="eager"
          fetchPriority="high"
          className="zoom-img max-h-[360px] w-full rounded-2xl object-contain mix-blend-multiply"
        />
      </div>
    </Link>
  );
}

function SideTile({ to, eyebrow, title, text, image, alt, tone = 'surface' }) {
  return (
    <Link
      to={to}
      className={`lift group flex items-center gap-4 overflow-hidden rounded-3xl p-5 sm:p-6 ${tone === 'dark' ? 'bg-ink text-white' : 'bg-surface text-ink'}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${tone === 'dark' ? 'text-[#9fd47a]' : 'text-brand'}`}>{eyebrow}</p>
        <p className="mt-1 text-xl font-bold leading-snug">{title}</p>
        <p className={`mt-1 text-sm ${tone === 'dark' ? 'text-white/70' : 'text-muted'}`}>{text}</p>
      </div>
      {image && (
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-white p-2 sm:h-32 sm:w-32">
          <ProductImage src={image} alt={alt} className="zoom-img h-full w-full object-contain" />
        </div>
      )}
    </Link>
  );
}

function CategoryTiles({ categories, byCategory }) {
  return (
    <section aria-labelledby="danh-muc" className="wrap py-10">
      <SectionHeading id="danh-muc" title="Mua theo dòng sản phẩm" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((c) => {
          const sample = byCategory.get(c.id)?.[0];
          return (
            <li key={c.id}>
              <Link to={`/danh-muc/${c.slug}`} className="lift group flex h-full flex-col items-center gap-3 rounded-2xl bg-surface p-4 text-center">
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-white p-2">
                  <ProductImage src={sample?.imageUrl} alt="" className="zoom-img h-full w-full object-contain" />
                </div>
                <span className="text-[15px] font-semibold text-ink">{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function HomePage() {
  const { data: categories = [] } = useCategories();
  const index = useProductIndex();
  const sale = useFlashSale();

  const sortedCats = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const byCategory = new Map();
  for (const p of index.data?.items ?? []) {
    const id = p.category?.id;
    if (!byCategory.has(id)) byCategory.set(id, []);
    byCategory.get(id).push(p);
  }
  for (const list of byCategory.values()) list.sort((a, b) => b.originalPrice - a.originalPrice);

  const live = sale.live[0];
  const next = sale.upcoming[0];
  const liveLines = live?.products.filter((l) => l.product) ?? [];
  const nextLead = next?.products.find((l) => l.product);
  const featuredCat = sortedCats.find((c) => byCategory.get(c.id)?.length) ?? null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FlashDeal',
      url: SITE_URL,
      logo: absoluteUrl('/favicon.svg'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FlashDeal',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/tim-kiem?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <>
      <Seo
        path="/"
        description="Mua MacBook, iPhone, iPad, Apple Watch và phụ kiện giá flash sale theo khung giờ. Giữ hàng 15 phút sau khi đặt, thanh toán qua VNPay."
        jsonLd={jsonLd}
      />

      <section aria-label="Ưu đãi nổi bật" className="wrap pt-5 sm:pt-6">
        {sale.isLoading ? (
          <div className="skeleton h-[420px] rounded-3xl" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            {live && liveLines.length ? (
              <HeroDeal campaign={live} />
            ) : (
              <div className="flex flex-col justify-center gap-4 rounded-3xl bg-surface p-8 sm:p-10 lg:min-h-[420px]">
                <h1 className="text-3xl font-bold sm:text-[44px]">MacBook, iPhone và iPad giá flash sale</h1>
                <p className="text-[17px] text-ink-2">
                  {next ? `Đợt tiếp theo mở lúc ${formatShortTime(next.startTime)}.` : 'Chưa có đợt flash sale nào đang mở. Xem sản phẩm theo dòng máy bên dưới.'}
                </p>
                <Link to="/flash-sale" className="btn btn-dark w-fit">
                  Xem lịch flash sale
                </Link>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {next && nextLead ? (
                <SideTile
                  to="/flash-sale"
                  eyebrow={`Mở lúc ${formatShortTime(next.startTime)}`}
                  title={next.title}
                  text={`${next.products.length} sản phẩm, giá từ ${formatPrice(Math.min(...next.products.map((l) => l.flashSalePrice)))}`}
                  image={nextLead.product.imageUrl}
                  alt={nextLead.product.name}
                  tone="dark"
                />
              ) : (
                <SideTile to="/flash-sale" eyebrow="Lịch mở bán" title="Các đợt flash sale" text="Xem đợt đang mở và đợt sắp tới." tone="dark" />
              )}
              {featuredCat && (
                <SideTile
                  to={`/danh-muc/${featuredCat.slug}`}
                  eyebrow={`${byCategory.get(featuredCat.id).length} mẫu đang bán`}
                  title={featuredCat.name}
                  text={`Giá từ ${formatPrice(Math.min(...byCategory.get(featuredCat.id).map((p) => p.originalPrice)))}`}
                  image={byCategory.get(featuredCat.id)[0]?.imageUrl}
                  alt={featuredCat.name}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {live && liveLines.length > 0 && (
        <section aria-labelledby="flash-sale" className="wrap pt-12">
          <div className="rounded-3xl bg-sale-soft p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 id="flash-sale" className="flex items-center gap-2 text-2xl font-bold text-sale sm:text-[28px]">
                  <Zap className="h-6 w-6" aria-hidden="true" /> Flash sale đang mở
                </h2>
                <div className="flex items-center gap-2 text-[15px] text-ink-2">
                  Kết thúc sau <Countdown to={live.endTime} boxed />
                </div>
              </div>
              <Link to="/flash-sale" className="link text-[15px] font-medium">
                Xem tất cả {live.products.length} sản phẩm
              </Link>
            </div>
            <ProductGrid>
              {liveLines.slice(0, 10).map((l) => (
                <ProductCard key={l.id} product={l.product} offer={{ campaign: live, line: l }} />
              ))}
            </ProductGrid>
          </div>
        </section>
      )}

      {sortedCats.length > 0 && <CategoryTiles categories={sortedCats} byCategory={byCategory} />}

      {index.isLoading ? (
        <div className="wrap py-10">
          <ProductGrid>
            {Array.from({ length: 5 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </ProductGrid>
        </div>
      ) : (
        sortedCats
          .filter((c) => byCategory.get(c.id)?.length)
          .slice(0, 5)
          .map((c) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`} className="wrap py-8">
              <SectionHeading id={`cat-${c.id}`} title={c.name} action={{ to: `/danh-muc/${c.slug}`, label: `Xem tất cả ${c.name}` }} />
              <ProductGrid>
                {byCategory
                  .get(c.id)
                  .slice(0, 5)
                  .map((p) => (
                    <ProductCard key={p.id} product={p} offer={sale.offers.get(p.id)} />
                  ))}
              </ProductGrid>
            </section>
          ))
      )}

      <div className="mt-8">
        <PromiseStrip />
      </div>
    </>
  );
}
