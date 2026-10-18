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
      // STUB(STUB-002) - Defaults quantity_g to 100 if missing or unprovided
      const quantityG = line.quantityG !== undefined ? line.quantityG : 100;
      await client.query(
        `INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity_g)
         VALUES ($1, $2, $3)`,
        [dish.id, line.ingredientId, quantityG]
      );
      insertedLines.push({
        ingredientId: line.ingredientId,
        quantityG,
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
