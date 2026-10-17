# ADR 0001: Technology Stack Selection

## Context
Budget Bistro is a full-stack web application built for the course requirements and Elite Engineering SDLC standards.

## Decision
We choose the following technology stack:
- **Backend:** Express.js running on Node.js v22.
- **Frontend:** React + Vite SPA.
- **Database:** PostgreSQL with `pg` node client.
- **Testing:** Vitest for unit & API/integration tests, Playwright for E2E tests (with video recordings).
- **Deployment:** Render (Web Service + Postgres).

## Consequences
- Clean separation between RESTful Express API backend and Vite React SPA frontend.
- Zero mock policy for core game logic and database interactions in integration tests.
