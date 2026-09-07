import React, { useState, useEffect } from 'react';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';
import { flashSaleApi } from '../api/flashSaleApi';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { getRandomCampaign } from '../utils/mockGenerator';
import Breadcrumb from './Breadcrumb';
import {
  LayoutDashboard,
  Zap,
  Package,
  Layers,
  ShoppingBag,
  Server,
  Cpu,
  Database,
  Plus,
  Dices,
  RefreshCw,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  Crown,
  Truck,
  XCircle,
  Search,
  PackageCheck,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard({ setLastResponse, showToast, onSelectProduct, activeUser, onNavigate }) {
  const isAdmin = activeUser?.role === 'ROLE_ADMIN';

  // 1. Kiem tra phan quyen: Neu chua dang nhap
  if (!activeUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-700">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase font-mono">
            401 UNAUTHORIZED
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-3 mb-2">
            Yêu Cầu Đăng Nhập Tài Khoản Quản Trị Viên
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            Khu vực Quản Trị Hệ Thống yêu cầu quyền <strong>ROLE_ADMIN</strong>. Vui lòng đăng nhập với tài khoản Admin để tiếp tục.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Đi Đến Trang Đăng Nhập Admin
            </button>
            <button
              onClick={() => onNavigate('storefront')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
            >
              Về Sàn Sản Phẩm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Kiem tra phan quyen: Neu da dang nhap nhung chi la ROLE_CUSTOMER
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 uppercase font-mono border border-red-200">
            403 FORBIDDEN - QUYỀN TRUY CẬP BỊ TỪ CHỐI
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-3 mb-2">
            Bạn Không Có Quyền Quản Trị Viên (Admin)
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Tài khoản hiện tại của bạn (<strong>{activeUser.email}</strong>) chỉ có vai trò Khách Hàng (<strong>{activeUser.role}</strong>).
            Chỉ tài khoản Quản Trị Viên (<strong>ROLE_ADMIN</strong>) mới có quyền thêm, sửa, xóa sản phẩm và tạo chiến dịch Flash Sale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Chuyển Sang Tài Khoản Admin (admin@flashdeal.vn)
            </button>
            <button
              onClick={() => onNavigate('storefront')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
            >
              Về Sàn Mua Sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Neu la ROLE_ADMIN -> Render toan bo Admin Dashboard
  const [adminTab, setAdminTab] = useState('overview');
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    campaignsCount: 0,
    ordersCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [updatingOrderCode, setUpdatingOrderCode] = useState(null);

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });

  const [productForm, setProductForm] = useState({
    campaignId: '',
    productId: '',
    productName: '',
    originalPrice: 30000000,
    flashSalePrice: 15000000,
    flashSaleStock: 100,
  });

  const handleAdminUpdateOrderStatus = async (orderCode, newStatus) => {
    const statusLabels = {
      SHIPPING: 'ĐANG GIAO HÀNG (Xuất kho giao cho shipper)',
      DELIVERED: 'ĐÃ GIAO HÀNG (Hoàn tất giao thành công)',
      CANCELLED: 'HỦY ĐƠN HÀNG (Tự động hoàn tồn kho vào Redis & PostgreSQL)',
    };
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn [${orderCode}] sang: ${statusLabels[newStatus] || newStatus}?`)) {
      return;
    }
    setUpdatingOrderCode(orderCode);
    try {
      const res = await flashSaleApi.updateOrderStatusByAdmin(orderCode, newStatus);
      showToast(`Đã chuyển đơn [${orderCode}] sang trạng thái [${newStatus}] thành công!`, 'success');
      setLastResponse(res);
      fetchDashboardStats();
    } catch (err) {
      showToast(`Lỗi khi cập nhật trạng thái đơn: ${err.message}`, 'error');
      setLastResponse(err);
    } finally {
      setUpdatingOrderCode(null);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, campRes] = await Promise.all([
        productApi.filter({ page: 0, size: 100 }),
        categoryApi.getAll(),
        flashSaleApi.getAllCampaigns(),
      ]);

      const prods = prodRes.data || [];
      const cats = catRes.data || [];
      const camps = campRes.data || [];

      setProductsList(prods);
      setCampaigns(camps);

      let orders = [];
      try {
        const orderRes = await flashSaleApi.getAllOrdersForAdmin();
        orders = orderRes.data || [];
        setAllOrders(orders);
      } catch (err) {
        console.error('Error fetching admin orders:', err);
      }

      setStats({
        productsCount: prodRes.meta?.totalElements || prods.length,
        categoriesCount: cats.length,
        campaignsCount: camps.length,
        ordersCount: orders.length,
      });

      setLastResponse(campRes);
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi khi tải dữ liệu thống kê', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRandomCampaign = () => {
    const random = getRandomCampaign();
    setCampaignForm(random);
    showToast('Đã tạo ngẫu nhiên thông tin Chiến dịch Flash Sale!', 'info');
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.startTime || !campaignForm.endTime) {
      showToast('Vui lòng điền đầy đủ tiêu đề và thời gian', 'error');
      return;
    }
    try {
      const res = await flashSaleApi.createCampaign(campaignForm);
      setLastResponse(res);
      showToast('Tạo chiến dịch Flash Sale thành công!', 'success');
      setCampaignForm({ title: '', startTime: '', endTime: '' });
      fetchDashboardStats();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  const handleAddProductToCampaign = async (e) => {
    e.preventDefault();
    if (!productForm.campaignId || !productForm.productId) {
      showToast('Vui lòng chọn chiến dịch và sản phẩm', 'error');
      return;
    }
    try {
      const selectedProd = productsList.find((p) => String(p.id) === String(productForm.productId));
      const payload = {
        productId: Number(productForm.productId),
        productName: selectedProd?.name || productForm.productName || 'Sản phẩm Flash Sale',
        originalPrice: selectedProd?.originalPrice || productForm.originalPrice,
        flashSalePrice: productForm.flashSalePrice,
        flashSaleStock: Number(productForm.flashSaleStock),
      };
      const res = await flashSaleApi.addProductToCampaign(productForm.campaignId, payload);
      setLastResponse(res);
      showToast('Thêm sản phẩm vào Flash Sale & Nạp kho Redis thành công!', 'success');
      fetchDashboardStats();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  const handleDeleteCampaign = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chiến dịch "${title}" (ID: ${id})?`)) return;
    try {
      const res = await flashSaleApi.deleteCampaign(id);
      setLastResponse(res);
      showToast(`Đã xóa chiến dịch "${title}" thành công!`, 'success');
      fetchDashboardStats();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  const formatPrice = (p) => {
    if (p == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  const breadcrumbItems = [
    { label: 'Trang chủ' },
    { label: 'Cổng Quản Trị Hệ Thống (ROLE_ADMIN)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Admin Portal Header (VinUni / Corporate Deep Navy) */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 mb-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-amber-500/40">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Đăng nhập với quyền Quản Trị Viên (ROLE_ADMIN)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trung Tâm Quản Trị Microservices & Hạ Tầng FlashDeal
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              Quản trị tập trung <strong>Chiến dịch Flash Sale</strong>, kiểm soát <strong>Tồn kho RAM Redis</strong>,
              quản lý <strong>Danh mục & Sản phẩm</strong>, và giám sát luồng dữ liệu <strong>Apache Kafka</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm Mới Số Liệu
            </button>
            <a
              href="http://localhost:8085"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Kafka UI (:8085)
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* 4 KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Sản Phẩm Trong DB</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.productsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">PostgreSQL product_db</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Danh Mục Ngành Hàng</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.categoriesCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Phân cấp & Bảo toàn SP</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Chiến Dịch Flash Sale</span>
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-extrabold text-red-400 font-mono">{stats.campaignsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Nạp kho Redis &lt; 1.5ms</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Hạ Tầng Microservices</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              5 Modules Online
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Gateway, Auth, Prod, Order</div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            adminTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng Quan & Quản Trị Flash Sale</span>
        </button>

        <button
          onClick={() => setAdminTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            adminTab === 'products'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Quản Trị Sản Phẩm & Cache</span>
        </button>

        <button
          onClick={() => setAdminTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            adminTab === 'categories'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Quản Trị Danh Mục</span>
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            adminTab === 'orders'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Quản Trị Đơn Hàng ({allOrders.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: OVERVIEW & FLASHSALE CONTROL CENTER */}
      {adminTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form 1: Create Campaign */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-900" />
                  1. Tạo Chiến Dịch Flash Sale Mới
                </h3>
                <button
                  type="button"
                  onClick={handleRandomCampaign}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Random Data
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiêu đề chiến dịch *</label>
                  <input
                    type="text"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    placeholder="Ví dụ: Giờ Vàng Săn Siêu Phẩm Công Nghệ Giảm 50%"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.startTime}
                      onChange={(e) => setCampaignForm({ ...campaignForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thời gian kết thúc *</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.endTime}
                      onChange={(e) => setCampaignForm({ ...campaignForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg transition text-xs shadow-xs"
                >
                  Tạo Chiến Dịch Flash Sale
                </button>
              </form>
            </div>

            {/* Form 2: Add Product to Campaign & Pre-heat */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-900" />
                  2. Thêm Sản Phẩm & Pre-heat Kho Redis
                </h3>
              </div>

              <form onSubmit={handleAddProductToCampaign} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn Chiến Dịch *</label>
                  <select
                    value={productForm.campaignId}
                    onChange={(e) => setProductForm({ ...productForm, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  >
                    <option value="">-- Chọn chiến dịch Flash Sale --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.title} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn Sản Phẩm Từ Database *</label>
                  <select
                    value={productForm.productId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const p = productsList.find((item) => String(item.id) === String(prodId));
                      setProductForm({
                        ...productForm,
                        productId: prodId,
                        productName: p ? p.name : '',
                        originalPrice: p ? p.originalPrice : 30000000,
                        flashSalePrice: p ? Math.round(p.originalPrice * 0.5) : 15000000,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  >
                    <option value="">-- Chọn sản phẩm có sẵn --</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.name} ({formatPrice(p.originalPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Giá Flash Sale (VNĐ) *</label>
                    <input
                      type="number"
                      value={productForm.flashSalePrice}
                      onChange={(e) => setProductForm({ ...productForm, flashSalePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Lượng Mở Bán Sale *</label>
                    <input
                      type="number"
                      value={productForm.flashSaleStock}
                      onChange={(e) => setProductForm({ ...productForm, flashSaleStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition text-xs shadow-xs"
                >
                  ⚡ Thêm Vào Sale & Nạp Kho Redis (Pre-heat)
                </button>
              </form>
            </div>
          </div>

          {/* Active Campaigns Management Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-600" />
                <span>Danh Sách Chiến Dịch Flash Sale & Tồn Kho RAM Redis</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                  {campaigns.length} Đợt
                </span>
              </h3>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Chưa có chiến dịch Flash Sale nào được tạo.
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-5 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500 font-bold">#{c.id}</span>
                          <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            c.status === 'ONGOING' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Thời gian: {new Date(c.startTime).toLocaleString('vi-VN')} - {new Date(c.endTime).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(c.id, c.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-slate-200 hover:border-red-300 text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa Chiến Dịch
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-bold text-slate-700 mb-2">Sản phẩm trong đợt sale:</div>
                      {(!c.products || c.products.length === 0) ? (
                        <div className="text-xs text-slate-400 italic">Chưa có sản phẩm nào được gán vào chiến dịch này.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3">Sản phẩm</th>
                                <th className="py-2 px-3">Giá Gốc</th>
                                <th className="py-2 px-3">Giá Flash Sale</th>
                                <th className="py-2 px-3 text-center">Tổng Suất Mở</th>
                                <th className="py-2 px-3 text-center">Tồn Kho RAM Redis</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60">
                              {c.products.map((p) => {
                                const redisStock = p.redisStock != null ? p.redisStock : p.availableStock;
                                return (
                                  <tr key={p.id} className="hover:bg-white transition">
                                    <td className="py-2 px-3 font-medium text-slate-900">{p.productName}</td>
                                    <td className="py-2 px-3 text-slate-500 line-through">{formatPrice(p.originalPrice)}</td>
                                    <td className="py-2 px-3 font-bold text-red-700">{formatPrice(p.flashSalePrice)}</td>
                                    <td className="py-2 px-3 text-center font-mono">{p.flashSaleStock}</td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                                        redisStock <= 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {redisStock} suất
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PRODUCT MANAGEMENT */}
      {adminTab === 'products' && (
        <ProductManager
          setLastResponse={setLastResponse}
          showToast={showToast}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* SUB-VIEW 3: CATEGORY MANAGEMENT */}
      {adminTab === 'categories' && (
        <CategoryManager
          setLastResponse={setLastResponse}
          showToast={showToast}
        />
      )}

      {/* SUB-VIEW 4: ALL ORDERS MONITOR & MANAGEMENT */}
      {adminTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Quản Trị Đơn Hàng Toàn Hệ Thống (order_db)</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono font-bold">
                  {allOrders.length} đơn
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem toàn bộ đơn hàng của khách hàng, theo dõi tiến trình và cập nhật trạng thái (Giao hàng ➔ Hoàn tất ➔ Hủy đơn).
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Làm Mới
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Status Tabs & Search Box */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'ALL', label: 'Tất Cả', count: allOrders.length },
                { id: 'PENDING', label: 'Chờ Thanh Toán', count: allOrders.filter((o) => o.status === 'PENDING').length },
                { id: 'PAID', label: 'Đang Chuẩn Bị', count: allOrders.filter((o) => o.status === 'PAID').length },
                { id: 'SHIPPING', label: 'Đang Giao', count: allOrders.filter((o) => o.status === 'SHIPPING').length },
                { id: 'DELIVERED', label: 'Đã Nhận', count: allOrders.filter((o) => o.status === 'DELIVERED').length },
                { id: 'CANCELLED', label: 'Đã Hủy', count: allOrders.filter((o) => o.status === 'CANCELLED').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    orderFilterStatus === tab.id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      orderFilterStatus === tab.id
                        ? 'bg-blue-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Tìm theo mã đơn, user, sản phẩm..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Orders Table */}
          {allOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Chưa có đơn hàng nào trong hệ thống.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Tổng Tiền</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4 text-center">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {allOrders
                    .filter((o) => {
                      const matchStatus =
                        orderFilterStatus === 'ALL' || o.status === orderFilterStatus;
                      const q = orderSearchQuery.toLowerCase();
                      const matchQuery =
                        !q ||
                        o.orderCode?.toLowerCase().includes(q) ||
                        String(o.userId).includes(q) ||
                        o.items?.some((i) => i.productName?.toLowerCase().includes(q));
                      return matchStatus && matchQuery;
                    })
                    .map((order) => {
                      const isUpdating = updatingOrderCode === order.orderCode;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">
                            {order.orderCode}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            #{order.userId}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                            <div className="truncate" title={order.items?.map((i) => i.productName).join(', ')}>
                              {order.items?.map((i) => i.productName).join(', ') || 'Sản phẩm Flash Sale'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {order.shippingAddress || 'Địa chỉ mặc định'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                                order.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : order.status === 'PAID'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : order.status === 'SHIPPING'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : order.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {order.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-700" />}
                              {order.status === 'PAID' && <PackageCheck className="w-3 h-3 text-blue-700" />}
                              {order.status === 'SHIPPING' && <Truck className="w-3 h-3 text-purple-700" />}
                              {order.status === 'DELIVERED' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                              {order.status === 'CANCELLED' && <XCircle className="w-3 h-3 text-slate-500" />}
                              
                              {order.status === 'PENDING'
                                ? 'CHỜ THANH TOÁN'
                                : order.status === 'PAID'
                                ? 'ĐANG CHUẨN BỊ'
                                : order.status === 'SHIPPING'
                                ? 'ĐANG GIAO HÀNG'
                                : order.status === 'DELIVERED'
                                ? 'ĐÃ NHẬN HÀNG'
                                : 'ĐÃ HỦY (HOÀN KHO)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Nếu là PAID -> Cho phép Admin chuyển sang SHIPPING */}
                              {order.status === 'PAID' && (
                                <button
                                  onClick={() => handleAdminUpdateOrderStatus(order.orderCode, 'SHIPPING')}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition shadow-xs disabled:opacity-50"
                                  title="Xuất kho và chuyển sang trạng thái Đang giao hàng"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Giao Hàng</span>
                                </button>
                              )}

                              {/* Nếu là SHIPPING -> Cho phép Admin chuyển sang DELIVERED */}
                              {order.status === 'SHIPPING' && (
                                <button
                                  onClick={() => handleAdminUpdateOrderStatus(order.orderCode, 'DELIVERED')}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs disabled:opacity-50"
                                  title="Xác nhận hoàn tất giao hàng thành công"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Hoàn Tất Giao</span>
                                </button>
                              )}

                              {/* Cho phép Hủy đơn (nếu chưa hoàn tất giao) */}
                              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleAdminUpdateOrderStatus(order.orderCode, 'CANCELLED')}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium text-[11px] transition disabled:opacity-50"
                                  title="Hủy đơn và hoàn tồn kho"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Hủy</span>
                                </button>
                              )}

                              {order.status === 'DELIVERED' && (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã Hoàn Tất
                                </span>
                              )}

                              {order.status === 'CANCELLED' && (
                                <span className="text-[11px] text-slate-400 italic">
                                  Đã Đóng
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
