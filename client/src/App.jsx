import React, { useEffect, useState } from 'react';
import { CookPage } from './pages/CookPage.jsx';
import { MarketPage } from './pages/MarketPage.jsx';

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [health, setHealth] = useState('checking...');
  const [gameState, setGameState] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');

  const fetchGameState = () => {
    fetch('/api/game/state')
      .then((res) => res.json())
      .then((data) => setGameState(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth('error'));

    fetchGameState();

    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleReset = async () => {
    try {
      const res = await fetch('/api/game/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGameState({ player: data.player, kitchen: data.kitchen, orders: data.orders });
        setMessage('Database reset to default seed state!');
        setShowConfirmModal(false);
      } else {
        setMessage('Failed to reset database.');
      }
    } catch (err) {
      setMessage('Error resetting database.');
    }
  };

  if (pathname === '/market') {
    return <MarketPage />;
  }

  if (pathname.includes('/cook')) {
    return <CookPage />;
  }

  const kitchen = gameState?.kitchen;
  const player = gameState?.player;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Budget Bistro 🍳</h1>
      <p id="health-status">API Status: {health}</p>

      {kitchen && (
        <div
          id="kitchen-stats"
          style={{
            background: '#f5f5f5',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            margin: '1.5rem 0',
            border: '1px solid #e0e0e0',
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {kitchen.name} (Chef: {player?.name || 'Head Chef'})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <strong>Wallet:</strong> <span id="stat-wallet">${kitchen.wallet?.toFixed(2)}</span>
            </div>
            <div>
              <strong>Reputation:</strong> <span id="stat-reputation">{kitchen.reputation}</span>/100
            </div>
            <div>
              <strong>Day:</strong> <span id="stat-day">{kitchen.day}</span>
            </div>
            <div>
              <strong>Tier:</strong> <span id="stat-tier">{kitchen.tier}</span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          id="status-message"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

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
        <button
          id="reset-game-btn"
          onClick={() => setShowConfirmModal(true)}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset Game 🔄
        </button>
      </div>

      {showConfirmModal && (
        <div
          id="confirm-reset-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Reset Game Database?</h3>
            <p style={{ color: '#555' }}>
              Are you sure you want to reset your kitchen? All saved dishes, custom orders, and progress will be reset to default starter state.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                id="cancel-reset-btn"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#9e9e9e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                id="confirm-reset-btn"
                onClick={handleReset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
