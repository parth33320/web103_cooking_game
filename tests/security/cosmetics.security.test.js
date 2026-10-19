import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Cosmetics Security & Validation Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset');
  });

  it('rejects purchase when kitchen tier is below unlockTier', async () => {
    // Item #4 (Blueprint Kitchen) requires Tier 3; starter kitchen is Tier 1
    const res = await request(app).post('/api/cosmetics/4/purchase');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TIER_LOCKED');
  });

  it('rejects purchase of already owned cosmetic', async () => {
    // Item #1 (Default Bistro) is already owned by default
    const res = await request(app).post('/api/cosmetics/1/purchase');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_OWNED');
  });

  it('rejects equip of unowned cosmetic', async () => {
    // Item #3 (Royal Banquet) is not owned yet
    const res = await request(app).post('/api/cosmetics/3/equip');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NOT_OWNED');
  });

  it('rejects purchase or equip with non-numeric or non-positive ID', async () => {
    const resInvalidStr = await request(app).post('/api/cosmetics/abc/purchase');
    expect(resInvalidStr.status).toBe(400);
    expect(resInvalidStr.body.error.code).toBe('INVALID_PARAMETER');

    const resNeg = await request(app).post('/api/cosmetics/-5/equip');
    expect(resNeg.status).toBe(400);
    expect(resNeg.body.error.code).toBe('INVALID_PARAMETER');
  });
});
