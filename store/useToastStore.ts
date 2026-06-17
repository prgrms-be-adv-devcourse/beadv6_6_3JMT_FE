import { create } from 'zustand';

interface ToastState {
  message: string | null;
  showToast: (msg: string) => void;
  hide: () => void;
}

let _timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,

  showToast: (msg) => {
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => {
      set({ message: null });
      _timer = null;
    }, 1800);
  },

  hide: () => {
    if (_timer) { clearTimeout(_timer); _timer = null; }
    set({ message: null });
  },
}));

export function useToast() {
  return useToastStore((s) => s.showToast);
}
