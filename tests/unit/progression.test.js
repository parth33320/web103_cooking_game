import { describe, it, expect } from 'vitest';
import { calculateXpForStars, calculateTier, getTierName } from '../../server/src/domain/progression.js';

describe('Progression Domain Module', () => {
  it('maps star ratings to correct XP awards', () => {
    expect(calculateXpForStars(1.0)).toBe(10);
    expect(calculateXpForStars(2.0)).toBe(20);
    expect(calculateXpForStars(3.0)).toBe(40);
    expect(calculateXpForStars(4.0)).toBe(70);
    expect(calculateXpForStars(4.5)).toBe(85);
    expect(calculateXpForStars(5.0)).toBe(100);
  });

  it('calculates tier thresholds and names accurately', () => {
    expect(calculateTier(0)).toEqual({ tier: 1, name: 'Food Truck', xp: 0, nextTierXp: 100 });
    expect(calculateTier(50)).toEqual({ tier: 1, name: 'Food Truck', xp: 50, nextTierXp: 100 });
    expect(calculateTier(100)).toEqual({ tier: 2, name: 'Diner', xp: 100, nextTierXp: 300 });
    expect(calculateTier(350)).toEqual({ tier: 3, name: 'Bistro', xp: 350, nextTierXp: 600 });
    expect(calculateTier(1200)).toEqual({ tier: 5, name: 'Fine Dining', xp: 1200, nextTierXp: null });
  });

  it('returns human-readable tier names', () => {
    expect(getTierName(1)).toBe('Food Truck');
    expect(getTierName(2)).toBe('Diner');
    expect(getTierName(3)).toBe('Bistro');
    expect(getTierName(4)).toBe('Gastropub');
    expect(getTierName(5)).toBe('Fine Dining');
  });
});
