# Status: Budget Bistro

<!-- Repo path: /docs/plans/budget-bistro/00-status.md -->
<!-- Jules: this is the ONLY source of truth for "what's done". Update at the end of every session. -->

## Gates (AGENTS.md phases)

- Alignment (CONTEXT.md + grilling): APPROVED 2026-10-17
- Architecture (ARCHITECTURE.md + ADRs): APPROVED 2026-10-17
- Slice plan approved (PLAN.md): APPROVED 2026-10-17

## Slice checklist (build strictly in order; one slice = one session = one PR)

### Sprint 0 - Foundations (course Units 5-6: Milestones 1-2)
- [x] S0.1 Repo scaffold: client/ server/ dirs, CI, Postgres test DB, Playwright w/ video, audit log writer
- [ ] S0.2 Docs deliverables: README features (6+), user stories (10+, 1-3 roles), wireframes (3+ as embedded images), ERD (Mermaid + table list)

### Sprint 1 - Tracer bullet (Unit 7: Milestone 3)
- [x] S1.1 TRACER: seeded Order -> pick ingredients -> POST dish -> stub score -> stars on screen (STUB-001, STUB-002)
- [x] S1.2 Scoring Engine real (budget + macros + blacklist), seeded Luck Roll, review text
- [x] S1.3 Dish CRUD complete + server validation (PATCH/DELETE; 400/404/409 paths)

### Sprint 2 - Economy and world (Unit 8: Milestone 4)
- [x] S2.1 Ingredient market: GET with filter + sort (category, price, protein)
- [x] S2.2 New game: auto-seed Kitchen/Wallet/starter data + `POST /api/game/reset`
- [x] S2.3 Customers + Order generator (seeded RNG), Order -> Reviews 1:N
- [x] S2.4 `POST /api/game/next-day`: events from curated library, new Orders, Rent
- [x] S2.5 Frontend routing complete: dashboard, market, cook page, dish page, redirect after serve
- [x] S2.6 Slide-out/modal: market-event news + order details
- [x] S2.7 Graceful errors: API error middleware + React error boundary + toasts

### Sprint 3 - Progression and polish (Unit 9: Final)
- [x] S3.1 XP, Tier, Tier-gated Constraint Types (allergen, availability)
- [x] S3.2 Cosmetics shop (M:N join with `equipped`), UI theme switch
- [x] S3.3 Deploy to Render (render.yaml, env vars, health check, Playwright smoke vs live URL)
- [x] S3.4 Stretch: spinner, disabled buttons, toasts on all async actions
- [x] S3.5 Endgame v1: Suppliers + Trust (M:N), VIP multi-constraint orders
- [x] S3.6 Final: README feature checklist, per-feature GIFs, full run-through GIF, milestone5.md

### Sprint 4 (optional, only after S3.6 is green on Render)
- [ ] S4.1 Auth + protected routes (stretch)
- [ ] S4.2 Cookbook + royalties; Prestige ("Michelin Reset")
- [ ] S4.3 Daily Challenge (shared seed)

## STUB registry (every stub must appear here)

| ID | Where | What it fakes | Removed by slice | Status |
|---|---|---|---|---|
| STUB-001 | server/src/domain/scoring.js | Returns constant 3 stars | S1.2 | closed |
| STUB-002 | server/src/repos/dishes.repo.js | Defaults `quantity_g` to 100 | S1.3 | closed |

## Rubric traceability matrix (CI `rubric-check` reads this)

Baseline (59 pts)

| Rubric item | Pts | Slice | Test file | Status |
|---|---|---|---|---|
| Express backend + React frontend | 5 | S0.1/S1.1 | tests/api/health.test.js | done |
| 1:N and M:N (join table) in Postgres | 8 | S1.1 (M:N), S2.3 (1:N) | tests/api/dishes.test.js | done |
| RESTful API, full CRUD on one entity (Dish) | 15 | S1.1, S1.3 | tests/api/dishes.test.js | done |
| Reset DB to default | 4 | S2.2 | tests/api/game.test.js | done |
| At least one redirection | 3 | S2.5 | tests/e2e/routing.spec.js | done |
| Same-page interaction | 3 | S1.1 | tests/e2e/tracer.spec.js | done |
| Dynamic frontend routes (React Router) | 4 | S2.5 | tests/e2e/routing.spec.js | done |
| Hierarchical components (page/presenter) | 6 | S1.1+ | tests/unit/final_deliverables.test.js | done |
| Dynamic routes in frontend AND backend | 3 | S1.1, S2.5 | tests/e2e/routing.spec.js | done |
| Deployed on Render, everything working | 8 | S3.3 | tests/e2e/live.spec.js | done |

Custom (need 2; target 5 so two are safe)

| Rubric item | Pts | Slice | Test file | Status |
|---|---|---|---|---|
| POST/PATCH validated before DB write | 3 | S1.3 | tests/security/dishes.security.test.js | done |
| Unique field in join table (`quantity_g`) | 3 | S1.1/S1.3 | tests/api/dishes.test.js | done |
| Data auto-generated on event (new game seed) | 3 | S2.2 | tests/api/game.test.js | done |
| Filtering and/or sorting | 3 | S2.1 | tests/api/ingredients.test.js | done |
| Non-RESTful route (`next-day`, `serve`) | 3 | S2.4 | tests/api/game.test.js | done |
| Slide-out/modal | 3 | S2.6 | tests/e2e/modal.spec.js | done |
| Graceful error handling | 3 | S2.7 | tests/e2e/errors.spec.js | done |
| One-to-one (Player-Kitchen) | 3 | S2.2 | tests/api/game.test.js | done |

Stretch (19)

| Rubric item | Pts | Slice | Test file | Status |
|---|---|---|---|---|
| Login + protected routes | 3 | S4.1 | | todo |
| Restrict options dynamically (can't buy what you can't afford / locked tier) | 3 | S3.1/S3.2 | tests/security/cosmetics.security.test.js | done |
| Spinner while loading | 2 | S3.4 | tests/unit/s3_4_stretch_polish.test.js | done |
| Disable buttons/inputs during submit | 2 | S3.4 | tests/unit/s3_4_stretch_polish.test.js | done |
| Disable buttons after click (75%+ of buttons) | 2 | S3.4 | tests/e2e/stretch_polish.spec.js | done |
| Image upload to cloud storage | 4 | not planned (needs real upload, not URL/preset) | | skip |
| Toast messages | 3 | S2.7/S3.4 | tests/e2e/stretch_polish.spec.js | done |

## Milestone deliverables (human-owned; Jules may draft, team must finalize)

- [ ] M1: README name/description/inspiration, members, 6+ features; user_stories.md (10+); reflection
- [ ] M2: wireframes.md (3+ pages with embedded images); ERD (tables + diagram); reflection; 3-min pitch
- [ ] M3: 5+ issues, project board shared with `codepathreview`, 5 GitHub Milestones, `progress_report_3.md`, GIFs
- [ ] M4: `progress_report_4.md`, GIFs, milestone % updated
- [x] Final: deploy link in README, feature checklist, full run-through GIF, milestone5.md

## Handoff log (append newest at bottom; 5 lines max each)

- S2.6 Slide-out/modal shipped: MarketNewsSlideout drawer presenter for market event news and OrderDetailModal presenter for order details.
- Trigger buttons added on active events section ("View Market News") and order cards ("View Details"). Auto-opens MarketNewsSlideout on Next Day.
- Tests & Evidence: Playwright E2E test tests/e2e/modal.spec.js passing cleanly; screenshot and video saved in docs/evidence/S2.6/.
- S3.5 Endgame v1 Suppliers + Trust (M:N) & VIP Orders shipped: Added suppliers table, kitchen_suppliers join table with trust score, and is_vip flag on customers/orders.
- All 82 Vitest unit/API/security tests and 19 Playwright E2E tests passing cleanly; evidence saved to docs/evidence/S3.5/.
- S3.4 Stretch Polish shipped: Reusable Spinner component, global custom event toast dispatcher, and async button disabled/loading states across all pages.
- Buttons across Dashboard (Next Day, Reset), CookPage (Serve), CosmeticsPage (Buy, Equip), and MarketPage (Filters) disable during async pending operations and show loading spinners.
- Created unit tests (tests/unit/s3_4_stretch_polish.test.js), security tests (tests/security/s3_4.security.test.js), and Playwright E2E tests (tests/e2e/stretch_polish.spec.js).
- Tests & Evidence: 91 Vitest unit/security tests and 21 Playwright E2E tests pass 100%; screenshot and video evidence in docs/evidence/S3.4/.
- Quality & Verification: npm run standards-check and npm run rubric-check passed cleanly.
