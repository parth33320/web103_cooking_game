import React, { useEffect, useState } from 'react';
import { CookPage } from './pages/CookPage.jsx';

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [health, setHealth] = useState('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('error'));

    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname.includes('/cook')) {
    return <CookPage />;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Budget Bistro</h1>
      <p id="health-status">API Status: {health}</p>
      <a
        href="/orders/1/cook"
        id="cook-link"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState({}, '', '/orders/1/cook');
          setPathname('/orders/1/cook');
        }}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.25rem',
          backgroundColor: '#2e7d32',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          marginTop: '1rem',
        }}
      >
        Go to Cook Order #1
      </a>
    </div>
  );
}
