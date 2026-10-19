import { test, expect } from '@playwright/test';

test('S1.2 Scoring Engine - Serve a dish and view stars with breakdown', async ({ page }) => {
  await page.goto('/');
  await page.click('#reset-game-btn');
  await page.click('#confirm-reset-btn');
  await expect(page.locator('#status-message')).toContainText('Database reset');

  await page.locator('.cook-order-btn').first().click();

  await expect(page.locator('h1')).toHaveText('Cook Page');

  // Select ingredients
  const chickenBtn = page.getByTestId('ingredient-1');
  await chickenBtn.click();

  // Serve the dish
  const serveBtn = page.locator('#serve-button');
  await expect(serveBtn).toBeEnabled();
  await serveBtn.click();

  // Check stars rating and breakdown appear on dish detail page after redirect
  await expect(page).toHaveURL(/\/dishes\/\d+$/);
  await expect(page.locator('#dish-stars')).toBeVisible();

  const breakdownBox = page.locator('#dish-breakdown');
  await expect(breakdownBox).toBeVisible();
  await expect(breakdownBox).toContainText('Score Breakdown');
  await expect(breakdownBox).toContainText('Base Stars');
});
