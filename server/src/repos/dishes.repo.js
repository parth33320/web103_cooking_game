import { pool } from '../db/index.js';

/**
 * Dishes Repository
 *
 * Inputs:
 *   - orderId: number
 *   - lines: array of { ingredientId: number, quantityG?: number }
 *   - stars: number
 * Outputs:
 *   - dish: { id, orderId, stars, lines: Array<{ ingredientId, quantityG }> }
 */
export async function createDish(orderId, lines, stars) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get kitchen_id from order
    const orderRes = await client.query('SELECT kitchen_id FROM orders WHERE id = $1', [orderId]);
    const kitchenId = orderRes.rows[0]?.kitchen_id || 1;

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

    await client.query('COMMIT');

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
    `SELECT di.ingredient_id, di.quantity_g, i.name as ingredient_name, i.emoji
     FROM dish_ingredients di
     JOIN ingredients i ON di.ingredient_id = i.id
     WHERE di.dish_id = $1
     ORDER BY di.ingredient_id ASC`,
    [dishId]
  );

  return {
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
  };
}

/**
 * Update dish lines and stars
 * Inputs: dishId (number), lines (array of { ingredientId, quantityG }), stars (number)
 * Outputs: updated dish object
 */
export async function updateDish(dishId, lines, stars) {
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
