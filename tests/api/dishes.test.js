import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Dishes API (S1.2 Scoring Engine)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('GET /api/orders/1 returns order and ingredients', async () => {
    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(1);
    expect(res.body.ingredients.length).toBeGreaterThan(0);
  });

  it('POST /api/dishes creates dish and returns breakdown + review from scoring engine', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });
    expect(res.status).toBe(201);
    expect(res.body.stars).toBeDefined();
    expect(res.body.dishId).toBeDefined();
    expect(res.body.review).toBeDefined();
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.breakdown.baseStars).toBe(5.0);
  });
});
