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
    const res = await request(app).post('/api/dishes').send({ orderId: 999999, lines: [] });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
