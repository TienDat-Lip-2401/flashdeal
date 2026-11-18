import { Link } from 'react-router-dom';

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl bg-surface px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Link to={action.to} className="btn btn-dark">
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="btn btn-dark">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ text = 'Không tải được dữ liệu.', onRetry }) {
  return (
    <div className="rounded-2xl border border-line px-6 py-10 text-center" role="alert">
      <p className="font-medium text-ink">{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost btn-sm mt-4">
          Tải lại trang này
        </button>
      )}
    </div>
  );
}

export function SectionHeading({ title, action, id, children }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-2xl font-bold text-ink sm:text-[28px]">
          {title}
        </h2>
        {children}
      </div>
      {action && (
        <Link to={action.to} className="link shrink-0 text-[15px] font-medium">
          {action.label}
        </Link>
      )}
    </div>
  );
}
