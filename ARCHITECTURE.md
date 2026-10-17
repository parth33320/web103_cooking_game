# Architecture Documentation

## System Architecture Overview

```mermaid
graph TD
    Client[React + Vite SPA] -->|HTTP REST API| API[Express Server]
    API -->|pg Client| DB[(PostgreSQL)]
    API --> Audit[Audit Logger logs/audit.jsonl]
```

## Module Interfaces & I/O

### Server Modules

#### `server/src/domain/scoring.js`
- **Inputs:** `{ order: Order, dish: Dish, prices: MarketPrices, seed: number }`
- **Outputs:** `{ stars: number, breakdown: Breakdown, review: string }`

#### `server/src/db/migrate.js`
- **Inputs:** `DATABASE_URL: string`
- **Outputs:** `Promise<void>`

#### `server/src/utils/audit.js`
- **Inputs:** `{ action: string, details: object }`
- **Outputs:** `Promise<void>` (appends JSON line to `logs/audit.jsonl`)
