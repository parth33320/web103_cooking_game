import { test, expect } from '@playwright/test';

test('S1.2 Scoring Engine - Serve a dish and view stars with breakdown', async ({ page }) => {
  await page.goto('/orders/1/cook');

  await expect(page.locator('h1')).toHaveText('Cook Page');
  await expect(page.locator('text=Order #1').first()).toBeVisible();

  // Select ingredients
  const chickenBtn = page.getByTestId('ingredient-1');
  await chickenBtn.click();

  // Serve the dish
  const serveBtn = page.locator('#serve-button');
  await expect(serveBtn).toBeEnabled();
  await serveBtn.click();

  // Check stars rating and breakdown appear
  const resultBox = page.locator('#result-box');
  await expect(resultBox).toBeVisible();
  await expect(page.locator('#star-rating')).toBeVisible();

  const breakdownBox = page.locator('#score-breakdown');
  await expect(breakdownBox).toBeVisible();
  await expect(breakdownBox).toContainText('Score Breakdown');
  await expect(breakdownBox).toContainText('Base Stars');
});
