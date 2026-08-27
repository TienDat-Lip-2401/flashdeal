import React, { useState, useEffect } from 'react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Eye, Tag, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProductCatalogSearch({ setLastResponse, showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageOfNumber: 1 });

  // Filter State
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingList, setTrendingList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');

  // Selected product for detail view
  const [detailProduct, setDetailProduct] = useState(null);

  // Autocomplete fetcher with debounce
  useEffect(() => {
    if (!keyword.trim() || keyword.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productApi.getSuggestions(keyword.trim(), 6);
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await productApi.getTrending(8);
      if (res && res.data && Array.isArray(res.data)) {
        setTrendingList(res.data);
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    }
  };

  const handleSearch = async (targetPage = page, customKeyword = null) => {
    setShowSuggestions(false);
    setLoading(true);
    const searchKw = customKeyword !== null ? customKeyword : keyword;
    try {
      const params = {
        keyword: searchKw.trim() || undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        status: 'ACTIVE',
        page: targetPage,
        size: size,
        sortBy: sortBy,
        sortDirection: sortDirection,
      };

      const res = await productApi.filter(params);
      setLastResponse(res);
      setProducts(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
      // Refresh trending leaderboard
      if (searchKw.trim()) {
        fetchTrending();
      }
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi tìm kiếm sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggest) => {
    setKeyword(suggest);
    setShowSuggestions(false);
    handleSearch(0, suggest);
  };

  const handleSelectTrending = (tagKeyword) => {
    setKeyword(tagKeyword);
    setShowSuggestions(false);
    handleSearch(0, tagKeyword);
  };

  useEffect(() => {
    fetchCategories();
    fetchTrending();
  }, []);

  useEffect(() => {
    handleSearch(0);
  }, [selectedCategory, sortBy, sortDirection, size]);

  const handleResetFilter = () => {
    setKeyword('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortDirection('DESC');
    setPage(0);
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Keyword Search Input with Autocomplete */}
          <div className="md:col-span-6 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  handleSearch(0);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Gõ từ khóa để test Autocomplete (VD: 'iph', 'ban', 'chuot')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    Redis ZSET Autocomplete
                  </span>
                  <span className="text-emerald-400">&lt; 2ms RAM</span>
                </div>
                <div className="py-1">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                        <span>{item}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-300">
                        Chọn ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">-- Tất cả danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              onClick={() => handleSearch(0)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/30"
            >
              <Search className="w-4 h-4" />
              Tìm kiếm
            </button>
            <button
              onClick={handleResetFilter}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition"
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trending Keywords Bar */}
        {trendingList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/40 text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <span>🔥</span>
              <span>Xu hướng tìm kiếm:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {trendingList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTrending(item.keyword)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 transition flex items-center gap-1.5 group"
                >
                  <span className="font-medium">{item.keyword}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 group-hover:bg-amber-500/30 text-slate-400 group-hover:text-amber-200 font-mono">
                    {item.searchCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extended Price Filter & Sorting Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/60 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Giá tối thiểu (VNĐ)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="VD: 5000000"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Giá tối đa (VNĐ)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="VD: 30000000"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Sắp xếp theo</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="createdAt">Mới nhất (Ngày tạo)</option>
              <option value="originalPrice">Giá sản phẩm</option>
              <option value="name">Tên A-Z</option>
              <option value="totalStock">Tồn kho</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Chiều sắp xếp</label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="DESC">Giảm dần (Cao xuống thấp)</option>
              <option value="ASC">Tăng dần (Thấp lên cao)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">
          Tìm thấy <span className="font-bold text-slate-100 font-mono">{meta.total}</span> sản phẩm phù hợp
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Hiển thị mỗi trang:</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value));
              setPage(0);
            }}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Đang tải sản phẩm từ FlashDeal API...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl text-center text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h4 className="text-base font-semibold text-slate-300">Không tìm thấy sản phẩm nào!</h4>
          <p className="text-xs text-slate-500 mt-1">
            Hãy thử nới lỏng bộ lọc giá hoặc sang Tab "Quản Lý Sản Phẩm" bấm Random Data để tạo thêm sản phẩm mẫu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300 flex flex-col group"
            >
              {/* Product Image */}
              <div className="relative aspect-video sm:aspect-square bg-slate-900 overflow-hidden">
                <img
                  src={product.imageUrl || 'https://placehold.co/400x400?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x400?text=No+Image';
                  }}
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur text-indigo-300 border border-slate-700">
                  {product.category?.name || 'Sản phẩm'}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Kho: {product.totalStock}
                </span>
              </div>

              {/* Product Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm line-clamp-2 group-hover:text-indigo-400 transition mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                      Giá niêm yết
                    </span>
                    <span className="text-base font-extrabold text-amber-400 font-mono">
                      {formatVND(product.originalPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => setDetailProduct(product)}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.pageOfNumber > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => {
              const prev = Math.max(0, page - 1);
              setPage(prev);
              handleSearch(prev);
            }}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Trang trước
          </button>

          <span className="px-4 py-2 text-xs font-mono font-bold text-indigo-400 bg-slate-800 border border-slate-700 rounded-xl">
            Trang {meta.page} / {meta.pageOfNumber}
          </span>

          <button
            onClick={() => {
              const next = Math.min(meta.pageOfNumber - 1, page + 1);
              setPage(next);
              handleSearch(next);
            }}
            disabled={page >= meta.pageOfNumber - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Trang sau
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">Chi Tiết Sản Phẩm</h3>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>
            <img
              src={detailProduct.imageUrl || 'https://placehold.co/400x400?text=No+Image'}
              alt={detailProduct.name}
              className="w-full h-48 object-cover rounded-xl bg-slate-950"
            />
            <div>
              <h4 className="font-bold text-lg text-slate-100">{detailProduct.name}</h4>
              <p className="text-xs text-indigo-400 font-mono">Slug: {detailProduct.slug}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 py-2 text-xs">
              <div className="bg-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Giá niêm yết:</span>
                <span className="font-bold text-amber-400 text-base">{formatVND(detailProduct.originalPrice)}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Tồn kho hiện tại:</span>
                <span className="font-bold text-emerald-400 text-base">{detailProduct.totalStock} chiếc</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl leading-relaxed">
              {detailProduct.description || 'Chưa có mô tả'}
            </p>
            <button
              onClick={() => setDetailProduct(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
