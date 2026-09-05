import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

const TONE_STYLES = {
  info: "bg-slate-800 border border-slate-700 text-slate-200",
  success: "bg-green-900 border border-green-700 text-green-200",
  error: "bg-red-900 border border-red-700 text-red-200",
  warning: "bg-amber-900 border border-amber-700 text-amber-200",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, tone = "info", duration = 5000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, tone }]);
      if (duration) setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[90vw] print:hidden"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 text-sm shadow-lg flex items-start justify-between gap-3 ${
              TONE_STYLES[t.tone] ?? TONE_STYLES.info
            }`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-70 hover:opacity-100 text-xs leading-none mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
