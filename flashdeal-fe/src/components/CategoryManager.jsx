import React, { useState, useEffect } from 'react';
import { categoryApi } from '../api/categoryApi';
import { getRandomCategory } from '../utils/mockGenerator';
import Breadcrumb from './Breadcrumb';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Dices,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X
} from 'lucide-react';

export default function CategoryManager({ setLastResponse, showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [autoReload, setAutoReload] = useState(false);

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
      showToast('Đã tải danh mục từ API Gateway (Nạp lại Cache categories::all)', 'info');
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
          setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data : c)));
        } else {
          setCategories((prev) => [...prev, res.data]);
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
      showToast(`Đã xóa danh mục "${deleteTarget.name}". Toàn bộ sản phẩm đã được bảo toàn và chuyển sang "Chưa phân loại"!`, 'success');

      const deletedId = deleteTarget.id;
      setDeleteTarget(null);

      if (autoReload) {
        fetchCategories();
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== deletedId));
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

  const breadcrumbItems = [
    { label: 'Trang chủ' },
    { label: 'Quản Lý Danh Mục' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section (Left Column) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingId ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRandomData}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                title="Điền dữ liệu mẫu ngẫu nhiên nhanh"
              >
                <Dices className="w-3.5 h-3.5" />
                Random Data
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên danh mục <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Điện Thoại & Smartphone"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug (URL thân thiện)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="dien-thoai-smartphone (để trống sẽ tự sinh)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục cha</label>
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  >
                    <option value="">-- Danh mục gốc (Level 1) --</option>
                    {categories
                      .filter((c) => c.id !== editingId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  {editingId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingId ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table Section (Right Column) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Danh Sách Danh Mục</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                    {categories.length} mục
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý các danh mục và kiểm tra tính năng Cache Redis</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={autoReload}
                    onChange={(e) => setAutoReload(e.target.checked)}
                    className="rounded text-blue-900 focus:ring-0"
                  />
                  <span>Tự nạp sau Xóa</span>
                </label>

                <button
                  onClick={fetchCategories}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  title="Gửi GET /api/categories để nạp lại dữ liệu vào Redis Cache"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Tải Lại & Nạp Cache</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Tên Danh Mục & Slug</th>
                    <th className="py-2.5 px-3 text-center">Thứ tự</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {categories.map((cat) => {
                    const isDefaultCategory = cat.slug === 'chua-phan-loai';
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">#{cat.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{cat.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">/{cat.slug}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium">{cat.displayOrder}</td>
                        <td className="py-3 px-3 text-right">
                          {isDefaultCategory ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              MẶC ĐỊNH
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(cat)}
                                className="p-1.5 rounded text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition"
                                title="Sửa danh mục"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(cat)}
                                className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                                title="Xóa danh mục an toàn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Safe Category Deletion */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa danh mục?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Bạn đang chuẩn bị xóa danh mục: <strong className="text-slate-900">"{deleteTarget.name}"</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-5 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                Cơ chế bảo toàn sản phẩm an toàn:
              </div>
              Toàn bộ sản phẩm đang thuộc danh mục này sẽ tự động được chuyển sang danh mục mặc định{' '}
              <strong className="underline">"Chưa phân loại"</strong>, không bị xóa mất dữ liệu!
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition shadow-xs"
              >
                Đồng Ý Xóa Danh Mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
