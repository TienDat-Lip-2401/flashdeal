import { useQuery } from '@tanstack/react-query';
import { Seo } from '../lib/seo';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

export default function PhotoCreditsPage() {
  const credits = useQuery({
    queryKey: ['photo-credits'],
    queryFn: () => fetch('/images/products/credits.json').then((r) => r.json()),
    staleTime: Infinity,
  });
  const rows = Object.entries(credits.data ?? {}).sort((a, b) => a[1].product.localeCompare(b[1].product, 'vi'));

  return (
    <div className="wrap pb-16">
      <Seo title="Nguồn ảnh sản phẩm" path="/nguon-anh" description="Danh sách tác giả và giấy phép của các ảnh sản phẩm dùng trên FlashDeal." />
      <Breadcrumbs items={[{ label: 'Trang chủ', to: '/' }, { label: 'Nguồn ảnh' }]} />
      <h1 className="text-3xl font-bold">Nguồn ảnh sản phẩm</h1>
      <p className="mt-2 max-w-2xl text-[16px] text-ink-2">
        Ảnh sản phẩm lấy từ Wikimedia Commons, dùng theo giấy phép ghi bên cạnh. Mỗi ảnh dẫn tới trang gốc kèm tên tác giả.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-ink-2">
            <tr>
              <th className="px-4 py-3 font-semibold">Sản phẩm</th>
              <th className="px-4 py-3 font-semibold">Ảnh gốc</th>
              <th className="px-4 py-3 font-semibold">Tác giả</th>
              <th className="px-4 py-3 font-semibold">Giấy phép</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([slug, c]) => (
              <tr key={slug}>
                <td className="px-4 py-3 font-medium">{c.product}</td>
                <td className="px-4 py-3">
                  <a href={c.page} className="link" rel="nofollow noopener" target="_blank">
                    {c.title}
                  </a>
                </td>
                <td className="px-4 py-3">{c.author}</td>
                <td className="px-4 py-3">
                  {c.licenseUrl ? (
                    <a href={c.licenseUrl} className="link" rel="nofollow noopener" target="_blank">
                      {c.license}
                    </a>
                  ) : (
                    c.license
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
