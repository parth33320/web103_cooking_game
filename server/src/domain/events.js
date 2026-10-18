import { mulberry32 } from './rng.js';
import marketEventsData from '../data/market-events.json' with { type: 'json' };

/**
 * Domain module for Market Events logic.
 *
 * Inputs:
 *   - options: { seed?: number|string, count?: number, library?: Array }
 * Outputs:
 *   - Array of selected market event objects
 */

export function selectMarketEvents({ seed = Date.now(), count, library = marketEventsData } = {}) {
  const numericSeed = typeof seed === 'number' ? seed : String(seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = mulberry32(numericSeed);

  if (!library || library.length === 0) {
    return [];
  }

  // If count is not explicitly provided, roll 0, 1, or 2 events
  const numEvents = count !== undefined ? count : Math.floor(rng() * 3); // 0, 1, or 2

  if (numEvents === 0) {
    return [];
  }

  const selected = [];
  const libraryCopy = [...library];

  for (let i = 0; i < numEvents && libraryCopy.length > 0; i++) {
    const idx = Math.floor(rng() * libraryCopy.length);
    const [event] = libraryCopy.splice(idx, 1);
    selected.push({
      eventId: event.id,
      name: event.name,
      description: event.description,
      category: event.category,
      multiplier: event.multiplier,
      daysRemaining: event.duration_days,
    });
  }

  return selected;
}
