import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { pool } from '../../server/src/db/index.js';

describe('Game Reset & State API (S2.2) and Next Day API (S2.4)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  describe('Game Reset & State API (S2.2)', () => {
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

  describe('Next Day API (S2.4)', () => {
    beforeAll(async () => {
      await request(app).post('/api/game/reset').send();
    });

    it('POST /api/game/next-day advances day, deducts rent, penalizes unserved orders, and generates new orders', async () => {
      // Initial state: Day 1, Wallet 100.00, Reputation 50, 2 open unserved orders
      const initialRes = await request(app).get('/api/game/state');
      expect(initialRes.body.kitchen.day).toBe(1);
      expect(initialRes.body.kitchen.wallet).toBe(100.00);
      expect(initialRes.body.kitchen.reputation).toBe(50);
      const initialOrdersCount = initialRes.body.orders.length;

      // Call next-day
      const res = await request(app).post('/api/game/next-day').send();
      if (res.status !== 200) {
        console.error('Next Day Error:', res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.rentCharged).toBe(10.00);
      expect(res.body.unservedOrdersCount).toBe(initialOrdersCount);
      expect(res.body.unservedPenalties).toBe(initialOrdersCount * 5); // 2 * 5 = 10 reputation lost

      expect(res.body.kitchen.day).toBe(2);
      expect(res.body.kitchen.wallet).toBe(90.00); // 100 - 10 rent
      expect(res.body.kitchen.reputation).toBe(40); // 50 - 10 penalty
      expect(res.body.gameOver).toBe(false);

      // Verify 3-5 new open orders were generated
      expect(res.body.orders.length).toBeGreaterThanOrEqual(3);
      expect(res.body.orders.length).toBeLessThanOrEqual(5);
    });

    it('POST /api/game/next-day triggers Game Over if wallet goes below 0', async () => {
      // Set kitchen wallet to $5.00
      await pool.query('UPDATE kitchens SET wallet = 5.00');

      const res = await request(app).post('/api/game/next-day').send();
      expect(res.status).toBe(200);
      expect(res.body.gameOver).toBe(true);
      expect(res.body.gameOverReason).toContain('Bankrupt');
      expect(res.body.kitchen.wallet).toBe(-5.00); // 5 - 10 rent
    });
  });
});
