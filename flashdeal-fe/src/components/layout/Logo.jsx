import { Link } from 'react-router-dom';

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label="FlashDeal, về trang chủ">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#1d1d1f" />
        <path d="M18.2 5.5 9.5 18h6l-1.7 8.5L22.5 14h-6l1.7-8.5Z" fill="#7ac142" />
      </svg>
      <span className="text-[21px] font-bold tracking-tight">
        Flash<span className="text-brand">Deal</span>
      </span>
    </Link>
  );
}
