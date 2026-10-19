import React from 'react';

/**
 * 404 Not Found Page Component
 */
export function NotFoundPage() {
  return (
    <div
      id="not-found-page"
      style={{
        padding: '3rem 2rem',
        maxWidth: '600px',
        margin: '3rem auto',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', color: '#d32f2f' }}>404</h1>
      <h2 style={{ marginTop: 0, color: '#333' }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        The recipe or page you are looking for does not exist in Budget Bistro.
      </p>
      <a
        id="go-home-link"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1976d2',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
        }}
      >
        Return to Kitchen Dashboard 🍳
      </a>
    </div>
  );
}
