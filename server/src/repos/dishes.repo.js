import { pool } from '../db/index.js';
import { calculateXpForStars, calculateTier } from '../domain/progression.js';

/**
 * Dishes Repository
 *
 * Inputs:
 *   - orderId: number
 *   - lines: array of { ingredientId: number, quantityG?: number }
 *   - stars: number
 *   - reviewText?: string
 *   - breakdown?: object
 * Outputs:
 *   - dish: { id, orderId, stars, lines: Array<{ ingredientId, quantityG }> }
 *   - progression: { xpGained, oldXp, newXp, oldTier, newTier, leveledUp }
 */
export async function createDish(orderId, lines, stars, reviewText = null, breakdown = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get kitchen_id, is_vip, and favorite_ingredient_id from order
    const orderRes = await client.query(
      `SELECT o.kitchen_id, o.is_vip, COALESCE(o.favorite_ingredient_id, c.favorite_ingredient_id) as favorite_ingredient_id
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );

    const orderRow = orderRes.rows[0] || {};
    const kitchenId = orderRow.kitchen_id || 1;
    const isVip = Boolean(orderRow.is_vip);
    const favoriteIngredientId = orderRow.favorite_ingredient_id;

    // Supplier Trust update if dish scored 4+ stars
    if (stars >= 4.0 && favoriteIngredientId) {
      const ingRes = await client.query('SELECT category FROM ingredients WHERE id = $1', [favoriteIngredientId]);
      if (ingRes.rows.length > 0) {
        const category = ingRes.rows[0].category;
        const trustBoost = isVip ? 2 : 1;

        const ksTableCheck = await client.query(`
          SELECT 1 FROM information_schema.tables WHERE table_name = 'kitchen_suppliers'
        `);
        if (ksTableCheck.rows.length > 0) {
          const supplierRes = await client.query('SELECT id FROM suppliers WHERE category = $1 LIMIT 1', [category]);
          if (supplierRes.rows.length > 0) {
            await client.query(
              `INSERT INTO kitchen_suppliers (kitchen_id, supplier_id, trust)
               VALUES ($1, $2, $3)
               ON CONFLICT (kitchen_id, supplier_id)
               DO UPDATE SET trust = kitchen_suppliers.trust + EXCLUDED.trust, updated_at = CURRENT_TIMESTAMP`,
              [kitchenId, supplierRes.rows[0].id, trustBoost]
            );
          }
        }
      }
    }

    const dishRes = await client.query(
      `INSERT INTO dishes (order_id, kitchen_id, stars)
       VALUES ($1, $2, $3)
       RETURNING id, order_id, kitchen_id, stars, created_at`,
      [orderId, kitchenId, stars]
    );
    const dish = dishRes.rows[0];

    const insertedLines = [];
    for (const line of lines) {
      await client.query(
        `INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity_g)
         VALUES ($1, $2, $3)`,
        [dish.id, line.ingredientId, line.quantityG]
      );
      insertedLines.push({
        ingredientId: line.ingredientId,
        quantityG: line.quantityG,
      });
    }

    // Insert review record into reviews table
    if (reviewText) {
      await client.query(
        `INSERT INTO reviews (order_id, dish_id, stars, review_text, breakdown)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, dish.id, stars, reviewText, JSON.stringify(breakdown || {})]
      );
    }

    // Progression XP & Tier Calculation
    const kitchenRes = await client.query('SELECT id, xp, tier FROM kitchens WHERE id = $1 FOR UPDATE', [kitchenId]);
    const kitchenRow = kitchenRes.rows[0] || { xp: 0, tier: 1 };
    const oldXp = parseInt(kitchenRow.xp || 0, 10);
    const oldTier = parseInt(kitchenRow.tier || 1, 10);

    const baseXpGained = calculateXpForStars(stars);
    const xpGained = isVip ? baseXpGained * 2 : baseXpGained;
    const newXp = oldXp + xpGained;
    const tierCalc = calculateTier(newXp);
    const newTier = tierCalc.tier;
    const leveledUp = newTier > oldTier;

    await client.query('UPDATE kitchens SET xp = $1, tier = $2 WHERE id = $3', [newXp, newTier, kitchenId]);

    await client.query('COMMIT');

    return {
      id: dish.id,
      orderId: dish.order_id,
      kitchenId: dish.kitchen_id,
      stars: parseFloat(dish.stars),
      lines: insertedLines,
      createdAt: dish.created_at,
      progression: {
        xpGained,
        oldXp,
        newXp,
        oldTier,
        newTier,
        leveledUp,
        nextTierXp: tierCalc.nextTierXp,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all dishes
 * Inputs: none
 * Outputs: array of dishes with their lines
 */
export async function getAllDishes() {
  const result = await pool.query(
    `SELECT d.id, d.order_id, d.kitchen_id, d.stars, d.created_at
     FROM dishes d
     ORDER BY d.id DESC`
  );

  const dishes = [];
  for (const row of result.rows) {
    const linesRes = await pool.query(
      `SELECT di.ingredient_id, di.quantity_g, i.name as ingredient_name, i.emoji
       FROM dish_ingredients di
       JOIN ingredients i ON di.ingredient_id = i.id
       WHERE di.dish_id = $1
       ORDER BY di.ingredient_id ASC`,
      [row.id]
    );

    dishes.push({
      id: row.id,
      orderId: row.order_id,
      kitchenId: row.kitchen_id,
      stars: parseFloat(row.stars),
      createdAt: row.created_at,
      lines: linesRes.rows.map((l) => ({
        ingredientId: l.ingredient_id,
        quantityG: l.quantity_g,
        ingredientName: l.ingredient_name,
        emoji: l.emoji,
      })),
    });
  }
  return dishes;
}

/**
 * Get dish by ID
 * Inputs: dishId (number)
 * Outputs: dish object or null
 */
export async function getDishById(dishId) {
  const result = await pool.query(
    `SELECT d.id, d.order_id, d.kitchen_id, d.stars, d.created_at
     FROM dishes d
     WHERE d.id = $1`,
    [dishId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  const linesRes = await pool.query(
    `SELECT di.ingredient_id, di.quantity_g, i.name as ingredient_name, i.emoji, i.base_price_per_100g
     FROM dish_ingredients di
     JOIN ingredients i ON di.ingredient_id = i.id
     WHERE di.dish_id = $1
     ORDER BY di.ingredient_id ASC`,
    [dishId]
  );

  const reviewRes = await pool.query(
    `SELECT review_text, breakdown
     FROM reviews
     WHERE dish_id = $1
     ORDER BY id DESC
     LIMIT 1`,
    [dishId]
  );
  const review = reviewRes.rows[0]?.review_text || null;
  const breakdown = reviewRes.rows[0]?.breakdown || null;

  return {
    id: row.id,
    orderId: row.order_id,
    kitchenId: row.kitchen_id,
    stars: parseFloat(row.stars),
    review,
    breakdown: typeof breakdown === 'string' ? JSON.parse(breakdown) : breakdown,
    createdAt: row.created_at,
    ingredients: linesRes.rows.map((l) => ({
      ingredientId: l.ingredient_id,
      name: l.ingredient_name,
      quantityG: l.quantity_g,
      basePricePer100g: parseFloat(l.base_price_per_100g || 0),
      emoji: l.emoji,
    })),
    lines: linesRes.rows.map((l) => ({
      ingredientId: l.ingredient_id,
      quantityG: l.quantity_g,
      ingredientName: l.ingredient_name,
      emoji: l.emoji,
    })),
  };
}

/**
 * Update dish lines and stars
 * Inputs: dishId (number), lines (array of { ingredientId, quantityG }), stars (number), reviewText?: string, breakdown?: object
 * Outputs: updated dish object
 */
export async function updateDish(dishId, lines, stars, reviewText = null, breakdown = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE dishes
       SET stars = $1
       WHERE id = $2
       RETURNING id, order_id, kitchen_id, stars, created_at`,
      [stars, dishId]
    );

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM dish_ingredients WHERE dish_id = $1', [dishId]);

    const insertedLines = [];
    for (const line of lines) {
      await client.query(
        `INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity_g)
         VALUES ($1, $2, $3)`,
        [dishId, line.ingredientId, line.quantityG]
      );
      insertedLines.push({
        ingredientId: line.ingredientId,
        quantityG: line.quantityG,
      });
    }

    if (reviewText) {
      await client.query(
        `INSERT INTO reviews (order_id, dish_id, stars, review_text, breakdown)
         VALUES ($1, $2, $3, $4, $5)`,
        [updateRes.rows[0].order_id, dishId, stars, reviewText, JSON.stringify(breakdown || {})]
      );
    }

    await client.query('COMMIT');

    const dish = updateRes.rows[0];
    return {
      id: dish.id,
      orderId: dish.order_id,
      kitchenId: dish.kitchen_id,
      stars: parseFloat(dish.stars),
      lines: insertedLines,
      createdAt: dish.created_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete dish by ID
 * Inputs: dishId (number)
 * Outputs: boolean (true if deleted, false if not found)
 */
export async function deleteDish(dishId) {
  const result = await pool.query('DELETE FROM dishes WHERE id = $1', [dishId]);
  return result.rowCount > 0;
}
