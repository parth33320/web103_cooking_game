import { pool } from '../db/index.js';

/**
 * Calculates supplier discount fraction based on trust level.
 * Each trust level grants discountPctPerTrust (default 5%).
 * Maximum capped at 25% (0.25).
 *
 * Inputs: trust (number), discountPctPerTrust (number)
 * Outputs: discount fraction (number, 0.00 to 0.25)
 */
export function calculateSupplierDiscount(trust = 0, discountPctPerTrust = 5) {
  if (trust <= 0) return 0;
  const rawDiscount = trust * (discountPctPerTrust / 100);
  return Math.min(rawDiscount, 0.25);
}

/**
 * Calculates effective market price for an ingredient considering active event multiplier
 * and supplier trust discount.
 *
 * Inputs: basePrice (number), eventMultiplier (number), trustDiscountFraction (number)
 * Outputs: effectivePrice (number rounded to 2 decimal places)
 */
export function calculateEffectiveIngredientPrice(basePrice, eventMultiplier = 1, trustDiscountFraction = 0) {
  const priceAfterEvent = basePrice * eventMultiplier;
  const finalPrice = priceAfterEvent * (1 - trustDiscountFraction);
  return parseFloat(finalPrice.toFixed(2));
}

/**
 * Retrieves all suppliers along with kitchen trust and active discount percentage.
 *
 * Inputs: kitchenId (number)
 * Outputs: Array of supplier objects { id, name, category, trust, discountPct, description }
 */
export async function getSuppliersWithTrust(kitchenId = 1) {
  const sql = `
    SELECT s.id, s.name, s.category, s.discount_pct_per_trust, s.description,
           COALESCE(ks.trust, 0) as trust
    FROM suppliers s
    LEFT JOIN kitchen_suppliers ks ON s.id = ks.supplier_id AND ks.kitchen_id = $1
    ORDER BY s.id ASC
  `;

  const result = await pool.query(sql, [kitchenId]);
  return result.rows.map((r) => {
    const trust = parseInt(r.trust, 10);
    const discountPctPerTrust = parseFloat(r.discount_pct_per_trust || 5);
    const discountFraction = calculateSupplierDiscount(trust, discountPctPerTrust);
    const discountPct = Math.round(discountFraction * 100);

    return {
      id: r.id,
      name: r.name,
      category: r.category,
      trust,
      discountPct,
      description: r.description,
    };
  });
}

/**
 * Retrieves map of category -> trust discount fraction for a kitchen.
 *
 * Inputs: kitchenId (number)
 * Outputs: Object mapping category -> discount fraction
 */
export async function getSupplierDiscounts(kitchenId = 1) {
  const suppliers = await getSuppliersWithTrust(kitchenId);
  const map = {};
  for (const s of suppliers) {
    map[s.category] = calculateSupplierDiscount(s.trust, 5);
  }
  return map;
}

/**
 * Increments trust for a given category's supplier.
 *
 * Inputs: kitchenId (number), category (string), trustAmount (number)
 * Outputs: updated supplier trust object or null
 */
export async function incrementSupplierTrust(kitchenId = 1, category = 'protein', trustAmount = 1) {
  const supplierRes = await pool.query('SELECT id FROM suppliers WHERE category = $1 LIMIT 1', [category]);
  if (supplierRes.rows.length === 0) return null;

  const supplierId = supplierRes.rows[0].id;

  const res = await pool.query(
    `INSERT INTO kitchen_suppliers (kitchen_id, supplier_id, trust)
     VALUES ($1, $2, $3)
     ON CONFLICT (kitchen_id, supplier_id)
     DO UPDATE SET trust = kitchen_suppliers.trust + EXCLUDED.trust, updated_at = CURRENT_TIMESTAMP
     RETURNING kitchen_id, supplier_id, trust`,
    [kitchenId, supplierId, trustAmount]
  );

  return res.rows[0];
}
