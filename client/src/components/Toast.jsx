import React, { useEffect } from 'react';

/**
 * Toast notification component
 * Inputs: toast { message, type }, onClose ()
 */
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast && toast.message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast || !toast.message) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  const bgColor = isError ? '#d32f2f' : isSuccess ? '#2e7d32' : '#1976d2';

  return (
    <div
      id="toast-container"
      className="toast"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: bgColor,
        color: '#fff',
        padding: '1rem 1.25rem',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 2000,
        fontFamily: 'sans-serif',
        maxWidth: '400px',
      }}
    >
      <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{toast.message}</span>
      <button
        id="close-toast-btn"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0 0.2rem',
          lineHeight: '1',
        }}
      >
        ×
      </button>
    </div>
  );
}
