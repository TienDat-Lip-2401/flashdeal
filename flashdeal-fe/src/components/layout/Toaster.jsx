import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../../store/toast';

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-ok' },
  error: { icon: XCircle, cls: 'text-sale' },
  info: { icon: Info, cls: 'text-link' },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {toasts.map((t) => {
        const { icon: Icon, cls } = TONES[t.tone] ?? TONES.info;
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-[15px] text-white shadow-2xl"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls === 'text-ok' ? 'text-[#7ac142]' : cls === 'text-sale' ? 'text-[#ff6b6b]' : 'text-[#6cb4ff]'}`} aria-hidden="true" />
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 rounded-full p-1 text-white/70 hover:text-white" aria-label="Đóng thông báo">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
