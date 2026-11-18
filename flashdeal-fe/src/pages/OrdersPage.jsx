import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { Seo } from '../lib/seo';
import { useMyOrders, useProductIndex } from '../lib/queries';
import { formatDateTime, formatPrice } from '../lib/format';
import { errorMessage } from '../lib/errors';
import { toast } from '../store/toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ProductImage } from '../components/ui/ProductImage';
import { EmptyState, ErrorState } from '../components/ui/States';
import { StatusBadge } from '../components/OrderStatus';
import { Countdown } from '../components/ui/Countdown';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

/* VNPay sends the shopper back here (return URL) with vnp_* params; verify them with the server once. */
function useVnpayReturn() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handled = useRef(false);
  const [checking, setChecking] = useState(Boolean(params.get('vnp_ResponseCode')));

  useEffect(() => {
    if (handled.current || !params.get('vnp_ResponseCode')) return;
    handled.current = true;
    const vnp = Object.fromEntries([...params].filter(([k]) => k.startsWith('vnp_')));
    const orderCode = params.get('vnp_TxnRef');
    api
      .get('/payments/vnpay/payment-callback', { params: vnp })
      .then((res) => {
        if (res?.success) toast.success(`Thanh toán đơn ${orderCode} thành công.`);
        else toast.error('Giao dịch VNPay chưa thành công. Đơn vẫn được giữ đến hết 15 phút, bạn có thể thanh toán lại.');
      })
      .catch((err) => toast.error(`Không xác nhận được kết quả thanh toán: ${errorMessage(err)}`))
      .finally(() => {
        setChecking(false);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        if (orderCode) navigate(`/tai-khoan/don-hang/${orderCode}`, { replace: true });
        else setParams({}, { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return checking;
}

export default function OrdersPage() {
  const checking = useVnpayReturn();
  const [params, setParams] = useSearchParams();
  const tab = params.get('trang-thai') ?? '';
  const orders = useMyOrders();
  const index = useProductIndex();

  const list = [...(orders.data ?? [])]
    .filter((o) => !tab || o.status === tab)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return (
    <div className="wrap pb-16">
      <Seo title="Đơn hàng của tôi" path="/tai-khoan/don-hang" noindex />
      <Breadcrumbs items={[{ label: 'Trang chủ', to: '/' }, { label: 'Đơn hàng của tôi' }]} />
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Đơn hàng của tôi</h1>

      {checking && (
        <p role="status" className="mb-6 rounded-xl bg-surface px-4 py-3 text-[15px]">
          Đang xác nhận kết quả thanh toán với VNPay…
        </p>
      )}

      <div role="tablist" aria-label="Lọc theo trạng thái" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const count = t.value ? (orders.data ?? []).filter((o) => o.status === t.value).length : (orders.data ?? []).length;
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={tab === t.value}
              onClick={() => setParams(t.value ? { 'trang-thai': t.value } : {})}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${tab === t.value ? 'bg-ink text-white' : 'bg-surface text-ink-2 hover:bg-surface-2'}`}
            >
              {t.label} {orders.data ? <span className="opacity-70">({count})</span> : null}
            </button>
          );
        })}
      </div>

      {orders.isError ? (
        <ErrorState onRetry={() => orders.refetch()} />
      ) : orders.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title={tab ? 'Không có đơn nào ở trạng thái này' : 'Bạn chưa có đơn hàng nào'}
          text="Đơn được tạo khi bạn đặt một suất flash sale."
          action={{ label: 'Xem lịch flash sale', to: '/flash-sale' }}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const item = o.items?.[0];
            const product = item ? index.byId.get(item.productId) : null;
            return (
              <li key={o.orderCode}>
                <Link to={`/tai-khoan/don-hang/${o.orderCode}`} className="card lift flex items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface p-1.5">
                    <ProductImage src={product?.imageUrl} alt={product?.name ?? item?.productName ?? ''} className="h-full w-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={o.status} />
                      <span className="text-sm text-muted">Mã đơn {o.orderCode}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 font-semibold">{product?.name ?? item?.productName}</p>
                    <p className="text-sm text-muted">
                      {formatDateTime(o.createdAt)} · <span className="font-semibold text-ink">{formatPrice(o.totalAmount)}</span>
                    </p>
                    {o.status === 'PENDING' && o.expiresAt && (
                      <p className="mt-1 text-sm text-warn">
                        Thanh toán trong <Countdown to={o.expiresAt} className="font-semibold" />
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
