import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Dishes API (S1.2 Scoring Engine)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset').send();
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

  it('GET /api/dishes lists all dishes created', async () => {
    const res = await request(app).get('/api/dishes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.dishes)).toBe(true);
    expect(res.body.dishes.length).toBeGreaterThan(0);
  });

  it('GET /api/dishes/:id returns dish details with lines and order info', async () => {
    const createRes = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 120 }] });
    const dishId = createRes.body.dishId;

    const res = await request(app).get(`/api/dishes/${dishId}`);
    expect(res.status).toBe(200);
    expect(res.body.dish.id).toBe(dishId);
    expect(res.body.dish.lines.length).toBe(1);
    expect(res.body.dish.lines[0].quantityG).toBe(120);
  });

  it('GET /api/dishes/:id returns 404 for non-existent dish', async () => {
    const res = await request(app).get('/api/dishes/999999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DISH_NOT_FOUND');
  });

  it('PATCH /api/dishes/:id updates dish line quantities and re-scores', async () => {
    const createRes = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });
    const dishId = createRes.body.dishId;

    const res = await request(app)
      .patch(`/api/dishes/${dishId}`)
      .send({ lines: [{ ingredientId: 1, quantityG: 150 }] });
    expect(res.status).toBe(200);
    expect(res.body.dishId).toBe(dishId);
    expect(res.body.lines[0].quantityG).toBe(150);
    expect(res.body.stars).toBeDefined();
  });

  it('DELETE /api/dishes/:id removes dish and returns 204 or 200', async () => {
    const createRes = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });
    const dishId = createRes.body.dishId;

    const delRes = await request(app).delete(`/api/dishes/${dishId}`);
    expect([200, 204]).toContain(delRes.status);

    const getRes = await request(app).get(`/api/dishes/${dishId}`);
    expect(getRes.status).toBe(404);
  });
});
