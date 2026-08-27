import React from 'react';
import { Layers, Package, ShoppingBag, Terminal, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenConsole, lastResponse, currentUser }) {
  const tabs = [
    { id: 'search', label: 'Sàn TMĐT & Bộ Lọc', icon: ShoppingBag },
    { id: 'products', label: 'Quản Lý Sản Phẩm', icon: Package },
    { id: 'categories', label: 'Quản Lý Danh Mục', icon: Layers },
    { id: 'auth', label: 'Xác Thực & Auth API', icon: ShieldCheck },
  ];

  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                  FlashDeal API Client
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-ping" />
                  API :8080
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                High-Concurrency E-Commerce & Flash Sale Tester
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Raw Response Viewer Button */}
          <button
            onClick={onOpenConsole}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 transition shadow-inner"
            title="Xem kết quả JSON API trả về gần nhất"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">API Response</span>
            {lastResponse && (
              <span
                className={`w-2 h-2 rounded-full ${
                  lastResponse.code === 200 || lastResponse.code === 1000
                    ? 'bg-emerald-400'
                    : 'bg-rose-400'
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
