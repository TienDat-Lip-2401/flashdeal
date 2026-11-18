import { Check } from 'lucide-react';

export const ORDER_STATUS = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-warn-soft text-warn' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-ok-soft text-ok' },
  SHIPPING: { label: 'Đang giao', cls: 'bg-[#e8f1fc] text-link' },
  DELIVERED: { label: 'Đã giao', cls: 'bg-surface-2 text-ink' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-surface text-muted' },
};

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, cls: 'bg-surface text-muted' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

const STEPS = ['PENDING', 'PAID', 'SHIPPING', 'DELIVERED'];
const STEP_LABEL = { PENDING: 'Đặt suất', PAID: 'Thanh toán', SHIPPING: 'Đang giao', DELIVERED: 'Đã nhận' };

export function OrderTimeline({ status }) {
  if (status === 'CANCELLED') return null;
  const current = STEPS.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Tiến trình đơn hàng">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-brand' : 'bg-line'}`} />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : i < current ? 'bg-brand' : 'bg-line'}`} />
            </div>
            <span className={`text-xs sm:text-sm ${done ? 'font-medium text-ink' : 'text-muted'}`}>{STEP_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}
