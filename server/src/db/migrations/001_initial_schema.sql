-- Migration 001: Initial schema
CREATE TABLE IF NOT EXISTS health_check_log (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kitchens (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'My Bistro',
  wallet NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  reputation INT NOT NULL DEFAULT 50,
  day INT NOT NULL DEFAULT 1,
  tier INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  kitchen_id INT REFERENCES kitchens(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  budget NUMERIC(10, 2) NOT NULL,
  target_protein_g INT NOT NULL,
  target_carbs_g INT DEFAULT 0,
  target_fat_g INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  base_price_per_100g NUMERIC(10, 2) NOT NULL,
  protein_g_per_100g INT NOT NULL DEFAULT 0,
  carbs_g_per_100g INT NOT NULL DEFAULT 0,
  fat_g_per_100g INT NOT NULL DEFAULT 0,
  emoji VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  kitchen_id INT REFERENCES kitchens(id) ON DELETE CASCADE,
  stars NUMERIC(3, 1) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
  id SERIAL PRIMARY KEY,
  dish_id INT REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_g INT NOT NULL,
  CONSTRAINT unique_dish_ingredient UNIQUE (dish_id, ingredient_id)
);

-- Seed starter data for Slice 1.1 if not present
INSERT INTO kitchens (id, name, wallet, reputation, day, tier, xp)
VALUES (1, 'Bistro Starter', 100.00, 50, 1, 1, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, name)
VALUES (1, 'Alice the Athlete')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, kitchen_id, customer_id, budget, target_protein_g, status)
VALUES (1, 1, 1, 15.00, 30, 'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ingredients (id, name, category, base_price_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, emoji)
VALUES
  (1, 'Chicken Breast', 'protein', 3.50, 31, 0, 3, '🍗'),
  (2, 'Rice', 'carbs', 1.00, 3, 28, 0, '🍚'),
  (3, 'Broccoli', 'vegetable', 1.50, 3, 7, 0, '🥦')
ON CONFLICT (id) DO NOTHING;
