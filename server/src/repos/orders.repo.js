import { pool } from '../db/index.js';

/**
 * Orders Repository
 *
 * Inputs: orderId (number)
 * Outputs: order object (including customer details and reviews array) or null
 */
export async function getOrderById(orderId) {
  const result = await pool.query(
    `SELECT o.id, o.kitchen_id, o.customer_id, o.budget, o.target_protein_g, o.target_carbs_g, o.target_fat_g,
            o.tolerance_pct, o.status,
            c.name as customer_name, c.job, c.diet,
            COALESCE(o.favorite_ingredient_id, c.favorite_ingredient_id) as favorite_ingredient_id,
            COALESCE(o.blacklisted_ingredient_id, c.blacklisted_ingredient_id) as blacklisted_ingredient_id,
            fav.name as favorite_ingredient_name,
            black.name as blacklisted_ingredient_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     LEFT JOIN ingredients fav ON COALESCE(o.favorite_ingredient_id, c.favorite_ingredient_id) = fav.id
     LEFT JOIN ingredients black ON COALESCE(o.blacklisted_ingredient_id, c.blacklisted_ingredient_id) = black.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  // Fetch reviews for 1:N orders -> reviews relationship
  const reviewsRes = await pool.query(
    `SELECT id, order_id, dish_id, stars, review_text, breakdown, created_at
     FROM reviews
     WHERE order_id = $1
     ORDER BY id ASC`,
    [orderId]
  );

  const reviews = reviewsRes.rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    dishId: r.dish_id,
    stars: parseFloat(r.stars),
    reviewText: r.review_text,
    breakdown: typeof r.breakdown === 'string' ? JSON.parse(r.breakdown) : r.breakdown,
    createdAt: r.created_at,
  }));

  const favId = row.favorite_ingredient_id ? parseInt(row.favorite_ingredient_id, 10) : null;
  const blackId = row.blacklisted_ingredient_id ? parseInt(row.blacklisted_ingredient_id, 10) : null;

  return {
    id: row.id,
    kitchenId: row.kitchen_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    job: row.job || 'Patron',
    diet: row.diet || 'Omnivore',
    budget: parseFloat(row.budget),
    targetProteinG: row.target_protein_g,
    targetCarbsG: row.target_carbs_g,
    targetFatG: row.target_fat_g,
    tolerancePct: row.tolerance_pct || 10,
    favoriteIngredientId: favId,
    favoriteIngredientName: row.favorite_ingredient_name || null,
    favoriteIngredientIds: favId ? [favId] : [],
    blacklistedIngredientId: blackId,
    blacklistedIngredientName: row.blacklisted_ingredient_name || null,
    blacklistedIngredientIds: blackId ? [blackId] : [],
    status: row.status,
    reviews,
  };
}

/**
 * Creates a Customer and Order row in Postgres
 *
 * Inputs: { kitchenId, customer, order }
 * Outputs: created order object
 */
export async function createCustomerAndOrder({ kitchenId = 1, customer, order }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const custIdRes = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM customers');
    const nextCustId = custIdRes.rows[0].next_id;

    const customerRes = await client.query(
      `INSERT INTO customers (id, name, job, diet, favorite_ingredient_id, blacklisted_ingredient_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, job, diet, favorite_ingredient_id, blacklisted_ingredient_id`,
      [
        nextCustId,
        customer.name,
        customer.job || 'Patron',
        customer.diet || 'Omnivore',
        customer.favoriteIngredientId || null,
        customer.blacklistedIngredientId || null,
      ]
    );
    const createdCustomer = customerRes.rows[0];

    const orderIdRes = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM orders');
    const nextOrderId = orderIdRes.rows[0].next_id;

    const orderRes = await client.query(
      `INSERT INTO orders (id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, favorite_ingredient_id, blacklisted_ingredient_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, status`,
      [
        nextOrderId,
        kitchenId,
        createdCustomer.id,
        order.budget,
        order.targetProteinG,
        order.targetCarbsG || 0,
        order.targetFatG || 0,
        order.tolerancePct || 10,
        order.favoriteIngredientId || createdCustomer.favorite_ingredient_id || null,
        order.blacklistedIngredientId || createdCustomer.blacklisted_ingredient_id || null,
        order.status || 'open',
      ]
    );
    const createdOrder = orderRes.rows[0];

    await client.query('COMMIT');

    return getOrderById(createdOrder.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
