import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Suppliers Security Tests', () => {
  let app;

  beforeAll(async () => {
    await runMigrations();
    app = createApp();
  });

  it('GET /api/suppliers handles parameter pollution and unexpected queries safely', async () => {
    const res = await request(app)
      .get('/api/suppliers?category=protein&category=carbs&sql=SELECT+*')
      .expect(200);

    expect(res.body).toHaveProperty('suppliers');
    expect(Array.isArray(res.body.suppliers)).toBe(true);
  });

  it('GET /api/suppliers does not expose internal database details or error stacks on malformed header', async () => {
    const res = await request(app)
      .get('/api/suppliers')
      .set('X-Kitchen-Id', "1' OR '1'='1");

    expect([200, 400]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).not.toHaveProperty('stack');
    }
  });
});
