import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Dishes API (S1.1 Tracer Bullet)', () => {
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

  it('POST /api/dishes creates dish and returns 3 stars (STUB-001)', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.stars).toBe(3);
    expect(res.body.dishId).toBeDefined();
  });
});
