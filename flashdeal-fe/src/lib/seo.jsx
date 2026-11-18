/*
  Per-page metadata. React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree
  into <head>, so each page renders <Seo …/> once. JSON-LD goes in a script tag in the body,
  which search engines read as well.
*/
export const SITE_NAME = 'FlashDeal';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');

export const absoluteUrl = (path = '/') => (/^https?:/.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

export function Seo({ title, description, path, image, noindex = false, jsonLd, type = 'website' }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – MacBook, iPhone, iPad giá flash sale`;
  const url = path ? absoluteUrl(path) : undefined;
  const img = image ? absoluteUrl(image) : absoluteUrl('/og-image.jpg');
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={img} />
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.label,
    ...(item.to ? { item: absoluteUrl(item.to) } : {}),
  })),
});
