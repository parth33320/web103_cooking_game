import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';

describe('Server Error Middleware Unit/API Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('should return 404 with standard error body for unknown /api route', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        details: {},
      },
    });
  });

  it('should handle unhandled internal server errors with 500 status and standard error body', async () => {
    // Calling an endpoint or route that throws or passes an error to next()
    // We can test express error middleware format
    const { errorHandler } = await import('../../server/src/middleware/errorHandler.js');
    const req = {};
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(body) {
        jsonSent = body;
        return this;
      },
    };
    const next = () => {};

    const customErr = new Error('Database connection failed');
    customErr.code = 'DB_ERROR';

    errorHandler(customErr, req, res, next);

    expect(statusSent).toBe(500);
    expect(jsonSent).toEqual({
      error: {
        code: 'DB_ERROR',
        message: 'Database connection failed',
        details: {},
      },
    });
  });
});
