import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CategoryManager from './components/CategoryManager';
import ProductManager from './components/ProductManager';
import ProductCatalogSearch from './components/ProductCatalogSearch';
import ApiResponseModal from './components/ApiResponseModal';
import { categoryApi } from './api/categoryApi';
import { productApi } from './api/productApi';
import { getRandomCategory, getRandomProduct } from './utils/mockGenerator';
import { Sparkles, Database, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [lastResponse, setLastResponse] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Quick Seed Data Generator (Tự động nạp 3 danh mục và 6 sản phẩm mẫu)
  const handleQuickSeedData = async () => {
    setSeeding(true);
    showToast('Đang khởi tạo dữ liệu mẫu (Categories & Products)...', 'info');
    try {
      // 1. Tạo 3 categories
      const createdCats = [];
      for (let i = 0; i < 3; i++) {
        const catData = getRandomCategory();
        const res = await categoryApi.create(catData);
        if (res?.data) createdCats.push(res.data);
      }

      // 2. Tạo 6 products
      for (let i = 0; i < 6; i++) {
        const catId = createdCats[i % createdCats.length]?.id || 1;
        const prodData = getRandomProduct(catId);
        await productApi.create(prodData);
      }

      showToast('🎉 Nạp thành công 3 Danh mục & 6 Sản phẩm mẫu vào Database!', 'success');
      // Reload current tab view
      window.location.reload();
    } catch (err) {
      showToast(`Lỗi khi nạp dữ liệu: ${err.message}`, 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-900/30'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-900/30'
                : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-indigo-900/30'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConsole={() => setIsConsoleOpen(true)}
        lastResponse={lastResponse}
      />

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Bộ công cụ Test Backend FlashDeal: <strong>Category API</strong> & <strong>Product Filter API</strong>
            </span>
          </div>

          <button
            onClick={handleQuickSeedData}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
            title="Tự động tạo hàng loạt dữ liệu mẫu (3 Danh mục + 6 Sản phẩm)"
          >
            <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Đang nạp...' : '⚡ Nạp Nhanh 10 Sản Phẩm & Danh Mục Mẫu'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <ProductCatalogSearch setLastResponse={setLastResponse} showToast={showToast} />
        )}
        {activeTab === 'products' && (
          <ProductManager setLastResponse={setLastResponse} showToast={showToast} />
        )}
        {activeTab === 'categories' && (
          <CategoryManager setLastResponse={setLastResponse} showToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>FlashDeal Platform • High Concurrency Event-Driven System (Spring Boot 3 + Redis + Kafka + Postgres)</p>
      </footer>

      {/* Raw API Response Modal */}
      <ApiResponseModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        responseData={lastResponse}
      />
    </div>
  );
}
