import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { Seo } from '../lib/seo';
import { useOrder, useProductIndex } from '../lib/queries';
import { formatDateTime, formatPrice, parseDate } from '../lib/format';
import { errorMessage } from '../lib/errors';
import { toast } from '../store/toast';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Countdown } from '../components/ui/Countdown';
import { Modal } from '../components/ui/Modal';
import { ProductImage } from '../components/ui/ProductImage';
import { ErrorState } from '../components/ui/States';
import { OrderTimeline, StatusBadge } from '../components/OrderStatus';

// Nút thanh toán thử chỉ hiện khi máy chủ bật chế độ demo (PAYMENT_SIMULATE_ENABLED ở payment-service)
const TEST_PAYMENT_ENABLED = import.meta.env.VITE_ENABLE_TEST_PAYMENT === 'true';

export default function OrderDetailPage() {
  const { code } = useParams();
  const order = useOrder(code);
  const index = useProductIndex();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast.success(success);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const payVnpay = () =>
    run('vnpay', async () => {
      // Số tiền và người mua do máy chủ tự lấy từ đơn hàng, không gửi từ trình duyệt
      const res = await api.post('/payments/vnpay/create-payment-url', {
        orderCode: o.orderCode,
        orderInfo: `Thanh toan don hang ${o.orderCode}`,
      });
      if (!res?.paymentUrl) throw { message: 'VNPay chưa trả về đường dẫn thanh toán.' };
      window.location.assign(res.paymentUrl);
    });

  const payTest = () =>
    run('test', () => api.post('/payments/vnpay/simulate-pay', null, { params: { orderCode: o.orderCode } }), 'Đã ghi nhận thanh toán thử. Trạng thái đơn sẽ cập nhật sau vài giây.');

  if (order.isLoading || (order.isFetching && !order.data)) {
    return (
      <div className="wrap py-10">
        <div className="skeleton mb-4 h-9 w-72" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }
  if (order.isError || !order.data) {
    return (
      <div className="wrap py-16">
        <ErrorState text={errorMessage(order.error, 'Không tải được đơn hàng.')} onRetry={() => order.refetch()} />
      </div>
    );
  }

  const o = order.data;
  const expired = o.status === 'PENDING' && o.expiresAt && parseDate(o.expiresAt) <= Date.now();

  return (
    <div className="wrap pb-16">
      <Seo title={`Đơn hàng ${o.orderCode}`} path={`/tai-khoan/don-hang/${o.orderCode}`} noindex />
      <Breadcrumbs items={[{ label: 'Trang chủ', to: '/' }, { label: 'Đơn hàng của tôi', to: '/tai-khoan/don-hang' }, { label: o.orderCode }]} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Đơn hàng {o.orderCode}</h1>
        <button
          type="button"
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-ink"
          onClick={() => {
            navigator.clipboard?.writeText(o.orderCode);
            toast.info('Đã sao chép mã đơn.');
          }}
          aria-label="Sao chép mã đơn"
        >
          <Copy className="h-4 w-4" />
        </button>
        <StatusBadge status={o.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {o.status !== 'CANCELLED' && (
            <div className="card p-5">
              <OrderTimeline status={o.status} />
            </div>
          )}

          <section aria-labelledby="san-pham-don" className="card p-5">
            <h2 id="san-pham-don" className="mb-4 text-lg font-semibold">
              Sản phẩm
            </h2>
            <ul className="divide-y divide-line">
              {o.items?.map((it) => {
                const p = index.byId.get(it.productId);
                return (
                  <li key={it.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface p-1.5">
                      <ProductImage src={p?.imageUrl} alt={p?.name ?? it.productName} className="h-full w-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {p ? (
                        <Link to={`/san-pham/${p.slug}`} className="line-clamp-2 font-semibold hover:underline underline-offset-4">
                          {p.name}
                        </Link>
                      ) : (
                        <p className="font-semibold">{it.productName}</p>
                      )}
                      <p className="text-sm text-muted">
                        {it.quantity} x {formatPrice(it.price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatPrice(it.totalPrice)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
              <span>Tổng tiền</span>
              <span className="text-sale">{formatPrice(o.totalAmount)}</span>
            </div>
          </section>

          <section aria-labelledby="giao-hang" className="card p-5">
            <h2 id="giao-hang" className="mb-3 text-lg font-semibold">
              Giao hàng
            </h2>
            <dl className="grid gap-2 text-[15px] sm:grid-cols-[9rem_1fr]">
              <dt className="text-muted">Người nhận, địa chỉ</dt>
              <dd>{o.shippingAddress}</dd>
              <dt className="text-muted">Số điện thoại</dt>
              <dd>{o.phone}</dd>
              <dt className="text-muted">Đặt lúc</dt>
              <dd>{formatDateTime(o.createdAt)}</dd>
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card p-5">
            {o.status === 'PENDING' && !expired && (
              <>
                <h2 className="text-lg font-semibold">Thanh toán đơn hàng</h2>
                <p className="mt-1 text-[15px] text-ink-2">
                  Hàng được giữ thêm <Countdown to={o.expiresAt} className="font-semibold text-warn" onDone={() => order.refetch()} />. Quá thời gian này đơn tự hủy.
                </p>
                <button type="button" className="btn btn-primary mt-5 w-full" onClick={payVnpay} disabled={Boolean(busy)}>
                  {busy === 'vnpay' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Thanh toán qua VNPay
                </button>
                {TEST_PAYMENT_ENABLED && (
                  <button type="button" className="btn btn-ghost mt-3 w-full" onClick={payTest} disabled={Boolean(busy)}>
                    {busy === 'test' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Thanh toán thử (môi trường demo)
                  </button>
                )}
                <button type="button" className="mt-4 w-full text-center text-sm font-medium text-muted hover:text-sale" onClick={() => setConfirmCancel(true)} disabled={Boolean(busy)}>
                  Hủy đơn này
                </button>
              </>
            )}
            {expired && (
              <p className="text-[15px] text-ink-2">Đơn đã quá 15 phút giữ hàng và đang được hủy tự động. Suất mua sẽ được trả lại.</p>
            )}
            {o.status === 'PAID' && <p className="text-[15px] text-ink-2">Đơn đã thanh toán. Cửa hàng đang chuẩn bị hàng để giao cho bạn.</p>}
            {o.status === 'SHIPPING' && (
              <>
                <p className="text-[15px] text-ink-2">Đơn đang trên đường giao. Khi nhận được hàng, bấm xác nhận bên dưới.</p>
                <button
                  type="button"
                  className="btn btn-primary mt-4 w-full"
                  disabled={Boolean(busy)}
                  onClick={() => run('confirm', () => api.put(`/flash-sales/orders/${o.orderCode}/confirm-delivered`), 'Cảm ơn bạn đã xác nhận nhận hàng.')}
                >
                  {busy === 'confirm' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Xác nhận đã nhận hàng
                </button>
              </>
            )}
            {o.status === 'DELIVERED' && <p className="text-[15px] text-ink-2">Đơn đã giao thành công.</p>}
            {o.status === 'CANCELLED' && (
              <>
                <p className="text-[15px] text-ink-2">Đơn đã hủy. Suất mua đã được trả lại, bạn có thể đặt lại nếu đợt flash sale còn mở.</p>
                <Link to="/flash-sale" className="btn btn-dark mt-4 w-full">
                  Xem lịch flash sale
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Hủy đơn hàng này?">
        <p className="text-[15px] text-ink-2">Suất flash sale sẽ được trả lại cho người khác. Bạn có thể đặt lại nếu đợt còn mở và còn suất.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmCancel(false)}>
            Giữ đơn
          </button>
          <button
            type="button"
            className="btn btn-sale"
            disabled={Boolean(busy)}
            onClick={async () => {
              await run('cancel', () => api.put(`/flash-sales/orders/${o.orderCode}/cancel`), 'Đã hủy đơn hàng.');
              setConfirmCancel(false);
            }}
          >
            {busy === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Hủy đơn
          </button>
        </div>
      </Modal>
    </div>
  );
}
