import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useProducts } from '../../lib/queries';
import { formatPrice } from '../../lib/format';
import { errorMessage } from '../../lib/errors';
import { toast } from '../../store/toast';
import { Modal } from '../../components/ui/Modal';
import { ProductImage } from '../../components/ui/ProductImage';
import { AdminTitle, td, th } from './AdminLayout';
import { adminApi } from './adminApi';

const EMPTY = { name: '', categoryId: '', originalPrice: '', totalStock: '', imageUrl: '', description: '', status: 'ACTIVE' };

function ProductForm({ initial, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nhập tên sản phẩm.';
    if (!form.categoryId) errs.categoryId = 'Chọn danh mục.';
    if (!(Number(form.originalPrice) > 0)) errs.originalPrice = 'Nhập giá lớn hơn 0.';
    if (!(Number(form.totalStock) >= 0) || form.totalStock === '') errs.totalStock = 'Nhập số lượng từ 0 trở lên.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const body = {
      ...form,
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      originalPrice: Number(form.originalPrice),
      totalStock: Number(form.totalStock),
      imageUrl: form.imageUrl || null,
    };
    try {
      if (initial.id) await adminApi.updateProduct(initial.id, body);
      else await adminApi.createProduct(body);
      toast.success(initial.id ? 'Đã lưu sản phẩm.' : 'Đã thêm sản phẩm.');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const err = (k) => errors[k] && <p className="field-error">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="p-name">Tên sản phẩm</label>
        <input id="p-name" className="field-input" value={form.name} onChange={set('name')} aria-invalid={errors.name ? 'true' : undefined} />
        {err('name')}
      </div>
      <div>
        <label className="field-label" htmlFor="p-cat">Danh mục</label>
        <select id="p-cat" className="field-input" value={form.categoryId} onChange={set('categoryId')} aria-invalid={errors.categoryId ? 'true' : undefined}>
          <option value="">Chọn danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {err('categoryId')}
      </div>
      <div>
        <label className="field-label" htmlFor="p-status">Trạng thái</label>
        <select id="p-status" className="field-input" value={form.status} onChange={set('status')}>
          <option value="ACTIVE">Đang bán</option>
          <option value="INACTIVE">Ngừng bán</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="p-price">Giá niêm yết (₫)</label>
        <input id="p-price" className="field-input" inputMode="numeric" value={form.originalPrice} onChange={set('originalPrice')} aria-invalid={errors.originalPrice ? 'true' : undefined} />
        {err('originalPrice')}
      </div>
      <div>
        <label className="field-label" htmlFor="p-stock">Tồn kho</label>
        <input id="p-stock" className="field-input" inputMode="numeric" value={form.totalStock} onChange={set('totalStock')} aria-invalid={errors.totalStock ? 'true' : undefined} />
        {err('totalStock')}
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="p-img">Đường dẫn ảnh</label>
        <input id="p-img" className="field-input" value={form.imageUrl ?? ''} onChange={set('imageUrl')} placeholder="/images/products/ten-san-pham.jpg" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="p-desc">Mô tả</label>
        <textarea id="p-desc" rows={4} className="field-input py-2.5" value={form.description ?? ''} onChange={set('description')} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Đóng</button>
        <button type="submit" className="btn btn-dark" disabled={busy}>{initial.id ? 'Lưu sản phẩm' : 'Thêm sản phẩm'}</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const products = useProducts({ keyword: keyword || undefined, page, size: 15, sortBy: 'createdAt', sortDirection: 'DESC' });
  const { data: categories = [] } = useCategories();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const reload = () => queryClient.invalidateQueries({ queryKey: ['products'] });
  const pages = products.data?.meta?.page_of_number ?? 1;

  return (
    <>
      <AdminTitle title="Sản phẩm">
        <button type="button" className="btn btn-dark btn-sm" onClick={() => setEditing(EMPTY)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Thêm sản phẩm
        </button>
      </AdminTitle>
      <label htmlFor="tim-sp" className="sr-only">Tìm sản phẩm</label>
      <input
        id="tim-sp"
        className="field-input mb-4 max-w-sm"
        placeholder="Tìm theo tên"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(0);
        }}
      />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface">
            <tr>
              <th className={th}>Sản phẩm</th>
              <th className={th}>Danh mục</th>
              <th className={th}>Giá</th>
              <th className={th}>Tồn kho</th>
              <th className={th}><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(products.data?.items ?? []).map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface p-1">
                      <ProductImage src={p.imageUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className={td}>{p.category?.name}</td>
                <td className={td}>{formatPrice(p.originalPrice)}</td>
                <td className={td}>{p.totalStock}</td>
                <td className={`${td} text-right`}>
                  <button
                    type="button"
                    className="rounded-full p-2 text-muted hover:bg-surface hover:text-ink"
                    aria-label={`Sửa ${p.name}`}
                    onClick={() => setEditing({ ...EMPTY, ...p, categoryId: p.category?.id ?? '', imageUrl: p.imageUrl ?? '' })}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-sale-soft hover:text-sale" aria-label={`Xóa ${p.name}`} onClick={() => setDeleting(p)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button>
          <span className="text-muted">Trang {page + 1}/{pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} wide>
        {editing && (
          <ProductForm
            initial={editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa sản phẩm này?">
        <p className="text-[15px] text-ink-2">“{deleting?.name}” sẽ biến mất khỏi cửa hàng. Đơn hàng cũ vẫn giữ nguyên.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Giữ lại</button>
          <button
            type="button"
            className="btn btn-sale"
            onClick={async () => {
              try {
                await adminApi.deleteProduct(deleting.id);
                toast.success('Đã xóa sản phẩm.');
                reload();
              } catch (err) {
                toast.error(errorMessage(err));
              }
              setDeleting(null);
            }}
          >
            Xóa sản phẩm
          </button>
        </div>
      </Modal>
    </>
  );
}
