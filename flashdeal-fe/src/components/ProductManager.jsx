import React, { useState, useEffect } from 'react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { getRandomProduct } from '../utils/mockGenerator';
import Breadcrumb from './Breadcrumb';
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  Dices,
  RefreshCw,
  CheckCircle2,
  Layers,
  Database,
  ExternalLink
} from 'lucide-react';

export default function ProductManager({ setLastResponse, showToast, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [autoReload, setAutoReload] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    originalPrice: 10000000,
    totalStock: 50,
    description: '',
    imageUrl: '',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.filter({ page: 0, size: 50 }),
        categoryApi.getAll(),
      ]);
      setLastResponse(prodRes);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      showToast('Đã tải danh sách từ API Gateway (Nạp lại Cache Redis product_filters)', 'info');
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRandomData = () => {
    const defaultCatId = categories.length > 0 ? categories[0].id : 1;
    const random = getRandomProduct(defaultCatId);
    setFormData(random);
    showToast('Đã tạo ngẫu nhiên dữ liệu Sản phẩm!', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Tên sản phẩm không được để trống!', 'error');
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await productApi.update(editingId, formData);
        showToast('Cập nhật sản phẩm thành công! Cache Redis đã được làm mới.', 'success');
      } else {
        res = await productApi.create(formData);
        showToast('Thêm mới sản phẩm thành công! Cache Redis đã được làm mới.', 'success');
      }
      setLastResponse(res);
      setFormData({
        name: '',
        slug: '',
        categoryId: categories[0]?.id || '',
        originalPrice: 10000000,
        totalStock: 50,
        description: '',
        imageUrl: '',
        status: 'ACTIVE',
      });
      setEditingId(null);

      if (autoReload) {
        fetchData();
      } else if (res.data) {
        if (editingId) {
          setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)));
        } else {
          setProducts((prev) => [res.data, ...prev]);
        }
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      slug: p.slug,
      categoryId: p.category?.id || '',
      originalPrice: p.originalPrice,
      totalStock: p.totalStock,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      status: p.status || 'ACTIVE',
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" (ID: ${id})?`)) return;
    try {
      const res = await productApi.delete(id);
      setLastResponse(res);
      showToast(`Đã xóa sản phẩm "${name}". Cache Redis (products & product_filters) đã bị xóa sạch! Bạn có thể kiểm tra redis-cli KEYS * ngay!`, 'success');

      if (autoReload) {
        fetchData();
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || '',
      originalPrice: 10000000,
      totalStock: 50,
      description: '',
      imageUrl: '',
      status: 'ACTIVE',
    });
  };

  const formatPrice = (p) => {
    if (p == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  const breadcrumbItems = [
    { label: 'Trang chủ' },
    { label: 'Quản Lý Sản Phẩm' }
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
                <Package className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingId ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRandomData}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                title="Điền dữ liệu ngẫu nhiên nhanh để test API"
              >
                <Dices className="w-3.5 h-3.5" />
                Random Data
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên sản phẩm <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  >
                    <option value="ACTIVE">ACTIVE (Kinh doanh)</option>
                    <option value="INACTIVE">INACTIVE (Ngừng bán)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tồn kho Database *</label>
                  <input
                    type="number"
                    value={formData.totalStock}
                    onChange={(e) => setFormData({ ...formData, totalStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL hình ảnh sản phẩm</label>
                <input
                  type="text"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả cấu hình & tính năng</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết sản phẩm..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  {editingId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingId ? 'Cập Nhật Sản Phẩm' : 'Tạo Mới Sản Phẩm'}
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
                  <span>Danh Sách Sản Phẩm</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                    {products.length} SP
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý và kiểm tra tính năng xóa Cache Redis</p>
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
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  title="Gửi GET /api/products để nạp lại dữ liệu vào Redis Cache"
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
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3">Giá bán</th>
                    <th className="py-2.5 px-3 text-center">Kho</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            className="w-9 h-9 rounded object-contain bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div
                              onClick={() => onSelectProduct(p.id)}
                              className="font-bold text-slate-900 hover:text-blue-900 cursor-pointer line-clamp-1"
                              title="Bấm để điều hướng sang trang Chi Tiết"
                            >
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.category?.name || 'Chưa phân loại'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{formatPrice(p.originalPrice)}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{p.totalStock}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(p.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition"
                            title="Xem trang chi tiết sản phẩm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition"
                            title="Sửa sản phẩm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                            title="Xóa sản phẩm & Xóa Cache Redis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
