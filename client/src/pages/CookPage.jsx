import React, { useState, useEffect } from 'react';

export function CookPage() {
  const [order, setOrder] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const fetchOrderDetails = (orderId) => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setIngredients(data.ingredients);
        setStatus('idle');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  };

  useEffect(() => {
    // Extract orderId from URL pathname, e.g. /orders/1/cook
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[2] || '1';

    fetchOrderDetails(orderId);
  }, []);

  const toggleIngredient = (id) => {
    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== id));
    } else {
      setSelectedIngredients([...selectedIngredients, id]);
    }
  };

  const handleServe = async () => {
    if (!order) return;
    setStatus('pending');
    try {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          lines: selectedIngredients.map((id) => ({ ingredientId: id, quantityG: 100 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to serve dish');
      setResult(data);
      setStatus('done');

      // Redirect to /dishes/:dishId after serve
      if (data.dishId) {
        window.history.pushState({}, '', `/dishes/${data.dishId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        fetchOrderDetails(order.id);
      }
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'loading') return <div style={{ padding: '2rem' }}>Loading order...</div>;
  if (status === 'error' && !order) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Cook Page</h1>
      {order && (
        <div style={{ border: '1px solid #ccc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: '#fafafa' }}>
          <h2 style={{ marginTop: 0 }}>Order #{order.id} for {order.customerName}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <p><strong>Job:</strong> <span id="customer-job">{order.job}</span></p>
            <p><strong>Diet:</strong> <span id="customer-diet">{order.diet}</span></p>
            <p><strong>Favorite Ingredient:</strong> <span id="customer-favorite">{order.favoriteIngredientName || 'None'}</span></p>
            <p><strong>Blacklisted Ingredient:</strong> <span id="customer-blacklist">{order.blacklistedIngredientName || 'None'}</span></p>
          </div>
          <hr style={{ border: '0', borderTop: '1px solid #e0e0e0', margin: '0.75rem 0' }} />
          <p><strong>Budget:</strong> ${order.budget?.toFixed(2)}</p>
          <p><strong>Macro Targets:</strong> Protein {order.targetProteinG}g | Carbs {order.targetCarbsG || 0}g | Fat {order.targetFatG || 0}g (±{order.tolerancePct || 10}%)</p>
        </div>
      )}

      <h3>Select Ingredients</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {ingredients.map((ing) => {
          const isSelected = selectedIngredients.includes(ing.id);
          return (
            <button
              key={ing.id}
              data-testid={`ingredient-${ing.id}`}
              onClick={() => toggleIngredient(ing.id)}
              style={{
                padding: '0.75rem 1rem',
                border: isSelected ? '2px solid #2e7d32' : '1px solid #ccc',
                backgroundColor: isSelected ? '#e8f5e9' : '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {ing.emoji} {ing.name} (${ing.basePricePer100g}/100g)
            </button>
          );
        })}
      </div>

      <button
        id="serve-button"
        disabled={selectedIngredients.length === 0 || status === 'pending'}
        onClick={handleServe}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: selectedIngredients.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'pending' ? 'Serving...' : 'Serve Dish'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {result && (
        <div id="result-box" style={{ marginTop: '2rem', padding: '1rem', border: '2px solid #1976d2', borderRadius: '8px', backgroundColor: '#e3f2fd' }}>
          <h2>Dish Score Result</h2>
          <p style={{ fontSize: '1.5rem' }}>
            Stars: <strong id="star-rating">{'⭐'.repeat(Math.round(result.stars))} ({result.stars} Stars)</strong>
          </p>
          <p><em>"{result.review}"</em></p>

          {result.breakdown && (
            <div id="score-breakdown" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}>
              <h4>Score Breakdown</h4>
              {result.breakdown.hardFailReason ? (
                <p style={{ color: 'red' }}><strong>Hard Fail:</strong> {result.breakdown.hardFailReason}</p>
              ) : (
                <ul>
                  <li>Base Stars: {result.breakdown.baseStars}</li>
                  <li>Macro Penalty: {result.breakdown.macroPenalty}</li>
                  <li>Budget Penalty: {result.breakdown.budgetPenalty}</li>
                  <li>Favorite Bonus: +{result.breakdown.favoriteBonus}</li>
                  <li>Luck Roll: {result.breakdown.luckRoll > 0 ? `+${result.breakdown.luckRoll}` : result.breakdown.luckRoll}</li>
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {order && order.reviews && order.reviews.length > 0 && (
        <div id="order-reviews-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Customer Reviews for Order #{order.id} ({order.reviews.length})</h3>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {order.reviews.map((rev) => (
              <li key={rev.id} style={{ marginBottom: '0.75rem' }} data-testid={`order-review-${rev.id}`}>
                <strong>{'⭐'.repeat(Math.round(rev.stars))} ({rev.stars} stars):</strong> "{rev.reviewText}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
