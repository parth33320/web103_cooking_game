import { test, expect } from '@playwright/test';

test('S2.3 Customers & Reviews - View customer details, serve dish, and verify order reviews list', async ({ page }) => {
  await page.goto('/');
  await page.click('#reset-game-btn');
  await page.click('#confirm-reset-btn');
  await expect(page.locator('#status-message')).toContainText('Database reset');

  await page.locator('.cook-order-btn').first().click();

  await expect(page.locator('h1')).toHaveText('Cook Page');

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

  // Check redirected to dish detail page with review
  await expect(page).toHaveURL(/\/dishes\/\d+$/);
  await expect(page.locator('#dish-stars')).toContainText('Stars');

  // Navigate back to orders/cook page to verify order reviews list updates (1:N relationship)
  await page.click('#back-to-orders-btn');
  await page.locator('.cook-order-btn').first().click();
  const reviewsSection = page.locator('#order-reviews-section');
  await expect(reviewsSection).toBeVisible();
  await expect(reviewsSection).toContainText('Customer Reviews for Order #');
});
