import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Suppliers API Endpoints (GET /api/suppliers)', () => {
  let app;

  beforeAll(async () => {
    await runMigrations();
    app = createApp();
    // Reset database to initial state
    await request(app).post('/api/game/reset').expect(200);
  });

  it('GET /api/suppliers returns list of 4 seeded suppliers with trust and discount %', async () => {
    const res = await request(app).get('/api/suppliers').expect(200);

    expect(res.body).toHaveProperty('suppliers');
    expect(Array.isArray(res.body.suppliers)).toBe(true);
    expect(res.body.suppliers.length).toBe(4);

    const proteinSupplier = res.body.suppliers.find((s) => s.category === 'protein');
    expect(proteinSupplier).toBeDefined();
    expect(proteinSupplier).toHaveProperty('id');
    expect(proteinSupplier).toHaveProperty('name');
    expect(proteinSupplier).toHaveProperty('category', 'protein');
    expect(proteinSupplier).toHaveProperty('trust');
    expect(proteinSupplier).toHaveProperty('discountPct');
  });

  it('GET /api/ingredients reflects supplier trust discount in market price', async () => {
    const res = await request(app).get('/api/ingredients').expect(200);
    expect(res.body).toHaveProperty('ingredients');
    const chicken = res.body.ingredients.find((i) => i.name === 'Chicken Breast');
    expect(chicken).toBeDefined();
    expect(chicken).toHaveProperty('effectivePricePer100g');
  });
});
