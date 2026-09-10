import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import StandardDialog from '../components/common/StandardDialog';
import ToastContainer from '../components/common/ToastContainer';

const DialogContext = createContext(null);

// Global event bus for non-component calls (e.g. axios interceptors)
let globalDialogHandler = null;

export const showGlobalAlert = (options) => {
  if (globalDialogHandler) {
    globalDialogHandler.show(options);
  } else {
    window.alert(typeof options === 'string' ? options : options.message || JSON.stringify(options));
  }
};

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
    title: '',
    message: '',
    details: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showDialog = useCallback((options) => {
    const isConfirm = options.type === 'confirm' || !!options.onConfirm;
    setDialogState({
      isOpen: true,
      type: options.type || (isConfirm ? 'confirm' : 'info'),
      title: options.title || (options.type === 'error' ? 'Operation Failed' : options.type === 'success' ? 'Success' : 'Notice'),
      message: options.message || (typeof options === 'string' ? options : ''),
      details: options.details || null,
      confirmText: options.confirmText || (isConfirm ? 'Confirm' : 'Got it'),
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      showCancel: isConfirm || options.showCancel || false
    });
  }, []);

  // Helpers
  const showSuccess = useCallback((message, title = 'Operation Successful') => {
    showDialog({
      type: 'success',
      title,
      message,
      confirmText: 'Continue'
    });
  }, [showDialog]);

  const showError = useCallback((message, title = 'Action Failed', details = null) => {
    showDialog({
      type: 'error',
      title,
      message: typeof message === 'string' ? message : (message?.message || 'An unexpected error occurred. Please try again.'),
      details: details || (message?.response?.data ? JSON.stringify(message.response.data, null, 2) : null),
      confirmText: 'Close'
    });
  }, [showDialog]);

  const showWarning = useCallback((message, title = 'Attention Required') => {
    showDialog({
      type: 'warning',
      title,
      message,
      confirmText: 'Understood'
    });
  }, [showDialog]);

  const showInfo = useCallback((message, title = 'Information') => {
    showDialog({
      type: 'info',
      title,
      message,
      confirmText: 'OK'
    });
  }, [showDialog]);

  const showConfirm = useCallback(({ title = 'Confirm Action', message, confirmText = 'Yes, Proceed', cancelText = 'Cancel', type = 'confirm', onConfirm, onCancel }) => {
    showDialog({
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm: async () => {
        closeDialog();
        if (onConfirm) await onConfirm();
      },
      onCancel: () => {
        closeDialog();
        if (onCancel) onCancel();
      }
    });
  }, [showDialog, closeDialog]);

  // Toast Helpers
  const showToast = useCallback(({ type = 'info', title = '', message = '', duration = 4000 }) => {
    const id = ++toastIdRef.current;
    const newToast = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global handler
  globalDialogHandler = {
    show: showDialog,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    confirm: showConfirm,
    toast: showToast
  };

  return (
    <DialogContext.Provider
      value={{
        showDialog,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        showToast,
        closeDialog
      }}
    >
      {children}
      <StandardDialog dialog={dialogState} onClose={closeDialog} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
