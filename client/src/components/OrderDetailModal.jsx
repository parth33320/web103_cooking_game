import React from 'react';

/**
 * OrderDetailModal Presenter Component
 *
 * Inputs: props { isOpen: boolean, order: Object, onClose: Function, onCook: Function }
 * Outputs: Modal overlay JSX element or null
 */
export function OrderDetailModal({ isOpen, order, onClose, onCook }) {
  if (!isOpen || !order) return null;

  return (
    <div
      id="order-detail-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1b5e20' }}>
            📋 Order #{order.id} Details
          </h2>
          <button
            id="close-order-modal"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
            }}
            aria-label="Close Order Details"
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
          <div style={{ backgroundColor: '#f9f9f9', padding: '0.75rem', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>👤 Customer Profile</h4>
            <div><strong>Name:</strong> {order.customerName || 'Patron'}</div>
            <div><strong>Job:</strong> {order.job || 'Patron'}</div>
            <div><strong>Diet:</strong> {order.diet || 'Omnivore'}</div>
          </div>

          <div style={{ backgroundColor: '#f9f9f9', padding: '0.75rem', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>🎯 Macro Targets</h4>
            <div><strong>Budget:</strong> ${order.budget?.toFixed(2)}</div>
            <div><strong>Target Protein:</strong> {order.targetProteinG}g</div>
            <div><strong>Target Carbs:</strong> {order.targetCarbsG || 0}g</div>
            <div><strong>Target Fat:</strong> {order.targetFatG || 0}g</div>
            <div><strong>Tolerance:</strong> &plusmn;{order.tolerancePct || 10}%</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fffde7', border: '1px solid #fff59d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#f57f17' }}>⭐ Customer Preferences</h4>
          <div>
            <strong>Favorite Ingredient:</strong>{' '}
            {order.favoriteIngredientName ? (
              <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>💚 {order.favoriteIngredientName}</span>
            ) : (
              'None'
            )}
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <strong>Blacklisted Ingredient:</strong>{' '}
            {order.blacklistedIngredientName ? (
              <span style={{ color: '#c62828', fontWeight: 'bold' }}>🚫 {order.blacklistedIngredientName}</span>
            ) : (
              'None'
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            id="close-order-modal-btn"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#9e9e9e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Close
          </button>
          <button
            id="modal-cook-btn"
            onClick={() => onCook(order.id)}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cook Order #{order.id} 🍳
          </button>
        </div>
      </div>
    </div>
  );
}
