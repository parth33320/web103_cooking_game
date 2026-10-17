# Budget Bistro - Master Plan for Google Jules

<!-- Repo path: /docs/plans/budget-bistro/PLAN.md -->
<!-- Pairs with: AGENTS.md, CONTEXT.md, docs/STANDARDS.md, 00-status.md -->

## 1. One-paragraph pitch

The player runs a tiny restaurant. Each Day, NPC Customers (seeded RNG) place Orders with a Budget, Macro Targets, and preferences. The player buys Ingredients at Market Prices (moved by curated Market Events), assembles a Dish by choosing grams per Ingredient, and gets a deterministic Score plus a seeded Luck Roll and an auto-written Review. Good Scores earn XP, cash, and Reputation; each Tier adds a brand-new kind of constraint so the game never becomes "same puzzle, tighter numbers."

## 2. Tech and architecture decisions (record as ADRs in S0.1)

| Decision | Choice | Why |
|---|---|---|
| Stack | React + Vite, Express, Postgres, `pg` (or Prisma), Render | Course requirement |
| Randomness | Injected seeded PRNG (e.g. mulberry32) | Deterministic tests, shareable daily seeds later |
| Market events | Static JSON library in repo, picked by seeded RNG | No API keys, no flaky demo, no LLM cost. Real-news/LLM feed is an optional post-launch spike, not core |
| Scoring | Pure function, one deep module | The heart of the game; most-tested code |
| Art | Emoji/SVG sprites + "plating blueprint" cards | Team has no art/animation skills |
| Testing | Real Postgres test DB + real HTTP, Playwright with video | AGENTS.md "no mocking" rule. Core game has no external API, so nothing needs mocking |
| Audit log | `logs/audit.jsonl` append-only | AGENTS.md accountability; also useful for debugging the economy |

**Design It Twice (AGENTS.md phase 2):** before S1.2, have Jules produce 3 radically different interface designs for the Scoring Engine (e.g. A: one `score()` returning everything; B: pipeline of `Rule` objects each returning a penalty; C: declarative constraint list evaluated by a tiny interpreter). Pick the deepest. Option C also makes new Constraint Types per Tier nearly free, which is the lever for endgame content, so lean toward it.

## 3. Data model (ERD to finalize in S0.2)

Tables: `players`, `kitchens`, `customers`, `orders`, `dishes`, `ingredients`, `dish_ingredients`, `reviews`, `market_events`, `active_events`, `suppliers`, `kitchen_suppliers`, `cosmetics`, `kitchen_cosmetics`.

| Relationship | Type | Rubric item |
|---|---|---|
| players -> kitchens | 1:1 | custom: one-to-one |
| customers -> orders, orders -> dishes, dishes -> reviews | 1:N | baseline 1:N |
| dishes <-> ingredients via `dish_ingredients(quantity_g)` | M:N + unique field | baseline M:N, custom: unique join field |
| kitchens <-> cosmetics via `kitchen_cosmetics(equipped)` | M:N + unique field | extra |
| kitchens <-> suppliers via `kitchen_suppliers(trust)` | M:N + unique field | extra, endgame |

Primary CRUD entity for the rubric: **Dish** (GET list/one, POST, PATCH quantities, DELETE).

## 4. Scoring rules v1 (Jules implements in S1.2; tune via tests)

Inputs: order (budget, targets with tolerances, favorite and blacklisted ingredient ids), dish (ingredient id + grams), prices, seed.

1. **Hard fails** (cap at 1 star, Luck Roll cannot rescue): total cost > budget; any blacklisted ingredient.
2. **Base 5 stars**, then subtract:
   - Each macro: within tolerance = 0; within 2x tolerance = -1; beyond = -2 (cap total macro penalty at -3).
   - Spending 100% of budget exactly = -0.5 (no margin); under 90% = +0 (no bonus, cleaner).
   - Includes a favorite = +0.5 (cap 5).
3. **Luck Roll d20 (seeded):** 1-3 = -1, 17-20 = +1, else 0. Applied only if no hard fail. Review text names the roll outcome ("Critic was in a mood").
4. Round to nearest 0.5, clamp 1-5. Return `breakdown` so the UI can show *why* (this is what makes the puzzle learnable).

## 5. Sprint plan (Scaled-Agile style: one Program Increment, four iterations)

Each iteration ends with: working software deployed or runnable, demo GIFs, updated status, a retro line in the handoff log. Each slice below is sized for ONE Jules session (one context window) and ONE PR.

| Iteration | Course milestone | Goal | Slices |
|---|---|---|---|
| Sprint 0 | Units 5-6 (M1, M2) | Aligned and planned | S0.1, S0.2 |
| Sprint 1 | Unit 7 (M3) | Tracer bullet alive, scoring real, CRUD done | S1.1-S1.3 |
| Sprint 2 | Unit 8 (M4) | A full game day works end to end | S2.1-S2.7 |
| Sprint 3 | Final | Progression, polish, deployed, graded checklist | S3.1-S3.6 |
| Sprint 4 | After final | Stretch/endgame only if S3.6 is green on Render | S4.x |

Check your own calendar against the due dates; Sprint 3's deploy slice (S3.3) should land at least a few days before the final deadline so Render surprises don't eat the demo.

### Slice cards

Each card = acceptance criteria. Jules turns each into RED tests first.

**S0.1 Repo scaffold.** `client/`, `server/`, Postgres test DB + migration runner, `render.yaml` stub, GitHub Actions (lint, tests, `standards-check`, `rubric-check`), Playwright with `video: 'on'`, `logs/audit.jsonl` writer, empty `ARCHITECTURE.md` with Mermaid skeleton, ADR-0001 (stack), ADR-0002 (seeded RNG and static events). *Done when:* CI green on an empty "health check" test hitting `GET /api/health` from a Playwright page.

**S1.1 TRACER BULLET.** Thinnest end-to-end pipe: seeded Order #1 -> `/orders/1/cook` shows budget + protein target and 3 emoji ingredients -> click to add -> "Serve" `POST /api/dishes` -> row in `dishes` + `dish_ingredients` -> response `{ stars: 3 }` -> stars shown. Stubs allowed ONLY: STUB-001 (constant score), STUB-002 (default grams). *Done when:* Playwright test goes through all layers and video shows it. This also earns the same-page interaction and dynamic-route rubric rows early.

**S1.2 Scoring Engine.** Replace STUB-001 with section 4 rules. Unit tests for every rule with exact values and seeded rolls; API test proves `POST /api/dishes` returns `breakdown`. UI shows the breakdown under the stars.

**S1.3 Dish CRUD + validation.** `GET /api/dishes`, `GET /api/dishes/:id`, `PATCH /api/dishes/:id` (change grams), `DELETE /api/dishes/:id`. Validation: grams 1-2000, integer, ingredient exists, no duplicate ingredient lines, order exists and is open. Replace STUB-002. Security tests: negative grams, string injection, another kitchen's dish id.

**S2.1 Market.** `GET /api/ingredients?category=&sort=price|protein&order=asc|desc`. UI page `/market` with filter chips and sort control; shows Market Price vs base.

**S2.2 New game + reset.** `POST /api/game/new` creates Player/Kitchen with $100, Reputation 50, Day 1, Tier 1 and seeds starter Orders. `POST /api/game/reset` restores DB to seed state (same code path used by test setup). Button in UI with confirm modal.

**S2.3 Customers and Orders.** Seeded generator: job + diet + favorite/blacklist + budget + targets scaled by Tier. `orders -> reviews` 1:N; Review text templates keyed by breakdown (budget/macro/luck lines), 3 variants per line so repeats don't feel robotic.

**S2.4 Next Day.** `POST /api/game/next-day`: charge Rent, expire old Market Events, roll 0-2 new events from the library, generate 3-5 Orders, unserved Orders cost Reputation, fail states return `{ gameOver: true, reason }`. Event library file `server/src/data/market-events.json` with 20+ curated events (price multipliers 0.6-2.5, durations 1-3 days).

**S2.5 Routing.** Pages: `/` dashboard, `/market`, `/orders`, `/orders/:orderId/cook`, `/dishes/:dishId`. Redirect: serve -> `/dishes/:dishId` result page. Hierarchy: pages = containers, components = presenters.

**S2.6 Modal/slide-out.** Event news slide-out on Next Day; order detail modal from dashboard.

**S2.7 Errors.** Express error middleware using the standard error shape; React error boundary; toast on API error; 404 page.

**S3.1 Progression.** XP per Score (e.g. 10/20/40/70/100 for 1-5 stars), Tier thresholds, Tier unlock table (below). Options dynamically restricted: locked ingredients/orders shown disabled with reason.

**S3.2 Cosmetics.** 10-15 cosmetics (UI themes, plate styles, apron/hat emoji badges) earned by achievements or bought; `equipped` flag; theme applies via CSS variables.

**S3.3 Deploy.** `render.yaml` (web service + Postgres), env var names documented in `docs/external/render.md` (names only, never values), `/api/health`, run migrations on deploy, Playwright smoke test against the live URL. Verify Render's current free-tier database limits before relying on it for Demo Day.

**S3.4 Stretch polish.** Spinner component, disable-on-submit hook used by every button, toast on every async success/error. Audit: list every button; target 100%.

**S3.5 Endgame v1.** Suppliers + Trust; VIP orders with multi-course constraint (see section 7).

**S3.6 Final.** Feature checklist in README with ✅ and a GIF per feature, full run-through GIF, `milestone5.md`.

## 6. Anti-slop workflow for Jules (how every session runs)

1. Session start protocol (STANDARDS.md section 0).
2. Write/refresh the slice's call-stack file (6-tier tree from AGENTS.md 4.5) under `docs/plans/budget-bistro/slices/<id>.md`.
3. RED: one failing test. GREEN: minimum code. REFACTOR. Repeat per acceptance criterion.
4. Playwright video + screenshot to `docs/evidence/<id>/`.
5. Session end protocol; one PR; tell human it is safe to clear context.

The hard rules that stop stubs from becoming permanent are the **STUB registry** (every stub has an ID and a removal slice) and CI checks that fail on orphan stubs. Slice 1 is allowed to fake things; nothing after it is, unless registered.

### Kickoff prompt template (paste into Jules per slice)

```
Jules, implement slice <ID> from docs/plans/budget-bistro/PLAN.md using the Elite Engineering SDLC in AGENTS.md.
Follow docs/STANDARDS.md section 0 (session start) and section 1 (session end) exactly.
Work ONLY on this slice. If acceptance criteria are ambiguous, run /grilling with me before coding.
Produce: slice call-stack file, RED evidence, GREEN tests (unit, security, e2e, regression), Playwright video,
updated 00-status.md (checklist, rubric matrix, STUB registry, handoff note), one PR.
Do not add features, files, or dependencies outside this slice.
```

### Paste at the TOP of AGENTS.md (Jules reads this file automatically)

```
## Session Start Protocol (read first, every session)
Before anything else read: CONTEXT.md, docs/STANDARDS.md, docs/plans/budget-bistro/00-status.md.
Work only on the first unchecked slice. Never invent stubs; register them. Update 00-status.md before ending.
If any instruction here conflicts with STANDARDS.md, STANDARDS.md wins for project rules; AGENTS.md wins for process.
```

Note one tension in AGENTS.md: it says tracer bullets may be "hardcoded or stubbed" while also banning slop. The STUB registry resolves it. Also, AGENTS.md references Groq calls for live tests; this game's core needs no external API, so "no mocking" simply means real DB and real HTTP.

### Slice 1 call stack (template for all later slices)

```
Execution Call Stack Trace: S1.1 Tracer Bullet - Serve a Dish
└── [Project] Browser SPA (Vite, :5173) -> Express API (:3001) -> Postgres (:5432)
    ├── [Env] VITE_API_URL=http://localhost:3001, PORT=3001, DATABASE_URL=postgres://.../bistro_test
    └── [Folder] client/src/pages
        └── [File] CookPage.jsx
            └── [Class] CookPage (function component; state: selected: {id,grams}[], result: Result|null, status: 'idle'|'pending')
                └── [Method] handleServe()
                    ├── [Variable] selected: [] -> [{id:3,grams:100},{id:7,grams:100}]
                    ├── [Variable] status: 'idle' -> 'pending'  (button disabled)
                    └── [Method] createDish({orderId, lines})  in client/src/api/dishes.js
                        └── [Project] HTTP boundary: POST /api/dishes  body {orderId:1, lines:[{ingredientId:3,quantityG:100},...]}
                            └── [Folder] server/src/routes
                                └── [File] dishes.routes.js
                                    └── [Class] (router) express.Router
                                        └── [Method] POST '/' -> dishesController.create(req,res)
                                            └── [Folder] server/src/controllers
                                                └── [File] dishes.controller.js
                                                    └── [Class] DishesController (object module)
                                                        └── [Method] create(req,res)
                                                            ├── [Variable] input: req.body -> {orderId:1, lines:[...]}   (S1.3 adds validation)
                                                            ├── [Folder] server/src/domain
                                                            │   └── [File] scoring.js
                                                            │       └── [Class] (pure module)
                                                            │           └── [Method] score({order, dish, prices, seed})
                                                            │               └── [Variable] stars: undefined -> 3   // STUB(STUB-001) removed in S1.2
                                                            └── [Folder] server/src/repos
                                                                └── [File] dishes.repo.js
                                                                    └── [Class] (module with pg Pool)
                                                                        └── [Method] insertDish(orderId, lines, stars)
                                                                            ├── [Variable] dishId: null -> 1
                                                                            ├── [Variable] lines[].quantityG: 100 (default)   // STUB(STUB-002) removed in S1.3
                                                                            └── [Project] Postgres INSERT dishes; INSERT dish_ingredients (dish_id, ingredient_id, quantity_g)
```

Response `201 {dishId:1, stars:3}` -> `result: null -> {dishId:1, stars:3}`, `status: 'pending' -> 'idle'`, stars render.

## 7. Game design improvements (progression, challenge, endgame, cosmetics)

### The core fix: every Tier adds a new verb, not just tighter numbers

Late-game boredom comes from "same puzzle, smaller tolerance." The starting content feels exciting because the player is *learning something new every few minutes*. Keep that rhythm by gating a new **Constraint Type** at every Tier. Each is cheap to build if the Scoring Engine is a list of constraint rules (design option C).

| Tier | Name | New thing the player learns | Constraint Type |
|---|---|---|---|
| 1 | Food Truck | Cost vs Budget | Budget only |
| 2 | Diner | Hit one macro | + Protein target |
| 3 | Bistro | Full macros + dislikes | + Carb/fat, blacklist allergens |
| 4 | Gastropub | Scarcity | + Availability (limited stock per Day, seasonal ingredients) |
| 5 | Fine Dining | Planning across dishes | + Multi-course orders (3 dishes, shared budget, combined macros) |
| 6 | Michelin | Efficiency | + Waste penalty (unused leftover grams cost Reputation), spoilage |

### Progression and challenge ideas (ranked by value per effort)

1. **Tier gates new verbs** (above). Highest impact; reuses the Scoring Engine.
2. **Boss orders ("Critic's Table")** at tier ends: one big multi-constraint Order with a Reputation-or-bust stake. Gives climaxes the way XCOM missions do.
3. **Supplier Trust** (M:N with `trust`): serving a Supplier's Orders well discounts their category. Creates a real strategic choice about which Orders to prioritize.
4. **Reputation triage**: when overloaded (Rush Days produce more Orders than the Player can finish), choose which to reject. This is the XCOM "sacrifice a region" tension, expressed as Reputation cost per Customer type.
5. **Market Events with consequences, not just prices**: "Gym season" boosts protein-order frequency; "Heatwave" makes salads cheap but soup Orders vanish.
6. **Spoilage and stock** (Tier 4+): buying in bulk is cheaper per gram but expires, which turns the shopping step into its own mini-puzzle.
7. **Staff skill trees**: Sous Chef widens Tolerance by 2%, Buyer shaves 5% off a category. Spend XP points, not cash, so progression isn't only a money loop.

### Endgame that still feels like progress

- **Prestige: "Michelin Reset."** At Tier 6, restart at Tier 1 with a permanent perk and a harder "star level" (tighter tolerances, new event pool). The player re-experiences the fast early ramp with new knowledge. This is the single best answer to "how do I recreate starting-content excitement."
- **Daily Challenge:** one shared seed per date (everyone gets the same Order and prices). Compare Scores on a simple leaderboard table. Costs almost nothing because the RNG is already seeded.
- **Mystery Basket mode:** you get 5 random Ingredients, a fixed Order, no purchasing. Pure puzzle, no economy, 2-minute sessions.
- **Cookbook royalties:** publish a 5-star Dish; it earns small passive income that decays as Market Events shift (old books lose relevance), so the player keeps cooking new things.
- **Recipe versions (the "Tare" idea, lite):** keep `dish_versions` so the player can compare "v2 vs v1" macros and Scores side by side. It's a learning tool and a genuine differentiator, but treat as Sprint 4.

### Cosmetics (earned, not just bought, so they feel like trophies)

- **Earned:** achievements award themes ("Zero Waste" -> Compost Green theme; "Five 5-star days" -> Gold-rim plates; "Survived Avian Flu" -> rooster weathervane badge).
- **Bought:** UI themes (Diner Neon, Royal Banquet, Blueprint), plate styles for the blueprint card, chef emoji badges and titles.
- **Showcase:** a Signature Menu page where the Player pins 3 best Dishes with their equipped theme. This is the "show it off" payoff Dressmaker players love, and it's just a read-only page.
- Cosmetics never affect Scores, so there's no pay-to-win loop and no balance burden.

### Scope warning

Everything in section 7 beyond Tier-gated constraints is Sprint 3-4. The course grades baseline + two custom features + "all visible features work." A smaller game that is fully working on Render beats a larger one with dead buttons. Cut from the bottom of the list first.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Jules drifts or forgets conventions | STANDARDS.md + session start protocol + CI guards (orphan stubs, skipped tests, rubric-check) |
| Context fills mid-slice | Slices are sized for one session; call-stack and handoff notes live on disk |
| Economy is unbalanced | Seeded simulation test: 100 simulated days with a simple bot; assert Wallet doesn't go negative on a baseline strategy and does for a careless one |
| Render/DB surprises at the end | Deploy by S3.3 and run Playwright against the live URL, don't wait for the last week |
| Team members don't understand code Jules wrote | Each PR reviewed by a human; reflections and pitch written by the team. Check the course policy on AI-generated code and keep commit authorship honest |
