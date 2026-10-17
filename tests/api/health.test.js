import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';

describe('API Health Check Endpoint', () => {
  it('GET /api/health returns 200 and status ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});
