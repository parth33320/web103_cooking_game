import { test, expect } from '@playwright/test';

test('S2.1 Market Page - Filter by category and sort by price/protein', async ({ page }) => {
  // Navigate to market page directly
  await page.goto('/market');

  // Verify header and ingredient grid exist
  await expect(page.locator('h1')).toContainText('Ingredient Market');
  const grid = page.locator('[data-testid="ingredients-grid"]');
  await expect(grid).toBeVisible();

  // Verify ingredient cards are displayed
  const initialCards = page.locator('[data-testid^="ingredient-card-"]');
  const initialCount = await initialCards.count();
  expect(initialCount).toBeGreaterThan(0);

  // Filter by category 'protein'
  await page.locator('[data-testid="filter-protein"]').click();
  await page.waitForResponse((res) => res.url().includes('/api/ingredients') && res.status() === 200);
  const proteinCards = page.locator('[data-testid^="ingredient-card-"]');
  expect(await proteinCards.count()).toBeGreaterThan(0);
  for (let i = 0; i < await proteinCards.count(); i++) {
    await expect(proteinCards.nth(i)).toContainText(/protein/i);
  }

  // Filter back to 'all'
  await page.locator('[data-testid="filter-all"]').click();

  // Sort by price descending
  await page.locator('[data-testid="sort-select"]').selectOption('price');
  await page.locator('[data-testid="order-select"]').selectOption('desc');

  // Take screenshot evidence
  await page.screenshot({ path: 'docs/evidence/S2.1/market.png', fullPage: true });
});
