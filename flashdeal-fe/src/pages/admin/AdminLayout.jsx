import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { FolderTree, LayoutDashboard, Package, ShoppingBag, Zap } from 'lucide-react';
import { Seo } from '../../lib/seo';
import { isAdmin, useAuth } from '../../store/auth';

const NAV = [
  { to: '/quan-tri', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/quan-tri/don-hang', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/quan-tri/flash-sale', label: 'Flash sale', icon: Zap },
  { to: '/quan-tri/san-pham', label: 'Sản phẩm', icon: Package },
  { to: '/quan-tri/danh-muc', label: 'Danh mục', icon: FolderTree },
];

export default function AdminLayout() {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="wrap py-16"><div className="skeleton h-80 rounded-2xl" /></div>;
  if (status !== 'authenticated') return <Navigate to="/dang-nhap" state={{ from: location.pathname }} replace />;
  if (!isAdmin(user)) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-2xl font-bold">Bạn không có quyền vào trang quản trị</h1>
        <p className="mt-2 text-ink-2">Trang này chỉ dành cho tài khoản quản trị viên.</p>
      </div>
    );
  }
  return (
    <div className="wrap grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:py-8">
      <Seo title="Quản trị" noindex />
      <nav aria-label="Quản trị" className="lg:sticky lg:top-36 lg:self-start">
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium ${isActive ? 'bg-ink text-white' : 'text-ink-2 hover:bg-surface'}`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

export function AdminTitle({ title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const th = 'px-4 py-3 text-left text-[13px] font-semibold text-ink-2';
export const td = 'px-4 py-3 align-middle';
