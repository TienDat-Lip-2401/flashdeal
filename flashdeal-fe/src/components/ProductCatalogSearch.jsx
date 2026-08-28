import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import Breadcrumb from './Breadcrumb';
import {
  Search,
  Flame,
  ArrowUpDown,
  ShoppingBag,
  Zap,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';

export default function ProductCatalogSearch({ setLastResponse, showToast }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Autocomplete
  const [keyword, setKeyword] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const searchContainerRef = useRef(null);

  // Filter & Pagination
  const [filter, setFilter] = useState({
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    status: 'ACTIVE',
    sortBy: 'id',
    sortDirection: 'DESC',
    page: 0,
    size: 12,
  });

  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 1,
  });

  // Fetch Categories & Trending on Mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, trendRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getTrendingKeywords(),
        ]);
        setCategories(catRes.data || []);
        setTrendingKeywords(trendRes.data || []);
      } catch (err) {
        // Ignore
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Products based on Filter
  const fetchProducts = async (keywordOverride = null, filterOverride = null) => {
    setLoading(true);
    try {
      const activeKeyword = keywordOverride !== null ? keywordOverride : keyword;
      const currentFilter = filterOverride || filter;
      const activeFilter = { ...currentFilter, keyword: (activeKeyword || '').trim() || null };
      const res = await productApi.filter(activeFilter);
      setLastResponse(res);
      setProducts(res.data || []);
      if (res.meta) {
        setPageInfo({
          page: res.meta.page != null ? res.meta.page : 0,
          size: res.meta.size || currentFilter.size,
          totalElements: res.meta.totalElements || (res.data || []).length,
          totalPages: Math.max(1, res.meta.totalPages || 1),
        });
      } else {
        setPageInfo({
          page: currentFilter.page,
          size: currentFilter.size,
          totalElements: (res.data || []).length,
          totalPages: 1,
        });
      }
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi khi tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  // Autocomplete debounce handler
  useEffect(() => {
    if (!keyword.trim()) {
      setAutocompleteResults([]);
      setIsAutocompleteOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productApi.autocomplete(keyword.trim());
        setAutocompleteResults(res.data || []);
        setIsAutocompleteOpen(true);
      } catch (err) {
        setAutocompleteResults([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsAutocompleteOpen(false);
    setFilter((prev) => ({ ...prev, page: 0 }));
    fetchProducts(keyword, { ...filter, page: 0 });
  };

  const handleSelectAutocomplete = (word) => {
    setKeyword(word);
    setIsAutocompleteOpen(false);
    setFilter((prev) => ({ ...prev, page: 0 }));
    fetchProducts(word, { ...filter, page: 0 });
  };

  const handleResetFilter = () => {
    setKeyword('');
    const reset = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      status: 'ACTIVE',
      sortBy: 'id',
      sortDirection: 'DESC',
      page: 0,
      size: 12,
    };
    setFilter(reset);
    fetchProducts('', reset);
  };

  const formatPrice = (p) => {
    if (p == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  const breadcrumbItems = [
    { label: 'Trang chủ' },
    { label: 'Sàn Thương Mại Điện Tử' }
  ];

  const currentPage = filter.page + 1;
  const totalPages = Math.max(1, pageInfo.totalPages);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero Corporate Banner (VinUni Inspired) */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 mb-8 border border-slate-800 shadow-md">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-700/50">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Nền Tảng Thương Mại Điện Tử Chuẩn SEO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Khám Phá Danh Mục Thiết Bị Công Nghệ Cao Cấp
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Hệ sinh thái phân tán với tìm kiếm siêu tốc <strong>Redis Lexicographical (&lt; 2ms)</strong>,
            bộ lọc động PostgreSQL và sàn <strong>Săn Deal Flash Sale 50.000 req/s</strong>.
          </p>
        </div>

        {/* Global Instant Search Bar with Redis Autocomplete */}
        <div ref={searchContainerRef} className="relative mt-6 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                if (autocompleteResults.length > 0) setIsAutocompleteOpen(true);
              }}
              placeholder="Nhập từ khóa tìm kiếm (ví dụ: iphone, macbook, tai nghe, sony)..."
              className="w-full pl-11 pr-28 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />

            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Tìm Kiếm
            </button>
          </form>

          {/* Autocomplete Dropdown Menu */}
          {isAutocompleteOpen && autocompleteResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Gợi ý từ khóa từ RAM Redis</span>
                <span className="text-[10px] text-blue-700 font-mono">ZRANGEBYLEX &lt; 2ms</span>
              </div>
              <ul className="py-1">
                {autocompleteResults.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectAutocomplete(item)}
                    className="px-4 py-2.5 hover:bg-blue-50 text-slate-800 text-sm cursor-pointer flex items-center justify-between transition group"
                  >
                    <span className="flex items-center gap-2 group-hover:text-blue-900 font-medium">
                      <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      {item}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Trending Keywords Bar */}
        {trendingKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              Từ khóa hot (Top Redis):
            </span>
            {trendingKeywords.slice(0, 5).map((trend, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAutocomplete(trend.keyword)}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition"
              >
                #{trend.keyword}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Catalog Section with Sidebar Filter & Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Filter (Solid Slate Style) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-900" />
                Bộ Lọc Sản Phẩm
              </h3>
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại
              </button>
            </div>

            {/* Category Filter List */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Danh mục</label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setFilter({ ...filter, categoryId: null, page: 0 })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    filter.categoryId === null
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter({ ...filter, categoryId: cat.id, page: 0 })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                      filter.categoryId === cat.id
                        ? 'bg-blue-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${filter.categoryId === cat.id ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Khoảng giá (VNĐ)</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Giá từ"
                  value={filter.minPrice || ''}
                  onChange={(e) => setFilter({ ...filter, minPrice: e.target.value ? Number(e.target.value) : null, page: 0 })}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-900"
                />
                <input
                  type="number"
                  placeholder="Đến giá"
                  value={filter.maxPrice || ''}
                  onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value ? Number(e.target.value) : null, page: 0 })}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-900"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilter({ ...filter, minPrice: 0, maxPrice: 10000000, page: 0 })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                >
                  &lt; 10 triệu
                </button>
                <button
                  type="button"
                  onClick={() => setFilter({ ...filter, minPrice: 10000000, maxPrice: 30000000, page: 0 })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                >
                  10 - 30 triệu
                </button>
                <button
                  type="button"
                  onClick={() => setFilter({ ...filter, minPrice: 30000000, maxPrice: null, page: 0 })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                >
                  &gt; 30 triệu
                </button>
              </div>
            </div>

            {/* Flash Sale Banner Link */}
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
              <div className="inline-flex p-2 bg-red-600 text-white rounded-lg mb-2">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <h4 className="text-xs font-bold text-red-900">Sàn Flash Sale 50.000 req/s</h4>
              <p className="text-[11px] text-red-700 mt-1 mb-3">
                Săn deal giảm 50% với thuật toán Redis Lua Script Fast-Gate!
              </p>
              <button
                type="button"
                onClick={() => navigate('/flash-sale')}
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Vào Sàn Flash Sale →
              </button>
            </div>
          </div>
        </div>

        {/* Right Product Grid Section */}
        <div className="lg:col-span-9">
          {/* Header Action & Sorting Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="text-xs text-slate-600 font-semibold">
              Tìm thấy <span className="font-bold text-blue-900">{pageInfo.totalElements}</span> sản phẩm phù hợp
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sắp xếp:</span>
              </div>
              <select
                value={`${filter.sortBy}-${filter.sortDirection}`}
                onChange={(e) => {
                  const [sortBy, sortDirection] = e.target.value.split('-');
                  setFilter({ ...filter, sortBy, sortDirection, page: 0 });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
              >
                <option value="id-DESC">Mới nhất</option>
                <option value="originalPrice-ASC">Giá tăng dần</option>
                <option value="originalPrice-DESC">Giá giảm dần</option>
                <option value="name-ASC">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-slate-500 font-semibold">Đang truy vấn dữ liệu từ PostgreSQL & Redis Cache...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm nào</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Hãy thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 transition"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Card Image Preview */}
                  <div
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="relative bg-slate-50 aspect-4/3 p-4 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-100"
                  >
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                      {p.category?.name || 'Sản phẩm'}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-900 cursor-pointer transition mb-2"
                        title="Bấm để điều hướng sang trang Chi Tiết Sản Phẩm"
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {p.description || 'Chính hãng 100%, bảo hành toàn quốc, giao hàng hỏa tốc.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-base font-extrabold text-blue-950">
                          {formatPrice(p.originalPrice)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 font-mono">
                          Kho: {p.totalStock}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="w-full py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition shadow-xs text-center"
                        >
                          Xem Chi Tiết →
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/flash-sale')}
                          className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition text-center flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3 h-3 fill-red-700" />
                          Săn Sale
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Professional Pagination Toolbar (Always Visible) */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="text-xs text-slate-600 flex items-center gap-3">
              <span>
                Hiển thị <strong className="text-blue-900">{products.length}</strong> / <strong>{pageInfo.totalElements}</strong> sản phẩm
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span>Số lượng:</span>
                <select
                  value={filter.size}
                  onChange={(e) => setFilter({ ...filter, size: Number(e.target.value), page: 0 })}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                >
                  <option value={6}>6 / trang</option>
                  <option value={12}>12 / trang</option>
                  <option value={24}>24 / trang</option>
                  <option value={48}>48 / trang</option>
                </select>
              </div>
            </div>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={filter.page === 0}
                onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setFilter({ ...filter, page: pageNum })}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    filter.page === pageNum
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {pageNum + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={filter.page + 1 >= totalPages}
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
