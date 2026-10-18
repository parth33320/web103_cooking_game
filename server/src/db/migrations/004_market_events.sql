-- Migration 004: Create active_events table for tracking daily market event price multipliers

CREATE TABLE IF NOT EXISTS active_events (
  id SERIAL PRIMARY KEY,
  kitchen_id INT REFERENCES kitchens(id) ON DELETE CASCADE,
  event_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  multiplier NUMERIC(4, 2) NOT NULL,
  days_remaining INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
