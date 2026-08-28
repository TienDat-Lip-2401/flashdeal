import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { getRandomRegisterUser } from '../utils/mockGenerator';
import Breadcrumb from './Breadcrumb';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  LogIn,
  UserPlus,
  RefreshCw,
  LogOut,
  Dices,
  KeyRound,
  Server,
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles
} from 'lucide-react';

export default function AuthManager({ setLastResponse, showToast, activeUser, setActiveUser }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState({
    accessToken: localStorage.getItem('access_token') || '',
    refreshToken: localStorage.getItem('refresh_token') || '',
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
  });

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await authApi.getProfile();
      setLastResponse(res);
      setActiveUser(res.data);
    } catch (err) {
      setLastResponse(err);
      setActiveUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokens.accessToken) {
      fetchProfile();
    }
  }, [tokens.accessToken]);

  const handleRandomRegisterData = () => {
    const random = getRandomRegisterUser();
    setRegisterForm(random);
    showToast('Đã tạo ngẫu nhiên thông tin tài khoản đăng ký!', 'info');
  };

  // Quick 1-Click Login Helper
  const handleQuickLogin = async (email, password, roleLabel) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setLastResponse(res);
      const data = res.data;
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setActiveUser(data.user);
      showToast(`Đăng nhập thành công với tài khoản ${roleLabel} [${data.user?.role}]!`, 'success');
    } catch (err) {
      // Neu chua co tai khoan thi tu dong dang ky luon roi dang nhap
      if (err.code === 2002 || err.code === 2001) {
        try {
          await authApi.register({
            email,
            password,
            fullName: email === 'admin@flashdeal.vn' ? 'Tổng Quản Trị Hệ Thống' : 'Khách Hàng Mẫu',
            phone: '0988668899',
            address: 'Hà Nội',
          });
          const loginRes = await authApi.login({ email, password });
          setLastResponse(loginRes);
          const data = loginRes.data;
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          setActiveUser(data.user);
          showToast(`Đã tự động khởi tạo và đăng nhập tài khoản ${roleLabel}!`, 'success');
        } catch (regErr) {
          setLastResponse(regErr);
          showToast(`Lỗi: ${regErr.message}`, 'error');
        }
      } else {
        setLastResponse(err);
        showToast(`Lỗi đăng nhập: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showToast('Vui lòng nhập email và mật khẩu', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(loginForm);
      setLastResponse(res);
      const data = res.data;
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setActiveUser(data.user);
      showToast(`Đăng nhập thành công! Chào mừng ${data.user?.fullName || data.user?.email}`, 'success');
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.email || !registerForm.password || !registerForm.fullName) {
      showToast('Vui lòng điền các thông tin bắt buộc (*)', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(registerForm);
      setLastResponse(res);
      showToast(`Đăng ký thành công! Sự kiện [user.registered.event] đã được bắn vào Kafka.`, 'success');
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });
      setAuthMode('login');
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      showToast('Không tìm thấy Refresh Token trong LocalStorage!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.refreshToken(refreshToken);
      setLastResponse(res);
      const data = res.data;
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      showToast('Xoay vòng Token (Rotation) thành công! Token cũ đã bị hủy và cấp cặp Token mới.', 'success');
      fetchProfile();
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi làm mới token: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const res = await authApi.logout(accessToken);
      setLastResponse(res);
      showToast('Đăng xuất thành công! Access Token đã được đưa vào Redis Blacklist.', 'success');
    } catch (err) {
      setLastResponse(err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setTokens({ accessToken: '', refreshToken: '' });
      setActiveUser(null);
    }
  };

  const breadcrumbItems = [
    { label: 'Trang chủ' },
    { label: 'Tài Khoản & Bảo Mật JWT' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero Header */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 mb-8 border border-slate-800 shadow-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Bảo Mật Xác Thực & Token Rotation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Authentication Service & Redis Blacklist Hub
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Hệ thống xác thực <strong>Stateless JWT (HMAC-SHA256)</strong>, cơ chế xoay vòng Refresh Token (Token Rotation),
            vô hiệu hóa tức thì với <strong>Redis Blacklist</strong>, và phân quyền người dùng <strong>ROLE_ADMIN / ROLE_CUSTOMER</strong>.
          </p>
        </div>
      </div>

      {/* Quick 1-Click Role Switcher Bar */}
      <div className="mb-8 p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span className="font-bold">1-Click Test Phân Quyền Nhanh:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('customer@flashdeal.vn', 'Password@123', 'Khách Hàng')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <User className="w-3.5 h-3.5" />
            <span>👤 Đăng Nhập Khách Hàng (ROLE_CUSTOMER)</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('admin@flashdeal.vn', 'Admin@123', 'Quản Trị Viên')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>👑 Đăng Nhập Quản Trị Viên (ROLE_ADMIN)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Login & Register Card */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {/* Toggle Tabs */}
            <div className="flex border-b border-slate-100 pb-3 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition ${
                  authMode === 'login'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Đăng Nhập (Login)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition ${
                  authMode === 'register'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Đăng Ký & Bắn Kafka Event
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email đăng nhập *</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="customer@flashdeal.vn hoặc admin@flashdeal.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg transition text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Hệ Thống'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tự động điền dữ liệu để test:</span>
                  <button
                    type="button"
                    onClick={handleRandomRegisterData}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Random Account Data
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="user@flashdeal.vn"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mật khẩu *</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Password@123"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="0988668899"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      placeholder="Hà Nội"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-900 transition text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng Ký & Phát Kafka Event'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: User Profile & Security Tokens Hub */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active User Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-900" />
                Thông Tin Tài Khoản Đang Đăng Nhập
              </h3>
              {activeUser && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  activeUser.role === 'ROLE_ADMIN'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {activeUser.role === 'ROLE_ADMIN' ? '👑 ROLE_ADMIN' : '👤 ROLE_CUSTOMER'}
                </span>
              )}
            </div>

            {activeUser ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-500">ID Người dùng:</span>
                    <div className="font-mono font-bold text-slate-900">#{activeUser.id}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Họ và tên:</span>
                    <div className="font-bold text-slate-900">{activeUser.fullName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <div className="font-medium text-slate-900">{activeUser.email}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Vai trò (Role):</span>
                    <div className="font-mono font-bold text-blue-900">{activeUser.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRefreshToken}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Test Xoay Vòng Token (Rotation)
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng Xuất (Blacklist)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Chưa có tài khoản đăng nhập. Hãy bấm một trong 2 nút 1-Click ở trên để trải nghiệm phân quyền!
              </div>
            )}
          </div>

          {/* Tokens LocalStorage Viewer */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-600" />
                Chuỗi Token JWT Lưu Trong LocalStorage
              </h3>
              <a
                href="http://localhost:8085"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <span>Xem Kafka-UI (:8085)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-600">Access Token (Hạn sống 60 phút):</span>
                <div className="font-mono text-[10px] bg-slate-900 text-slate-300 p-2 rounded-lg break-all mt-1 max-h-16 overflow-y-auto">
                  {tokens.accessToken || '(Chưa có Token)'}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-600">Refresh Token (Hạn sống 7 ngày):</span>
                <div className="font-mono text-[10px] bg-slate-900 text-slate-300 p-2 rounded-lg break-all mt-1">
                  {tokens.refreshToken || '(Chưa có Token)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
