import { describe, it, expect } from 'vitest';
import { selectMarketEvents } from '../../server/src/domain/events.js';

describe('Market Events Domain Module', () => {
  it('deterministically selects market events given a fixed seed', () => {
    const events1 = selectMarketEvents({ seed: 12345, count: 2 });
    const events2 = selectMarketEvents({ seed: 12345, count: 2 });

    expect(events1).toHaveLength(2);
    expect(events2).toHaveLength(2);
    expect(events1).toEqual(events2);
  });

  it('selects valid events from the library with required fields', () => {
    const events = selectMarketEvents({ seed: 999, count: 1 });
    expect(events).toHaveLength(1);
    const [evt] = events;
    expect(evt).toHaveProperty('eventId');
    expect(evt).toHaveProperty('name');
    expect(evt).toHaveProperty('description');
    expect(evt).toHaveProperty('category');
    expect(typeof evt.multiplier).toBe('number');
    expect(typeof evt.daysRemaining).toBe('number');
  });

  it('handles custom library and zero count', () => {
    const customLib = [
      { id: 'TEST1', name: 'Test Event', description: 'Desc', category: 'protein', multiplier: 1.5, duration_days: 2 },
    ];
    const zeroEvents = selectMarketEvents({ seed: 100, count: 0, library: customLib });
    expect(zeroEvents).toEqual([]);

    const selectedCustom = selectMarketEvents({ seed: 100, count: 1, library: customLib });
    expect(selectedCustom).toHaveLength(1);
    expect(selectedCustom[0].eventId).toBe('TEST1');
  });
});
