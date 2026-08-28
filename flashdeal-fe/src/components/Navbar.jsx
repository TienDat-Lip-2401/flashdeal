import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  Code2,
  UserCheck,
  LogOut,
  Building2,
  Crown,
  User,
  ChevronDown,
  Mail,
  ShieldAlert
} from 'lucide-react';

export default function Navbar({ lastResponse, onOpenResponseModal, activeUser, onLogout }) {
  const navigate = useNavigate();
  const isAdmin = activeUser?.role === 'ROLE_ADMIN';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { to: '/', label: 'Sàn Sản Phẩm', icon: ShoppingBag },
    { to: '/flash-sale', label: 'Săn Deal Flash Sale ⚡', icon: Zap, badge: '50k req/s' },
    ...(isAdmin ? [{ to: '/admin', label: 'Quản Trị Hệ Thống', icon: LayoutDashboard, badge: '👑 Admin' }] : []),
    { to: '/auth', label: 'Tài Khoản & Bảo Mật JWT', icon: ShieldCheck },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0B192C] flex items-center justify-center text-white shadow-sm group-hover:bg-blue-900 transition">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                <span>FLASHDEAL</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-bold">ENTERPRISE</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                High-Concurrency E-Commerce
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.to === '/flash-sale' ? 'text-red-600' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                          isActive
                            ? 'bg-blue-800 text-white'
                            : item.to === '/flash-sale'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Tools & User Profile */}
          <div className="flex items-center gap-3">
            {/* Gateway Inspector Trigger */}
            <button
              onClick={onOpenResponseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition"
              title="Xem chi tiết mã JSON từ API Gateway"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Gateway Inspector</span>
              {lastResponse && (
                <span className={`w-2 h-2 rounded-full ${lastResponse.code === 1000 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              )}
            </button>

            {/* Auth Profile / Login State */}
            {activeUser ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono text-white ${
                    isAdmin ? 'bg-amber-600 ring-2 ring-amber-300' : 'bg-blue-900'
                  }`}>
                    {isAdmin ? <Crown className="w-3.5 h-3.5 text-white" /> : (activeUser.fullName?.charAt(0) || 'U')}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {activeUser.fullName || activeUser.email}
                    </div>
                    <div className="text-[10px] font-bold flex items-center gap-1">
                      {isAdmin ? (
                        <span className="text-amber-700 font-mono">👑 ROLE_ADMIN</span>
                      ) : (
                        <span className="text-emerald-700 font-mono">👤 CUSTOMER</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-3">
                    <div className="pb-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{activeUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{activeUser.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 text-slate-700">
                        <span>Vai trò:</span>
                        <strong className={isAdmin ? 'text-amber-700' : 'text-blue-900'}>{activeUser.role}</strong>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-semibold">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 text-amber-900 transition"
                        >
                          <Crown className="w-4 h-4 text-amber-600" />
                          <span>Trang Quản Trị Hệ Thống</span>
                        </Link>
                      )}

                      <Link
                        to="/auth"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <span>Xem Chi Tiết Token JWT</span>
                      </Link>

                      <Link
                        to="/flash-sale"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 transition"
                      >
                        <Zap className="w-4 h-4 text-red-600" />
                        <span>Săn Deal Flash Sale</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng Xuất Tài Khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${
                    isActive ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
