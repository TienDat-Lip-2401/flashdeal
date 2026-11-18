import { Link } from 'react-router-dom';
import { Seo } from '../lib/seo';

export default function NotFoundPage() {
  return (
    <div className="wrap flex flex-col items-center py-24 text-center">
      <Seo title="Không tìm thấy trang" noindex />
      <p className="text-sm font-semibold text-brand">Lỗi 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Không tìm thấy trang này</h1>
      <p className="mt-3 max-w-md text-[16px] text-ink-2">Đường dẫn có thể đã đổi hoặc sản phẩm đã ngừng bán.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-dark">
          Về trang chủ
        </Link>
        <Link to="/flash-sale" className="btn btn-ghost">
          Xem lịch flash sale
        </Link>
      </div>
    </div>
  );
}
