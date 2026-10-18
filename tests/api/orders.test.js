import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { createCustomerAndOrder } from '../../server/src/repos/orders.repo.js';

describe('Orders and Reviews 1:N API (S2.3)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('GET /api/orders/1 returns customer profile details and reviews array', async () => {
    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(1);
    expect(res.body.order.customerName).toBeDefined();
    expect(res.body.order.job).toBeDefined();
    expect(res.body.order.diet).toBeDefined();
    expect(Array.isArray(res.body.order.reviews)).toBe(true);
  });

  it('POST /api/dishes appends review to order reviews list (1:N orders -> reviews)', async () => {
    const initialGet = await request(app).get('/api/orders/1');
    const initialReviewCount = initialGet.body.order.reviews.length;

    const dishRes1 = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 1, quantityG: 100 }] });
    expect(dishRes1.status).toBe(201);

    const dishRes2 = await request(app)
      .post('/api/dishes')
      .send({ orderId: 1, lines: [{ ingredientId: 2, quantityG: 100 }] });
    expect(dishRes2.status).toBe(201);

    const updatedGet = await request(app).get('/api/orders/1');
    expect(updatedGet.status).toBe(200);
    expect(updatedGet.body.order.reviews.length).toBe(initialReviewCount + 2);

    const latestReview = updatedGet.body.order.reviews[updatedGet.body.order.reviews.length - 1];
    expect(latestReview.orderId).toBe(1);
    expect(latestReview.stars).toBeDefined();
    expect(latestReview.reviewText).toBeDefined();
  });

  it('createCustomerAndOrder helper creates custom customer and order with preferences', async () => {
    const created = await createCustomerAndOrder({
      kitchenId: 1,
      customer: {
        name: 'Diana Prince',
        job: 'Museum Curator',
        diet: 'Balanced',
        favoriteIngredientId: 3,
        blacklistedIngredientId: 2,
      },
      order: {
        budget: 25.00,
        targetProteinG: 25,
        targetCarbsG: 30,
        targetFatG: 10,
        tolerancePct: 12,
      },
    });

    expect(created.id).toBeDefined();
    expect(created.customerName).toBe('Diana Prince');
    expect(created.job).toBe('Museum Curator');
    expect(created.diet).toBe('Balanced');
    expect(created.favoriteIngredientId).toBe(3);
    expect(created.blacklistedIngredientId).toBe(2);
    expect(created.tolerancePct).toBe(12);

    const getRes = await request(app).get(`/api/orders/${created.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.order.job).toBe('Museum Curator');
  });
});
