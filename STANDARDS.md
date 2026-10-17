# STANDARDS.md - Rules Jules Must Follow Every Session

<!-- Repo path: /docs/STANDARDS.md. Version: 1. Changing a rule requires an ADR in docs/adr/. -->

## 0. Session start protocol (mandatory, in order)

1. Read `AGENTS.md`, `CONTEXT.md`, this file, `docs/plans/budget-bistro/00-status.md`.
2. Pick the FIRST unchecked slice in 00-status.md. Never skip ahead. Never work on two slices.
3. Read the slice's section in `docs/plans/budget-bistro/PLAN.md` and its call-stack file under `docs/plans/budget-bistro/slices/`.
4. If the slice has no call-stack file yet, write it first (AGENTS.md section 4.5), commit it, then continue.
5. If anything is ambiguous, run /grilling against the human BEFORE coding. Recommend an answer with each question.

## 1. Session end protocol (mandatory)

1. All tests green (unit, security, e2e, regression). Playwright video saved to `docs/evidence/<slice-id>/`.
2. Update `00-status.md`: check the slice, update the rubric matrix row(s), update the STUB registry.
3. Append a 5-line **Handoff** note at the bottom of 00-status.md: what shipped, what is stubbed, what is next, gotchas, open questions.
4. Append one JSONL line per major action to `logs/audit.jsonl` (append-only).
5. Open ONE PR for the slice. Tell the human it is safe to clear context.

## 2. Anti-slop rules (CI enforces the starred ones)

- * **No orphan stubs.** Any stub must carry `// STUB(STUB-NNN)` and be registered in 00-status.md with the slice that removes it. CI fails if a stub's removal slice is already checked.
- * **No `TODO` without an issue number** (`// TODO(#12)`). CI greps.
- * **No skipped/disabled/commented-out tests.** CI greps for `.skip`, `xit`, `xdescribe`, `test.fixme`.
- * **No mocks of our own code.** Tests hit a real Express server and a real Postgres test database. External APIs are not used by core game logic.
- * **Every PR touches exactly one slice.** Max ~400 changed lines excluding lockfiles and generated files. Larger means split the slice.
- A test must fail before the code exists (RED evidence in the PR description: paste the failing output).
- Never weaken an assertion to get green. Fix the code or raise it as a question.
- Never add a dependency without an ADR line explaining why.
- Do not "improve" unrelated files. Out-of-scope ideas go to a GitHub issue labeled `idea`.

## 3. Architecture rules

- **Deep modules.** Business logic lives in `server/src/domain/*` behind a small interface. Routes and controllers stay thin (parse, call domain, respond).
- **Scoring Engine is pure.** `score({ order, dish, prices, seed }) -> { stars, breakdown, review }`. No DB, no `Math.random()`, no `Date.now()`. Randomness comes from an injected seeded RNG.
- **Time and randomness are injected** (clock, rng) so tests are deterministic.
- **One-way imports:** routes -> controllers -> domain -> repositories -> db. Never upward.
- Every exported function documents Inputs and Outputs in a header comment (this satisfies "Show Your Process"), and `ARCHITECTURE.md` lists each domain module's I/O.

## 4. API conventions

- Base path `/api`. Plural nouns, lowercase, kebab-case: `/api/dishes`, `/api/dishes/:id`, `/api/orders/:id/dishes`.
- Verbs: GET read, POST create, PATCH partial update, DELETE remove. No PUT.
- Non-RESTful actions are POST with a verb path and are listed in `docs/api.md`: `POST /api/game/next-day`, `POST /api/game/reset`, `POST /api/orders/:id/serve`.
- Status codes: 200 read/update, 201 create, 204 delete, 400 validation, 404 missing, 409 conflict (e.g. out of stock), 500 unexpected.
- Error body shape, always: `{ "error": { "code": "OVER_BUDGET", "message": "...", "details": {} } }`.
- Validate on the server for every POST/PATCH body. Client validation is UX only.

## 5. Frontend conventions

- Folders: `client/src/pages` (route-level containers), `components` (presenters), `hooks`, `api` (fetch wrappers only), `styles`.
- Pages fetch and own state; components receive props and render. No fetch inside presenters.
- React Router dynamic routes: `/orders/:orderId/cook`, `/dishes/:dishId`.
- Every async button: disabled while pending, shows spinner, toast on success and on error (also earns stretch points).
- No art dependencies. Ingredients use emoji or a single SVG sprite sheet; Dishes render as a "plating blueprint" card (color-coded blocks + macro bars).

## 6. Testing rules (AGENTS.md section 5, made concrete)

| Layer | Tool | Target |
|---|---|---|
| Unit | Vitest/Jest | Domain modules (scoring, pricing, rng, event picker) |
| API/integration | Vitest + real Postgres + supertest-style real HTTP | Every route, every status code |
| Security | Same | SQL injection attempts, oversized bodies, negative quantities, other player's ids, mass-assignment |
| E2E | Playwright (video on) | Each slice's user path, run against local; final slice also against the Render URL |
| Regression | Any | Every bug fix adds a test that fails on the old code |

- Seeded RNG: a fixed seed must produce a fixed Order, Score, and Event. Tests assert exact values.
- Test DB is reset per test file via the same code path as `POST /api/game/reset`.

## 7. Definition of Done (per slice)

- [ ] Vertical: schema -> API -> UI -> tests all present for the slice's one path
- [ ] RED evidence recorded, now GREEN
- [ ] No new orphan stubs; STUB registry updated
- [ ] I/O comments added; ARCHITECTURE.md updated
- [ ] Playwright video and a screenshot in `docs/evidence/<slice-id>/`
- [ ] 00-status.md: slice checked, rubric matrix updated, handoff note written
- [ ] Demo GIF recorded for README if the slice completes a feature
- [ ] CI green; PR description lists files touched and acceptance criteria met

## 8. Rubric guardrail

The course grades "all pages and features working": every visible button, link, and form must work on Render. **If a feature is not finished, remove it from the UI.** Jules must never leave a dead button.

## 9. Drift guards (why docs alone are not enough)

- CI job `standards-check`: greps for orphan stubs, issue-less TODOs, skipped tests, mocks of `server/src/**`.
- CI job `rubric-check`: parses the matrix in 00-status.md and fails if a row marked DONE has no test file path or the file doesn't exist.
- Dependabot/Renovate PRs count as their own slice: run the full suite, no feature changes mixed in.
- Any change to STANDARDS.md, the schema, or the Scoring Engine interface requires an ADR in `docs/adr/`.
