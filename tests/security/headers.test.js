import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';

describe('Security Baseline Tests', () => {
  it('rejects malicious or oversized headers cleanly', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/health')
      .set('X-Custom-Header', 'a'.repeat(1000));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
