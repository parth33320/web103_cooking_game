import { test, expect } from '@playwright/test';

test('S2.3 Customers & Reviews - View customer details, serve dish, and verify order reviews list', async ({ page }) => {
  await page.goto('/orders/1/cook');

  await expect(page.locator('h1')).toHaveText('Cook Page');
  await expect(page.locator('text=Order #1')).toBeVisible();

  // Verify customer profile details
  await expect(page.locator('#customer-job')).toBeVisible();
  await expect(page.locator('#customer-diet')).toBeVisible();

  // Select an ingredient
  const chickenBtn = page.getByTestId('ingredient-1');
  await chickenBtn.click();

  // Serve the dish
  const serveBtn = page.locator('#serve-button');
  await expect(serveBtn).toBeEnabled();
  await serveBtn.click();

  // Check result box appears with review
  const resultBox = page.locator('#result-box');
  await expect(resultBox).toBeVisible();
  await expect(page.locator('#star-rating')).toContainText('Stars');

  // Verify order reviews list updates (1:N relationship)
  const reviewsSection = page.locator('#order-reviews-section');
  await expect(reviewsSection).toBeVisible();
  await expect(reviewsSection).toContainText('Customer Reviews for Order #1');
});
