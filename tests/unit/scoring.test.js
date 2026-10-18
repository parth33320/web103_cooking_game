import { describe, it, expect } from 'vitest';
import { score } from '../../server/src/domain/scoring.js';

describe('Scoring Engine (S1.2 Real Scoring)', () => {
  const sampleOrder = {
    id: 1,
    budget: 10.0,
    targetProteinG: 30,
    targetCarbsG: 50,
    targetFatG: 20,
    tolerancePct: 10, // 10% tolerance
    favoriteIngredientIds: [1], // Chicken Breast
    blacklistedIngredientIds: [5], // Peanut
  };

  const sampleIngredients = [
    { id: 1, name: 'Chicken Breast', basePricePer100g: 3.0, proteinGPer100g: 30, carbsGPer100g: 0, fatGPer100g: 3 },
    { id: 2, name: 'Rice', basePricePer100g: 1.0, proteinGPer100g: 3, carbsGPer100g: 28, fatGPer100g: 0 },
    { id: 3, name: 'Avocado', basePricePer100g: 2.0, proteinGPer100g: 2, carbsGPer100g: 9, fatGPer100g: 15 },
    { id: 5, name: 'Peanut', basePricePer100g: 1.5, proteinGPer100g: 25, carbsGPer100g: 16, fatGPer100g: 49 },
  ];

  it('hard fails (1 star) if blacklisted ingredient is included', () => {
    const dish = {
      lines: [
        { ingredientId: 1, quantityG: 100 },
        { ingredientId: 5, quantityG: 100 }, // Blacklisted!
      ],
    };

    const result = score({ order: sampleOrder, dish, prices: sampleIngredients, seed: 123 });
    expect(result.stars).toBe(1.0);
    expect(result.breakdown.hardFailReason).toContain('Blacklisted ingredient');
    expect(result.review).toContain('blacklisted');
  });

  it('hard fails (1 star) if total cost exceeds budget', () => {
    const dish = {
      lines: [
        { ingredientId: 1, quantityG: 400 }, // $12.00 > $10.00 budget
      ],
    };

    const result = score({ order: sampleOrder, dish, prices: sampleIngredients, seed: 123 });
    expect(result.stars).toBe(1.0);
    expect(result.breakdown.hardFailReason).toContain('Over budget');
    expect(result.review).toContain('budget');
  });

  it('calculates macro penalties, favorite bonus, budget penalty, and luck roll deterministically', () => {
    const dish = {
      lines: [
        { ingredientId: 1, quantityG: 100 }, // $3.00, 30g protein, 0g carbs, 3g fat
        { ingredientId: 2, quantityG: 175 }, // $1.75, 5.25g protein, 49g carbs, 0g fat
        { ingredientId: 3, quantityG: 133 }, // $2.66, 2.66g protein, 11.97g carbs, 19.95g fat
      ],
    };

    const result = score({ order: sampleOrder, dish, prices: sampleIngredients, seed: 42 });
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.hardFailReason).toBeNull();
    expect(result.breakdown.favoriteBonus).toBe(0.5);
    expect(result.stars).toBeGreaterThanOrEqual(1.0);
    expect(result.stars).toBeLessThanOrEqual(5.0);
    expect(result.review).not.toContain('STUB');
  });
});
