import React, { useEffect, useState } from 'react';
import { CookPage } from './pages/CookPage.jsx';
import { MarketPage } from './pages/MarketPage.jsx';
import { DishPage } from './pages/DishPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { MarketNewsSlideout } from './components/MarketNewsSlideout.jsx';
import { OrderDetailModal } from './components/OrderDetailModal.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Toast } from './components/Toast.jsx';

/**
 * Component to throw an error when ?triggerError=true query param is present (for testing ErrorBoundary)
 */
function BuggyComponent() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('triggerError') === 'true') {
    throw new Error('Test error caught by ErrorBoundary');
  }
  return null;
}

export function AppContent() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [health, setHealth] = useState('checking...');
  const [gameState, setGameState] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isNextDayPending, setIsNextDayPending] = useState(false);

  // S2.6 Slide-out & Modal State
  const [isNewsSlideoutOpen, setIsNewsSlideoutOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // S2.7 Toast state
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = 'info') => {
    setToast({ message: msg, type });
  };

  const fetchGameState = () => {
    fetch('/api/game/state')
      .then((res) => res.json())
      .then((data) => setGameState(data))
      .catch(() => {
        triggerToast('Failed to fetch game state', 'error');
      });
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => {
        setHealth('error');
        triggerToast('API server health check failed', 'error');
      });

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
        setGameState({ player: data.player, kitchen: data.kitchen, orders: data.orders, activeEvents: data.activeEvents || [] });
        setMessage('Database reset to default seed state!');
        triggerToast('Kitchen database reset successfully!', 'success');
        setShowConfirmModal(false);
      } else {
        setMessage('Failed to reset database.');
        triggerToast('Failed to reset database', 'error');
      }
    } catch (err) {
      setMessage('Error resetting database.');
      triggerToast('Error connecting to server for reset', 'error');
    }
  };

  const handleNextDay = async () => {
    setIsNextDayPending(true);
    setMessage('');
    try {
      const res = await fetch('/api/game/next-day', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGameState({
          player: data.player,
          kitchen: data.kitchen,
          orders: data.orders,
          activeEvents: data.activeEvents || [],
        });
        if (data.gameOver) {
          setMessage(`GAME OVER! ${data.gameOverReason}`);
          triggerToast(`GAME OVER: ${data.gameOverReason}`, 'error');
        } else {
          const msg = `Advanced to Day ${data.kitchen.day}! Rent charged: $${data.rentCharged.toFixed(2)}.`;
          setMessage(msg);
          triggerToast(msg, 'success');
          // S2.6 Auto-open market news slideout on Next Day
          setIsNewsSlideoutOpen(true);
        }
      } else {
        setMessage('Error advancing to next day.');
        triggerToast(data?.error?.message || 'Error advancing to next day', 'error');
      }
    } catch (err) {
      setMessage('Failed to advance day.');
      triggerToast('Failed to connect to server for next day', 'error');
    } finally {
      setIsNextDayPending(false);
    }
  };

  // Check known routes
  if (pathname === '/market') {
    return (
      <>
        <BuggyComponent />
        <MarketPage />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (pathname.includes('/cook')) {
    return (
      <>
        <BuggyComponent />
        <CookPage />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (pathname.startsWith('/dishes/')) {
    return (
      <>
        <BuggyComponent />
        <DishPage />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (pathname !== '/' && pathname !== '/orders') {
    return (
      <>
        <BuggyComponent />
        <NotFoundPage />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const kitchen = gameState?.kitchen;
  const player = gameState?.player;
  const orders = gameState?.orders || [];
  const activeEvents = gameState?.activeEvents || [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <BuggyComponent />
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

      <div
        id="active-events-section"
        style={{
          padding: '1rem',
          backgroundColor: '#fff8e1',
          borderRadius: '6px',
          border: '1px solid #ffe082',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#f57f17' }}>📰 Active Market Events ({activeEvents.length})</h3>
          <button
            id="view-market-news-btn"
            onClick={() => setIsNewsSlideoutOpen(true)}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#f57f17',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
            }}
          >
            View Market News 📰
          </button>
        </div>
        {activeEvents.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {activeEvents.map((evt) => (
              <li key={evt.id || evt.eventId} className="active-event-item" style={{ marginBottom: '0.5rem' }}>
                <strong>{evt.name}</strong> ({evt.category}): {evt.multiplier}x price ({evt.daysRemaining} days remaining) - {evt.description}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
            No active market price events today.
          </p>
        )}
      </div>

      {orders.length > 0 && (
        <div
          id="orders-section"
          style={{
            padding: '1rem',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ marginTop: 0 }}>📋 Today's Open Orders ({orders.length})</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {orders.map((o) => (
              <div
                key={o.id}
                className="order-card"
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>Order #{o.id}</strong> ({o.customerName || 'Customer'}) - Budget: ${o.budget?.toFixed(2)} | Target Protein: {o.targetProteinG}g
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="view-order-details-btn"
                    id={`view-order-${o.id}-btn`}
                    onClick={() => setSelectedOrder(o)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    View Details
                  </button>
                  <a
                    href={`/orders/${o.id}/cook`}
                    className="cook-order-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', `/orders/${o.id}/cook`);
                      setPathname(`/orders/${o.id}/cook`);
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#2e7d32',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  >
                    Cook Order #{o.id}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div
          id="status-message"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: message.includes('GAME OVER') ? '#ffebee' : '#e8f5e9',
            color: message.includes('GAME OVER') ? '#c62828' : '#2e7d32',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          id="next-day-btn"
          onClick={handleNextDay}
          disabled={isNextDayPending}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#7b1fa2',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {isNextDayPending ? 'Advancing...' : 'Next Day 🌙'}
        </button>
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

      {/* S2.6 Slide-out & Modal Presenters */}
      <MarketNewsSlideout
        isOpen={isNewsSlideoutOpen}
        events={activeEvents}
        onClose={() => setIsNewsSlideoutOpen(false)}
      />

      <OrderDetailModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCook={(orderId) => {
          setSelectedOrder(null);
          window.history.pushState({}, '', `/orders/${orderId}/cook`);
          setPathname(`/orders/${orderId}/cook`);
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
