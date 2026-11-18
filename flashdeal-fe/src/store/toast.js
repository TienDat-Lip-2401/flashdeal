import { create } from 'zustand';

let nextId = 1;

export const useToast = create((set, get) => ({
  toasts: [],
  show(message, tone = 'info', timeout = 4500) {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    if (timeout) setTimeout(() => get().dismiss(id), timeout);
    return id;
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  success: (m) => useToast.getState().show(m, 'success'),
  error: (m) => useToast.getState().show(m, 'error', 6000),
  info: (m) => useToast.getState().show(m, 'info'),
};
