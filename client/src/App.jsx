import React, { useEffect, useState } from 'react';
import { CookPage } from './pages/CookPage.jsx';
import { MarketPage } from './pages/MarketPage.jsx';

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

  if (pathname === '/market') {
    return <MarketPage />;
  }

  if (pathname.includes('/cook')) {
    return <CookPage />;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Budget Bistro</h1>
      <p id="health-status">API Status: {health}</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
          }}
        >
          Go to Cook Order #1
        </a>
        <a
          href="/market"
          id="market-link"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/market');
            setPathname('/market');
          }}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#1976d2',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
          }}
        >
          Go to Market 🛒
        </a>
      </div>
    </div>
  );
}
