import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { pool } from '../../server/src/db/index.js';

describe('Game Reset & State API (S2.2)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('GET /api/game/state returns current player, kitchen, and orders', async () => {
    const res = await request(app).get('/api/game/state');
    expect(res.status).toBe(200);
    expect(res.body.player).toBeDefined();
    expect(res.body.player.name).toBe('Head Chef');
    expect(res.body.kitchen).toBeDefined();
    expect(res.body.kitchen.wallet).toBe(100.00);
    expect(res.body.kitchen.reputation).toBe(50);
    expect(res.body.kitchen.day).toBe(1);
    expect(res.body.kitchen.tier).toBe(1);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('POST /api/game/reset resets DB to default initial seed state', async () => {
    // Modify kitchen state or create dish first
    await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });

    const resetRes = await request(app).post('/api/game/reset').send();
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('reset');
    expect(resetRes.body.kitchen.wallet).toBe(100.00);
    expect(resetRes.body.kitchen.reputation).toBe(50);
    expect(resetRes.body.kitchen.day).toBe(1);
    expect(resetRes.body.orders.length).toBe(2);

    // Verify dishes table is truncated
    const dishesRes = await request(app).get('/api/dishes');
    expect(dishesRes.body.dishes.length).toBe(0);
  });

  it('POST /api/game/new creates a new game with custom player and kitchen name', async () => {
    const res = await request(app)
      .post('/api/game/new')
      .send({ playerName: 'Master Chef Gordon', kitchenName: 'Hell Kitchen' });

    expect(res.status).toBe(201);
    expect(res.body.player.name).toBe('Master Chef Gordon');
    expect(res.body.kitchen.name).toBe('Hell Kitchen');
    expect(res.body.kitchen.wallet).toBe(100.00);
  });

  it('Enforces 1:1 relationship between Player and Kitchen', async () => {
    const playerRes = await pool.query('SELECT id FROM players LIMIT 1');
    const playerId = playerRes.rows[0].id;

    // Attempting to insert a second kitchen for the same player_id should fail due to UNIQUE constraint
    await expect(
      pool.query(
        'INSERT INTO kitchens (player_id, name, wallet, reputation, day, tier, xp) VALUES ($1, $2, 100, 50, 1, 1, 0)',
        [playerId, 'Duplicate Kitchen']
      )
    ).rejects.toThrow();
  });
});
