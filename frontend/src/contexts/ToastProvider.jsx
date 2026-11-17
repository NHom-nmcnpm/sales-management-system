import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ToastContext } from './toast.js';

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback(
    (message, type = 'success') => setToast({ message, type, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'error' ? (
              <AlertCircle size={20} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} aria-hidden="true" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} aria-label="Đóng thông báo">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
