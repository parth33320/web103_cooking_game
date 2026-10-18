-- Migration 002: Add players table and enforce 1:1 relationship with kitchens

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'Head Chef',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure default player row exists
INSERT INTO players (id, name)
VALUES (1, 'Head Chef')
ON CONFLICT (id) DO NOTHING;

-- Add player_id column to kitchens table with UNIQUE constraint for 1:1 relationship
ALTER TABLE kitchens
ADD COLUMN IF NOT EXISTS player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE;

-- Backfill default kitchen to default player
UPDATE kitchens SET player_id = 1 WHERE id = 1 AND player_id IS NULL;
