import { describe, it, expect } from 'vitest';
import { score } from '../../server/src/domain/scoring.js';

describe('Scoring Engine (STUB-001)', () => {
  it('returns STUB 3 stars rating and review', () => {
    const result = score({ order: {}, dish: {} });
    expect(result.stars).toBe(3.0);
    expect(result.review).toContain('STUB');
  });
});
