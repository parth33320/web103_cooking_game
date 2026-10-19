-- Migration 005: Add min_tier column to ingredients for Tier-Gating
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS min_tier INT NOT NULL DEFAULT 1;

-- Seed higher tier ingredients if present or set min_tier for specific premium ingredients
INSERT INTO ingredients (id, name, category, base_price_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, emoji, min_tier)
VALUES
  (4, 'Ribeye Steak', 'protein', 7.50, 26, 0, 18, '🥩', 2),
  (5, 'Salmon Filet', 'protein', 6.00, 22, 0, 13, '🐟', 2),
  (6, 'Truffle Oil', 'fat', 12.00, 0, 0, 100, '🍄', 3)
ON CONFLICT (id) DO UPDATE SET min_tier = EXCLUDED.min_tier;
