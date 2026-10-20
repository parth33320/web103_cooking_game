# Milestone 5 Final Project Report - Budget Bistro 🍳

## 1. Project Overview & Deliverables Summary

**Project Name**: Budget Bistro
**Live Application URL**: [https://budget-bistro.onrender.com](https://budget-bistro.onrender.com)
**GitHub Repository**: [Budget Bistro Repo](https://github.com)

Budget Bistro is a full-stack puzzle strategy and restaurant management game. Over the course of the project, all baseline requirements, 8 custom features, and multiple stretch features were implemented using vertical slices, Live TDD, and Elite Engineering SDLC practices.

---

## 2. Completed Rubric Requirements

### Baseline Features (All Completed ✅)
1. **Express Backend & React Frontend**: Dual-tier architecture with Vite SPA and Express server.
2. **Database Relationships (PostgreSQL)**:
   - 1:1 (`players` -> `kitchens`)
   - 1:N (`customers` -> `orders` -> `reviews`)
   - M:N with join table (`dishes` <-> `ingredients` via `dish_ingredients` with `quantity_g`, `kitchens` <-> `cosmetics` via `kitchen_cosmetics` with `equipped`, `kitchens` <-> `suppliers` via `kitchen_suppliers` with `trust`).
3. **RESTful API for Primary Entity (`Dish`)**: Full `GET`, `POST`, `PATCH`, `DELETE` operations on dishes and ingredient lines.
4. **Database Reset**: `POST /api/game/reset` resets data to initial deterministic seed state.
5. **Client Redirection**: Automatic redirection after serving dishes from `/orders/:id/cook` to `/dishes/:id`.
6. **Same-Page Interaction**: Interactive ingredient selector and live macro progress bars on CookPage.
7. **Dynamic Frontend Routes**: React Router client-side routes (`/`, `/market`, `/orders/:id/cook`, `/dishes/:id`, `/cosmetics`).
8. **Hierarchical React Components**: Clean container/presenter architecture (`pages/` vs `components/`).
9. **Live Deployment on Render**: Hosted on Render with PostgreSQL database and SPA route fallbacks.

### Custom Features (Completed 8 of 8 ✅)
1. **Graceful Error Handling**: Centralized Express API error middleware and React ErrorBoundary with toast alerts.
2. **1:1 Database Relationship**: `players` 1:1 `kitchens`.
3. **Slide-Out Pane / Modal**: Market news slide-out drawer on Next Day transition and Order details modal.
4. **Unique Field in Join Table**: `dish_ingredients.quantity_g`, `kitchen_cosmetics.equipped`, `kitchen_suppliers.trust`.
5. **Custom Non-RESTful Routes**: `POST /api/game/next-day` and `POST /api/game/reset`.
6. **Filtering & Sorting**: Market page ingredient filtering by category and sorting by price/protein.
7. **Auto-Generated Data Events**: Automatic generation of daily Orders, Market Events, and initial Wallet on new game / reset.
8. **Request Body Validation**: Server-side validation on POST/PATCH requests prior to DB operations.

---

## 3. Team Reflection

### What Went Well
- **Vertical Slices & Tracer Bullets**: Slicing features into vertical tracer bullets (Schema -> API -> UI -> Tests) ensured that each session delivered a fully runnable, demoable capability.
- **Pure Domain Engine**: Isolating core business rules (Scoring Engine, progression, market event picker) into pure domain functions made the game completely deterministic and easy to unit test.
- **Deterministic Seeded Testing**: Injected mulberry32 PRNG allowed 100% deterministic test coverage across API, security, and Playwright E2E tests.

### Challenges & Key Learnings
- **PostgreSQL Isolation in Testing**: Running parallel integration tests against PostgreSQL required careful lifecycle management (`pg_advisory_lock` for migrations and sequential Vitest execution) to avoid catalog and state race conditions.
- **Centralized Error Handling**: Ensuring all controller validation errors preceded parameter lookups established a clean precedence order for error responses.

---

## 4. Final Status
All tests (Unit, Integration, Security, and Playwright E2E) are green, quality gates (`standards-check` and `rubric-check`) pass cleanly, and the app is deployed and fully operational on Render.
