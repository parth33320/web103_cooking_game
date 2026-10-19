import React from 'react';

/**
 * MarketNewsSlideout Presenter Component
 *
 * Inputs: props { isOpen: boolean, events: Array<Object>, onClose: Function }
 * Outputs: Slide-out drawer JSX element or null
 */
export function MarketNewsSlideout({ isOpen, events = [], onClose }) {
  if (!isOpen) return null;

  return (
    <div
      id="market-news-slideout"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
        maxWidth: '90vw',
        height: '100%',
        backgroundColor: '#ffffff',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.25)',
        zIndex: 1100,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #f57f17',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f57f17', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📰</span> Market News & Event Flash
        </h2>
        <button
          id="close-news-slideout"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#555',
            lineHeight: 1,
          }}
          aria-label="Close Market News"
        >
          &times;
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No active market events affecting prices today.</p>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id || evt.eventId}
              className="market-news-card"
              style={{
                backgroundColor: '#fffde7',
                border: '1px solid #ffe082',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1rem', color: '#333' }}>{evt.name}</strong>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: evt.multiplier > 1 ? '#ffcdd2' : '#c8e6c9',
                    color: evt.multiplier > 1 ? '#b71c1c' : '#1b5e20',
                  }}
                >
                  {evt.multiplier}x Price
                </span>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555' }}>{evt.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#777' }}>
                <span>Category: <strong>{evt.category}</strong></span>
                <span>Remaining: <strong>{evt.daysRemaining} day(s)</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f57f17',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
