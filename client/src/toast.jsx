import { createContext, useCallback, useContext, useState } from 'react';

// A small toast system replaces the original alert() calls. It keeps the same
// "tell the user what happened" behaviour but without blocking the UI thread.

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'info', timeout = 4000) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      if (timeout > 0) {
        setTimeout(() => dismiss(id), timeout);
      }
      return id;
    },
    [dismiss]
  );

  const value = {
    notify,
    success: (m, t) => notify(m, 'success', t),
    error: (m, t) => notify(m, 'error', t),
    info: (m, t) => notify(m, 'info', t),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
