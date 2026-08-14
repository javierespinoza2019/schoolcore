import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconMap = {
    success: 'ri-checkbox-circle-line',
    error: 'ri-error-warning-line',
    info: 'ri-information-line',
  };

  const colorMap = {
    success: 'border-emerald-400 bg-emerald-50 text-emerald-800',
    error: 'border-red-400 bg-red-50 text-red-800',
    info: 'border-sky-400 bg-sky-50 text-sky-800',
  };

  const iconColorMap = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-sky-500',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-sm animate-slide-up min-w-[280px] max-w-[420px] ${colorMap[toast.type]}`}
          >
            <i className={`${iconMap[toast.type]} text-lg flex-shrink-0 ${iconColorMap[toast.type]}`} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xs" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}