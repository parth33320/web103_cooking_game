-- Migration 006: Cosmetics table and Kitchen Cosmetics M:N join table
CREATE TABLE IF NOT EXISTS cosmetics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  unlock_tier INT NOT NULL DEFAULT 1,
  value VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kitchen_cosmetics (
  id SERIAL PRIMARY KEY,
  kitchen_id INT REFERENCES kitchens(id) ON DELETE CASCADE,
  cosmetic_id INT REFERENCES cosmetics(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_kitchen_cosmetic UNIQUE (kitchen_id, cosmetic_id)
);

-- Seed cosmetics (10 items across theme, plate_style, badge)
INSERT INTO cosmetics (id, name, type, price, unlock_tier, value, description) VALUES
  (1, 'Default Bistro', 'theme', 0.00, 1, 'theme-default', 'Classic cozy bistro theme'),
  (2, 'Neon Cyber-Diner', 'theme', 20.00, 1, 'theme-neon', 'Futuristic neon glow aesthetic'),
  (3, 'Royal Banquet', 'theme', 50.00, 2, 'theme-royal', 'Luxurious gold and deep purple theme'),
  (4, 'Blueprint Kitchen', 'theme', 100.00, 3, 'theme-blueprint', 'Architectural blueprint theme'),
  (5, 'Classic White Plate', 'plate_style', 0.00, 1, 'plate-classic', 'Simple ceramic white plate'),
  (6, 'Slate Stone Slab', 'plate_style', 15.00, 1, 'plate-slate', 'Modern dark slate plating surface'),
  (7, 'Gold-Rimmed China', 'plate_style', 40.00, 2, 'plate-gold', 'Elegant porcelain with gold leaf trim'),
  (8, 'Chef Hat', 'badge', 0.00, 1, '🧑‍🍳', 'Standard toque blanche toque'),
  (9, 'Golden Apron', 'badge', 30.00, 1, '🎗️', 'Prestigious golden chef apron badge'),
  (10, 'Master Star Badge', 'badge', 75.00, 3, '⭐', 'Awarded for culinary mastery')
ON CONFLICT (id) DO NOTHING;

-- Equip defaults for starter kitchen (id=1)
INSERT INTO kitchen_cosmetics (kitchen_id, cosmetic_id, equipped) VALUES
  (1, 1, true),
  (1, 5, true),
  (1, 8, true)
ON CONFLICT (kitchen_id, cosmetic_id) DO NOTHING;
