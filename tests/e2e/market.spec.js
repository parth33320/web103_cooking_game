import { test, expect } from '@playwright/test';

test('S2.1 Market Page - Filter by category and sort by price/protein', async ({ page }) => {
  // Reset game state to default
  await page.request.post('/api/game/reset');

  // Navigate to market page directly
  await page.goto('/market');

  // Verify header and ingredient grid exist
  await expect(page.locator('h1')).toContainText('Ingredient Market');
  const grid = page.locator('[data-testid="ingredients-grid"]');
  await expect(grid).toBeVisible();

  // Verify ingredient cards are displayed
  const initialCards = page.locator('[data-testid^="ingredient-card-"]');
  await expect(initialCards.first()).toBeVisible();
  const initialCount = await initialCards.count();
  expect(initialCount).toBeGreaterThan(0);

  // Filter by category 'protein'
  await page.locator('[data-testid="filter-protein"]').click();
  const proteinCards = page.locator('[data-testid^="ingredient-card-"]');
  await expect(proteinCards.first()).toBeVisible();
  expect(await proteinCards.count()).toBeGreaterThan(0);
  for (let i = 0; i < await proteinCards.count(); i++) {
    await expect(proteinCards.nth(i)).toContainText(/protein/i);
  }

  // Filter back to 'all'
  await page.locator('[data-testid="filter-all"]').click();
  await expect(initialCards.first()).toBeVisible();

  // Sort by price descending
  await page.locator('[data-testid="sort-select"]').selectOption('price');
  await page.locator('[data-testid="order-select"]').selectOption('desc');
  await page.waitForTimeout(500);

  // Take screenshot evidence
  await page.screenshot({ path: 'docs/evidence/S2.1/market.png', fullPage: true });
});
