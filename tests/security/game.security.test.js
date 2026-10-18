import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Game Security & Validation (S2.2)', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
  });

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
