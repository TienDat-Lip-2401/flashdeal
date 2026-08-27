import React, { useState, useEffect } from 'react';
import { categoryApi } from '../api/categoryApi';
import { getRandomCategory } from '../utils/mockGenerator';
import { Layers, Plus, Trash2, Edit3, Dices, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CategoryManager({ setLastResponse, showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [autoReload, setAutoReload] = useState(false); // Mặc định tắt để người dùng kiểm tra Redis rỗng sau khi xóa

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: null,
    displayOrder: 0,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll();
      setLastResponse(res);
      setCategories(res.data || []);
      showToast('Đã tải danh sách từ API Gateway (Dữ liệu đã được nạp vào Redis Cache categories::all)', 'info');
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi khi tải danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRandomData = () => {
    const random = getRandomCategory();
    setFormData(random);
    showToast('Đã tạo ngẫu nhiên dữ liệu Danh mục!', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Tên danh mục không được để trống!', 'error');
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await categoryApi.update(editingId, formData);
        showToast('Cập nhật danh mục thành công! Cache Redis đã được làm mới.', 'success');
      } else {
        res = await categoryApi.create(formData);
        showToast('Thêm mới danh mục thành công! Cache Redis đã được làm mới.', 'success');
      }
      setLastResponse(res);
      setFormData({ name: '', slug: '', parentId: null, displayOrder: 0 });
      setEditingId(null);

      if (autoReload) {
        fetchCategories();
      } else if (res.data) {
        if (editingId) {
          setCategories(prev => prev.map(c => c.id === editingId ? res.data : c));
        } else {
          setCategories(prev => [...prev, res.data]);
        }
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId || null,
      displayOrder: cat.displayOrder || 0,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await categoryApi.delete(deleteTarget.id);
      setLastResponse(res);
      showToast(`Đã xóa danh mục "${deleteTarget.name}". Cache Redis (categories & products) đã bị xóa sạch! Bạn có thể kiểm tra redis-cli KEYS * ngay!`, 'success');
      
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);

      if (autoReload) {
        fetchCategories();
      } else {
        // Cập nhật giao diện cục bộ mà KHÔNG gửi GET request để bạn kiểm tra Redis rỗng
        setCategories(prev => prev.filter(c => c.id !== deletedId));
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
      setDeleteTarget(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', parentId: null, displayOrder: 0 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-100">
                {editingId ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRandomData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold transition"
              title="Điền dữ liệu mẫu ngẫu nhiên nhanh"
            >
              <Dices className="w-3.5 h-3.5" />
              Random Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên danh mục <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Điện Thoại Thông Minh"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Slug (URL thân thiện)
              </label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Để trống hệ thống sẽ tự sinh slug"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Danh mục cha (Parent ID)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Không có (Gốc) --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                {editingId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Table List Section */}
      <div className="lg:col-span-7">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-700 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <span>Danh Sách Danh Mục</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {categories.length} mục
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý các danh mục và kiểm tra tính năng Cache Redis
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoReload}
                  onChange={(e) => setAutoReload(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-600"
                />
                <span>Tự nạp lại sau Xóa</span>
              </label>

              <button
                onClick={fetchCategories}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                title="Gửi GET /api/categories để nạp lại dữ liệu vào Redis Cache"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Tải Lại & Nạp Cache</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tên & Slug</th>
                  <th className="py-3 px-4 text-center">Thứ tự</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 italic">
                      Chưa có danh mục nào. Hãy bấm "Random Data" và Tạo danh mục ngay!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-400 font-bold">
                        #{cat.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{cat.name}</div>
                        <div className="text-xs font-mono text-slate-400">{cat.slug}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-700">
                          {cat.displayOrder || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
                            title="Sửa danh mục"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-100 text-base">Xác Nhận Xóa Danh Mục</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-white font-mono">"{deleteTarget.name}"</span> không?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <span className="font-bold shrink-0">Lưu ý:</span>
              <span>
                Toàn bộ sản phẩm thuộc danh mục này sẽ <b>tự động được chuyển sang danh mục "Chưa phân loại"</b> để bảo toàn dữ liệu sản phẩm.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-rose-600/30 active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
