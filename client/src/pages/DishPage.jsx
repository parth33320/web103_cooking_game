import React, { useState, useEffect } from 'react';

export function DishPage() {
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract dishId from URL path, e.g., /dishes/1 or /dishes/10
    const pathParts = window.location.pathname.split('/');
    const dishId = pathParts[2] || '1';

    fetch(`/api/dishes/${dishId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Dish not found');
        return res.json();
      })
      .then((data) => {
        setDish(data.dish);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }} data-testid="dish-loading">Loading dish details...</div>;
  }

  if (error || !dish) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: 'red' }}>Error</h2>
        <p>{error || 'Dish not found'}</p>
        <button
          onClick={() => navigateTo('/')}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Kitchen
        </button>
      </div>
    );
  }

  const breakdown = dish.breakdown;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Dish #{dish.id} Details</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a
            href="/"
            id="back-to-kitchen-btn"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/');
            }}
            style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
          >
            ← Back to Kitchen
          </a>
          <a
            href="/orders"
            id="back-to-orders-btn"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/orders');
            }}
            style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
          >
            ← Back to Orders
          </a>
        </div>
      </header>

      <div
        id="dish-card"
        style={{
          padding: '1.5rem',
          border: '2px solid #1976d2',
          borderRadius: '8px',
          backgroundColor: '#f4f9ff',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
          Rating: <strong id="dish-stars">{'⭐'.repeat(Math.round(dish.stars || 3))} ({dish.stars} Stars)</strong>
        </p>

        {dish.review && (
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '6px', borderLeft: '4px solid #1976d2', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontStyle: 'italic' }}>"{dish.review}"</p>
          </div>
        )}

        <p><strong>Order ID:</strong> #{dish.orderId}</p>

        {breakdown && (
          <div id="dish-breakdown" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '6px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Score Breakdown</h4>
            {breakdown.hardFailReason ? (
              <p style={{ color: 'red', margin: 0 }}><strong>Hard Fail:</strong> {breakdown.hardFailReason}</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Base Stars: {breakdown.baseStars}</li>
                <li>Macro Penalty: {breakdown.macroPenalty}</li>
                <li>Budget Penalty: {breakdown.budgetPenalty}</li>
                <li>Favorite Bonus: +{breakdown.favoriteBonus}</li>
                <li>Luck Roll: {breakdown.luckRoll > 0 ? `+${breakdown.luckRoll}` : breakdown.luckRoll}</li>
              </ul>
            )}
          </div>
        )}
      </div>

      {dish.ingredients && dish.ingredients.length > 0 && (
        <div id="dish-ingredients-section" style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Ingredients Plating Blueprint</h3>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {dish.ingredients.map((ing) => (
              <li key={ing.ingredientId || ing.id} style={{ marginBottom: '0.5rem' }}>
                {ing.emoji || '🥗'} <strong>{ing.name}</strong> - {ing.quantityG || 100}g (${((ing.quantityG || 100) / 100 * (ing.basePricePer100g || 0)).toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
