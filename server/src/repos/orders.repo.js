import { pool } from '../db/index.js';

/**
 * Orders Repository
 *
 * Inputs: orderId (number)
 * Outputs: order object or null
 */
export async function getOrderById(orderId) {
  const result = await pool.query(
    `SELECT o.id, o.kitchen_id, o.customer_id, o.budget, o.target_protein_g, o.target_carbs_g, o.target_fat_g, o.status, c.name as customer_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.id = $1`,
    [orderId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    kitchenId: row.kitchen_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    budget: parseFloat(row.budget),
    targetProteinG: row.target_protein_g,
    targetCarbsG: row.target_carbs_g,
    targetFatG: row.target_fat_g,
    status: row.status,
  };
}

/**
 * Ingredients Repository
 *
 * Inputs: options object { category?, sort?, order? }
 * Outputs: array of ingredient objects
 */
export async function getIngredients({ category, sort, order } = {}) {
  const queryParams = [];
  const whereClauses = [];

  if (category && typeof category === 'string' && category.trim() !== '' && category !== 'all') {
    queryParams.push(category.trim());
    whereClauses.push(`category = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let sortColumn = 'id';
  if (sort === 'price') {
    sortColumn = 'base_price_per_100g';
  } else if (sort === 'protein') {
    sortColumn = 'protein_g_per_100g';
  }

  const sortDirection = order === 'desc' ? 'DESC' : 'ASC';

  const sql = `
    SELECT id, name, category, base_price_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, emoji
    FROM ingredients
    ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}, id ASC
  `;

  const result = await pool.query(sql, queryParams);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    basePricePer100g: parseFloat(row.base_price_per_100g),
    proteinGPer100g: row.protein_g_per_100g,
    carbsGPer100g: row.carbs_g_per_100g,
    fatGPer100g: row.fat_g_per_100g,
    emoji: row.emoji,
  }));
}

/**
 * Legacy alias for getAllIngredients
 * Inputs: none
 * Outputs: array of ingredient objects
 */
export async function getAllIngredients() {
  return getIngredients();
}
