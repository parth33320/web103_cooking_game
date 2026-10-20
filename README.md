# Budget Bistro 🍳 - Full-Stack Restaurant Puzzle & Cooking Strategy Game

[![Deploy to Render](https://img.shields.io/badge/Deploy-Render-blue?style=for-the-badge&logo=render)](https://budget-bistro.onrender.com)
[![CI Status](https://img.shields.io/badge/CI-Passed-success?style=for-the-badge)](https://github.com)

**Live Demo URL**: [https://budget-bistro.onrender.com](https://budget-bistro.onrender.com)

---

## 📖 App Overview & Description

**Budget Bistro** is an engaging, full-stack puzzle strategy cooking game built with **React (Vite SPA)** on the frontend, **Express.js** on the backend, and **PostgreSQL** as the primary relational database.

Players step into the shoes of a restaurant owner managing a kitchen under real culinary constraints:
- **Dynamic Customer Demands**: NPC Customers (driven by a deterministic, seeded RNG) arrive with specific budget limits, macro nutritional targets (Protein, Carbs, Fats), and ingredient preferences/allergens.
- **Flurrying Market Prices**: Ingredient market prices fluctuate daily based on macroeconomic market news and events.
- **Plating & Scoring Engine**: Assemble dishes by specifying ingredient quantities in grams. The pure domain scoring engine evaluates cost, nutritional targets, and customer preferences while applying a seeded luck roll.
- **Progression & Customization**: Earn XP to raise Kitchen Tiers, unlock tier-gated constraints (such as allergen blacklists and ingredient scarcity), customize kitchen aesthetics in the Cosmetics Shop, and gain Supplier Trust for category-wide ingredient discounts.

---

## 👥 Team Members

- **Parth Patel** ([@ParthPatel](https://github.com)) - Full-Stack Engineering & Lead Architecture

---

## 💡 Inspiration

Inspired by cozy job simulation and strategy games like *Dressmaker*, *Good Pizza, Great Pizza*, and tactical decision-making systems from *XCOM*. Budget Bistro transforms recipe formulation into a satisfying, dashboard-driven optimization puzzle where every cent and gram matters.

---

## ✅ Completed Feature Checklist & Evidence

All baseline, custom, and stretch features specified in the WEB103 Capstone Rubric are fully implemented, tested, and verified on Render:

| Feature Name | Type | Description | Evidence & Media |
|---|---|---|---|
| **Express Backend & React Frontend** | Baseline | Full-stack application architecture with Express API server and React Vite SPA client. | [docs/evidence/S0.1/](docs/evidence/S0.1/) |
| **1:N & M:N Postgres Relationships** | Baseline | 1:N (Customers -> Orders -> Reviews) and M:N join tables (`dish_ingredients`, `kitchen_cosmetics`, `kitchen_suppliers`). | [docs/evidence/S1.1/](docs/evidence/S1.1/) |
| **RESTful Dish CRUD API** | Baseline | Full CRUD operations for `Dish` (`GET /api/dishes`, `POST /api/dishes`, `PATCH /api/dishes/:id`, `DELETE /api/dishes/:id`). | [docs/evidence/S1.3/](docs/evidence/S1.3/) |
| **Database Reset Endpoint** | Baseline | `POST /api/game/reset` resets the database and seeds starter Kitchen, Orders, and Suppliers. | [docs/evidence/S2.2/](docs/evidence/S2.2/) |
| **Frontend Redirection & Routing** | Baseline | React Router client-side routing with automatic redirect after serving dishes (`/orders/:id/cook` -> `/dishes/:id`). | [docs/evidence/S2.5/](docs/evidence/S2.5/) |
| **Same-Page Interaction** | Baseline | Live ingredient selection and gram adjustments on the cook page updating macro bars in real time. | [docs/evidence/S1.1/](docs/evidence/S1.1/) |
| **Hierarchical React Components** | Baseline | Structured container pages (`DashboardPage`, `MarketPage`, `CookPage`, `CosmeticsPage`) and presenters. | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Deployed on Render** | Baseline | Web service deployed live on Render connected to PostgreSQL with static asset fallback. | [docs/evidence/S3.3/](docs/evidence/S3.3/) |
| **Graceful Error Handling** | Custom | Centralized API error middleware, React ErrorBoundary fallback UI, and toast notifications. | [docs/evidence/S2.7/](docs/evidence/S2.7/) |
| **1:1 Database Relationship** | Custom | One-to-One mapping between `Player` and `Kitchen` in PostgreSQL. | [docs/evidence/S2.2/](docs/evidence/S2.2/) |
| **Slide-Out Pane / Modal** | Custom | Market event news slide-out drawer on Next Day transition and Order detail modal. | [docs/evidence/S2.6/](docs/evidence/S2.6/) |
| **Unique Join Table Fields** | Custom | Extra attributes on join tables: `dish_ingredients.quantity_g`, `kitchen_cosmetics.equipped`, `kitchen_suppliers.trust`. | [docs/evidence/S3.2/](docs/evidence/S3.2/) |
| **Non-RESTful Game Routes** | Custom | Specialized action routes (`POST /api/game/next-day`, `POST /api/game/reset`). | [docs/evidence/S2.4/](docs/evidence/S2.4/) |
| **Filtering & Sorting** | Custom | Ingredient market filtering by category and sorting by price/protein ascending/descending. | [docs/evidence/S2.1/](docs/evidence/S2.1/) |
| **Auto-Generated Data Events** | Custom | Automated seeding of Orders, Market Events, and initial Wallet on new game / reset. | [docs/evidence/S2.2/](docs/evidence/S2.2/) |
| **Request Payload Validation** | Custom | Strict validation on `POST` and `PATCH` requests before DB execution (rejects negative/oversized grams, duplicate lines, out of budget). | [docs/evidence/S1.3/](docs/evidence/S1.3/) |
| **Dynamic Option Restriction** | Stretch | Tier-locked ingredients show 🔒 badges; affordable items highlight dynamically based on Wallet balance. | [docs/evidence/S3.1/](docs/evidence/S3.1/) |
| **Toast Notifications** | Stretch | Global toast messaging system delivering user feedback across route transitions and async actions. | [docs/evidence/S2.7/](docs/evidence/S2.7/) |
| **Supplier Trust & VIP Orders** | Endgame | M:N Supplier Trust system unlocking category discounts, plus high-stakes VIP multi-constraint Orders. | [docs/evidence/S3.5/](docs/evidence/S3.5/) |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Custom CSS Modules / Variables
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (`pg` driver, PostgreSQL advisory locks for concurrent migrations, `pg-mem` for isolated in-memory test DBs)
- **Testing**: Vitest for unit, API, and security tests; Playwright for end-to-end browser testing with video recording
- **CI/CD**: GitHub Actions, Render Deployment Blueprint (`render.yaml`)

---

## 🚀 Running Locally

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/budget-bistro.git
   cd budget-bistro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```
   - Client dev server: `http://localhost:5173`
   - Express server: `http://localhost:3001`

4. **Run Build & Production Server**:
   ```bash
   npm run build
   npm start
   ```

5. **Run Test Suites**:
   - Unit & API tests: `npm test`
   - Playwright E2E tests: `npx playwright test`
   - Standards check: `npm run standards-check`
   - Rubric check: `npm run rubric-check`
