import { pool } from '../db/index.js';

/**
 * Game Repository
 * Handles DB reset, initial game seeding, and state retrieval.
 */

/**
 * Resets the DB tables to the default seed state.
 *
 * Inputs: none
 * Outputs: Object { player, kitchen, orders }
 */
export async function resetDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean up dynamic user data
    await client.query('DELETE FROM dish_ingredients');
    await client.query('DELETE FROM dishes');

    // Check table existence before deleting from reviews to avoid transaction abort in Postgres
    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews'
    `);
    if (tableCheck.rows.length > 0) {
      await client.query('DELETE FROM reviews');
    }

    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM customers');
    await client.query('DELETE FROM kitchens');
    await client.query('DELETE FROM players');

    // 1. Seed Default Player
    const playerRes = await client.query(
      `INSERT INTO players (id, name)
       VALUES (1, 'Head Chef')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, created_at`
    );
    const playerRow = playerRes.rows[0];

    // 2. Seed Default Kitchen (1:1 with Player)
    const kitchenRes = await client.query(
      `INSERT INTO kitchens (id, player_id, name, wallet, reputation, day, tier, xp)
       VALUES (1, $1, 'Bistro Starter', 100.00, 50, 1, 1, 0)
       ON CONFLICT (id) DO UPDATE SET
         player_id = EXCLUDED.player_id,
         name = EXCLUDED.name,
         wallet = EXCLUDED.wallet,
         reputation = EXCLUDED.reputation,
         day = EXCLUDED.day,
         tier = EXCLUDED.tier,
         xp = EXCLUDED.xp
       RETURNING id, player_id, name, wallet, reputation, day, tier, xp`,
      [playerRow.id]
    );
    const kitchenRow = kitchenRes.rows[0];

    // 3. Ensure Default Ingredients exist
    await client.query(`
      INSERT INTO ingredients (id, name, category, base_price_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, emoji)
      VALUES
        (1, 'Chicken Breast', 'protein', 3.50, 31, 0, 3, '🍗'),
        (2, 'Rice', 'carbs', 1.00, 3, 28, 0, '🍚'),
        (3, 'Broccoli', 'vegetable', 1.50, 3, 7, 0, '🥦')
      ON CONFLICT (id) DO NOTHING
    `);

    // 4. Seed Starter Customers
    await client.query(`
      INSERT INTO customers (id, name)
      VALUES (1, 'Alice the Athlete'), (2, 'Bob the Builder')
      ON CONFLICT (id) DO NOTHING
    `);

    // 5. Seed Starter Open Orders
    const order1Res = await client.query(`
      INSERT INTO orders (id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, status)
      VALUES (1, 1, 1, 15.00, 30, 20, 5, 'open')
      ON CONFLICT (id) DO UPDATE SET
        kitchen_id = EXCLUDED.kitchen_id,
        customer_id = EXCLUDED.customer_id,
        budget = EXCLUDED.budget,
        target_protein_g = EXCLUDED.target_protein_g,
        target_carbs_g = EXCLUDED.target_carbs_g,
        target_fat_g = EXCLUDED.target_fat_g,
        status = EXCLUDED.status
      RETURNING id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, status
    `);

    const order2Res = await client.query(`
      INSERT INTO orders (id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, status)
      VALUES (2, 1, 2, 12.00, 15, 40, 10, 'open')
      ON CONFLICT (id) DO UPDATE SET
        kitchen_id = EXCLUDED.kitchen_id,
        customer_id = EXCLUDED.customer_id,
        budget = EXCLUDED.budget,
        target_protein_g = EXCLUDED.target_protein_g,
        target_carbs_g = EXCLUDED.target_carbs_g,
        target_fat_g = EXCLUDED.target_fat_g,
        status = EXCLUDED.status
      RETURNING id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, status
    `);

    await client.query('COMMIT');

    const player = {
      id: playerRow.id,
      name: playerRow.name,
    };

    const kitchen = {
      id: kitchenRow.id,
      playerId: kitchenRow.player_id,
      name: kitchenRow.name,
      wallet: parseFloat(kitchenRow.wallet),
      reputation: kitchenRow.reputation,
      day: kitchenRow.day,
      tier: kitchenRow.tier,
      xp: kitchenRow.xp,
    };

    const orders = [order1Res.rows[0], order2Res.rows[0]].map((o) => ({
      id: o.id,
      kitchenId: o.kitchen_id,
      customerId: o.customer_id,
      budget: parseFloat(o.budget),
      targetProteinG: o.target_protein_g,
      targetCarbsG: o.target_carbs_g,
      targetFatG: o.target_fat_g,
      status: o.status,
    }));

    return { player, kitchen, orders };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Creates a new game session with custom or default names.
 *
 * Inputs: options object { playerName?, kitchenName? }
 * Outputs: Object { player, kitchen, orders }
 */
export async function newGame({ playerName = 'Head Chef', kitchenName = 'Bistro Starter' } = {}) {
  const resetResult = await resetDatabase();

  if (playerName !== 'Head Chef' || kitchenName !== 'Bistro Starter') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE players SET name = $1 WHERE id = 1', [playerName]);
      await client.query('UPDATE kitchens SET name = $1 WHERE id = 1', [kitchenName]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return getGameState();
}

/**
 * Retrieves the current game state (player, kitchen, orders).
 *
 * Inputs: none
 * Outputs: Object { player, kitchen, orders }
 */
export async function getGameState() {
  const playerRes = await pool.query('SELECT id, name FROM players LIMIT 1');
  if (playerRes.rows.length === 0) {
    return resetDatabase();
  }

  const player = {
    id: playerRes.rows[0].id,
    name: playerRes.rows[0].name,
  };

  const kitchenRes = await pool.query(
    'SELECT id, player_id, name, wallet, reputation, day, tier, xp FROM kitchens WHERE player_id = $1 LIMIT 1',
    [player.id]
  );

  const kitchenRow = kitchenRes.rows[0];
  const kitchen = kitchenRow
    ? {
        id: kitchenRow.id,
        playerId: kitchenRow.player_id,
        name: kitchenRow.name,
        wallet: parseFloat(kitchenRow.wallet),
        reputation: kitchenRow.reputation,
        day: kitchenRow.day,
        tier: kitchenRow.tier,
        xp: kitchenRow.xp,
      }
    : null;

  const ordersRes = await pool.query(
    `SELECT o.id, o.kitchen_id, o.customer_id, o.budget, o.target_protein_g, o.target_carbs_g, o.target_fat_g, o.status, c.name as customer_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.kitchen_id = $1 AND o.status = 'open'
     ORDER BY o.id ASC`,
    [kitchen ? kitchen.id : 1]
  );

  const orders = ordersRes.rows.map((row) => ({
    id: row.id,
    kitchenId: row.kitchen_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    budget: parseFloat(row.budget),
    targetProteinG: row.target_protein_g,
    targetCarbsG: row.target_carbs_g,
    targetFatG: row.target_fat_g,
    status: row.status,
  }));

  return { player, kitchen, orders };
}
