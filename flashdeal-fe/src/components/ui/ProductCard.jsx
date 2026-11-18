import { Link } from 'react-router-dom';
import { discountPercent, formatPrice } from '../../lib/format';
import { ProductImage } from './ProductImage';
import { StockBar } from './StockBar';

/*
  One card for every product listing. `offer` is an optional { campaign, line } from useFlashSale;
  a live offer shows the sale price and the stock left, an upcoming one shows when it opens.
*/
export function ProductCard({ product, offer, headingLevel = 3 }) {
  const live = offer?.campaign.state === 'live' ? offer.line : null;
  const upcoming = offer?.campaign.state === 'upcoming' ? offer : null;
  const price = live ? live.flashSalePrice : product.originalPrice;
  const pct = live ? discountPercent(live.originalPrice, live.flashSalePrice) : 0;
  const soldOut = live && live.availableStock <= 0;
  const Heading = `h${headingLevel}`;

  return (
    <article className="card lift group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-white p-4">
        <ProductImage src={product.imageUrl} alt={product.name} className="zoom-img h-full w-full object-contain" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {pct > 0 && <span className="badge bg-sale text-white">-{pct}%</span>}
          {upcoming && <span className="badge bg-warn-soft text-warn">Sắp mở bán</span>}
          {soldOut && <span className="badge bg-surface-2 text-ink-2">Hết suất</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4">
        {product.category?.name && <p className="text-xs text-muted">{product.category.name}</p>}
        <Heading className="line-clamp-2 min-h-[2.75em] text-[15px] font-semibold leading-snug text-ink">
          <Link to={`/san-pham/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </Heading>
        <div className="mt-auto pt-1">
          <p className={`text-lg font-bold ${live ? 'text-sale' : 'text-ink'}`}>{formatPrice(price)}</p>
          {live ? (
            <p className="text-sm text-muted line-through">{formatPrice(live.originalPrice)}</p>
          ) : (
            <p className="text-sm text-transparent select-none" aria-hidden="true">.</p>
          )}
          {live && <StockBar sold={live.flashSaleStock - live.availableStock} total={live.flashSaleStock} className="mt-2" />}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="aspect-square p-4">
        <div className="skeleton h-full w-full" />
      </div>
      <div className="space-y-2 px-4 pb-4">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton mt-3 h-5 w-24" />
      </div>
    </div>
  );
}

export function ProductGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${className}`}>{children}</div>
  );
}
