import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import Breadcrumb from './Breadcrumb';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Zap,
  ShoppingBag,
  Layers,
  Database,
  Cpu,
  Lock
} from 'lucide-react';

export default function ProductDetail({ setLastResponse, showToast, activeUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await productApi.getById(id);
        setLastResponse(res);
        setProduct(res.data);
      } catch (err) {
        setLastResponse(err);
        showToast(err.message || 'Không thể tải thông tin sản phẩm', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleBuyNow = () => {
    if (!activeUser) {
      showToast('Vui lòng Đăng Nhập tài khoản để tiến hành đặt mua sản phẩm!', 'warning');
      navigate('/auth');
      return;
    }
    showToast(`Đặt mua thành công ${quantity} sản phẩm "${product.name}" cho tài khoản ${activeUser.email}!`, 'success');
  };

  const formatPrice = (p) => {
    if (p == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải thông tin chi tiết sản phẩm từ Database...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-base text-rose-600 font-semibold mb-4">Không tìm thấy thông tin sản phẩm!</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Trang chủ', onClick: () => navigate('/') },
    { label: product.category?.name || 'Sản phẩm', onClick: () => navigate('/') },
    { label: product.name }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* SEO Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Back Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-900 transition py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại sàn sản phẩm
        </button>
      </div>

      {/* Main Product Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Image & Media */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square flex items-center justify-center p-4">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
              <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                product.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
              }`}>
                {product.status === 'ACTIVE' ? 'Đang Kinh Doanh' : 'Ngừng Kinh Doanh'}
              </span>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Chính hãng 100%</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Giao hàng toàn quốc</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Đổi trả 30 ngày</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Kiểm tra khi nhận</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/60 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-700" />
                  {product.category?.name || 'Chưa phân loại'}
                </span>
                <span className="text-xs text-slate-400 font-mono">SKU: #{product.id}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mt-4">
                <div className="text-3xl font-extrabold text-blue-900">
                  {formatPrice(product.originalPrice)}
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  VAT Đã Bao Gồm
                </div>
              </div>
            </div>

            {/* Microservice Storage & Real-time Stock Meta */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Tồn kho Database</div>
                  <div className="text-sm font-bold text-slate-800">{product.totalStock} sản phẩm</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-800">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Trạng thái RAM Redis</div>
                  <div className="text-sm font-bold text-blue-900">Sẵn Sàng Giao Ngay</div>
                </div>
              </div>
            </div>

            {/* Short Description */}
            <div className="py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Đặc điểm nổi bật:</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Sản phẩm chính hãng với hiệu năng vượt trội, độ bền cao và dịch vụ bảo hành tiêu chuẩn quốc tế.'}
              </p>
            </div>

            {/* Action Buttons with RBAC Warning */}
            <div className="pt-6 mt-auto space-y-3">
              {!activeUser && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bạn đang duyệt ở chế độ Khách. Vui lòng đăng nhập để có thể đặt mua hàng.</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/flash-sale')}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-sm transition active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Săn Deal Flash Sale Siêu Tốc (50.000 req/s)
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-sm transition active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {activeUser ? 'Đặt Mua Ngay' : 'Đăng Nhập Để Mua Hàng'}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Slug URL: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{product.slug}</code></span>
                <span>Ngày tạo: {product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '27/08/2026'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Technical Details Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedTab('description')}
            className={`text-sm font-bold pb-3 -mb-3 border-b-2 transition ${
              selectedTab === 'description'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Bài Viết Chi Tiết Sản Phẩm
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('specs')}
            className={`text-sm font-bold pb-3 -mb-3 border-b-2 transition ${
              selectedTab === 'specs'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Thông Số Kỹ Thuật
          </button>
        </div>

        {selectedTab === 'description' ? (
          <div className="prose max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Giới thiệu chi tiết về {product.name}</h3>
            <p>
              {product.name} là sản phẩm công nghệ cao cấp thuộc danh mục <strong>{product.category?.name || 'Sản phẩm'}</strong>.
              Được thiết kế tỉ mỉ với quy trình kiểm định chất lượng nghiêm ngặt, sản phẩm mang lại trải nghiệm sử dụng hoàn hảo cho cả nhu cầu làm việc chuyên nghiệp và giải trí đỉnh cao.
            </p>
            <p>
              {product.description}
            </p>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 my-4">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Cam kết từ Hệ Thống FlashDeal</h4>
              <p className="text-xs text-slate-600">
                Toàn bộ sản phẩm được phân phối chính hãng 100%, bảo hành điện tử theo Serial Number / IMEI trên hệ thống dữ liệu đám mây toàn quốc.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <table className="w-full text-left text-sm text-slate-700 border-collapse">
              <tbody>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500 w-1/3">Mã sản phẩm (ID)</th>
                  <td className="py-2.5 font-mono font-medium text-slate-900">#{product.id}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500">Tên sản phẩm</th>
                  <td className="py-2.5 font-medium text-slate-900">{product.name}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500">Danh mục</th>
                  <td className="py-2.5 font-medium text-slate-900">{product.category?.name || 'Chưa phân loại'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500">Giá niêm yết</th>
                  <td className="py-2.5 font-bold text-blue-900">{formatPrice(product.originalPrice)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500">Tồn kho khả dụng</th>
                  <td className="py-2.5 font-medium text-slate-900">{product.totalStock} sản phẩm</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 pr-4 text-xs font-semibold text-slate-500">Trạng thái kinh doanh</th>
                  <td className="py-2.5 font-medium text-emerald-700">{product.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
