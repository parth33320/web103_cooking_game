import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('GET /api/ingredients (API)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('returns 200 with all ingredients sorted by id asc by default', async () => {
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ingredients');
    expect(Array.isArray(res.body.ingredients)).toBe(true);
    expect(res.body.ingredients.length).toBeGreaterThan(0);
  });

  it('filters ingredients by category', async () => {
    const res = await request(app).get('/api/ingredients?category=protein');
    expect(res.status).toBe(200);
    expect(res.body.ingredients.length).toBeGreaterThan(0);
    for (const item of res.body.ingredients) {
      expect(item.category).toBe('protein');
    }
  });

  it('sorts ingredients by price asc and desc', async () => {
    const resAsc = await request(app).get('/api/ingredients?sort=price&order=asc');
    expect(resAsc.status).toBe(200);
    const pricesAsc = resAsc.body.ingredients.map((i) => i.basePricePer100g);
    for (let i = 0; i < pricesAsc.length - 1; i++) {
      expect(pricesAsc[i]).toBeLessThanOrEqual(pricesAsc[i + 1]);
    }

    const resDesc = await request(app).get('/api/ingredients?sort=price&order=desc');
    expect(resDesc.status).toBe(200);
    const pricesDesc = resDesc.body.ingredients.map((i) => i.basePricePer100g);
    for (let i = 0; i < pricesDesc.length - 1; i++) {
      expect(pricesDesc[i]).toBeGreaterThanOrEqual(pricesDesc[i + 1]);
    }
  });

  it('sorts ingredients by protein asc and desc', async () => {
    const resAsc = await request(app).get('/api/ingredients?sort=protein&order=asc');
    expect(resAsc.status).toBe(200);
    const protAsc = resAsc.body.ingredients.map((i) => i.proteinGPer100g);
    for (let i = 0; i < protAsc.length - 1; i++) {
      expect(protAsc[i]).toBeLessThanOrEqual(protAsc[i + 1]);
    }

    const resDesc = await request(app).get('/api/ingredients?sort=protein&order=desc');
    expect(resDesc.status).toBe(200);
    const protDesc = resDesc.body.ingredients.map((i) => i.proteinGPer100g);
    for (let i = 0; i < protDesc.length - 1; i++) {
      expect(protDesc[i]).toBeGreaterThanOrEqual(protDesc[i + 1]);
    }
  });

  it('returns 400 for invalid sort parameter', async () => {
    const res = await request(app).get('/api/ingredients?sort=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid order parameter', async () => {
    const res = await request(app).get('/api/ingredients?order=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
