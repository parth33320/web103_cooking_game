/**
 * Scoring Engine Domain Module
 *
 * Inputs:
 *   - params: { order: object, dish: object, prices?: object, seed?: number|string }
 * Outputs:
 *   - { stars: number, breakdown: object, review: string }
 */

// STUB(STUB-001) - fakes scoring by returning a constant 3 stars
export function score({ order, dish, prices, seed } = {}) {
  return {
    stars: 3.0,
    breakdown: {
      budgetPenalty: 0,
      macroPenalty: 0,
      luckRoll: 0,
    },
    review: 'STUB: Decent dish, constant 3 stars.',
  };
}
