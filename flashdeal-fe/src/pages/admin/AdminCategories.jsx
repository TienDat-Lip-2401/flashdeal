import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useProductIndex } from '../../lib/queries';
import { errorMessage } from '../../lib/errors';
import { toast } from '../../store/toast';
import { Modal } from '../../components/ui/Modal';
import { AdminTitle, td, th } from './AdminLayout';
import { adminApi } from './adminApi';

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useCategories();
  const index = useProductIndex();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const counts = new Map();
  for (const p of index.data?.items ?? []) counts.set(p.category?.id, (counts.get(p.category?.id) ?? 0) + 1);
  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const reload = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const save = async (e) => {
    e.preventDefault();
    if (!editing.name.trim()) {
      setError('Nhập tên danh mục.');
      return;
    }
    const body = { name: editing.name.trim(), slug: editing.slug || undefined, displayOrder: Number(editing.displayOrder) || 0 };
    try {
      if (editing.id) await adminApi.updateCategory(editing.id, body);
      else await adminApi.createCategory(body);
      toast.success('Đã lưu danh mục.');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <AdminTitle title="Danh mục">
        <button type="button" className="btn btn-dark btn-sm" onClick={() => setEditing({ name: '', slug: '', displayOrder: sorted.length + 1 })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Thêm danh mục
        </button>
      </AdminTitle>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface">
            <tr>
              <th className={th}>Thứ tự</th>
              <th className={th}>Tên</th>
              <th className={th}>Đường dẫn</th>
              <th className={th}>Sản phẩm</th>
              <th className={th}><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((c) => (
              <tr key={c.id}>
                <td className={td}>{c.displayOrder}</td>
                <td className={`${td} font-medium`}>{c.name}</td>
                <td className={`${td} text-muted`}>/danh-muc/{c.slug}</td>
                <td className={td}>{counts.get(c.id) ?? 0}</td>
                <td className={`${td} text-right`}>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-surface hover:text-ink" aria-label={`Sửa ${c.name}`} onClick={() => setEditing({ ...c })}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-sale-soft hover:text-sale" aria-label={`Xóa ${c.name}`} onClick={() => setDeleting(c)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={5} className={`${td} py-10 text-center text-muted`}>{isLoading ? 'Đang tải…' : 'Chưa có danh mục.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Sửa danh mục' : 'Thêm danh mục'}>
        {editing && (
          <form onSubmit={save} noValidate className="space-y-4">
            <div>
              <label className="field-label" htmlFor="c-name">Tên danh mục</label>
              <input
                id="c-name"
                className="field-input"
                value={editing.name}
                onChange={(e) => {
                  setEditing({ ...editing, name: e.target.value });
                  setError('');
                }}
                aria-invalid={error ? 'true' : undefined}
              />
              {error && <p className="field-error">{error}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="c-slug">Đường dẫn (để trống sẽ tự tạo theo tên)</label>
              <input id="c-slug" className="field-input" value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="c-order">Thứ tự hiển thị</label>
              <input id="c-order" className="field-input" inputMode="numeric" value={editing.displayOrder ?? 0} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Đóng</button>
              <button type="submit" className="btn btn-dark">Lưu danh mục</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa danh mục này?">
        <p className="text-[15px] text-ink-2">
          “{deleting?.name}” đang có {counts.get(deleting?.id) ?? 0} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Giữ lại</button>
          <button
            type="button"
            className="btn btn-sale"
            onClick={async () => {
              try {
                await adminApi.deleteCategory(deleting.id);
                toast.success('Đã xóa danh mục.');
                reload();
              } catch (err) {
                toast.error(errorMessage(err));
              }
              setDeleting(null);
            }}
          >
            Xóa danh mục
          </button>
        </div>
      </Modal>
    </>
  );
}
