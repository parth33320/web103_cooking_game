import { describe, it, expect } from 'vitest';
import { createApp } from '../../server/src/app.js';

describe('Sanity & Unit Tests for S0.1', () => {
  it('createApp initializes an express application instance', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
