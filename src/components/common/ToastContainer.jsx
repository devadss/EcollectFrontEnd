import React from 'react';
import './StandardDialog.css';

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container-stack">
      {toasts.map((t) => {
        const icon =
          t.type === 'success' ? '✓' :
          t.type === 'error' ? '✕' :
          t.type === 'warning' ? '⚠️' : 'ℹ️';

        return (
          <div key={t.id} className={`toast-bubble is-${t.type}`}>
            <div className="toast-icon-chip">{icon}</div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-dismiss-btn" onClick={() => onRemove(t.id)}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
