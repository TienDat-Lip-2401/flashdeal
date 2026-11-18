import { Link } from 'react-router-dom';
import { useCategories, useFlashSale, useProductIndex } from '../../lib/queries';
import { formatDateTime, formatPrice } from '../../lib/format';
import { StatusBadge, ORDER_STATUS } from '../../components/OrderStatus';
import { Countdown } from '../../components/ui/Countdown';
import { AdminTitle, td, th } from './AdminLayout';
import { useAdminOrders } from './adminApi';

function Stat({ label, value, note }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const orders = useAdminOrders();
  const products = useProductIndex();
  const { data: categories = [] } = useCategories();
  const sale = useFlashSale();

  const list = orders.data ?? [];
  const revenue = list.filter((o) => ['PAID', 'SHIPPING', 'DELIVERED'].includes(o.status)).reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const byStatus = Object.keys(ORDER_STATUS).map((s) => [s, list.filter((o) => o.status === s).length]);
  const recent = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8);

  return (
    <>
      <AdminTitle title="Tổng quan" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Doanh thu đã thanh toán" value={formatPrice(revenue)} note={`${list.length} đơn tất cả`} />
        <Stat label="Đơn chờ thanh toán" value={byStatus.find(([s]) => s === 'PENDING')[1]} />
        <Stat label="Sản phẩm đang bán" value={products.data?.items.length ?? '…'} note={`${categories.length} danh mục`} />
        <Stat label="Đợt flash sale đang mở" value={sale.live.length} note={`${sale.upcoming.length} đợt sắp mở`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden" aria-labelledby="don-moi">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 id="don-moi" className="text-lg font-semibold">
              Đơn mới nhất
            </h2>
            <Link to="/quan-tri/don-hang" className="link text-sm font-medium">
              Xem tất cả đơn
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className={th}>Mã đơn</th>
                  <th className={th}>Thời gian</th>
                  <th className={th}>Tổng tiền</th>
                  <th className={th}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((o) => (
                  <tr key={o.orderCode}>
                    <td className={`${td} font-medium`}>{o.orderCode}</td>
                    <td className={td}>{formatDateTime(o.createdAt)}</td>
                    <td className={td}>{formatPrice(o.totalAmount)}</td>
                    <td className={td}>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td colSpan={4} className={`${td} py-8 text-center text-muted`}>
                      {orders.isLoading ? 'Đang tải…' : 'Chưa có đơn hàng.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5" aria-labelledby="dot-sale">
          <h2 id="dot-sale" className="text-lg font-semibold">
            Đợt flash sale
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {[...sale.live, ...sale.upcoming].map((c) => {
              const total = c.products.reduce((s, l) => s + l.flashSaleStock, 0);
              const left = c.products.reduce((s, l) => s + l.availableStock, 0);
              return (
                <li key={c.id} className="py-3">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted">
                    {c.state === 'live' ? (
                      <>
                        Đang mở · kết thúc sau <Countdown to={c.endTime} />
                      </>
                    ) : (
                      <>Mở lúc {formatDateTime(c.startTime)}</>
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    Đã bán {total - left}/{total} suất
                  </p>
                </li>
              );
            })}
            {!sale.live.length && !sale.upcoming.length && <li className="py-3 text-sm text-muted">Không có đợt nào đang mở hoặc sắp mở.</li>}
          </ul>
          <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
            {byStatus.map(([s, n]) => (
              <li key={s} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <span>{ORDER_STATUS[s].label}</span>
                <span className="font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
