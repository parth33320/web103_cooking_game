import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('S3.4 Security & Async State Integrity Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset').send();
  });

  it('should handle concurrent next-day requests safely without database state corruption', async () => {
    // Fire two simultaneous next-day requests
    const [res1, res2] = await Promise.all([
      request(app).post('/api/game/next-day').send(),
      request(app).post('/api/game/next-day').send(),
    ]);

    // Both should return valid HTTP status codes (200 or 400/409), not crash or throw 500
    expect([200, 400, 409]).toContain(res1.status);
    expect([200, 400, 409]).toContain(res2.status);

    // Verify game state remains consistent and Day counter is valid
    const stateRes = await request(app).get('/api/game/state');
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.kitchen.day).toBeGreaterThanOrEqual(2);
  });

  it('should validate dish submission payloads and prevent empty or invalid concurrent dish creations', async () => {
    const invalidRes = await request(app).post('/api/dishes').send({
      orderId: 1,
      lines: [], // empty lines
    });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toBeDefined();
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
