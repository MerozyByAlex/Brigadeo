import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { ToastProps } from './Toast';
import Toast from './Toast';

type ToastContextType = {
  showToast: (props: Omit<ToastProps, 'onClose'>) => void;
};

type ToastItem = ToastProps & { id: string };

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((props: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...props, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastContext }