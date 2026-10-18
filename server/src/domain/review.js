import { mulberry32 } from './rng.js';

/**
 * Review Text Generator Domain Module
 * Keyed by breakdown lines with 3 template variants per condition to prevent robotic repetition.
 *
 * Inputs:
 *   - breakdown: object from score()
 *   - stars: number
 *   - customer?: object
 *   - order?: object
 *   - favoriteName?: string
 *   - seed?: number|string
 * Outputs:
 *   - reviewText: string
 */

const HARD_FAIL_BLACKLIST_VARIANTS = [
  (name) => `Disaster! The dish included a blacklisted ingredient (${name}). 1 star.`,
  (name) => `Unacceptable! ${name} is on my allergy blacklist. 1 star.`,
  (name) => `Ruined my meal! You added blacklisted ${name} to my plate. 1 star.`,
];

const HARD_FAIL_BUDGET_VARIANTS = [
  (cost, budget) => `Rejected! The dish total cost ($${cost}) went over my budget ($${budget}). 1 star.`,
  (cost, budget) => `Too expensive! $${cost} exceeds my budget limit of $${budget}. 1 star.`,
  (cost, budget) => `Over budget! I allocated $${budget} but the dish cost $${cost}. 1 star.`,
];

const HIGH_SCORE_VARIANTS = [
  'Outstanding dish! Perfectly executed.',
  'Exceptional flavor and balance! Bravo.',
  'Simply amazing! Hit all my requirements perfectly.',
];

const GOOD_SCORE_VARIANTS = [
  'Good dish! Enjoyed the combination.',
  'Solid effort! Satisfied my meal targets.',
  'Pretty decent dish! Meets my expectations.',
];

const SUBPAR_SCORE_VARIANTS = [
  'Subpar dish. Macro targets or budget were missed.',
  'Needs improvement. The balance of macros was off.',
  'Disappointing meal. Failed to hit my diet goals.',
];

const LUCK_POSITIVE_VARIANTS = [
  ' Critic was in a great mood!',
  ' Bonus points for exquisite presentation!',
  ' An extra spark of luck made it special!',
];

const LUCK_NEGATIVE_VARIANTS = [
  ' Critic was in a bad mood!',
  ' A minor service delay deducted a point.',
  ' Unfortunate luck dragged down the rating.',
];

const FAVORITE_BONUS_VARIANTS = [
  (fav) => ` Loved the inclusion of ${fav}!`,
  (fav) => ` The ${fav} was a delightful highlight!`,
  (fav) => ` Great choice adding my favorite ${fav}!`,
];

export function generateReviewText({
  breakdown = {},
  stars = 3.0,
  favoriteName = null,
  seed = 12345,
} = {}) {
  const rng = mulberry32(seed);

  // 1. Hard fail blacklist
  if (breakdown.hardFailReason && breakdown.hardFailReason.includes('Blacklisted ingredient')) {
    const ingName = breakdown.hardFailReason.split(': ')[1] || 'blacklisted item';
    const idx = Math.floor(rng() * HARD_FAIL_BLACKLIST_VARIANTS.length);
    return HARD_FAIL_BLACKLIST_VARIANTS[idx](ingName);
  }

  // 2. Hard fail budget
  if (breakdown.hardFailReason && breakdown.hardFailReason.includes('Over budget')) {
    const cost = (breakdown.totalCost || 0).toFixed(2);
    const budget = (breakdown.budget || 0).toFixed(2);
    const idx = Math.floor(rng() * HARD_FAIL_BUDGET_VARIANTS.length);
    return HARD_FAIL_BUDGET_VARIANTS[idx](cost, budget);
  }

  // 3. Score base text
  let baseText = '';
  if (stars >= 4.5) {
    const idx = Math.floor(rng() * HIGH_SCORE_VARIANTS.length);
    baseText = HIGH_SCORE_VARIANTS[idx];
  } else if (stars >= 3.0) {
    const idx = Math.floor(rng() * GOOD_SCORE_VARIANTS.length);
    baseText = GOOD_SCORE_VARIANTS[idx];
  } else {
    const idx = Math.floor(rng() * SUBPAR_SCORE_VARIANTS.length);
    baseText = SUBPAR_SCORE_VARIANTS[idx];
  }

  // 4. Favorite bonus
  if (breakdown.favoriteBonus > 0 && favoriteName) {
    const idx = Math.floor(rng() * FAVORITE_BONUS_VARIANTS.length);
    baseText += FAVORITE_BONUS_VARIANTS[idx](favoriteName);
  }

  // 5. Luck roll modifier
  if (breakdown.luckRoll > 0) {
    const idx = Math.floor(rng() * LUCK_POSITIVE_VARIANTS.length);
    baseText += LUCK_POSITIVE_VARIANTS[idx];
  } else if (breakdown.luckRoll < 0) {
    const idx = Math.floor(rng() * LUCK_NEGATIVE_VARIANTS.length);
    baseText += LUCK_NEGATIVE_VARIANTS[idx];
  }

  return baseText;
}
