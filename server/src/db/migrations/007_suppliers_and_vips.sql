-- Migration 007: Suppliers, Kitchen Suppliers M:N join table, and VIP Order columns

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  discount_pct_per_trust NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kitchen_suppliers (
  id SERIAL PRIMARY KEY,
  kitchen_id INT REFERENCES kitchens(id) ON DELETE CASCADE,
  supplier_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
  trust INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_kitchen_supplier UNIQUE (kitchen_id, supplier_id)
);

-- Add is_vip column to customers and orders
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT false;

-- Seed 4 Suppliers for each major ingredient category
INSERT INTO suppliers (id, name, category, discount_pct_per_trust, description) VALUES
  (1, 'Prime Cuts Co.', 'protein', 5.00, 'Premium wholesale meat & seafood supplier'),
  (2, 'Golden Grain Milling', 'carbs', 5.00, 'Organic grains, rice, and artisanal flour supplier'),
  (3, 'Green Acres Farm', 'vegetable', 5.00, 'Fresh local produce & organic vegetable farm'),
  (4, 'Pure Artisanal Oils', 'fat', 5.00, 'Cold-pressed oils, butter, and specialty fats supplier')
ON CONFLICT (id) DO NOTHING;

-- Seed initial supplier trust rows for starter kitchen (id=1)
INSERT INTO kitchen_suppliers (kitchen_id, supplier_id, trust) VALUES
  (1, 1, 0),
  (1, 2, 0),
  (1, 3, 0),
  (1, 4, 0)
ON CONFLICT (kitchen_id, supplier_id) DO NOTHING;
