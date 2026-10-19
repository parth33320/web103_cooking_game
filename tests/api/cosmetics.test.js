import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { runMigrations } from '../../server/src/db/migrate.js';

describe('Cosmetics API Integration', () => {
  const app = createApp();

  beforeAll(async () => {
    await runMigrations();
    await request(app).post('/api/game/reset');
  });

  it('GET /api/cosmetics returns list of available cosmetics with ownership state', async () => {
    const res = await request(app).get('/api/cosmetics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cosmetics');
    expect(Array.isArray(res.body.cosmetics)).toBe(true);
    expect(res.body.cosmetics.length).toBeGreaterThan(0);

    const defaultTheme = res.body.cosmetics.find((c) => c.id === 1);
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme.name).toBe('Default Bistro');
    expect(defaultTheme.unlocked).toBe(true);
    expect(defaultTheme.equipped).toBe(true);
  });

  it('POST /api/cosmetics/:id/purchase buys an unlocked item if affordable', async () => {
    // Item #2 (Neon Cyber-Diner) costs $20.00, unlock_tier 1, starter wallet $100.00
    const res = await request(app).post('/api/cosmetics/2/purchase');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cosmetic');
    expect(res.body.cosmetic.id).toBe(2);
    expect(res.body.cosmetic.unlocked).toBe(true);
    expect(res.body.wallet).toBe(80);
  });

  it('POST /api/cosmetics/:id/equip equips owned cosmetic item and unequips previous of same type', async () => {
    const res = await request(app).post('/api/cosmetics/2/equip');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Cosmetic equipped successfully',
      cosmeticId: 2,
      type: 'theme',
      equipped: true,
    });

    const listRes = await request(app).get('/api/cosmetics');
    const item1 = listRes.body.cosmetics.find((c) => c.id === 1);
    const item2 = listRes.body.cosmetics.find((c) => c.id === 2);
    expect(item1.equipped).toBe(false);
    expect(item2.equipped).toBe(true);
  });
});
