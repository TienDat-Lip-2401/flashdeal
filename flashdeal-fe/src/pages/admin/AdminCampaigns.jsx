import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useFlashSale, useProductIndex } from '../../lib/queries';
import { discountPercent, formatDateTime, formatPrice } from '../../lib/format';
import { errorMessage } from '../../lib/errors';
import { toast } from '../../store/toast';
import { Modal } from '../../components/ui/Modal';
import { AdminTitle, td, th } from './AdminLayout';
import { adminApi } from './adminApi';

const STATE = { live: ['Đang mở', 'bg-sale-soft text-sale'], upcoming: ['Sắp mở', 'bg-warn-soft text-warn'], ended: ['Đã kết thúc', 'bg-surface text-muted'] };

const toInput = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function CampaignForm({ onDone }) {
  const now = new Date();
  const [form, setForm] = useState({ title: '', startTime: toInput(new Date(now.getTime() + 3600e3)), endTime: toInput(new Date(now.getTime() + 5 * 3600e3)) });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Nhập tên đợt flash sale.');
    if (form.endTime <= form.startTime) return setError('Giờ kết thúc phải sau giờ bắt đầu.');
    try {
      await adminApi.createCampaign({ title: form.title.trim(), startTime: `${form.startTime}:00`, endTime: `${form.endTime}:00` });
      toast.success('Đã tạo đợt flash sale. Thêm sản phẩm vào đợt ở bảng bên dưới.');
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label className="field-label" htmlFor="cp-title">Tên đợt</label>
        <input id="cp-title" className="field-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ví dụ: Giờ vàng MacBook" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="cp-start">Bắt đầu</label>
          <input id="cp-start" type="datetime-local" className="field-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="cp-end">Kết thúc</label>
          <input id="cp-end" type="datetime-local" className="field-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Đóng</button>
        <button type="submit" className="btn btn-dark">Tạo đợt flash sale</button>
      </div>
    </form>
  );
}

function AddProductForm({ campaign, onDone }) {
  const index = useProductIndex();
  const inCampaign = new Set(campaign.products.map((l) => l.productId));
  const options = (index.data?.items ?? []).filter((p) => !inCampaign.has(p.id));
  const [form, setForm] = useState({ productId: '', flashSalePrice: '', flashSaleStock: '10' });
  const [error, setError] = useState('');
  const product = options.find((p) => String(p.id) === form.productId);

  const submit = async (e) => {
    e.preventDefault();
    if (!product) return setError('Chọn sản phẩm.');
    const price = Number(form.flashSalePrice);
    if (!(price > 0) || price >= Number(product.originalPrice)) return setError('Giá flash sale phải lớn hơn 0 và thấp hơn giá niêm yết.');
    if (!(Number(form.flashSaleStock) >= 1)) return setError('Số suất ít nhất là 1.');
    try {
      await adminApi.addCampaignProduct(campaign.id, {
        productId: product.id,
        productName: product.name,
        originalPrice: Number(product.originalPrice),
        flashSalePrice: price,
        flashSaleStock: Number(form.flashSaleStock),
      });
      toast.success(`Đã thêm ${product.name} vào ${campaign.title}.`);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label className="field-label" htmlFor="ap-product">Sản phẩm</label>
        <select id="ap-product" className="field-input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
          <option value="">Chọn sản phẩm</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>{p.name} – {formatPrice(p.originalPrice)}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="ap-price">Giá flash sale (₫)</label>
          <input id="ap-price" className="field-input" inputMode="numeric" value={form.flashSalePrice} onChange={(e) => setForm({ ...form, flashSalePrice: e.target.value })} />
          {product && Number(form.flashSalePrice) > 0 && (
            <p className="mt-1.5 text-sm text-muted">Giảm {discountPercent(product.originalPrice, form.flashSalePrice)}% so với {formatPrice(product.originalPrice)}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="ap-stock">Số suất</label>
          <input id="ap-stock" className="field-input" inputMode="numeric" value={form.flashSaleStock} onChange={(e) => setForm({ ...form, flashSaleStock: e.target.value })} />
        </div>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Đóng</button>
        <button type="submit" className="btn btn-dark">Thêm vào đợt</button>
      </div>
    </form>
  );
}

export default function AdminCampaigns() {
  const sale = useFlashSale();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const reload = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  const list = [...sale.list].sort((a, b) => String(b.startTime).localeCompare(String(a.startTime)));

  return (
    <>
      <AdminTitle title="Flash sale">
        <button type="button" className="btn btn-dark btn-sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Tạo đợt flash sale
        </button>
      </AdminTitle>

      <div className="space-y-5">
        {list.map((c) => (
          <section key={c.id} className="card overflow-hidden" aria-labelledby={`cp-${c.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id={`cp-${c.id}`} className="text-lg font-semibold">{c.title}</h2>
                  <span className={`badge ${STATE[c.state][1]}`}>{STATE[c.state][0]}</span>
                </div>
                <p className="text-sm text-muted">{formatDateTime(c.startTime)} đến {formatDateTime(c.endTime)}</p>
              </div>
              <div className="flex gap-2">
                {c.state !== 'ended' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(c)}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Thêm sản phẩm
                  </button>
                )}
                <button type="button" className="rounded-full p-2 text-muted hover:bg-sale-soft hover:text-sale" aria-label={`Xóa ${c.title}`} onClick={() => setDeleting(c)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {c.products.length > 0 && (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-surface">
                    <tr>
                      <th className={th}>Sản phẩm</th>
                      <th className={th}>Giá sale</th>
                      <th className={th}>Giảm</th>
                      <th className={th}>Đã bán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {c.products.map((l) => (
                      <tr key={l.id}>
                        <td className={`${td} font-medium`}>{l.product?.name ?? l.productName}</td>
                        <td className={td}>{formatPrice(l.flashSalePrice)}</td>
                        <td className={td}>{discountPercent(l.originalPrice, l.flashSalePrice)}%</td>
                        <td className={td}>{l.flashSaleStock - l.availableStock}/{l.flashSaleStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
        {!list.length && <p className="card p-8 text-center text-muted">{sale.isLoading ? 'Đang tải…' : 'Chưa có đợt flash sale nào.'}</p>}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Tạo đợt flash sale">
        {creating && <CampaignForm onDone={() => { setCreating(false); reload(); }} />}
      </Modal>
      <Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={`Thêm sản phẩm vào ${adding?.title ?? ''}`}>
        {adding && <AddProductForm campaign={adding} onDone={() => { setAdding(null); reload(); }} />}
      </Modal>
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa đợt flash sale này?">
        <p className="text-[15px] text-ink-2">“{deleting?.title}” và các suất chưa bán sẽ bị xóa. Đơn đã đặt vẫn giữ nguyên.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Giữ lại</button>
          <button
            type="button"
            className="btn btn-sale"
            onClick={async () => {
              try {
                await adminApi.deleteCampaign(deleting.id);
                toast.success('Đã xóa đợt flash sale.');
                reload();
              } catch (err) {
                toast.error(errorMessage(err));
              }
              setDeleting(null);
            }}
          >
            Xóa đợt
          </button>
        </div>
      </Modal>
    </>
  );
}
