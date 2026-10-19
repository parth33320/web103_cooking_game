import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Progression & Tier-Gating Security Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset');
  });

  it('rejects dish submission with 400 when ingredient tier exceeds kitchen tier', async () => {
    // Ingredient #6 is Truffle Oil (min_tier = 3). Kitchen starts at Tier 1.
    const res = await request(app).post('/api/dishes').send({
      orderId: 1,
      lines: [
        { ingredientId: 1, quantityG: 100 },
        { ingredientId: 6, quantityG: 100 },
      ],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('TIER_LOCKED');
    expect(res.body.error.message).toContain('Tier');
  });
});
