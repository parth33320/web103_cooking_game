import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Game Security & Validation (S2.2) and Next Day Security & Validation (S2.4)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

  describe('Game Security & Validation (S2.2)', () => {
    it('rejects POST /api/game/new with non-string playerName', async () => {
      const res = await request(app)
        .post('/api/game/new')
        .send({ playerName: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects POST /api/game/new with oversized playerName (>100 chars)', async () => {
      const res = await request(app)
        .post('/api/game/new')
        .send({ playerName: 'A'.repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects POST /api/game/new with oversized kitchenName (>100 chars)', async () => {
      const res = await request(app)
        .post('/api/game/new')
        .send({ kitchenName: 'B'.repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles empty body gracefully in POST /api/game/reset', async () => {
      const res = await request(app).post('/api/game/reset').send();
      expect(res.status).toBe(200);
      expect(res.body.kitchen).toBeDefined();
    });
  });

  describe('Next Day Security & Validation (S2.4)', () => {
    it('rejects POST /api/game/next-day with invalid kitchenId type', async () => {
      const res = await request(app)
        .post('/api/game/next-day')
        .send({ kitchenId: 'invalid-id' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects POST /api/game/next-day with negative or zero kitchenId', async () => {
      const res = await request(app)
        .post('/api/game/next-day')
        .send({ kitchenId: -5 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for non-existent kitchenId', async () => {
      const res = await request(app)
        .post('/api/game/next-day')
        .send({ kitchenId: 999999 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
