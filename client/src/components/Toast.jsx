import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

/**
 * Simple toast notification system.
 */
let toastId = 0;
let addToastFn = null;

export function showToast(message, type = 'info') {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = {
    success: <CheckCircle2 size={18} color="var(--color-success)" />,
    error: <XCircle size={18} color="var(--color-danger)" />,
    info: <Info size={18} color="var(--color-info)" />,
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {icons[toast.type]}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
