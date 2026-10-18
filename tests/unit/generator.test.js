import { describe, it, expect } from 'vitest';
import { generateCustomerAndOrder } from '../../server/src/domain/generator.js';

describe('Order & Customer Generator Domain Module', () => {
  const dummyIngredients = [
    { id: 1, name: 'Chicken Breast' },
    { id: 2, name: 'Rice' },
    { id: 3, name: 'Broccoli' },
  ];

  it('generates deterministic customer and order given a fixed seed', () => {
    const res1 = generateCustomerAndOrder({ kitchenTier: 1, seed: 4242, ingredients: dummyIngredients });
    const res2 = generateCustomerAndOrder({ kitchenTier: 1, seed: 4242, ingredients: dummyIngredients });

    expect(res1.customer.name).toBe(res2.customer.name);
    expect(res1.customer.job).toBe(res2.customer.job);
    expect(res1.customer.diet).toBe(res2.customer.diet);
    expect(res1.order.budget).toBe(res2.order.budget);
    expect(res1.order.targetProteinG).toBe(res2.order.targetProteinG);
    expect(res1.order.tolerancePct).toBe(res2.order.tolerancePct);
  });

  it('scales tolerance percentage according to kitchen tier', () => {
    const tier1 = generateCustomerAndOrder({ kitchenTier: 1, seed: 100, ingredients: dummyIngredients });
    const tier3 = generateCustomerAndOrder({ kitchenTier: 3, seed: 100, ingredients: dummyIngredients });
    const tier5 = generateCustomerAndOrder({ kitchenTier: 5, seed: 100, ingredients: dummyIngredients });

    expect(tier1.order.tolerancePct).toBe(15);
    expect(tier3.order.tolerancePct).toBe(10);
    expect(tier5.order.tolerancePct).toBe(5);
  });

  it('assigns favorite and optional blacklisted ingredients from available ingredients', () => {
    const res = generateCustomerAndOrder({ kitchenTier: 2, seed: 999, ingredients: dummyIngredients });

    expect(res.customer.favoriteIngredientId).toBeGreaterThanOrEqual(1);
    expect(res.customer.favoriteIngredientId).toBeLessThanOrEqual(3);
    if (res.customer.blacklistedIngredientId !== null) {
      expect(res.customer.blacklistedIngredientId).not.toBe(res.customer.favoriteIngredientId);
    }
  });
});
