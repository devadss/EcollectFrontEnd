import React, { useEffect } from 'react';
import './StandardDialog.css';

const DialogIcons = {
  Success: () => (
    <div className="dialog-icon-wrapper is-success">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div className="icon-glow is-success"></div>
    </div>
  ),
  Error: () => (
    <div className="dialog-icon-wrapper is-error">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <div className="icon-glow is-error"></div>
    </div>
  ),
  Warning: () => (
    <div className="dialog-icon-wrapper is-warning">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="icon-glow is-warning"></div>
    </div>
  ),
  Confirm: () => (
    <div className="dialog-icon-wrapper is-confirm">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div className="icon-glow is-confirm"></div>
    </div>
  ),
  Info: () => (
    <div className="dialog-icon-wrapper is-info">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div className="icon-glow is-info"></div>
    </div>
  )
};

const StandardDialog = ({ dialog, onClose }) => {
  const {
    isOpen,
    type = 'info',
    title,
    message,
    details,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    showCancel = false
  } = dialog;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        else onClose();
      } else if (e.key === 'Enter' && !showCancel) {
        if (onConfirm) onConfirm();
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel, onClose, showCancel]);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <DialogIcons.Success />;
      case 'error':
        return <DialogIcons.Error />;
      case 'warning':
        return <DialogIcons.Warning />;
      case 'confirm':
        return <DialogIcons.Confirm />;
      case 'info':
      default:
        return <DialogIcons.Info />;
    }
  };

  return (
    <div className="standard-dialog-overlay" onClick={handleCancelClick}>
      <div
        className={`standard-dialog-card is-${type}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header & Glow */}
        <div className="dialog-ambient-glow"></div>

        <button className="dialog-close-btn" onClick={handleCancelClick} aria-label="Close">
          ✕
        </button>

        <div className="dialog-body">
          <div className="dialog-icon-area">
            {renderIcon()}
          </div>

          <div className="dialog-content-area">
            <h3 className="dialog-title">{title}</h3>
            <div className="dialog-message">{message}</div>

            {details && (
              <details className="dialog-details-box">
                <summary>Technical Details & Logs</summary>
                <pre className="dialog-details-code">{details}</pre>
              </details>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dialog-actions-row">
          {showCancel && (
            <button className="dialog-btn is-cancel" onClick={handleCancelClick}>
              {cancelText}
            </button>
          )}

          <button className={`dialog-btn is-confirm-btn is-${type}`} onClick={handleConfirmClick} autoFocus>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardDialog;
