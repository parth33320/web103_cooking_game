# ADR 0002: Seeded Randomness and Static Market Events

## Context
The game requires deterministic game behavior for testing while supporting daily variation in customer orders and market prices.

## Decision
1. **Seeded PRNG:** Use an injected seeded pseudo-random number generator (Mulberry32) for all game randomness (Luck Roll, Order generation, Market event selection).
2. **Static Market Events:** Maintain a curated static JSON library (`server/src/data/market-events.json`) of market events instead of external LLM or live web APIs.

## Consequences
- Fully deterministic and reproducible tests.
- Zero external API dependencies or costs.
