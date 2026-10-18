import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Orders and Reviews Security Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  it('GET /api/orders/abc returns 400 invalid order ID', async () => {
    const res = await request(app).get('/api/orders/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });

  it('GET /api/orders/999999 returns 404 order not found', async () => {
    const res = await request(app).get('/api/orders/999999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('GET /api/orders/\' OR 1=1 -- prevents SQL injection', async () => {
    const res = await request(app).get("/api/orders/' OR 1=1 --");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });
});
