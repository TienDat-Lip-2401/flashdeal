const vnd = new Intl.NumberFormat('vi-VN');

export const formatPrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `${vnd.format(Math.round(n))}₫` : '';
};

export const discountPercent = (original, sale) => {
  const o = Number(original);
  const s = Number(sale);
  if (!o || !s || s >= o) return 0;
  return Math.round(((o - s) / o) * 100);
};

/* Backend timestamps are local (Asia/Ho_Chi_Minh) without an offset. */
export const parseDate = (value) => (value ? new Date(String(value).replace(' ', 'T')) : null);

export const formatDateTime = (value) => {
  const d = parseDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatShortTime = (value) => {
  const d = parseDate(value);
  if (!d) return '';
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
};

export const splitDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
};

export const pad2 = (n) => String(n).padStart(2, '0');
