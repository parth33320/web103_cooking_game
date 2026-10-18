import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('GET /api/ingredients (Security)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('prevents SQL injection in sort parameter', async () => {
    const maliciousSort = "price; DROP TABLE ingredients; --";
    const res = await request(app).get(`/api/ingredients?sort=${encodeURIComponent(maliciousSort)}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents SQL injection in order parameter', async () => {
    const maliciousOrder = "asc; DROP TABLE ingredients; --";
    const res = await request(app).get(`/api/ingredients?order=${encodeURIComponent(maliciousOrder)}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents SQL injection in category parameter', async () => {
    const maliciousCategory = "' OR '1'='1";
    const res = await request(app).get(`/api/ingredients?category=${encodeURIComponent(maliciousCategory)}`);
    expect(res.status).toBe(200);
    expect(res.body.ingredients.length).toBe(0);
  });
});
