import { pool } from '../db/index.js';
import { selectMarketEvents } from '../domain/events.js';
import { generateCustomerAndOrder } from '../domain/generator.js';
import { mulberry32 } from '../domain/rng.js';

/**
 * Game Repository
 * Handles DB reset, initial game seeding, state retrieval, and next-day processing.
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

    // Check table existence before deleting from reviews and active_events
    const reviewsTableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews'
    `);
    if (reviewsTableCheck.rows.length > 0) {
      await client.query('DELETE FROM reviews');
    }

    const activeEventsTableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'active_events'
    `);
    if (activeEventsTableCheck.rows.length > 0) {
      await client.query('DELETE FROM active_events');
    }

    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM customers');
    await client.query('DELETE FROM kitchens');
    await client.query('DELETE FROM players');

    // 1. Seed Default Player (without explicit ID so SERIAL sequence advances)
    const playerRes = await client.query(
      `INSERT INTO players (name)
       VALUES ('Head Chef')
       RETURNING id, name, created_at`
    );
    const playerRow = playerRes.rows[0];

    // 2. Seed Default Kitchen (without explicit ID so SERIAL sequence advances)
    const kitchenRes = await client.query(
      `INSERT INTO kitchens (player_id, name, wallet, reputation, day, tier, xp)
       VALUES ($1, 'Bistro Starter', 100.00, 50, 1, 1, 0)
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

    // 4. Seed Starter Customers (without explicit ID so SERIAL sequence advances)
    const cust1Res = await client.query(`
      INSERT INTO customers (name, job, diet, favorite_ingredient_id)
      VALUES ('Alice the Athlete', 'Fitness Trainer', 'High Protein', 1)
      RETURNING id, name
    `);
    const cust2Res = await client.query(`
      INSERT INTO customers (name, job, diet, favorite_ingredient_id)
      VALUES ('Bob the Builder', 'Construction Worker', 'High Carb', 2)
      RETURNING id, name
    `);

    // 5. Seed Starter Open Orders (without explicit ID so SERIAL sequence advances)
    const order1Res = await client.query(`
      INSERT INTO orders (kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, favorite_ingredient_id, status)
      VALUES ($1, $2, 15.00, 30, 20, 5, 10, 1, 'open')
      RETURNING id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, status`,
      [kitchenRow.id, cust1Res.rows[0].id]
    );

    const order2Res = await client.query(`
      INSERT INTO orders (kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, favorite_ingredient_id, status)
      VALUES ($1, $2, 12.00, 15, 40, 10, 10, 2, 'open')
      RETURNING id, kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, status`,
      [kitchenRow.id, cust2Res.rows[0].id]
    );

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

    return { player, kitchen, orders, activeEvents: [] };
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
      await client.query('UPDATE players SET name = $1 WHERE id = $2', [playerName, resetResult.player.id]);
      await client.query('UPDATE kitchens SET name = $1 WHERE id = $2', [kitchenName, resetResult.kitchen.id]);
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
 * Retrieves the current game state (player, kitchen, orders, activeEvents).
 *
 * Inputs: none
 * Outputs: Object { player, kitchen, orders, activeEvents }
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

  let activeEvents = [];
  const activeEventsTableCheck = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'active_events'
  `);
  if (activeEventsTableCheck.rows.length > 0 && kitchen) {
    const eventsRes = await pool.query(
      `SELECT id, event_id, name, description, category, multiplier, days_remaining
       FROM active_events
       WHERE kitchen_id = $1
       ORDER BY id ASC`,
      [kitchen.id]
    );
    activeEvents = eventsRes.rows.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      description: row.description,
      category: row.category,
      multiplier: parseFloat(row.multiplier),
      daysRemaining: row.days_remaining,
    }));
  }

  return { player, kitchen, orders, activeEvents };
}

/**
 * Advances the game state to the Next Day.
 *
 * Deducts $10.00 rent, updates/rolls active market events,
 * penalizes unserved open orders (-5 reputation each),
 * checks game over condition, generates 3-5 new orders, and advances day counter.
 *
 * Inputs: kitchenId (number, optional - defaults to primary kitchen)
 * Outputs: Object { message, player, kitchen, orders, activeEvents, rentCharged: 10.00, unservedPenalties: number, gameOver: boolean, gameOverReason?: string }
 */
export async function processNextDay(kitchenId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Retrieve Kitchen
    let targetKitchenId = kitchenId;
    if (!targetKitchenId) {
      const kRes = await client.query('SELECT id FROM kitchens LIMIT 1');
      if (kRes.rows.length === 0) {
        throw new Error('Kitchen not found');
      }
      targetKitchenId = kRes.rows[0].id;
    }

    const kitchenRes = await client.query(
      'SELECT id, player_id, name, wallet, reputation, day, tier, xp FROM kitchens WHERE id = $1 FOR UPDATE',
      [targetKitchenId]
    );

    if (kitchenRes.rows.length === 0) {
      throw new Error('Kitchen not found');
    }

    const kitchenRow = kitchenRes.rows[0];
    let currentWallet = parseFloat(kitchenRow.wallet);
    let currentReputation = kitchenRow.reputation;
    const currentDay = kitchenRow.day;
    const currentTier = kitchenRow.tier;
    const daySeed = currentDay * 777 + targetKitchenId * 1000;

    // 2. Deduct Rent ($10.00)
    const RENT_AMOUNT = 10.00;
    currentWallet -= RENT_AMOUNT;

    // 3. Expire/Decrement unserved previous Open Orders (-5 Reputation per unserved order)
    const unservedRes = await client.query(
      `SELECT id FROM orders WHERE kitchen_id = $1 AND status = 'open'`,
      [targetKitchenId]
    );
    const unservedCount = unservedRes.rows.length;
    const reputationPenalty = unservedCount * 5;
    currentReputation -= reputationPenalty;

    await client.query(
      `UPDATE orders SET status = 'expired' WHERE kitchen_id = $1 AND status = 'open'`,
      [targetKitchenId]
    );

    // 4. Update Active Market Events
    const activeEventsTableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'active_events'
    `);

    if (activeEventsTableCheck.rows.length > 0) {
      // Expire events with 1 day remaining
      await client.query(
        `DELETE FROM active_events WHERE kitchen_id = $1 AND days_remaining <= 1`,
        [targetKitchenId]
      );
      // Decrement days remaining for existing active events
      await client.query(
        `UPDATE active_events SET days_remaining = days_remaining - 1 WHERE kitchen_id = $1`,
        [targetKitchenId]
      );

      // Roll 0-2 new market events using seeded RNG
      const newEvents = selectMarketEvents({ seed: daySeed });

      for (const evt of newEvents) {
        await client.query(
          `INSERT INTO active_events (kitchen_id, event_id, name, description, category, multiplier, days_remaining)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [targetKitchenId, evt.eventId, evt.name, evt.description, evt.category, evt.multiplier, evt.daysRemaining]
        );
      }
    }

    // 5. Check Game Over Condition
    let gameOver = false;
    let gameOverReason = null;

    if (currentWallet < 0) {
      gameOver = true;
      gameOverReason = `Bankrupt! Wallet dropped below $0 (Current wallet: $${currentWallet.toFixed(2)})`;
    } else if (currentReputation <= 0) {
      gameOver = true;
      gameOverReason = `Reputation ruined! Reputation reached 0.`;
    }

    // 6. Generate 3-5 New Orders if not game over
    if (!gameOver) {
      const ingredientsRes = await client.query('SELECT id, name FROM ingredients ORDER BY id ASC');
      const ingredients = ingredientsRes.rows;

      const orderCountSeed = currentDay * 123 + targetKitchenId * 99;
      const orderCountRng = mulberry32(orderCountSeed);
      const newOrdersCount = 3 + Math.floor(orderCountRng() * 3); // 3, 4, or 5 orders

      for (let i = 0; i < newOrdersCount; i++) {
        const orderSeed = daySeed + (i + 1) * 50;
        const generated = generateCustomerAndOrder({
          kitchenTier: currentTier,
          seed: orderSeed,
          ingredients,
        });

        const custRes = await client.query(
          `INSERT INTO customers (name, job, diet, favorite_ingredient_id, blacklisted_ingredient_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            generated.customer.name,
            generated.customer.job,
            generated.customer.diet,
            generated.customer.favoriteIngredientId,
            generated.customer.blacklistedIngredientId,
          ]
        );
        const customerId = custRes.rows[0].id;

        await client.query(
          `INSERT INTO orders (kitchen_id, customer_id, budget, target_protein_g, target_carbs_g, target_fat_g, tolerance_pct, favorite_ingredient_id, blacklisted_ingredient_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')`,
          [
            targetKitchenId,
            customerId,
            generated.order.budget,
            generated.order.targetProteinG,
            generated.order.targetCarbsG,
            generated.order.targetFatG,
            generated.order.tolerancePct,
            generated.order.favoriteIngredientId,
            generated.order.blacklistedIngredientId,
          ]
        );
      }
    }

    // 7. Advance Day and Update Kitchen
    const newDay = currentDay + 1;
    await client.query(
      `UPDATE kitchens SET wallet = $1, reputation = $2, day = $3 WHERE id = $4`,
      [currentWallet, currentReputation, newDay, targetKitchenId]
    );

    await client.query('COMMIT');

    const updatedState = await getGameState();

    return {
      message: gameOver ? 'Game Over!' : 'Advanced to Next Day!',
      rentCharged: RENT_AMOUNT,
      unservedPenalties: reputationPenalty,
      unservedOrdersCount: unservedCount,
      gameOver,
      gameOverReason,
      player: updatedState.player,
      kitchen: updatedState.kitchen,
      orders: updatedState.orders,
      activeEvents: updatedState.activeEvents,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
