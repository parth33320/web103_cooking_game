import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Progression & Tier-Gating API Integration', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset');
  });

  it('returns xpGained and updated kitchen xp/tier when posting a dish', async () => {
    const res = await request(app).post('/api/dishes').send({
      orderId: 1,
      lines: [
        { ingredientId: 1, quantityG: 100 },
        { ingredientId: 2, quantityG: 100 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('xpGained');
    expect(typeof res.body.xpGained).toBe('number');
    expect(res.body.xpGained).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('kitchen');
    expect(res.body.kitchen).toHaveProperty('xp');
    expect(res.body.kitchen).toHaveProperty('tier');
    expect(res.body.kitchen).toHaveProperty('nextTierXp');
  });

  it('returns minTier field for ingredients', async () => {
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.ingredients)).toBe(true);
    expect(res.body.ingredients[0]).toHaveProperty('minTier');
  });
});
