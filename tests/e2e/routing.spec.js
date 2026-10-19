import { test, expect } from '@playwright/test';

test.describe('S2.5 Frontend Routing & Redirection E2E', () => {
  test('Navigates between Dashboard, Market, Cook page, and Dish Detail page after serving', async ({ page }) => {
    // 1. Reset database state first
    await page.goto('/');
    await page.click('#reset-game-btn');
    await page.click('#confirm-reset-btn');
    await expect(page.locator('#status-message')).toContainText('Database reset');

    // Verify Dashboard route '/'
    await expect(page.locator('h1')).toContainText('Budget Bistro');
    await expect(page.locator('#orders-section')).toBeVisible();

    // 2. Navigate to Market page '/market'
    await page.click('#market-link');
    await expect(page).toHaveURL(/\/market$/);
    await expect(page.locator('h1')).toContainText('Ingredient Market');

    // Navigate back from Market page to Kitchen / Dashboard
    await page.click('text=← Back to Kitchen');
    await expect(page).toHaveURL(/\/$/);

    // 3. Click Cook Order from Dashboard
    await page.locator('.cook-order-btn').first().click();
    await expect(page).toHaveURL(/\/orders\/\d+\/cook$/);
    await expect(page.locator('h1')).toHaveText('Cook Page', { timeout: 10000 });

    // 4. Select an ingredient and serve dish on Cook page
    await page.getByTestId('ingredient-1').click();
    await page.click('#serve-button');

    // 5. Verify automatic redirect after serve to Dish Detail page '/dishes/:dishId'
    await expect(page).toHaveURL(/\/dishes\/\d+$/);
    await expect(page.locator('h1')).toContainText('Dish #');
    await expect(page.locator('#dish-stars')).toBeVisible();
    await expect(page.locator('#dish-ingredients-section')).toBeVisible();

    // 6. Click "← Back to Orders" navigation button
    await page.click('#back-to-orders-btn');
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.locator('h1')).toContainText('Budget Bistro');

    // Take screenshot evidence
    await page.screenshot({ path: 'docs/evidence/S2.5/screenshot.png' });
  });
});
