import { describe, it, expect } from 'vitest';
import { generateReviewText } from '../../server/src/domain/review.js';

describe('Review Generator Domain Module', () => {
  it('generates distinct template variants across different seeds for hard fail blacklist', () => {
    const reviews = new Set();
    const breakdown = { hardFailReason: 'Blacklisted ingredient included: Broccoli' };

    for (let s = 1; s <= 20; s++) {
      const text = generateReviewText({ breakdown, stars: 1.0, seed: s });
      reviews.add(text);
    }

    expect(reviews.size).toBeGreaterThanOrEqual(2);
    for (const rev of reviews) {
      expect(rev).toContain('Broccoli');
    }
  });

  it('generates distinct template variants for hard fail budget', () => {
    const reviews = new Set();
    const breakdown = { hardFailReason: 'Over budget: $20.00 exceeds $15.00', totalCost: 20, budget: 15 };

    for (let s = 1; s <= 20; s++) {
      const text = generateReviewText({ breakdown, stars: 1.0, seed: s });
      reviews.add(text);
    }

    expect(reviews.size).toBeGreaterThanOrEqual(2);
    for (const rev of reviews) {
      expect(rev).toMatch(/20.00|15.00/);
    }
  });

  it('generates high score review variants with favorite bonus and luck roll', () => {
    const breakdown = { favoriteBonus: 0.5, luckRoll: 1.0 };
    const text = generateReviewText({
      breakdown,
      stars: 5.0,
      favoriteName: 'Chicken Breast',
      seed: 1234,
    });

    expect(text).toMatch(/Chicken Breast/);
    expect(text.length).toBeGreaterThan(15);
  });

  it('generates subpar review variants when stars < 3.0', () => {
    const breakdown = { macroPenalty: -3.0 };
    const text = generateReviewText({ breakdown, stars: 2.0, seed: 555 });

    expect(text).toMatch(/Subpar|improvement|Disappointing/);
  });
});
