import React, { useEffect, useState } from 'react';
import { getCosmetics, purchaseCosmetic, equipCosmetic } from '../api/cosmetics.js';
import { Toast } from '../components/Toast.jsx';

export function CosmeticsPage({ kitchen, onRefreshKitchen }) {
  const [cosmetics, setCosmetics] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchCosmeticsList = async () => {
    try {
      setLoading(true);
      const data = await getCosmetics();
      setCosmetics(data.cosmetics || []);
    } catch (err) {
      setToast({ message: err.message || 'Error loading cosmetics shop', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosmeticsList();
  }, []);

  const handleBuy = async (item) => {
    try {
      const data = await purchaseCosmetic(item.id);
      setToast({ message: `Successfully purchased ${data.cosmetic.name}!`, type: 'success' });
      await fetchCosmeticsList();
      if (onRefreshKitchen) await onRefreshKitchen();
    } catch (err) {
      setToast({ message: err.message || 'Failed to purchase cosmetic', type: 'error' });
    }
  };

  const handleEquip = async (item) => {
    try {
      await equipCosmetic(item.id);
      setToast({ message: `Equipped ${item.name}!`, type: 'success' });
      await fetchCosmeticsList();
      if (onRefreshKitchen) await onRefreshKitchen();
    } catch (err) {
      setToast({ message: err.message || 'Failed to equip cosmetic', type: 'error' });
    }
  };

  const filteredCosmetics = activeTab === 'all'
    ? cosmetics
    : cosmetics.filter((c) => c.type === activeTab);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>🎨 Cosmetics Shop & Customization</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
            Customize your bistro theme, plating style, and chef badges!
          </p>
        </div>
        <a
          href="/"
          id="back-to-dashboard-link"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1976d2',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        >
          ← Back to Dashboard
        </a>
      </div>

      {kitchen && (
        <div
          id="cosmetics-kitchen-info"
          style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '2rem',
            border: '1px solid #ddd',
          }}
        >
          <div>
            <strong>Wallet:</strong> <span id="cosmetics-wallet">${kitchen.wallet?.toFixed(2)}</span>
          </div>
          <div>
            <strong>Kitchen Tier:</strong> <span id="cosmetics-tier">{kitchen.tier}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'theme', 'plate_style', 'badge'].map((type) => (
          <button
            key={type}
            id={`tab-${type}`}
            onClick={() => setActiveTab(type)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === type ? '#1976d2' : '#e0e0e0',
              color: activeTab === type ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === type ? 'bold' : 'normal',
              textTransform: 'capitalize',
            }}
          >
            {type === 'plate_style' ? 'Plate Styles' : type === 'badge' ? 'Badges' : type}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading shop items...</p>
      ) : (
        <div
          id="cosmetics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredCosmetics.map((item) => {
            const isLockedTier = kitchen && kitchen.tier < item.unlockTier;
            const canAfford = kitchen && kitchen.wallet >= item.price;

            return (
              <div
                key={item.id}
                className={`cosmetic-card ${item.equipped ? 'equipped' : ''}`}
                id={`cosmetic-card-${item.id}`}
                style={{
                  border: item.equipped ? '2px solid #2e7d32' : '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: item.equipped ? '#f1f8e9' : '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: '#eee',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#555', margin: '0.5rem 0' }}>{item.description}</p>
                  <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0.5rem' }}>
                    Value: <code>{item.value}</code>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span>Price: <strong>${item.price.toFixed(2)}</strong></span>
                    <span>Unlock: Tier {item.unlockTier}</span>
                  </div>

                  {item.equipped ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      Equipped ✓
                    </button>
                  ) : item.unlocked ? (
                    <button
                      className="equip-cosmetic-btn"
                      id={`equip-cosmetic-${item.id}-btn`}
                      onClick={() => handleEquip(item)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0288d1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Equip Item
                    </button>
                  ) : isLockedTier ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#9e9e9e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'not-allowed',
                      }}
                    >
                      🔒 Requires Tier {item.unlockTier}
                    </button>
                  ) : (
                    <button
                      className="buy-cosmetic-btn"
                      id={`buy-cosmetic-${item.id}-btn`}
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: canAfford ? '#2e7d32' : '#bdbdbd',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                      }}
                    >
                      {canAfford ? 'Buy Cosmetic' : 'Insufficient Funds'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
