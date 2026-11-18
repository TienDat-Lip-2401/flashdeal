import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CreditCard, RotateCcw, ShieldCheck, Timer, Zap } from 'lucide-react';
import { Seo, absoluteUrl, breadcrumbLd } from '../lib/seo';
import { shopApi, useFlashSale } from '../lib/queries';
import { discountPercent, formatPrice, formatShortTime, parseDate } from '../lib/format';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Countdown } from '../components/ui/Countdown';
import { ProductCard, ProductGrid } from '../components/ui/ProductCard';
import { ProductImage } from '../components/ui/ProductImage';
import { StockBar } from '../components/ui/StockBar';
import { ErrorState, SectionHeading } from '../components/ui/States';
import { useBuyFlow } from '../components/BuyFlow';
import NotFoundPage from './NotFoundPage';

function OfferBox({ offer, product, onBuy }) {
  if (!offer) {
    return (
      <div className="rounded-2xl border border-line p-5">
        <p className="text-sm text-muted">Giá niêm yết</p>
        <p className="mt-1 text-3xl font-bold">{formatPrice(product.originalPrice)}</p>
        <p className="mt-3 text-[15px] text-ink-2">
          Sản phẩm này chưa có suất flash sale. FlashDeal chỉ nhận đặt hàng trong các đợt flash sale.
        </p>
        <Link to="/flash-sale" className="btn btn-dark mt-4 w-full sm:w-auto">
          Xem lịch flash sale
        </Link>
      </div>
    );
  }

  const { campaign, line } = offer;
  const pct = discountPercent(line.originalPrice, line.flashSalePrice);
  const soldOut = line.availableStock <= 0;
  const live = campaign.state === 'live';

  return (
    <div className={`overflow-hidden rounded-2xl border ${live ? 'border-sale/30' : 'border-line'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${live ? 'bg-sale text-white' : 'bg-ink text-white'}`}>
        <p className="flex items-center gap-1.5 font-semibold">
          <Zap className="h-4 w-4" aria-hidden="true" /> {campaign.title}
        </p>
        <p className="flex items-center gap-2 text-sm">
          {live ? (
            <>
              Kết thúc sau <Countdown to={campaign.endTime} className="font-semibold" />
            </>
          ) : (
            <>Mở lúc {formatShortTime(campaign.startTime)}</>
          )}
        </p>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-bold text-sale">{formatPrice(line.flashSalePrice)}</p>
          <p className="text-lg text-muted line-through">{formatPrice(line.originalPrice)}</p>
          {pct > 0 && <span className="badge bg-sale-soft text-sale">Giảm {pct}%</span>}
        </div>
        {live && <StockBar sold={line.flashSaleStock - line.availableStock} total={line.flashSaleStock} className="mt-4" />}
        <button
          type="button"
          className="btn btn-sale mt-5 w-full"
          disabled={!live || soldOut}
          onClick={() => onBuy(campaign, line, product)}
        >
          {!live ? `Mở bán lúc ${formatShortTime(campaign.startTime)}` : soldOut ? 'Đã hết suất flash sale' : 'Mua giá flash sale'}
        </button>
        <p className="mt-3 text-center text-sm text-muted">Mỗi tài khoản mua 1 suất · Giá niêm yết {formatPrice(product.originalPrice)}</p>
      </div>
    </div>
  );
}

const FACTS = [
  { icon: Timer, text: 'Giữ hàng 15 phút sau khi đặt suất' },
  { icon: CreditCard, text: 'Thanh toán qua VNPay bằng thẻ hoặc ứng dụng ngân hàng' },
  { icon: RotateCcw, text: 'Hủy đơn chưa thanh toán, suất được trả lại ngay' },
  { icon: ShieldCheck, text: 'Kiểm tra trạng thái đơn trong mục đơn hàng' },
];

export default function ProductPage() {
  const { slug } = useParams();
  const product = useQuery({ queryKey: ['product', slug], queryFn: () => shopApi.productBySlug(slug), retry: (n, e) => e?.status !== 404 && n < 2 });
  const summary = useQuery({
    queryKey: ['product-summary', product.data?.id],
    queryFn: () => shopApi.productSummary(product.data.id),
    enabled: Boolean(product.data?.id),
  });
  const sale = useFlashSale();
  const buy = useBuyFlow();

  if (product.isLoading) {
    return (
      <div className="wrap grid gap-10 py-10 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }
  if (product.isError && (product.error?.status === 404 || product.error?.status === 400)) return <NotFoundPage />;
  if (product.isError || !product.data) {
    return (
      <div className="wrap py-16">
        <ErrorState onRetry={() => product.refetch()} />
      </div>
    );
  }

  const p = product.data;
  const offer = sale.offers.get(p.id);
  const related = (summary.data?.relatedProducts ?? []).filter((r) => r.id !== p.id).slice(0, 5);
  const crumbs = [
    { label: 'Trang chủ', to: '/' },
    ...(p.category ? [{ label: p.category.name, to: `/danh-muc/${p.category.slug}` }] : []),
    { label: p.name, to: `/san-pham/${p.slug}` },
  ];
  const liveLine = offer?.campaign.state === 'live' ? offer.line : null;
  const price = liveLine ? liveLine.flashSalePrice : p.originalPrice;
  const description = `${p.name} chính hãng, giá ${formatPrice(price)}. ${p.description ?? ''}`.slice(0, 158);

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.imageUrl ? [absoluteUrl(p.imageUrl)] : undefined,
    description: p.description,
    sku: String(p.id),
    category: p.category?.name,
    brand: { '@type': 'Brand', name: /sony/i.test(p.name) ? 'Sony' : /logitech/i.test(p.name) ? 'Logitech' : /marshall/i.test(p.name) ? 'Marshall' : /anker/i.test(p.name) ? 'Anker' : /lg /i.test(p.name) ? 'LG' : 'Apple' },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/san-pham/${p.slug}`),
      priceCurrency: 'VND',
      price: Math.round(Number(price)),
      availability: liveLine && liveLine.availableStock <= 0 ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      ...(liveLine ? { priceValidUntil: parseDate(offer.campaign.endTime)?.toISOString().slice(0, 10) } : {}),
    },
  };

  return (
    <div className="wrap pb-16">
      <Seo title={p.name} description={description} path={`/san-pham/${p.slug}`} image={p.imageUrl} type="product" jsonLd={[productLd, breadcrumbLd(crumbs)]} />
      <Breadcrumbs items={crumbs} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-surface p-4 sm:aspect-square sm:p-10 lg:sticky lg:top-36 lg:self-start">
          <ProductImage src={p.imageUrl} alt={p.name} loading="eager" fetchPriority="high" className="h-full w-full rounded-2xl object-contain mix-blend-multiply" />
        </div>

        <div>
          {p.category && (
            <Link to={`/danh-muc/${p.category.slug}`} className="text-sm font-medium text-brand hover:underline underline-offset-4">
              {p.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-[28px] font-bold leading-tight sm:text-4xl">{p.name}</h1>

          <div className="mt-6">
            <OfferBox offer={offer} product={p} onBuy={buy.start} />
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {FACTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-ink-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <section aria-labelledby="mo-ta" className="mt-8">
            <h2 id="mo-ta" className="text-xl font-bold">
              Điểm chính của {p.name}
            </h2>
            <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{p.description}</p>
          </section>

          {offer?.campaign.state === 'upcoming' && (
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Hãy đăng nhập trước giờ mở bán để đặt suất nhanh hơn.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="lien-quan" className="mt-16">
          <SectionHeading
            id="lien-quan"
            title={`${p.category?.name ?? 'Sản phẩm'} khác`}
            action={p.category ? { to: `/danh-muc/${p.category.slug}`, label: `Xem tất cả ${p.category.name}` } : undefined}
          />
          <ProductGrid>
            {related.map((r) => (
              <ProductCard key={r.id} product={r} offer={sale.offers.get(r.id)} />
            ))}
          </ProductGrid>
        </section>
      )}
      {buy.dialog}
    </div>
  );
}
