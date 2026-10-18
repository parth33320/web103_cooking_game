import { mulberry32 } from './rng.js';

/**
 * Seeded Customer & Order Generator
 *
 * Inputs:
 *   - options: { kitchenTier?: number, seed?: number|string, ingredients?: Array }
 * Outputs:
 *   - { customer: object, order: object }
 */

const JOBS = [
  'Fitness Trainer',
  'Software Engineer',
  'Construction Worker',
  'Yoga Instructor',
  'Marathon Runner',
  'College Student',
  'Food Critic',
  'Office Manager',
];

const DIETS = [
  'High Protein',
  'Keto',
  'Omnivore',
  'Low Carb',
  'Balanced',
  'Vegetarian',
];

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Evan',
  'Fiona',
  'George',
  'Hannah',
];

/**
 * Returns tolerance percentage scaled by Kitchen Tier.
 * Higher tiers have tighter tolerances.
 */
function getToleranceForTier(tier) {
  if (tier <= 1) return 15;
  if (tier === 2) return 12;
  if (tier === 3) return 10;
  if (tier === 4) return 8;
  return 5;
}

export function generateCustomerAndOrder({ kitchenTier = 1, seed = 1001, ingredients = [] } = {}) {
  const rng = mulberry32(seed);

  // Pick customer attributes
  const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const job = JOBS[Math.floor(rng() * JOBS.length)];
  const diet = DIETS[Math.floor(rng() * DIETS.length)];
  const fullName = `${firstName} the ${job.split(' ')[0]}`;

  // Ingredient preference assignment
  let favoriteIngredientId = null;
  let blacklistedIngredientId = null;

  if (ingredients && ingredients.length > 0) {
    const favIdx = Math.floor(rng() * ingredients.length);
    favoriteIngredientId = ingredients[favIdx].id;

    // 40% chance of a blacklisted ingredient
    if (rng() < 0.4 && ingredients.length > 1) {
      let blackIdx = Math.floor(rng() * ingredients.length);
      while (blackIdx === favIdx) {
        blackIdx = Math.floor(rng() * ingredients.length);
      }
      blacklistedIngredientId = ingredients[blackIdx].id;
    }
  }

  // Calculate order targets based on tier & RNG
  const tolerancePct = getToleranceForTier(kitchenTier);
  const baseBudget = 10 + kitchenTier * 4 + Math.floor(rng() * 10);
  const budget = parseFloat(baseBudget.toFixed(2));

  // Targets based on diet profile
  let targetProteinG = 20 + Math.floor(rng() * 25);
  let targetCarbsG = 15 + Math.floor(rng() * 30);
  let targetFatG = 5 + Math.floor(rng() * 15);

  if (diet === 'High Protein') {
    targetProteinG += 15;
  } else if (diet === 'Keto' || diet === 'Low Carb') {
    targetCarbsG = Math.max(5, targetCarbsG - 15);
    targetFatG += 10;
  }

  return {
    customer: {
      name: fullName,
      job,
      diet,
      favoriteIngredientId,
      blacklistedIngredientId,
    },
    order: {
      budget,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      tolerancePct,
      favoriteIngredientId,
      blacklistedIngredientId,
      status: 'open',
    },
  };
}
