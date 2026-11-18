import { useSearchParams } from 'react-router-dom';
import { Seo } from '../lib/seo';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ProductListing } from '../components/ProductListing';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();

  return (
    <div className="wrap pb-16">
      {/* Result pages are thin and endless; keep them out of the index. */}
      <Seo title={q ? `Kết quả tìm kiếm “${q}”` : 'Tìm kiếm'} path="/tim-kiem" noindex />
      <Breadcrumbs items={[{ label: 'Trang chủ', to: '/' }, { label: 'Tìm kiếm' }]} />
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">{q ? <>Kết quả cho “{q}”</> : 'Tìm sản phẩm'}</h1>
      <ProductListing
        keyword={q}
        emptyTitle={q ? `Không tìm thấy “${q}”` : 'Nhập tên sản phẩm để tìm'}
        emptyText="Kiểm tra lại chính tả, hoặc tìm bằng tên dòng máy như MacBook Air, iPhone 15, AirPods."
      />
    </div>
  );
}
