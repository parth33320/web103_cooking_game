-- Migration 001: Initial schema placeholder
CREATE TABLE IF NOT EXISTS health_check_log (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
