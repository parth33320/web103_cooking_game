-- Migration 003: Customer attributes, order preferences, and reviews table

-- Add customer details
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS job VARCHAR(100),
ADD COLUMN IF NOT EXISTS diet VARCHAR(50),
ADD COLUMN IF NOT EXISTS favorite_ingredient_id INT REFERENCES ingredients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blacklisted_ingredient_id INT REFERENCES ingredients(id) ON DELETE SET NULL;

-- Add order tolerance and preferences
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tolerance_pct INT NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS favorite_ingredient_id INT REFERENCES ingredients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blacklisted_ingredient_id INT REFERENCES ingredients(id) ON DELETE SET NULL;

-- Create reviews table (orders -> reviews 1:N relationship)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id INT REFERENCES dishes(id) ON DELETE CASCADE,
  stars NUMERIC(3, 1) NOT NULL,
  review_text TEXT NOT NULL,
  breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backfill default seed customers
UPDATE customers SET job = 'Fitness Trainer', diet = 'High Protein', favorite_ingredient_id = 1 WHERE id = 1 AND job IS NULL;
UPDATE customers SET job = 'Construction Worker', diet = 'High Carb', favorite_ingredient_id = 2 WHERE id = 2 AND job IS NULL;

-- Backfill default seed orders
UPDATE orders SET favorite_ingredient_id = 1, tolerance_pct = 10 WHERE id = 1 AND favorite_ingredient_id IS NULL;
UPDATE orders SET favorite_ingredient_id = 2, tolerance_pct = 10 WHERE id = 2 AND favorite_ingredient_id IS NULL;
