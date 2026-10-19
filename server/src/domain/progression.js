/**
 * Domain Module: Progression & Progression Engine
 *
 * Handles XP calculations from Dish Scores (stars) and Kitchen Tier progression.
 *
 * Inputs & Outputs:
 * - calculateXpForStars(stars: number): number
 * - calculateTier(xp: number): { tier: number, name: string, currentXp: number, nextTierXp: number|null }
 * - getTierName(tier: number): string
 */

export const TIER_THRESHOLDS = [
  { tier: 1, name: 'Food Truck', xpRequired: 0 },
  { tier: 2, name: 'Diner', xpRequired: 100 },
  { tier: 3, name: 'Bistro', xpRequired: 300 },
  { tier: 4, name: 'Gastropub', xpRequired: 600 },
  { tier: 5, name: 'Fine Dining', xpRequired: 1000 },
];

/**
 * Calculates XP awarded for a dish based on star rating.
 *
 * Inputs:
 *   - stars: number (1.0 to 5.0)
 * Outputs:
 *   - xpGained: number
 */
export function calculateXpForStars(stars) {
  const normalizedStars = Math.min(5.0, Math.max(1.0, Math.round(stars * 2) / 2));
  switch (normalizedStars) {
    case 1.0:
      return 10;
    case 1.5:
      return 15;
    case 2.0:
      return 20;
    case 2.5:
      return 30;
    case 3.0:
      return 40;
    case 3.5:
      return 55;
    case 4.0:
      return 70;
    case 4.5:
      return 85;
    case 5.0:
      return 100;
    default:
      return 10;
  }
}

/**
 * Returns tier name for a given numeric tier level.
 *
 * Inputs:
 *   - tier: number
 * Outputs:
 *   - name: string
 */
export function getTierName(tier) {
  const match = TIER_THRESHOLDS.find((t) => t.tier === tier);
  return match ? match.name : 'Master Bistro';
}

/**
 * Computes kitchen Tier and progress from cumulative XP.
 *
 * Inputs:
 *   - xp: number
 * Outputs:
 *   - Object { tier: number, name: string, xp: number, nextTierXp: number|null }
 */
export function calculateTier(xp = 0) {
  const currentXp = Math.max(0, parseInt(xp, 10) || 0);

  let currentTierObj = TIER_THRESHOLDS[0];
  let nextTierObj = TIER_THRESHOLDS[1];

  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (currentXp >= TIER_THRESHOLDS[i].xpRequired) {
      currentTierObj = TIER_THRESHOLDS[i];
      nextTierObj = TIER_THRESHOLDS[i + 1] || null;
    } else {
      break;
    }
  }

  return {
    tier: currentTierObj.tier,
    name: currentTierObj.name,
    xp: currentXp,
    nextTierXp: nextTierObj ? nextTierObj.xpRequired : null,
  };
}
