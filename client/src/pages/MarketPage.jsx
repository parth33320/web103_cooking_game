import React, { useEffect, useState } from 'react';
import { getSuppliers } from '../api/suppliers.js';
import { Spinner } from '../components/Spinner.jsx';

export function MarketPage() {
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('price');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kitchenTier, setKitchenTier] = useState(1);

  const triggerToast = (message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
  };

  useEffect(() => {
    fetch('/api/game/state')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.kitchen) {
          setKitchenTier(data.kitchen.tier || 1);
        }
      })
      .catch(() => {});

    getSuppliers()
      .then((data) => {
        if (data && data.suppliers) {
          setSuppliers(data.suppliers);
        }
      })
      .catch(() => {});

    let url = `/api/ingredients?sort=${sort}&order=${order}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }

    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch market ingredients');
        return res.json();
      })
      .then((data) => {
        setIngredients(data.ingredients || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        triggerToast(err.message || 'Error loading market ingredients', 'error');
      });
  }, [category, sort, order]);

  const categories = ['all', 'protein', 'carbs', 'vegetable', 'fat'];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>🛒 Ingredient Market</h1>
          <p style={{ color: '#666' }}>Browse ingredients, compare market vs base prices, and filter by macro goals.</p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
        >
          ← Back to Kitchen
        </a>
      </header>

      {/* Suppliers & Trust Panel */}
      <section
        data-testid="suppliers-panel"
        style={{
          backgroundColor: '#eef6fc',
          border: '1px solid #b6d4fe',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#0c5460', fontSize: '1.25rem' }}>🤝 Suppliers & Trust</h2>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#31708f' }}>
          Serve 4+ star dishes matching a supplier's ingredient category to build trust and unlock up to 25% discounts on market prices!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {suppliers.map((s) => (
            <div
              key={s.id}
              data-testid={`supplier-card-${s.id}`}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d0e2f0',
                borderRadius: '6px',
                padding: '0.85rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#1976d2' }}>{s.name}</h4>
              <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', textTransform: 'capitalize', color: '#666' }}>
                Category: <strong>{s.category}</strong>
              </p>
              <div style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>
                ⭐ Trust: <strong>{s.trust}</strong> Level
              </div>
              <div style={{ fontSize: '0.85rem', color: s.discountPct > 0 ? '#2e7d32' : '#888', fontWeight: 'bold' }}>
                🏷️ Discount: {s.discountPct}% OFF
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter and Sort Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              disabled={loading}
              onClick={() => {
                setCategory(cat);
                triggerToast(`Filtered market by ${cat}`, 'info');
              }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '16px',
                border: '1px solid #ccc',
                backgroundColor: category === cat ? '#1976d2' : '#fff',
                color: category === cat ? '#fff' : '#333',
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'capitalize',
                fontWeight: category === cat ? 'bold' : 'normal',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label htmlFor="sort-select" style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
              Sort by:
            </label>
            <select
              id="sort-select"
              data-testid="sort-select"
              disabled={loading}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                triggerToast(`Sorted market by ${e.target.value}`, 'info');
              }}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="price">Price</option>
              <option value="protein">Protein</option>
            </select>
          </div>

          <div>
            <label htmlFor="order-select" style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
              Order:
            </label>
            <select
              id="order-select"
              data-testid="order-select"
              disabled={loading}
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                triggerToast(`Market sort order: ${e.target.value}`, 'info');
              }}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="asc">Ascending ⬆️</option>
              <option value="desc">Descending ⬇️</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ingredient Cards Grid */}
      {loading ? (
        <div data-testid="market-loading-spinner" style={{ padding: '3rem', textAlign: 'center', color: '#1976d2' }}>
          <Spinner size="large" color="#1976d2" />
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Loading market ingredients...</p>
        </div>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : ingredients.length === 0 ? (
        <p>No ingredients found for category "{category}".</p>
      ) : (
        <div
          data-testid="ingredients-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {ingredients.map((ing) => {
            const isLocked = ing.minTier && ing.minTier > kitchenTier;
            return (
              <div
                key={ing.id}
                data-testid={`ingredient-card-${ing.id}`}
                className={`ingredient-card ${isLocked ? 'locked' : ''}`}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  backgroundColor: isLocked ? '#f0f0f0' : '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  opacity: isLocked ? 0.65 : 1,
                  position: 'relative',
                }}
              >
                {isLocked && (
                  <div
                    className="tier-lock-badge"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#d32f2f',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    🔒 Tier {ing.minTier} Required
                  </div>
                )}
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{ing.emoji || '🥗'}</div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>{ing.name}</h3>
                <span
                  style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    color: '#666',
                    backgroundColor: '#eee',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '1rem',
                  }}
                >
                  {ing.category}
                </span>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: isLocked ? '#777' : '#2e7d32' }}>
                    Market Price: ${(ing.effectivePricePer100g || ing.basePricePer100g).toFixed(2)} / 100g
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#888' }}>
                    Base Price: ${ing.basePricePer100g.toFixed(2)}
                  </p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#444' }}>
                    <span>💪 {ing.proteinGPer100g}g Protein</span> | <span>🍞 {ing.carbsGPer100g}g Carbs</span> |{' '}
                    <span>🥑 {ing.fatGPer100g}g Fat</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
