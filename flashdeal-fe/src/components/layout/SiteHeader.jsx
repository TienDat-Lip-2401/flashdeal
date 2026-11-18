import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, User, X, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { useCategories } from '../../lib/queries';
import { isAdmin, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';

function AccountMenu() {
  const { user, status, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  if (status !== 'authenticated') {
    return (
      <Link
        to="/dang-nhap"
        state={{ from: location.pathname + location.search }}
        className="flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-ink hover:bg-surface"
      >
        <User className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Đăng nhập</span>
      </Link>
    );
  }

  const firstName = (user?.fullName || user?.email || '').trim().split(' ').pop();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-ink hover:bg-surface"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {firstName?.[0]?.toUpperCase() || 'U'}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{firstName}</span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl">
          <div className="border-b border-line px-4 pb-2 pt-1">
            <p className="truncate text-sm font-semibold">{user?.fullName}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <Link role="menuitem" to="/tai-khoan/don-hang" className="flex items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-surface">
            <Package className="h-4 w-4 text-muted" aria-hidden="true" /> Đơn hàng của tôi
          </Link>
          {isAdmin(user) && (
            <Link role="menuitem" to="/quan-tri" className="flex items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-surface">
              <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden="true" /> Trang quản trị
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              await logout();
              toast.info('Bạn đã đăng xuất.');
              navigate('/');
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] hover:bg-surface"
          >
            <LogOut className="h-4 w-4 text-muted" aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ open, onClose, categories }) {
  const location = useLocation();
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="Danh mục">
      <div className="wrap flex h-16 items-center justify-between">
        <Logo />
        <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2.5 hover:bg-surface" aria-label="Đóng danh mục">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="wrap flex-1 overflow-y-auto pb-8">
        <SearchBox className="mb-4" onDone={onClose} />
        <nav aria-label="Danh mục sản phẩm">
          <ul className="divide-y divide-line">
            <li>
              <Link to="/flash-sale" className="flex min-h-14 items-center gap-2 text-lg font-semibold text-sale">
                <Zap className="h-5 w-5" aria-hidden="true" /> Flash sale
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/danh-muc/${c.slug}`} className="flex min-h-14 items-center text-lg font-medium">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/tai-khoan/don-hang" className="flex min-h-14 items-center text-lg font-medium">
                Đơn hàng của tôi
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { data: categories = [] } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <>
      <a href="#noi-dung" className="sr-only z-[70] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
        Bỏ qua đến nội dung chính
      </a>
      <div className="hidden bg-surface text-[13px] text-ink-2 sm:block">
        <div className="wrap flex h-9 items-center justify-between gap-4">
          <p>Giữ hàng 15 phút khi bạn đặt suất flash sale · Thanh toán qua VNPay</p>
          <div className="flex items-center gap-5">
            <Link to="/tai-khoan/don-hang" className="hover:text-ink">
              Tra cứu đơn hàng
            </Link>
            <Link to="/flash-sale" className="hover:text-ink">
              Lịch flash sale
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="wrap flex h-16 items-center gap-3 lg:gap-8">
          <button
            type="button"
            className="-ml-2 rounded-full p-2.5 hover:bg-surface lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở danh mục"
            aria-expanded={menuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
          <SearchBox className="hidden flex-1 md:block lg:max-w-xl" />
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/tai-khoan/don-hang"
              className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-ink hover:bg-surface md:flex"
            >
              <Package className="h-5 w-5" aria-hidden="true" />
              <span className="hidden lg:inline">Đơn hàng</span>
            </Link>
            <AccountMenu />
          </div>
        </div>
        <div className="wrap pb-3 md:hidden">
          <SearchBox />
        </div>
        <nav aria-label="Danh mục sản phẩm" className="hidden border-t border-line lg:block">
          <ul className="wrap flex h-12 items-center gap-7 text-[15px] font-medium">
            <li>
              <NavLink to="/flash-sale" className="flex items-center gap-1.5 text-sale hover:opacity-80">
                <Zap className="h-4 w-4" aria-hidden="true" /> Flash sale
              </NavLink>
            </li>
            {sorted.map((c) => (
              <li key={c.id}>
                <NavLink
                  to={`/danh-muc/${c.slug}`}
                  className={({ isActive }) =>
                    `relative py-3 text-ink-2 hover:text-ink ${isActive ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-ink' : ''}`
                  }
                >
                  {c.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} categories={sorted} />
    </>
  );
}
