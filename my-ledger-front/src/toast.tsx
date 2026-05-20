import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(items => items.filter(item => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(items => [...items, { id, type, message }]);
    window.setTimeout(() => removeToast(id), 3200);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex w-[calc(100%-32px)] max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;
          const color = toast.type === 'success' ? 'text-[#4d7c6b]' : toast.type === 'error' ? 'text-[#c05656]' : 'text-[#8b9d83]';
          return (
            <div key={toast.id} className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[#f0ede6] bg-white px-4 py-3 shadow-lg">
              <Icon size={18} className={color} />
              <p className="min-w-0 flex-1 text-sm text-[#4a4a46]">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
