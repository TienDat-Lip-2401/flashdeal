import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Seo, breadcrumbLd } from '../lib/seo';
import { useFlashSale } from '../lib/queries';
import { discountPercent, formatPrice, formatShortTime } from '../lib/format';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Countdown } from '../components/ui/Countdown';
import { ProductImage } from '../components/ui/ProductImage';
import { StockBar } from '../components/ui/StockBar';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useBuyFlow } from '../components/BuyFlow';

function DealRow({ campaign, line, onBuy }) {
  const p = line.product;
  const pct = discountPercent(line.originalPrice, line.flashSalePrice);
  const live = campaign.state === 'live';
  const soldOut = line.availableStock <= 0;
  const name = p?.name ?? line.productName;

  return (
    <article className="card lift group relative flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-white p-4">
        <ProductImage src={p?.imageUrl} alt={name} className="zoom-img h-full w-full object-contain" />
        {pct > 0 && <span className="badge absolute left-3 top-3 bg-sale text-white">-{pct}%</span>}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4">
        <h3 className="line-clamp-2 min-h-[2.75em] text-[15px] font-semibold leading-snug">
          {p ? (
            <Link to={`/san-pham/${p.slug}`} className="after:absolute after:inset-0">
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>
        <p className="mt-2 text-lg font-bold text-sale">{formatPrice(line.flashSalePrice)}</p>
        <p className="text-sm text-muted line-through">{formatPrice(line.originalPrice)}</p>
        {live ? (
          <StockBar sold={line.flashSaleStock - line.availableStock} total={line.flashSaleStock} className="mt-2" />
        ) : (
          <p className="mt-2 text-xs text-muted">{line.flashSaleStock} suất</p>
        )}
        <button
          type="button"
          onClick={() => onBuy(campaign, line, p)}
          disabled={!live || soldOut}
          className="btn btn-sale btn-sm relative z-10 mt-4 w-full"
        >
          {!live ? 'Chưa mở bán' : soldOut ? 'Hết suất' : 'Mua ngay'}
        </button>
      </div>
    </article>
  );
}

function CampaignBlock({ campaign, onBuy }) {
  const live = campaign.state === 'live';
  return (
    <section aria-labelledby={`c-${campaign.id}`} className={`rounded-3xl p-4 sm:p-6 ${live ? 'bg-sale-soft' : 'bg-surface'}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${live ? 'text-sale' : 'text-warn'}`}>{live ? 'Đang mở bán' : 'Sắp mở bán'}</p>
          <h2 id={`c-${campaign.id}`} className="text-2xl font-bold">
            {campaign.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[15px] text-ink-2">
          {live ? (
            <>
              Kết thúc sau <Countdown to={campaign.endTime} boxed />
            </>
          ) : (
            <>
              Mở sau <Countdown to={campaign.startTime} boxed />
              <span className="hidden text-sm text-muted sm:inline">({formatShortTime(campaign.startTime)})</span>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {campaign.products.map((line) => (
          <DealRow key={line.id} campaign={campaign} line={line} onBuy={onBuy} />
        ))}
      </div>
    </section>
  );
}

export default function FlashSalePage() {
  const sale = useFlashSale();
  const buy = useBuyFlow();
  const crumbs = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Flash sale', to: '/flash-sale' },
  ];
  const campaigns = [...sale.live, ...sale.upcoming].filter((c) => c.products.length);

  return (
    <div className="wrap pb-16">
      <Seo
        title="Lịch flash sale MacBook, iPhone, iPad"
        description="Các đợt flash sale đang mở và sắp mở tại FlashDeal: giá giảm, số suất còn lại và giờ bắt đầu. Mỗi tài khoản mua 1 suất mỗi sản phẩm."
        path="/flash-sale"
        jsonLd={breadcrumbLd(crumbs)}
      />
      <Breadcrumbs items={crumbs} />
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl">
          <Zap className="h-8 w-8 text-sale" aria-hidden="true" /> Lịch flash sale
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] text-ink-2">
          Mỗi đợt mở trong khung giờ cố định với số suất giới hạn. Đặt được suất, hàng được giữ 15 phút để bạn thanh toán.
        </p>
      </div>

      {sale.isError ? (
        <ErrorState />
      ) : sale.isLoading ? (
        <div className="skeleton h-96 rounded-3xl" />
      ) : campaigns.length === 0 ? (
        <EmptyState title="Chưa có đợt flash sale nào" text="Đợt mới sẽ hiện ở đây ngay khi được lên lịch." action={{ label: 'Xem sản phẩm', to: '/' }} />
      ) : (
        <div className="space-y-8">
          {campaigns.map((c) => (
            <CampaignBlock key={c.id} campaign={c} onBuy={buy.start} />
          ))}
        </div>
      )}
      {buy.dialog}
    </div>
  );
}
