import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { Toaster } from './components/layout/Toaster';
import { useAuth } from './store/auth';
import { toast } from './store/toast';
import HomePage from './pages/HomePage';

/* Pages below the home page load on demand, so the first visit downloads only what it shows. */
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const PhotoCreditsPage = lazy(() => import('./pages/PhotoCreditsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="wrap py-10" aria-busy="true">
      <div className="skeleton mb-6 h-8 w-64" />
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}

function RequireAuth() {
  const status = useAuth((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <PageFallback />;
  if (status !== 'authenticated') return <Navigate to="/dang-nhap" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/* VNPay's return URL is configured as /orders; keep its query string when forwarding. */
function LegacyOrdersRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/tai-khoan/don-hang${search}`} replace />;
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const clearSession = useAuth((s) => s.clearSession);

  useEffect(() => {
    bootstrap();
    const onExpired = () => {
      clearSession();
      toast.info('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [bootstrap, clearSession]);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main id="noi-dung" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flash-sale" element={<FlashSalePage />} />
            <Route path="/danh-muc/:slug" element={<CategoryPage />} />
            <Route path="/san-pham/:slug" element={<ProductPage />} />
            <Route path="/tim-kiem" element={<SearchPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/nguon-anh" element={<PhotoCreditsPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/tai-khoan/don-hang" element={<OrdersPage />} />
              <Route path="/tai-khoan/don-hang/:code" element={<OrderDetailPage />} />
            </Route>
            <Route path="/quan-tri" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="don-hang" element={<AdminOrders />} />
              <Route path="flash-sale" element={<AdminCampaigns />} />
              <Route path="san-pham" element={<AdminProducts />} />
              <Route path="danh-muc" element={<AdminCategories />} />
            </Route>
            {/* old paths */}
            <Route path="/orders" element={<LegacyOrdersRedirect />} />
            <Route path="/my-orders" element={<LegacyOrdersRedirect />} />
            <Route path="/admin" element={<Navigate to="/quan-tri" replace />} />
            <Route path="/auth" element={<Navigate to="/dang-nhap" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  );
}
