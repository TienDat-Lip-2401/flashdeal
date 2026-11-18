import { Link } from 'react-router-dom';
import { CreditCard, PackageCheck, RotateCcw, Timer } from 'lucide-react';
import { Logo } from './Logo';
import { useCategories } from '../../lib/queries';

const PROMISES = [
  { icon: Timer, title: 'Giữ hàng 15 phút', text: 'Đặt được suất flash sale là hàng được giữ cho bạn trong 15 phút để thanh toán.' },
  { icon: CreditCard, title: 'Thanh toán qua VNPay', text: 'Trả bằng thẻ ATM, thẻ quốc tế hoặc ứng dụng ngân hàng qua cổng VNPay.' },
  { icon: RotateCcw, title: 'Hủy đơn trả lại suất', text: 'Hủy đơn hoặc thanh toán không thành công, suất mua được trả lại để bạn đặt lại.' },
  { icon: PackageCheck, title: 'Theo dõi từng bước', text: 'Xem đơn đang chờ thanh toán, đang giao hay đã giao trong mục đơn hàng.' },
];

export function PromiseStrip() {
  return (
    <section aria-labelledby="cam-ket" className="border-t border-line bg-white">
      <h2 id="cam-ket" className="sr-only">
        Cách FlashDeal giữ hàng và thanh toán
      </h2>
      <ul className="wrap grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SiteFooter() {
  const { data: categories = [] } = useCategories();
  return (
    <footer className="bg-surface text-sm text-ink-2">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-muted">
            Cửa hàng MacBook, iPhone, iPad và phụ kiện, mở bán giá flash sale theo khung giờ.
          </p>
        </div>
        <nav aria-label="Danh mục ở chân trang">
          <h2 className="mb-3 font-semibold text-ink">Sản phẩm</h2>
          <ul className="space-y-2.5">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link to={`/danh-muc/${c.slug}`} className="hover:text-ink hover:underline underline-offset-4">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Hỗ trợ">
          <h2 className="mb-3 font-semibold text-ink">Mua hàng</h2>
          <ul className="space-y-2.5">
            <li>
              <Link to="/flash-sale" className="hover:text-ink hover:underline underline-offset-4">
                Lịch flash sale
              </Link>
            </li>
            <li>
              <Link to="/tai-khoan/don-hang" className="hover:text-ink hover:underline underline-offset-4">
                Tra cứu đơn hàng
              </Link>
            </li>
            <li>
              <Link to="/dang-ky" className="hover:text-ink hover:underline underline-offset-4">
                Tạo tài khoản
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-semibold text-ink">Liên hệ</h2>
          <ul className="space-y-2.5">
            <li>
              Email:{' '}
              <a href="mailto:hotro@flashdeal.example" className="hover:text-ink hover:underline underline-offset-4">
                hotro@flashdeal.example
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FlashDeal. Dự án cá nhân, không phải cửa hàng thật.</p>
          <p>
            Ảnh sản phẩm từ Wikimedia Commons theo giấy phép Creative Commons.{' '}
            <Link to="/nguon-anh" className="underline underline-offset-4 hover:text-ink">
              Xem nguồn ảnh
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
