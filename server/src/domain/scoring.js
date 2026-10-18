import { mulberry32, rollD20 } from './rng.js';

/**
 * Scoring Engine Domain Module
 *
 * Inputs:
 *   - params: { order: object, dish: object, prices?: Array|object, seed?: number|string }
 * Outputs:
 *   - { stars: number, breakdown: object, review: string }
 */
export function score({ order = {}, dish = {}, prices = [], seed = 12345 } = {}) {
  const lines = dish.lines || [];
  const favoriteIds = order.favoriteIngredientIds || [];
  const blacklistIds = order.blacklistedIngredientIds || [];
  const budget = parseFloat(order.budget || 0);

  // Helper map for ingredient prices and macros
  const ingMap = new Map();
  if (Array.isArray(prices)) {
    for (const ing of prices) {
      ingMap.set(ing.id, ing);
    }
  } else if (prices && typeof prices === 'object') {
    for (const key of Object.keys(prices)) {
      ingMap.set(Number(key), prices[key]);
    }
  }

  let totalCost = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let hasBlacklisted = false;
  let blacklistedName = '';
  let hasFavorite = false;

  for (const line of lines) {
    const ingId = line.ingredientId;
    const qtyG = line.quantityG !== undefined ? line.quantityG : 100;
    const ing = ingMap.get(ingId) || {
      basePricePer100g: 0,
      proteinGPer100g: 0,
      carbsGPer100g: 0,
      fatGPer100g: 0,
      name: `Ingredient #${ingId}`,
    };

    const factor = qtyG / 100.0;
    totalCost += (parseFloat(ing.basePricePer100g) || 0) * factor;
    totalProtein += (parseFloat(ing.proteinGPer100g) || 0) * factor;
    totalCarbs += (parseFloat(ing.carbsGPer100g) || 0) * factor;
    totalFat += (parseFloat(ing.fatGPer100g) || 0) * factor;

    if (blacklistIds.includes(ingId)) {
      hasBlacklisted = true;
      blacklistedName = ing.name || `Ingredient #${ingId}`;
    }
    if (favoriteIds.includes(ingId)) {
      hasFavorite = true;
    }
  }

  // Check hard fails
  if (hasBlacklisted) {
    return {
      stars: 1.0,
      breakdown: {
        hardFailReason: `Blacklisted ingredient included: ${blacklistedName}`,
        baseStars: 1.0,
        budgetPenalty: 0,
        macroPenalty: 0,
        favoriteBonus: 0,
        luckRoll: 0,
        rawStars: 1.0,
        clampedStars: 1.0,
        totalCost,
        budget,
        totalProtein,
        totalCarbs,
        totalFat,
      },
      review: `Disaster! The dish included a blacklisted ingredient (${blacklistedName}). 1 star.`,
    };
  }

  if (budget > 0 && totalCost > budget) {
    return {
      stars: 1.0,
      breakdown: {
        hardFailReason: `Over budget: $${totalCost.toFixed(2)} exceeds $${budget.toFixed(2)}`,
        baseStars: 1.0,
        budgetPenalty: 0,
        macroPenalty: 0,
        favoriteBonus: 0,
        luckRoll: 0,
        rawStars: 1.0,
        clampedStars: 1.0,
        totalCost,
        budget,
        totalProtein,
        totalCarbs,
        totalFat,
      },
      review: `Rejected! The dish total cost ($${totalCost.toFixed(2)}) went over my budget ($${budget.toFixed(2)}). 1 star.`,
    };
  }

  // Base 5 stars calculations
  let baseStars = 5.0;

  // Macro penalties calculation
  const tolerancePct = (order.tolerancePct !== undefined ? order.tolerancePct : 10) / 100.0;
  let totalMacroPenalty = 0;

  const checkMacro = (actual, target) => {
    if (!target || target <= 0) return 0;
    const diff = Math.abs(actual - target);
    const tol = target * tolerancePct;
    if (diff <= tol) return 0;
    if (diff <= 2 * tol) return -1.0;
    return -2.0;
  };

  const pPen = checkMacro(totalProtein, order.targetProteinG);
  const cPen = checkMacro(totalCarbs, order.targetCarbsG);
  const fPen = checkMacro(totalFat, order.targetFatG);

  totalMacroPenalty = Math.max(-3.0, pPen + cPen + fPen);

  // Budget penalty (-0.5 if exactly 100% of budget)
  let budgetPenalty = 0;
  if (budget > 0 && Math.abs(totalCost - budget) < 0.001) {
    budgetPenalty = -0.5;
  }

  // Favorite bonus (+0.5 if favorite ingredient included)
  const favoriteBonus = hasFavorite ? 0.5 : 0;

  // Seeded Luck Roll d20
  const d20 = rollD20(seed);
  let luckRollPenalty = 0;
  let luckMsg = '';
  if (d20 <= 3) {
    luckRollPenalty = -1.0;
    luckMsg = ' Critic was in a bad mood!';
  } else if (d20 >= 17) {
    luckRollPenalty = 1.0;
    luckMsg = ' Critic was in a great mood!';
  }

  const rawStars = baseStars + totalMacroPenalty + budgetPenalty + favoriteBonus + luckRollPenalty;
  // Round to nearest 0.5, clamp 1.0 - 5.0
  const rounded = Math.round(rawStars * 2) / 2;
  const clampedStars = Math.min(5.0, Math.max(1.0, rounded));

  let reviewText = `Solid meal! Scored ${clampedStars} stars.`;
  if (clampedStars >= 4.5) {
    reviewText = `Outstanding dish! Perfectly executed.${luckMsg}`;
  } else if (clampedStars >= 3.0) {
    reviewText = `Good dish! Enjoyed the combination.${luckMsg}`;
  } else {
    reviewText = `Subpar dish. Macro targets or budget were missed.${luckMsg}`;
  }

  return {
    stars: clampedStars,
    breakdown: {
      hardFailReason: null,
      baseStars,
      budgetPenalty,
      macroPenalty: totalMacroPenalty,
      favoriteBonus,
      luckRoll: luckRollPenalty,
      rawStars,
      clampedStars,
      totalCost,
      budget,
      totalProtein,
      totalCarbs,
      totalFat,
    },
    review: reviewText,
  };
}
