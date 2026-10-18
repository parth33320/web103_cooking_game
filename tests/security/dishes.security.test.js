import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Dishes Security Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('handles bad request body gracefully', async () => {
    const res = await request(app).post('/api/dishes').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('handles non-existent order id', async () => {
    const res = await request(app).post('/api/dishes').send({ orderId: 999999, lines: [{ ingredientId: 1, quantityG: 100 }] });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('rejects POST /api/dishes with negative quantityG', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: -50 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/dishes with quantityG > 2000g', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 2500 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/dishes with non-integer quantityG', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 12.5 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/dishes with missing quantityG (STUB-002 removal)', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/dishes with duplicate ingredient lines', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({
        orderId: 1,
        lines: [
          { ingredientId: 1, quantityG: 100 },
          { ingredientId: 1, quantityG: 100 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/dishes with non-existent ingredient ID', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 999999, quantityG: 100 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INGREDIENT_NOT_FOUND');
  });

  it('rejects PATCH /api/dishes/:id with invalid quantityG', async () => {
    const createRes = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });
    const dishId = createRes.body.dishId;

    const res = await request(app)
      .patch(`/api/dishes/${dishId}`)
      .send({ lines: [{ ingredientId: 1, quantityG: -10 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
