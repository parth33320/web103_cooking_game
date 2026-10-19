import { pool } from '../db/index.js';

/**
 * Cosmetics Repository
 * Handles listing, purchasing, and equipping cosmetics for kitchens.
 */

async function getTargetKitchenId(clientOrPool, kitchenId) {
  if (kitchenId && typeof kitchenId === 'number') return kitchenId;
  const res = await clientOrPool.query('SELECT id FROM kitchens LIMIT 1');
  return res.rows[0]?.id || 1;
}

/**
 * Retrieves all cosmetics along with unlocked and equipped status for a kitchen.
 *
 * Inputs: kitchenId (number)
 * Outputs: Promise<Array<{ id, name, type, price, unlockTier, value, description, unlocked: boolean, equipped: boolean }>>
 */
export async function listCosmetics(kitchenId) {
  const targetKitchenId = await getTargetKitchenId(pool, kitchenId);

  const query = `
    SELECT
      c.id,
      c.name,
      c.type,
      c.price,
      c.unlock_tier AS "unlockTier",
      c.value,
      c.description,
      CASE WHEN kc.id IS NOT NULL THEN true ELSE false END AS unlocked,
      COALESCE(kc.equipped, false) AS equipped
    FROM cosmetics c
    LEFT JOIN kitchen_cosmetics kc
      ON c.id = kc.cosmetic_id AND kc.kitchen_id = $1
    ORDER BY c.type ASC, c.unlock_tier ASC, c.id ASC
  `;
  const res = await pool.query(query, [targetKitchenId]);
  return res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    price: parseFloat(row.price),
    unlockTier: row.unlockTier,
    value: row.value,
    description: row.description,
    unlocked: row.unlocked,
    equipped: row.equipped,
  }));
}

/**
 * Purchases a cosmetic item for a kitchen.
 *
 * Inputs: kitchenId (number), cosmeticId (number)
 * Outputs: Promise<{ cosmetic: object, wallet: number, tier: number }>
 */
export async function purchaseCosmetic(kitchenId, cosmeticId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetKitchenId = await getTargetKitchenId(client, kitchenId);

    // 1. Fetch cosmetic details
    const cosmeticRes = await client.query(
      'SELECT id, name, type, price, unlock_tier, value, description FROM cosmetics WHERE id = $1',
      [cosmeticId]
    );
    if (cosmeticRes.rows.length === 0) {
      const err = new Error('Cosmetic item not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const cosmetic = cosmeticRes.rows[0];
    const price = parseFloat(cosmetic.price);
    const unlockTier = cosmetic.unlock_tier;

    // 2. Fetch kitchen
    const kitchenRes = await client.query(
      'SELECT id, wallet, tier FROM kitchens WHERE id = $1 FOR UPDATE',
      [targetKitchenId]
    );
    if (kitchenRes.rows.length === 0) {
      const err = new Error('Kitchen not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const kitchen = kitchenRes.rows[0];
    const wallet = parseFloat(kitchen.wallet);
    const tier = kitchen.tier;

    // 3. Check if already owned
    const ownedRes = await client.query(
      'SELECT id FROM kitchen_cosmetics WHERE kitchen_id = $1 AND cosmetic_id = $2',
      [targetKitchenId, cosmeticId]
    );
    if (ownedRes.rows.length > 0) {
      const err = new Error('Cosmetic item is already owned');
      err.code = 'ALREADY_OWNED';
      err.status = 400;
      throw err;
    }

    // 4. Check tier lock
    if (tier < unlockTier) {
      const err = new Error(`Tier ${unlockTier} required to unlock ${cosmetic.name}`);
      err.code = 'TIER_LOCKED';
      err.status = 400;
      throw err;
    }

    // 5. Check funds
    if (wallet < price) {
      const err = new Error(`Insufficient wallet funds ($${wallet.toFixed(2)} available, $${price.toFixed(2)} required)`);
      err.code = 'INSUFFICIENT_FUNDS';
      err.status = 400;
      throw err;
    }

    // 6. Deduct funds & Insert into join table
    const newWallet = wallet - price;
    await client.query('UPDATE kitchens SET wallet = $1 WHERE id = $2', [newWallet, targetKitchenId]);
    await client.query(
      'INSERT INTO kitchen_cosmetics (kitchen_id, cosmetic_id, equipped) VALUES ($1, $2, false)',
      [targetKitchenId, cosmeticId]
    );

    await client.query('COMMIT');

    return {
      cosmetic: {
        id: cosmetic.id,
        name: cosmetic.name,
        type: cosmetic.type,
        price,
        unlockTier,
        value: cosmetic.value,
        description: cosmetic.description,
        unlocked: true,
        equipped: false,
      },
      wallet: newWallet,
      tier,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Equips a cosmetic item for a kitchen (un-equipping other items of the same type).
 *
 * Inputs: kitchenId (number), cosmeticId (number)
 * Outputs: Promise<{ cosmeticId: number, type: string, equipped: boolean }>
 */
export async function equipCosmetic(kitchenId, cosmeticId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetKitchenId = await getTargetKitchenId(client, kitchenId);

    // 1. Check if cosmetic exists
    const cosmeticRes = await client.query(
      'SELECT id, name, type FROM cosmetics WHERE id = $1',
      [cosmeticId]
    );
    if (cosmeticRes.rows.length === 0) {
      const err = new Error('Cosmetic item not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const cosmetic = cosmeticRes.rows[0];

    // 2. Check if kitchen owns cosmetic
    const ownedRes = await client.query(
      'SELECT id FROM kitchen_cosmetics WHERE kitchen_id = $1 AND cosmetic_id = $2',
      [targetKitchenId, cosmeticId]
    );
    if (ownedRes.rows.length === 0) {
      const err = new Error('Cannot equip cosmetic item that is not owned');
      err.code = 'NOT_OWNED';
      err.status = 400;
      throw err;
    }

    // 3. Unequip existing items of same type
    await client.query(
      `UPDATE kitchen_cosmetics
       SET equipped = false
       WHERE kitchen_id = $1
         AND cosmetic_id IN (SELECT id FROM cosmetics WHERE type = $2)`,
      [targetKitchenId, cosmetic.type]
    );

    // 4. Equip target item
    await client.query(
      'UPDATE kitchen_cosmetics SET equipped = true WHERE kitchen_id = $1 AND cosmetic_id = $2',
      [targetKitchenId, cosmeticId]
    );

    await client.query('COMMIT');

    return {
      cosmeticId,
      type: cosmetic.type,
      equipped: true,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
