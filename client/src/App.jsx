import React, { useEffect, useState } from 'react';

export function App() {
  const [health, setHealth] = useState('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('error'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Budget Bistro</h1>
      <p id="health-status">API Status: {health}</p>
    </div>
  );
}
