import React, { useEffect, useState } from 'react';

export function MarketPage() {
  const [ingredients, setIngredients] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('price');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
      });
  }, [category, sort, order]);

  const categories = ['all', 'protein', 'carbs', 'vegetable'];

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
              onClick={() => setCategory(cat)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '16px',
                border: '1px solid #ccc',
                backgroundColor: category === cat ? '#1976d2' : '#fff',
                color: category === cat ? '#fff' : '#333',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: category === cat ? 'bold' : 'normal',
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
              value={sort}
              onChange={(e) => setSort(e.target.value)}
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
              value={order}
              onChange={(e) => setOrder(e.target.value)}
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
        <p data-testid="market-loading">Loading ingredients...</p>
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
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              data-testid={`ingredient-card-${ing.id}`}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
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
                <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: '#2e7d32' }}>
                  Market Price: ${ing.basePricePer100g.toFixed(2)} / 100g
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
          ))}
        </div>
      )}
    </div>
  );
}
