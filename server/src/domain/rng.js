/**
 * Mulberry32 Seeded PRNG Utility
 *
 * Inputs:
 *   - seed: number | string (seed for PRNG)
 * Outputs:
 *   - fn(): number (returns pseudo-random float between 0 inclusive and 1 exclusive)
 */
export function mulberry32(seed) {
  let a = typeof seed === 'number' ? seed : parseSeed(seed);

  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseSeed(seedStr) {
  if (!seedStr) return 12345;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Rolls a d20 (1 to 20) given a seeded PRNG function or seed.
 */
export function rollD20(seedOrRng) {
  const rng = typeof seedOrRng === 'function' ? seedOrRng : mulberry32(seedOrRng);
  return Math.floor(rng() * 20) + 1;
}
