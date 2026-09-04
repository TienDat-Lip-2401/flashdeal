import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CreditCard,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  User,
  FileText,
  X,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { flashSaleApi } from '../api/flashSaleApi';
import { paymentApi } from '../api/paymentApi';
import Breadcrumb from './Breadcrumb';

// Component đồng hồ đếm ngược 15 phút Real-time cho từng đơn hàng
function OrderCountdown({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!expiresAt) return { total: 0, minutes: 0, seconds: 0 };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { total: 0, minutes: 0, seconds: 0 };
    return {
      total: diff,
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
        if (onExpired) onExpired();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft.total <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
        <XCircle className="w-3 h-3" />
        Đã quá hạn (Chờ hoàn kho)
      </span>
    );
  }

  const isUrgent = timeLeft.minutes < 3;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-xs font-bold border transition ${
        isUrgent
          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
          : 'bg-amber-50 text-amber-800 border-amber-300'
      }`}
      title="Đơn hàng sẽ tự động bị hủy và hoàn lại tồn kho vào Redis sau thời gian này"
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
      <span>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
      {isUrgent && <span className="text-[10px] text-red-500 font-sans font-semibold ml-0.5">(Sắp hết hạn!)</span>}
    </span>
  );
}

export default function MyOrders({ setLastResponse, showToast, activeUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [processingCode, setProcessingCode] = useState(null);
  const [isVnpayLoading, setIsVnpayLoading] = useState(false);

  const fetchOrders = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const res = await flashSaleApi.getMyOrders();
      setOrders(res.data || []);
      if (setLastResponse) setLastResponse(res);
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Không thể tải danh sách đơn hàng: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Tiếp nhận và xử lý kết quả khi VNPAY redirect về /orders
    const searchParams = new URLSearchParams(window.location.search);
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const vnpTxnRef = searchParams.get('vnp_TxnRef');

    if (vnpResponseCode) {
      const params = {};
      searchParams.forEach((val, key) => {
        params[key] = val;
      });

      paymentApi.handleVNPayCallback(params)
        .then((res) => {
          if (vnpResponseCode === '00' || res?.success) {
            showToast(`🎉 Thanh toán VNPAY thành công cho đơn hàng [${vnpTxnRef}]! Đơn đã chuyển sang PAID và email biên lai đã được gửi!`, 'success');
          } else {
            showToast(`Giao dịch VNPAY không thành công hoặc bị hủy (Mã lỗi: ${vnpResponseCode})`, 'error');
          }
        })
        .catch((err) => {
          showToast(`Lỗi xác thực phản hồi VNPAY: ${err.message}`, 'error');
        })
        .finally(() => {
          navigate('/orders', { replace: true });
          fetchOrders();
        });
    }
  }, [activeUser]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép: ${code}`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVNPayPayment = async (order) => {
    setIsVnpayLoading(true);
    try {
      const res = await paymentApi.createVNPayPaymentUrl({
        orderCode: order.orderCode,
        amount: order.totalAmount,
        userId: activeUser?.id,
        email: activeUser?.email,
        orderInfo: `Thanh toan don hang FlashSale ${order.orderCode}`,
      });
      if (setLastResponse) setLastResponse(res);
      showToast('Đang chuyển hướng sang Cổng Thanh Toán VNPAY...', 'info');
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Không thể tạo liên kết VNPAY: ${err.message}`, 'error');
      setIsVnpayLoading(false);
    }
  };

  const handleSimulatePayment = async (orderCode) => {
    setProcessingCode(orderCode);
    try {
      const res = await paymentApi.simulatePayment(orderCode, activeUser?.email);
      if (setLastResponse) setLastResponse(res);
      showToast(`🎉 Thanh toán VNPAY thành công cho đơn [${orderCode}]! Đơn đã chuyển sang PAID và email biên lai đã được gửi!`, 'success');
      setSelectedOrderForPayment(null);
      fetchOrders();
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Lỗi thanh toán: ${err.message}`, 'error');
    } finally {
      setProcessingCode(null);
    }
  };

  const handlePayOrder = async (orderCode) => {
    setProcessingCode(orderCode);
    try {
      const res = await flashSaleApi.payOrder(orderCode);
      if (setLastResponse) setLastResponse(res);
      showToast(`⚡ Thanh toán đơn hàng [${orderCode}] thành công! Trạng thái: PAID`, 'success');
      setSelectedOrderForPayment(null);
      fetchOrders();
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Lỗi thanh toán: ${err.message}`, 'error');
    } finally {
      setProcessingCode(null);
    }
  };

  const handleCancelOrder = async (orderCode) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn hàng ${orderCode}?\nTồn kho Flash Sale sẽ được tự động hoàn lại vào Redis RAM ngay lập tức!`)) {
      return;
    }
    setProcessingCode(orderCode);
    try {
      const res = await flashSaleApi.cancelOrder(orderCode);
      if (setLastResponse) setLastResponse(res);
      showToast(`Đã hủy đơn ${orderCode} và hoàn lại tồn kho vào Redis thành công!`, 'success');
      fetchOrders();
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Lỗi khi hủy đơn: ${err.message}`, 'error');
    } finally {
      setProcessingCode(null);
    }
  };

  const handleTriggerCancelExpired = async () => {
    try {
      const res = await flashSaleApi.triggerCancelExpired();
      if (setLastResponse) setLastResponse(res);
      showToast(`Đã kích hoạt quét đơn quá hạn 15 phút! Số đơn đã hủy: ${res.data}`, 'info');
      fetchOrders();
    } catch (err) {
      if (setLastResponse) setLastResponse(err);
      showToast(`Lỗi quét đơn: ${err.message}`, 'error');
    }
  };

  const formatPrice = (p) => {
    if (p == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  // Filter orders by status and search query
  const filteredOrders = orders.filter((o) => {
    const matchStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'CANCELLED'
        ? o.status === 'CANCELLED' || o.status === 'EXPIRED'
        : o.status === filterStatus;

    const matchQuery =
      searchQuery.trim() === '' ||
      o.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some((i) => i.productName?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchQuery;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'EXPIRED').length;

  if (!activeUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Đăng Nhập Để Xem Đơn Hàng</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Bạn cần đăng nhập tài khoản khách hàng để theo dõi danh sách các đơn hàng săn deal Flash Sale và tiến hành thanh toán trong 15 phút.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs shadow-md transition"
          >
            <span>Đăng Nhập Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Đơn Hàng Của Tôi' }]} />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#0B192C] flex items-center justify-center text-white shadow-xs">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Quản Lý Đơn Hàng Flash Sale
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Theo dõi tiến trình các đơn hàng săn deal thành công, thời hạn thanh toán 15 phút và xuất hóa đơn điện tử.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <Link
            to="/flash-sale"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Zap className="w-4 h-4" />
            <span>Săn Deal Tiếp</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Tất Cả</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'PENDING'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-amber-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Chờ Thanh Toán</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-extrabold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'PAID'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã Thanh Toán</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono">
              {paidCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'CANCELLED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Đã Hủy / Hoàn Kho</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {cancelledCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc sản phẩm..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Orders List Container */}
      {loading && orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang truy vấn đơn hàng từ PostgreSQL & Kafka...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Không tìm thấy đơn hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery
              ? 'Không có đơn hàng nào khớp với từ khóa tìm kiếm của bạn.'
              : 'Bạn chưa có đơn hàng nào trong trạng thái này.'}
          </p>
          <Link
            to="/flash-sale"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs transition shadow-xs"
          >
            <span>Đến Sàn Săn Deal Ngay ⚡</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPaid = order.status === 'PAID';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';

            return (
              <div
                key={order.orderCode}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition"
              >
                {/* Order Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Mã đơn:</span>
                      <span className="font-mono font-extrabold text-sm text-blue-950 tracking-tight">
                        {order.orderCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(order.orderCode)}
                        className="text-slate-400 hover:text-blue-700 p-1 rounded transition"
                        title="Sao chép mã đơn"
                      >
                        {copiedCode === order.orderCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="text-slate-300">|</span>

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Status Badge & Countdown */}
                  <div className="flex items-center gap-2.5">
                    {isPending && (
                      <OrderCountdown expiresAt={order.expiresAt} onExpired={fetchOrders} />
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isPaid
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isPending && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                      {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                      {isCancelled && <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                      {isPending
                        ? 'CHỜ THANH TOÁN'
                        : isPaid
                        ? 'ĐÃ THANH TOÁN'
                        : 'ĐÃ HỦY (HOÀN KHO)'}
                    </span>
                  </div>
                </div>

                {/* Order Body Details */}
                <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Product List (8 cols) */}
                  <div className="lg:col-span-8 space-y-3">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Zap className="w-6 h-6 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                                FLASH SALE
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.productName || 'Sản phẩm Flash Sale'}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span>Số lượng: <strong className="text-slate-800">{item.quantity}</strong></span>
                              <span>•</span>
                              <span>Đơn giá: <strong className="text-red-700">{formatPrice(item.price)}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">Chi tiết sản phẩm Flash Sale</div>
                    )}

                    {/* Shipping Address Note */}
                    <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Địa chỉ nhận: {order.shippingAddress || 'Tòa nhà VinUni, Vinhomes Ocean Park, Gia Lâm, Hà Nội'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 pl-5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.phone || '0988668899'}
                        </span>
                        <span>•</span>
                        <span>Người nhận: <strong>{activeUser.fullName || activeUser.email}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Total & Action Buttons (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
                    <div className="text-left lg:text-right">
                      <div className="text-xs text-slate-500">Tổng thanh toán:</div>
                      <div className="text-lg font-extrabold text-red-600 tracking-tight">
                        {formatPrice(order.totalAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        (Miễn phí vận chuyển hỏa tốc)
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => setSelectedOrderForDetail(order)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Hóa Đơn</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleCancelOrder(order.orderCode)}
                            disabled={processingCode === order.orderCode}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                            title="Hủy đơn và hoàn lại tồn kho vào Redis ngay"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Hủy Đơn</span>
                          </button>

                          <button
                            onClick={() => setSelectedOrderForPayment(order)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm hover:shadow transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thanh Toán</span>
                          </button>
                        </>
                      )}

                      {isPaid && (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Đang chuẩn bị hàng</span>
                        </div>
                      )}

                      {isCancelled && (
                        <span className="text-[11px] text-slate-400 italic">
                          Đã tự động hoàn kho Redis
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: THANH TOÁN (PAYMENT MODAL VỚI VIETQR ĐỘNG) */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Cổng Thanh Toán Đơn Hàng Flash Sale</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Đơn hàng #{selectedOrderForPayment.orderCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Amount Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Số tiền cần thanh toán:</div>
                  <div className="text-xl font-extrabold text-red-600">
                    {formatPrice(selectedOrderForPayment.totalAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Thời hạn còn lại:</div>
                  <OrderCountdown expiresAt={selectedOrderForPayment.expiresAt} />
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chọn phương thức thanh toán:
                </label>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VNPAY')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition relative overflow-hidden ${
                      paymentMethod === 'VNPAY'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0">
                      VNP
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Cổng VNPAY</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[9px] font-extrabold">
                          KHUYÊN DÙNG
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">Thẻ NCB Sandbox & QR</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      paymentMethod === 'VIETQR'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-8 h-8 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold">Quét VietQR</div>
                      <div className="text-[10px] text-slate-500 font-normal">Chuyển khoản MB Bank</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* VNPAY SANDBOX CONTENT */}
              {paymentMethod === 'VNPAY' && (
                <div className="space-y-3.5">
                  <div className="bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-3 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                      <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-700" />
                        Thẻ Test NCB Sandbox (Miễn Phí 100%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Sandbox Official
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-500">Số thẻ test:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-blue-900 mt-0.5">
                          <span>9704198526191432198</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode('9704198526191432198')}
                            className="text-slate-400 hover:text-blue-700 p-0.5 transition"
                            title="Sao chép số thẻ"
                          >
                            {copiedCode === '9704198526191432198' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">Tên chủ thẻ:</span>
                        <div className="font-bold text-slate-800 mt-0.5">NGUYEN VAN A</div>
                      </div>

                      <div>
                        <span className="text-slate-500">Ngày phát hành:</span>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">07/15</div>
                      </div>

                      <div>
                        <span className="text-slate-500">Mã OTP xác thực:</span>
                        <div className="font-mono font-bold text-red-600 mt-0.5">123456</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVNPayPayment(selectedOrderForPayment)}
                    disabled={isVnpayLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {isVnpayLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang kết nối Cổng VNPAY Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <span>Mở Cổng Thanh Toán VNPAY Sandbox</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(selectedOrderForPayment.orderCode)}
                      disabled={processingCode === selectedOrderForPayment.orderCode}
                      className="text-[11px] text-slate-500 hover:text-blue-700 underline font-semibold transition"
                    >
                      ⚡ Hoặc bấm vào đây để giả lập thanh toán nhanh (Không cần nhập thẻ)
                    </button>
                  </div>
                </div>
              )}

              {/* VIETQR CONTENT */}
              {paymentMethod === 'VIETQR' && (
                <div className="space-y-3">
                  <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-4 text-center space-y-3">
                    <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `2|99|0988668899|FLASHDEAL ENTERPRISE|datnguyentien2401@gmail.com|0|0|${selectedOrderForPayment.totalAmount}|${selectedOrderForPayment.orderCode}|transfer_myqr`
                        )}`}
                        alt="VietQR Code"
                        className="w-40 h-40 mx-auto"
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div>Ngân hàng: <strong>MB BANK (Quân Đội)</strong></div>
                      <div>Số tài khoản: <strong className="font-mono text-blue-900">0988668899</strong></div>
                      <div>Chủ tài khoản: <strong>FLASHDEAL ENTERPRISE</strong></div>
                      <div className="flex items-center justify-center gap-1 text-slate-800">
                        <span>Nội dung chuyển khoản:</span>
                        <strong className="font-mono text-red-600">{selectedOrderForPayment.orderCode}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulatePayment(selectedOrderForPayment.orderCode)}
                    disabled={processingCode === selectedOrderForPayment.orderCode}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {processingCode === selectedOrderForPayment.orderCode ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xác nhận thanh toán...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác Nhận Đã Chuyển Khoản Thành Công</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="px-5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HÓA ĐƠN ĐIỆN TỬ (INVOICE MODAL) */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <FileText className="w-5 h-5 text-blue-700" />
                <span>HÓA ĐƠN BÁN HÀNG FLASHDEAL</span>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-blue-900">{selectedOrderForDetail.orderCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-slate-900">{selectedOrderForDetail.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Thời gian tạo:</span>
                <span>{new Date(selectedOrderForDetail.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Người nhận:</span>
                <span>{activeUser.fullName || activeUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Địa chỉ giao hàng:</span>
                <span className="max-w-[240px] text-right">{selectedOrderForDetail.shippingAddress}</span>
              </div>

              <div className="pt-2">
                <div className="font-bold text-slate-800 mb-2">Chi tiết sản phẩm:</div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                  {selectedOrderForDetail.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[220px]">{item.productName} (x{item.quantity})</span>
                      <span className="font-bold text-slate-900">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-extrabold border-t border-slate-200">
                <span>Tổng cộng:</span>
                <span className="text-red-600 text-base">{formatPrice(selectedOrderForDetail.totalAmount)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
