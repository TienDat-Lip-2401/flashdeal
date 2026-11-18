export function StockBar({ sold, total, className = '' }) {
  const safeTotal = Math.max(1, total || 0);
  const pct = Math.min(100, Math.round((Math.max(0, sold) / safeTotal) * 100));
  const left = Math.max(0, safeTotal - sold);
  const label = left === 0 ? 'Đã hết suất' : `Còn ${left}/${total} suất`;
  return (
    <div className={className}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-sale-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-sale transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
