import { useEffect } from 'react';
import { useUIStore } from '../stores';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration ?? 4000;
      const timer = setTimeout(() => removeToast(toast.id), duration);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right ${
            toast.type === 'success' ? 'bg-success/10 border-success/30 text-success' :
            toast.type === 'error' ? 'bg-error/10 border-error/30 text-error' :
            toast.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' :
            'bg-primary/10 border-primary/30 text-primary'
          }`}
        >
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description && <p className="text-xs mt-1 opacity-80">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
