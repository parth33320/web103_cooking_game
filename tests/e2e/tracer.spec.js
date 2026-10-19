import { test, expect } from '@playwright/test';

test('S1.1 Tracer Bullet - Serve a dish and view stars', async ({ page }) => {
  await page.goto('/');
  await page.click('#reset-game-btn');
  await page.click('#confirm-reset-btn');
  await expect(page.locator('#status-message')).toContainText('Database reset');

  await page.locator('.cook-order-btn').first().click();

  await expect(page.locator('h1')).toHaveText('Cook Page');

  // Select an ingredient
  const chickenBtn = page.getByTestId('ingredient-1');
  await chickenBtn.click();

  // Serve the dish
  const serveBtn = page.locator('#serve-button');
  await expect(serveBtn).toBeEnabled();
  await serveBtn.click();

  // Check dish detail page appears after redirect
  await expect(page).toHaveURL(/\/dishes\/\d+$/);
  await expect(page.locator('#dish-stars')).toContainText('Stars');
});
