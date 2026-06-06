import { useState, useEffect, useCallback } from "react";
import { setToastListener } from "./toast";

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "✅", text: "#15803d" },
  error:   { bg: "#fef2f2", border: "#fca5a5", icon: "❌", text: "#dc2626" },
  info:    { bg: "#fffbeb", border: "#fcd34d", icon: "💡",  text: "#92400e" },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    setToastListener((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => remove(toast.id), 3500);
    });
    return () => setToastListener(null);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10,
      maxWidth: 340, width: "calc(100vw - 48px)",
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id}
            onClick={() => remove(t.id)}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${c.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              cursor: "pointer",
              animation: "slideIn 0.25s ease",
            }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ fontSize: 14, color: c.text, fontWeight: 500, lineHeight: 1.4 }}>
              {t.message}
            </span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}
