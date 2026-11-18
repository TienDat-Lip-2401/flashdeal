import { useParams } from 'react-router-dom';
import { Seo, breadcrumbLd } from '../lib/seo';
import { useCategories } from '../lib/queries';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ProductListing } from '../components/ProductListing';
import NotFoundPage from './NotFoundPage';

export default function CategoryPage() {
  const { slug } = useParams();
  const { data: categories, isLoading } = useCategories();
  const category = categories?.find((c) => c.slug === slug);

  if (isLoading) {
    return (
      <div className="wrap py-10">
        <div className="skeleton mb-6 h-9 w-56" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (!category) return <NotFoundPage />;

  const crumbs = [
    { label: 'Trang chủ', to: '/' },
    { label: category.name, to: `/danh-muc/${category.slug}` },
  ];

  return (
    <div className="wrap pb-16">
      <Seo
        title={`${category.name} chính hãng, giá tốt`}
        description={`Mua ${category.name} chính hãng tại FlashDeal: so giá các phiên bản, xem suất flash sale đang mở, giữ hàng 15 phút và thanh toán qua VNPay.`}
        path={`/danh-muc/${category.slug}`}
        jsonLd={breadcrumbLd(crumbs)}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">{category.name}</h1>
      <ProductListing categoryId={category.id} emptyTitle={`Chưa có sản phẩm ${category.name}`} />
    </div>
  );
}
