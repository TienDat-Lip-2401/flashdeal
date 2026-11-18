import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { formatDateTime, formatPrice } from '../../lib/format';
import { errorMessage } from '../../lib/errors';
import { toast } from '../../store/toast';
import { ORDER_STATUS, StatusBadge } from '../../components/OrderStatus';
import { AdminTitle, td, th } from './AdminLayout';
import { adminApi, useAdminOrders } from './adminApi';

/* Moves an order forward the way a shop would: paid -> shipping -> delivered. */
const NEXT = { PAID: ['SHIPPING'], SHIPPING: ['DELIVERED'], PENDING: ['CANCELLED'] };

export default function AdminOrders() {
  const orders = useAdminOrders();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');

  const list = [...(orders.data ?? [])]
    .filter((o) => !filter || o.status === filter)
    .filter((o) => !q || `${o.orderCode} ${o.phone} ${o.shippingAddress}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const change = async (code, status) => {
    setBusy(code);
    try {
      await adminApi.setOrderStatus(code, status);
      toast.success(`Đơn ${code} chuyển sang “${ORDER_STATUS[status].label}”.`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <AdminTitle title="Đơn hàng">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => orders.refetch()}>
          <RefreshCw className={`h-4 w-4 ${orders.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" /> Tải lại đơn
        </button>
      </AdminTitle>

      <div className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="tim-don" className="sr-only">
          Tìm đơn
        </label>
        <input id="tim-don" className="field-input max-w-xs" placeholder="Mã đơn, số điện thoại, địa chỉ" value={q} onChange={(e) => setQ(e.target.value)} />
        <label htmlFor="loc-trang-thai" className="sr-only">
          Lọc theo trạng thái
        </label>
        <select id="loc-trang-thai" className="field-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-surface">
            <tr>
              <th className={th}>Mã đơn</th>
              <th className={th}>Sản phẩm</th>
              <th className={th}>Giao tới</th>
              <th className={th}>Tổng tiền</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((o) => (
              <tr key={o.orderCode}>
                <td className={td}>
                  <p className="font-medium">{o.orderCode}</p>
                  <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                </td>
                <td className={`${td} max-w-[220px]`}>
                  <p className="line-clamp-2">{o.items?.map((i) => i.productName).join(', ')}</p>
                </td>
                <td className={`${td} max-w-[240px]`}>
                  <p className="line-clamp-2">{o.shippingAddress}</p>
                  <p className="text-xs text-muted">{o.phone}</p>
                </td>
                <td className={`${td} font-medium`}>{formatPrice(o.totalAmount)}</td>
                <td className={td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-2">
                    {(NEXT[o.status] ?? []).map((s) => (
                      <button key={s} type="button" disabled={busy === o.orderCode} className={`btn btn-sm ${s === 'CANCELLED' ? 'btn-ghost' : 'btn-dark'}`} onClick={() => change(o.orderCode, s)}>
                        {s === 'SHIPPING' ? 'Giao hàng' : s === 'DELIVERED' ? 'Đã giao' : 'Hủy đơn'}
                      </button>
                    ))}
                    {!NEXT[o.status] && <span className="text-xs text-muted">Không có thao tác</span>}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={6} className={`${td} py-10 text-center text-muted`}>
                  {orders.isLoading ? 'Đang tải đơn…' : orders.isError ? errorMessage(orders.error) : 'Không có đơn phù hợp.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
