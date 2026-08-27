import React, { useState, useEffect } from 'react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { getRandomProduct } from '../utils/mockGenerator';
import { Package, Plus, Trash2, Edit3, Dices, RefreshCw, CheckCircle2, Image, Layers, DollarSign, Box } from 'lucide-react';

export default function ProductManager({ setLastResponse, showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [autoReload, setAutoReload] = useState(false); // Mặc định tắt để người dùng kiểm tra Redis rỗng sau khi xóa

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    originalPrice: 1000000,
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
      showToast('Đã gửi GET /api/products và nạp lại Cache Redis (product_filters)', 'info');
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
    if (!formData.categoryId) {
      showToast('Vui lòng chọn Danh mục sản phẩm!', 'error');
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
        originalPrice: 1000000,
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
          setProducts(prev => prev.map(p => p.id === editingId ? res.data : p));
        } else {
          setProducts(prev => [res.data, ...prev]);
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
        // Cập nhật giao diện cục bộ mà KHÔNG gửi GET request để bạn kiểm tra Redis rỗng
        setProducts(prev => prev.filter(p => p.id !== id));
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
      originalPrice: 1000000,
      totalStock: 50,
      description: '',
      imageUrl: '',
      status: 'ACTIVE',
    });
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">
                {editingId ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRandomData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold transition"
              title="Điền dữ liệu mẫu ngẫu nhiên nhanh"
            >
              <Dices className="w-3.5 h-3.5" />
              Random Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên sản phẩm <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Danh mục <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ACTIVE">Kinh doanh (ACTIVE)</option>
                  <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Giá gốc (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số lượng tồn kho <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalStock}
                  onChange={(e) => setFormData({ ...formData, totalStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Link ảnh sản phẩm (URL)
              </label>
              <input
                type="text"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mô tả sản phẩm
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả cấu hình, tính năng nổi bật..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/30 transition active:scale-95"
              >
                {editingId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm'}
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
                <span>Danh Sách Sản Phẩm</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {products.length} sản phẩm
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý sản phẩm và kiểm tra xóa Cache Redis (products & product_filters)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoReload}
                  onChange={(e) => setAutoReload(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 bg-slate-800 border-slate-600"
                />
                <span>Tự nạp lại sau Xóa</span>
              </label>

              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/30 transition disabled:opacity-50"
                title="Gửi GET /api/products để nạp lại dữ liệu vào Redis Cache"
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
                  <th className="py-3 px-4">Ảnh & Sản phẩm</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 italic">
                      Chưa có sản phẩm nào. Hãy bấm "Random Data" và bấm "Tạo Sản Phẩm" ngay!
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || 'https://placehold.co/100x100?text=No+Image'}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/100x100?text=No+Image';
                            }}
                          />
                          <div>
                            <div className="font-semibold text-slate-100 line-clamp-1">{p.name}</div>
                            <div className="text-xs font-mono text-slate-400">ID: #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-indigo-300 text-xs border border-slate-600">
                          {p.category?.name || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                        {formatVND(p.originalPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span
                          className={`px-2 py-1 rounded-md font-bold ${
                            p.totalStock > 20
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.totalStock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
                            title="Sửa sản phẩm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                            title="Xóa sản phẩm"
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
    </div>
  );
}
