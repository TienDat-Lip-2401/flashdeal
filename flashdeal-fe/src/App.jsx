import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import TopHeader from './components/TopHeader';
import Navbar from './components/Navbar';
import ProductCatalogSearch from './components/ProductCatalogSearch';
import FlashSaleHub from './components/FlashSaleHub';
import AdminDashboard from './components/AdminDashboard';
import AuthManager from './components/AuthManager';
import ProductDetail from './components/ProductDetail';
import ApiResponseModal from './components/ApiResponseModal';
import { authApi } from './api/authApi';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Building2,
  ShieldCheck,
  Server,
  Cpu
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const [lastResponse, setLastResponse] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Fetch initial profile if access token exists
  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (token) {
      authApi
        .getProfile()
        .then((res) => {
          setActiveUser(res.data);
          setLastResponse(res);
        })
        .catch(() => {
          setActiveUser(null);
        });
    }
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    try {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
      showToast('Đã đăng xuất tài khoản và đưa Token vào Redis Blacklist', 'info');
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refresh_token');
      setActiveUser(null);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* 1. Top Utility Header Bar */}
      <TopHeader />

      {/* 2. Main Navigation Bar with React Router Links */}
      <Navbar
        lastResponse={lastResponse}
        onOpenResponseModal={() => setIsResponseModalOpen(true)}
        activeUser={activeUser}
        onLogout={handleLogout}
      />

      {/* 3. Main Content URL Router View */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <ProductCatalogSearch
                setLastResponse={setLastResponse}
                showToast={showToast}
                activeUser={activeUser}
              />
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProductDetail
                setLastResponse={setLastResponse}
                showToast={showToast}
                activeUser={activeUser}
              />
            }
          />
          <Route
            path="/flash-sale"
            element={
              <FlashSaleHub
                setLastResponse={setLastResponse}
                showToast={showToast}
                activeUser={activeUser}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminDashboard
                setLastResponse={setLastResponse}
                showToast={showToast}
                activeUser={activeUser}
              />
            }
          />
          <Route
            path="/auth"
            element={
              <AuthManager
                setLastResponse={setLastResponse}
                showToast={showToast}
                activeUser={activeUser}
                setActiveUser={setActiveUser}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 4. Corporate Footer */}
      <footer className="bg-[#0B192C] text-slate-300 border-t border-slate-800 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>FLASHDEAL ENTERPRISE</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Nền tảng kiến trúc Microservices phân tán chịu tải cao (High Concurrency 50.000 req/s),
                tối ưu hóa nguyên tử với Redis Lua Script và Apache Kafka.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                © 2026 FlashDeal Inc. All rights reserved.
              </div>
            </div>

            {/* Microservices Cluster */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Hệ Thống Microservices
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>• API Gateway (:8080) - Spring Cloud Reactive</li>
                <li>• Auth Service (:8081) - JWT & Redis Blacklist</li>
                <li>• Product Service (:8082) - Cache & Search Lex</li>
                <li>• FlashSale Order (:8083) - Lua & Kafka Engine</li>
              </ul>
            </div>

            {/* Architecture Highlights */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Công Nghệ Cốt Lõi
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Redis In-Memory Stock Fast-Gate (&lt; 1.5ms)</li>
                <li>• Kafka Partition Key & 4 Worker Threads</li>
                <li>• PostgreSQL 16 Shared-Nothing Architecture</li>
                <li>• ReactJS + TailwindCSS SEO Standard</li>
              </ul>
            </div>

            {/* Technical Contact & Monitoring */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Giám Sát Hạ Tầng
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="http://localhost:8085" target="_blank" rel="noreferrer" className="hover:text-white transition">
                    → Kafka UI Dashboard (:8085)
                  </a>
                </li>
                <li>
                  <a href="http://localhost:8080/product-docs/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-white transition">
                    → Product Swagger Docs (:8080)
                  </a>
                </li>
                <li>
                  <a href="http://localhost:8080/auth-docs/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-white transition">
                    → Auth Swagger Docs (:8080)
                  </a>
                </li>
                <li>
                  <a href="http://localhost:8080/order-docs/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-white transition">
                    → FlashSale Order Swagger Docs (:8080)
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. API Gateway JSON Inspector Modal */}
      <ApiResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        lastResponse={lastResponse}
        showToast={showToast}
      />

      {/* 6. Toast Notification Center */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 text-xs leading-relaxed animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-red-950 border-red-700 text-red-100'
                : toast.type === 'warning'
                ? 'bg-amber-950 border-amber-700 text-amber-100'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
