import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/* Native <dialog>: focus trap, Esc to close and the backdrop come from the browser. */
export function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/40`}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="-m-2 rounded-full p-2 text-muted hover:bg-surface hover:text-ink" aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
