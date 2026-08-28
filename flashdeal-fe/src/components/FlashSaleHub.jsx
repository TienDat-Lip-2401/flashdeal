import React, { useState, useEffect } from 'react';
import { flashSaleApi } from '../api/flashSaleApi';
import { productApi } from '../api/productApi';
import { getRandomCampaign } from '../utils/mockGenerator';
import Breadcrumb from './Breadcrumb';
import {
  Zap,
  Timer,
  ShoppingBag,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  Dices,
  RefreshCw,
  Cpu,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lock,
  Crown,
  CreditCard,
  History
} from 'lucide-react';

// Real-time Countdown Timer Component (15:00 -> 00:00)
function OrderCountdown({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('--:--');
      return;
    }

    const updateTimer = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        if (onExpired) onExpired();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <Clock className="w-3 h-3 text-rose-600" />
        Hết hạn thanh toán
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300">
      <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
      Còn lại: {timeLeft}
    </span>
  );
}

export default function FlashSaleHub({ setLastResponse, showToast, onSelectProduct, activeUser, onNavigate }) {
  const isAdmin = activeUser?.role === 'ROLE_ADMIN';
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'my-orders' | 'admin-campaign'
  const [campaigns, setCampaigns] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [latestSuccessOrder, setLatestSuccessOrder] = useState(null);

  // Form State for Admin Campaign Creation
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });

  // Form State for Adding Product to Campaign
  const [productForm, setProductForm] = useState({
    campaignId: '',
    productId: '',
    productName: '',
    originalPrice: 30000000,
    flashSalePrice: 15000000,
    flashSaleStock: 100,
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await flashSaleApi.getAllCampaigns();
      setLastResponse(res);
      setCampaigns(res.data || []);
    } catch (err) {
      setLastResponse(err);
      showToast(err.message || 'Lỗi khi tải chiến dịch Flash Sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!activeUser) return;
    try {
      const res = await flashSaleApi.getMyOrders();
      setLastResponse(res);
      setMyOrders(res.data || []);
    } catch (err) {
      setLastResponse(err);
      if (err.code === 1004) {
        showToast('Vui lòng đăng nhập ở Tab "Tài Khoản" để xem đơn hàng đã săn', 'warning');
      } else {
        showToast(err.message || 'Lỗi tải đơn hàng', 'error');
      }
    }
  };

  const fetchProductsForSelect = async () => {
    try {
      const res = await productApi.filter({ page: 0, size: 50 });
      setProductsList(res.data || []);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProductsForSelect();
    if (activeUser) {
      fetchMyOrders();
    }
  }, [activeUser]);

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
      const formatTime = (t) => (t && t.length === 16 ? `${t}:00` : t);
      const payload = {
        title: campaignForm.title,
        startTime: formatTime(campaignForm.startTime),
        endTime: formatTime(campaignForm.endTime),
      };
      const res = await flashSaleApi.createCampaign(payload);
      setLastResponse(res);
      showToast('Tạo chiến dịch Flash Sale thành công!', 'success');
      setCampaignForm({ title: '', startTime: '', endTime: '' });
      fetchCampaigns();
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
      fetchCampaigns();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    }
  };

  // High Concurrency Săn Deal Action (Checked RBAC)
  const handleBuyFlashSale = async (campaignId, productId, defaultName = '') => {
    if (!activeUser) {
      showToast('Vui lòng Đăng Nhập tài khoản để tham gia Săn Deal Flash Sale!', 'warning');
      if (onNavigate) onNavigate('auth');
      return;
    }

    setBuyingId(productId);
    const startTime = performance.now();
    try {
      const payload = {
        campaignId,
        productId,
        shippingAddress: activeUser.address || 'Tòa nhà VinUni, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
        phone: activeUser.phone || '0988668899',
      };
      const res = await flashSaleApi.createOrder(payload);
      const elapsed = Math.round(performance.now() - startTime);

      setLastResponse(res);
      setLatestSuccessOrder({
        ...res.data,
        elapsedTime: elapsed,
        productName: defaultName || 'Sản phẩm Flash Sale',
      });

      showToast(`⚡ SĂN DEAL THÀNH CÔNG! Mã đơn [${res.data?.orderCode}] (Xử lý trong ${elapsed}ms)`, 'success');
      fetchCampaigns();
      fetchMyOrders();
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setLastResponse(err);
      if (err.code === 3004) {
        showToast(`❌ HẾT HÀNG FLASH SALE! (Redis phản hồi trong ${elapsed}ms)`, 'error');
      } else if (err.code === 3005) {
        showToast(`⚠️ Bạn đã săn sản phẩm này rồi! Mỗi tài khoản chỉ được mua 1 lần.`, 'warning');
      } else {
        showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
      }
    } finally {
      setBuyingId(null);
    }
  };

  const handlePayOrder = async (orderCode) => {
    try {
      const res = await flashSaleApi.payOrder(orderCode);
      setLastResponse(res);
      showToast(`Thanh toán đơn hàng [${orderCode}] thành công! Trạng thái: PAID`, 'success');
      fetchMyOrders();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi thanh toán: ${err.message}`, 'error');
    }
  };

  const handleCancelOrder = async (orderCode) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn hàng ${orderCode}? Tồn kho sẽ được tự động hoàn lại vào Redis!`)) return;
    try {
      const res = await flashSaleApi.cancelOrder(orderCode);
      setLastResponse(res);
      showToast(`Đã hủy đơn ${orderCode} và hoàn kho vào Redis thành công!`, 'success');
      fetchMyOrders();
      fetchCampaigns();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  const handleTriggerCancelExpired = async () => {
    try {
      const res = await flashSaleApi.triggerCancelExpired();
      setLastResponse(res);
      showToast(`Đã kích hoạt quét hủy đơn quá hạn! Số lượng đơn hủy: ${res.data}`, 'info');
      fetchMyOrders();
      fetchCampaigns();
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
    { label: 'Sàn Săn Deal Flash Sale' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero Header (VinUni / Corporate Deep Navy Style) */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 mb-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 fill-white" />
              Sàn Săn Deal Tốc Độ Cao
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Flash Sale High-Concurrency Engine (50.000 req/s)
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              Trải nghiệm cơ chế đặt hàng nguyên tử với <strong>Redis Lua Script Fast-Gate (&lt; 1.5ms)</strong>,
              tự động hủy đơn quá hạn <strong>15 phút & hoàn kho tức thì</strong>, điều phối hàng đợi qua <strong>Kafka Pipeline</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sàn Săn Deal Trực Tiếp
            </button>

            {activeUser && (
              <button
                onClick={() => {
                  setActiveTab('my-orders');
                  fetchMyOrders();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'my-orders'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Đơn Hàng Của Tôi ({myOrders.length})
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin-campaign')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'admin-campaign'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo Đợt Sale (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Notice */}
      {!activeUser && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Bạn đang xem với tư cách Khách. Vui lòng đăng nhập để có thể tham gia <strong>Săn Deal Flash Sale</strong>!</span>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('auth')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 transition"
          >
            Đăng Nhập Ngay →
          </button>
        </div>
      )}

      {/* Success Order Confirmation Banner */}
      {latestSuccessOrder && (
        <div className="mb-8 p-6 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-emerald-900">SĂN DEAL THÀNH CÔNG!</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-mono">
                    ⚡ Phản hồi: {latestSuccessOrder.elapsedTime}ms
                  </span>
                </div>
                <div className="text-sm font-semibold text-emerald-900 mt-1">
                  Mã đơn hàng: <code className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{latestSuccessOrder.orderCode}</code>
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  Thời hạn thanh toán: <strong>15 phút</strong>. Quá 15 phút không thanh toán, hệ thống sẽ tự động hủy đơn và hoàn lại kho trên Redis.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('my-orders');
                fetchMyOrders();
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition"
            >
              Xem Chi Tiết Đơn Hàng →
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: SÀN SĂN DEAL FLASH SALE */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-slate-900">Chiến Dịch Flash Sale Đang Diễn Ra</h2>
            </div>
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm Mới Tồn Kho
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Timer className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Chưa có chiến dịch Flash Sale nào</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {isAdmin
                  ? 'Bạn có thể tạo nhanh một chiến dịch sale ở mục Quản Trị.'
                  : 'Hãy quay lại sau khi đợt Flash Sale mới được mở bán.'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin-campaign')}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 transition"
                >
                  + Tạo Chiến Dịch Flash Sale Mẫu
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Campaign Header Bar */}
                  <div className="bg-slate-900 text-white p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                      <div>
                        <h3 className="text-base font-bold text-white">{campaign.title}</h3>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Bắt đầu: {new Date(campaign.startTime).toLocaleTimeString('vi-VN')}</span>
                          <span>-</span>
                          <span>Kết thúc: {new Date(campaign.endTime).toLocaleTimeString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                        campaign.status === 'ONGOING'
                          ? 'bg-red-600 text-white'
                          : campaign.status === 'UPCOMING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {campaign.status === 'ONGOING' ? '🔥 ĐANG MỞ BÁN' : campaign.status === 'UPCOMING' ? '⏳ SẮP DIỄN RA' : 'ĐÃ KẾT THÚC'}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Products Grid */}
                  <div className="p-6">
                    {(!campaign.products || campaign.products.length === 0) ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Chiến dịch chưa có sản phẩm.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaign.products.map((item) => {
                          const redisStock = item.redisStock != null ? item.redisStock : item.availableStock;
                          const percentSold = Math.min(100, Math.round(((item.flashSaleStock - redisStock) / item.flashSaleStock) * 100));
                          const isSoldOut = redisStock <= 0;

                          return (
                            <div
                              key={item.id}
                              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                    GIẢM GIÁ SHOCK
                                  </span>
                                  <span className="text-xs font-mono text-slate-400">ID #{item.productId}</span>
                                </div>

                                <h4
                                  onClick={() => onSelectProduct(item.productId)}
                                  className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-900 cursor-pointer transition mb-2"
                                  title="Bấm để xem trang chi tiết sản phẩm"
                                >
                                  {item.productName}
                                </h4>

                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-xl font-extrabold text-red-700">
                                    {formatPrice(item.flashSalePrice)}
                                  </span>
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatPrice(item.originalPrice)}
                                  </span>
                                </div>

                                {/* Live Redis Stock Progress Bar */}
                                <div className="space-y-1.5 mb-4">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Cpu className="w-3 primary-blue" />
                                      Tồn kho RAM Redis:
                                    </span>
                                    <span className={isSoldOut ? 'text-red-600 font-bold' : 'text-blue-900 font-bold'}>
                                      {isSoldOut ? 'HẾT HÀNG' : `Còn ${redisStock}/${item.flashSaleStock} suất`}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${isSoldOut ? 'bg-slate-400' : 'bg-red-600'}`}
                                      style={{ width: `${percentSold}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 text-right">
                                    Đã bán {percentSold}%
                                  </div>
                                </div>
                              </div>

                              {/* Buy Flash Sale Action */}
                              <button
                                type="button"
                                disabled={campaign.status !== 'ONGOING' || isSoldOut || buyingId === item.productId}
                                onClick={() => handleBuyFlashSale(campaign.id, item.productId, item.productName)}
                                className={`w-full py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                                  campaign.status === 'UPCOMING'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-300 cursor-not-allowed'
                                    : campaign.status === 'ENDED' || isSoldOut
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-red-700 hover:bg-red-800 text-white active:scale-98'
                                }`}
                              >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                {buyingId === item.productId
                                  ? 'Đang chạy Lua Script...'
                                  : campaign.status === 'UPCOMING'
                                  ? '⏳ CHƯA ĐẾN GIỜ MỞ BÁN'
                                  : campaign.status === 'ENDED'
                                  ? 'ĐÃ KẾT THÚC ĐỢT SALE'
                                  : isSoldOut
                                  ? 'ĐÃ HẾT HÀNG'
                                  : activeUser
                                  ? '⚡ SĂN DEAL NGAY (< 5ms)'
                                  : 'Đăng Nhập Để Săn Deal'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LỊCH SỬ ĐƠN HÀNG CỦA TÔI & COUNTDOWN TIMEOUT ENGINE */}
      {activeTab === 'my-orders' && activeUser && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">Lịch Sử Đơn Hàng Săn Deal Flash Sale</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các đơn hàng ở trạng thái <strong>PENDING</strong> có thời hạn thanh toán <strong>15 phút</strong>. Quá 15 phút sẽ tự động hủy và hoàn kho.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerCancelExpired}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition"
                title="Kích hoạt thủ công Động cơ quét & hủy đơn quá hạn 15 phút"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Quét Hủy Đơn Quá Hạn (Test Cron)
              </button>

              <button
                onClick={fetchMyOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tải Lại
              </button>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Bạn chưa có đơn hàng Flash Sale nào. Hãy thử bấm "Săn Deal Ngay" ở Tab Sàn Flash Sale!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn Hàng</th>
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-4">Tổng tiền</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Hạn Thanh Toán (Countdown)</th>
                    <th className="py-3 px-4">Thời gian tạo</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {order.orderCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {order.items && order.items.length > 0
                          ? order.items.map((i) => i.productName).join(', ')
                          : 'Sản phẩm Flash Sale'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          order.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : order.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {order.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {order.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                          {order.status === 'PENDING' ? 'CHỜ THANH TOÁN' : order.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'ĐÃ HỦY (HOÀN KHO)'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.status === 'PENDING' ? (
                          <OrderCountdown
                            expiresAt={order.expiresAt}
                            onExpired={() => {
                              fetchMyOrders();
                              fetchCampaigns();
                            }}
                          />
                        ) : order.status === 'PAID' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold">Đã hoàn tất</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Đã giải phóng kho</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePayOrder(order.orderCode)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition text-xs shadow-xs"
                                title="Giả lập thanh toán đơn hàng thành công"
                              >
                                <CreditCard className="w-3 h-3" />
                                Thanh Toán
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order.orderCode)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-red-50 text-red-700 hover:text-red-800 border border-slate-200 hover:border-red-300 font-semibold transition"
                                title="Hủy đơn hàng và tự động hoàn lại tồn kho vào Redis"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Hủy
                              </button>
                            </>
                          )}

                          {order.status === 'PAID' && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Thành Công
                            </span>
                          )}

                          {order.status === 'CANCELLED' && (
                            <span className="text-slate-400 text-xs italic">
                              Đã hoàn kho
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN TẠO CHIẾN DỊCH & NẠP KHO REDIS */}
      {activeTab === 'admin-campaign' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Campaign Form */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-900" />
                Tạo Chiến Dịch Flash Sale Mới
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
                  placeholder="Ví dụ: Đại Tiệc Siêu Bão Công Nghệ Giảm 50%"
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
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg transition text-xs shadow-sm"
              >
                Tạo Chiến Dịch Flash Sale
              </button>
            </form>
          </div>

          {/* Add Product To Campaign Form */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-900" />
                Thêm Sản Phẩm & Pre-heat Kho Redis
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
                className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition text-xs shadow-sm"
              >
                ⚡ Thêm Vào Sale & Nạp Kho Redis (Pre-heat)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
