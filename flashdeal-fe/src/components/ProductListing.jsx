import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFlashSale, useProducts } from '../lib/queries';
import { ProductCard, ProductCardSkeleton, ProductGrid } from './ui/ProductCard';
import { EmptyState, ErrorState } from './ui/States';

const PAGE_SIZE = 20;

const SORTS = [
  { value: 'new', label: 'Mới nhất', sortBy: 'createdAt', sortDirection: 'DESC' },
  { value: 'price-asc', label: 'Giá thấp đến cao', sortBy: 'originalPrice', sortDirection: 'ASC' },
  { value: 'price-desc', label: 'Giá cao đến thấp', sortBy: 'originalPrice', sortDirection: 'DESC' },
  { value: 'name', label: 'Tên A đến Z', sortBy: 'name', sortDirection: 'ASC' },
];

const PRICE_RANGES = [
  { value: '', label: 'Mọi mức giá' },
  { value: '0-5000000', label: 'Dưới 5 triệu' },
  { value: '5000000-15000000', label: 'Từ 5 đến 15 triệu' },
  { value: '15000000-30000000', label: 'Từ 15 đến 30 triệu' },
  { value: '30000000-', label: 'Trên 30 triệu' },
];

/* Product list driven by URL params (?sort=&gia=&trang=), so every filtered view has its own link. */
export function ProductListing({ categoryId, keyword, emptyTitle, emptyText }) {
  const [params, setParams] = useSearchParams();
  const sort = SORTS.find((s) => s.value === params.get('sort')) ?? SORTS[0];
  const price = params.get('gia') ?? '';
  const page = Math.max(1, Number(params.get('trang')) || 1);
  const [minPrice, maxPrice] = price.split('-');

  const query = useProducts({
    categoryId,
    keyword: keyword || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    page: page - 1,
    size: PAGE_SIZE,
    sortBy: sort.sortBy,
    sortDirection: sort.sortDirection,
  });
  const sale = useFlashSale();

  const items = query.data?.items ?? [];
  const total = query.data?.meta?.total ?? 0;
  const pages = query.data?.meta?.page_of_number ?? 0;

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('trang' in patch)) next.delete('trang');
    setParams(next);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="text-[15px] text-muted" aria-live="polite">
          {query.isLoading ? 'Đang tải sản phẩm…' : `${total} sản phẩm`}
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="loc-gia">
            Khoảng giá
          </label>
          <select id="loc-gia" value={price} onChange={(e) => update({ gia: e.target.value })} className="field-input min-h-10 w-auto rounded-full py-0 pr-8 text-sm">
            {PRICE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="sap-xep">
            Sắp xếp
          </label>
          <select
            id="sap-xep"
            value={sort.value}
            onChange={(e) => update({ sort: e.target.value === 'new' ? '' : e.target.value })}
            className="field-input min-h-10 w-auto rounded-full py-0 pr-8 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <ProductGrid>
          {Array.from({ length: 10 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </ProductGrid>
      ) : items.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'Không có sản phẩm phù hợp'}
          text={emptyText ?? 'Thử bỏ bớt bộ lọc giá hoặc tìm bằng từ khóa khác.'}
          action={price ? { label: 'Bỏ lọc giá', onClick: () => update({ gia: '' }) } : { label: 'Về trang chủ', to: '/' }}
        />
      ) : (
        <ProductGrid className={query.isFetching ? 'opacity-70 transition-opacity' : ''}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} offer={sale.offers.get(p.id)} headingLevel={2} />
          ))}
        </ProductGrid>
      )}

      {pages > 1 && (
        <nav aria-label="Phân trang" className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => update({ trang: page - 1 > 1 ? String(page - 1) : '' })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Trang trước
          </button>
          <span className="px-3 text-sm text-muted">
            Trang {page}/{pages}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => update({ trang: String(page + 1) })}>
            Trang sau <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
