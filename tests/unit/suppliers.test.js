import { describe, it, expect } from 'vitest';
import { calculateSupplierDiscount, calculateEffectiveIngredientPrice } from '../../server/src/repos/suppliers.repo.js';
import { generateCustomerAndOrder } from '../../server/src/domain/generator.js';

describe('Suppliers & VIP Domain Unit Tests', () => {
  it('calculates supplier discount correctly based on trust level', () => {
    // 0 trust = 0% discount
    expect(calculateSupplierDiscount(0, 5)).toBe(0);
    // 2 trust * 5% = 10% discount (0.10)
    expect(calculateSupplierDiscount(2, 5)).toBe(0.10);
    // 10 trust * 5% = 50% discount capped at max 25% (0.25)
    expect(calculateSupplierDiscount(10, 5)).toBe(0.25);
  });

  it('calculates effective ingredient price with event multiplier and supplier discount', () => {
    const basePrice = 10.00;
    const eventMultiplier = 1.5; // Event increases price to $15.00
    const trustDiscount = 0.10; // 10% discount from supplier trust

    // 10.00 * 1.5 * (1 - 0.10) = 15.00 * 0.90 = $13.50
    const effective = calculateEffectiveIngredientPrice(basePrice, eventMultiplier, trustDiscount);
    expect(effective).toBe(13.50);
  });

  it('generates VIP customer and order when forced or at higher tier', () => {
    const result = generateCustomerAndOrder({ kitchenTier: 3, seed: 9999, forceVip: true });
    expect(result.customer.isVip).toBe(true);
    expect(result.order.isVip).toBe(true);
    expect(result.order.budget).toBeGreaterThanOrEqual(30.00);
  });
});
