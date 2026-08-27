import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import {
  UserPlus,
  LogIn,
  LogOut,
  RefreshCw,
  User,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AuthManager({ setLastResponse, showToast, currentUser, setCurrentUser }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
  });

  const [tokenInfo, setTokenInfo] = useState({
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
  });

  const fetchProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setProfile(null);
      setCurrentUser?.(null);
      return;
    }
    try {
      const res = await authApi.getProfile();
      setLastResponse(res);
      setProfile(res.data);
      setCurrentUser?.(res.data);
    } catch (err) {
      setLastResponse(err);
      // Neu token het han, xoa khoi storage
      if (err.status === 401 || err.code === 1008 || err.code === 1009) {
        handleClearAuth();
      }
    }
  };

  useEffect(() => {
    if (tokenInfo.accessToken) {
      fetchProfile();
    }
  }, [tokenInfo.accessToken]);

  const handleClearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setTokenInfo({ accessToken: '', refreshToken: '' });
    setProfile(null);
    setCurrentUser?.(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.fullName) {
      showToast('Vui lòng điền đầy đủ Email, Mật khẩu và Họ tên!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(registerData);
      setLastResponse(res);
      showToast('Đăng ký tài khoản thành công! Kafka event user.registered.event đã được phát!', 'success');
      // Chuyển sang tab đăng nhập với email vừa đăng ký
      setLoginData({ email: registerData.email, password: registerData.password });
      setAuthMode('login');
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      showToast('Vui lòng nhập Email và Mật khẩu!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(loginData);
      setLastResponse(res);
      const authData = res.data;
      if (authData?.accessToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        setTokenInfo({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
        });
        showToast(`Đăng nhập thành công! Chào mừng ${authData.user?.fullName || ''}`, 'success');
        fetchProfile();
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi [Code ${err.code || 500}]: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    const rfToken = localStorage.getItem('refreshToken');
    if (!rfToken) {
      showToast('Không tìm thấy Refresh Token trong LocalStorage!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.refreshToken({ refreshToken: rfToken });
      setLastResponse(res);
      const authData = res.data;
      if (authData?.accessToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        setTokenInfo({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
        });
        showToast('Đã làm mới (Rotate) Access Token & Refresh Token thành công!', 'success');
      }
    } catch (err) {
      setLastResponse(err);
      showToast(`Lỗi làm mới Token: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await authApi.logout();
      setLastResponse(res);
      handleClearAuth();
      showToast('Đăng xuất thành công! Token đã được đưa vào Redis Blacklist.', 'success');
    } catch (err) {
      setLastResponse(err);
      handleClearAuth();
      showToast('Đã xóa phiên đăng nhập cục bộ!', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMockCustomer = () => {
    const rand = Math.floor(Math.random() * 10000);
    setRegisterData({
      email: `customer_${rand}@gmail.com`,
      password: 'Password123!',
      fullName: `Nguyễn Văn Sale ${rand}`,
      phone: '0988' + Math.floor(100000 + Math.random() * 900000),
      address: 'Số 123 Đường Cầu Giấy, Hà Nội',
    });
    showToast('Đã tạo dữ liệu mẫu đăng ký!', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-950/50 to-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Auth & Identity Service (:8081)
                </h1>
                <p className="text-sm text-slate-400">
                  Xác thực JWT Stateless • Redis Refresh Token & Blacklist • Kafka Event Bus
                </p>
              </div>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700">
            <span
              className={`w-3 h-3 rounded-full ${
                profile ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              Trạng thái: {profile ? `Đã đăng nhập (${profile.role})` : 'Khách vãng lai (Guest)'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Login / Register Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl">
            {/* Tab switch */}
            <div className="flex items-center p-1 bg-slate-900 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Đăng Ký Tài Khoản
              </button>
            </div>

            {/* Login Form */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email đăng nhập <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="customer@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập & Cấp Token'}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Điền thông tin đăng ký</span>
                  <button
                    type="button"
                    onClick={handleQuickMockCustomer}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Tạo dữ liệu mẫu
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="customer@gmail.com"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu (tối thiểu 6 ký tự) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      placeholder="0988888888"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ</label>
                    <input
                      type="text"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      placeholder="Hà Nội"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                  <Send className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>
                    Khi đăng ký thành công, sự kiện <b>user.registered.event</b> sẽ được bắn vào Kafka!
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Bắn Kafka'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Profile & Token Manager */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
              <User className="w-5 h-5 text-indigo-400" />
              Thông Tin Hồ Sơ (GET /api/auth/profile)
            </h3>

            {profile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white">
                      {profile.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{profile.fullName}</h4>
                      <p className="text-xs text-slate-400 font-mono">{profile.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      profile.role === 'ROLE_ADMIN'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">User ID:</span>
                    <span className="font-mono font-bold text-slate-200">#{profile.id}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">Số điện thoại:</span>
                    <span className="font-mono text-slate-200">{profile.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">Địa chỉ:</span>
                    <span className="text-slate-200 truncate block">{profile.address || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">Trạng thái:</span>
                    <span className="text-emerald-400 font-semibold">{profile.status}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleRefreshToken}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold rounded-xl text-xs border border-indigo-500/30 transition flex items-center justify-center gap-2"
                    title="Gọi POST /auth/refresh-token để cấp lại Token mới"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Làm Mới Token (Rotate)
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold rounded-xl text-xs border border-rose-500/30 transition flex items-center justify-center gap-2"
                    title="Gọi POST /auth/logout để đưa Token vào Blacklist Redis"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng Xuất & Blacklist
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-slate-700 rounded-2xl text-slate-400 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-medium">Chưa có phiên đăng nhập</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Hãy đăng nhập hoặc tạo tài khoản ở cột bên trái để nhận JWT Token và xem thông tin hồ sơ.
                </p>
              </div>
            )}
          </div>

          {/* Token Storage Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
              <Key className="w-5 h-5 text-amber-400" />
              Token Trong LocalStorage
            </h3>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Access Token (JWT):</span>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs font-mono text-emerald-400 truncate">
                {tokenInfo.accessToken || '(Chưa có token)'}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Refresh Token (UUID trên Redis):</span>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs font-mono text-amber-400 truncate">
                {tokenInfo.refreshToken || '(Chưa có token)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
