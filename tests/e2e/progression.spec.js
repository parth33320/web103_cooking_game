import { test, expect } from '@playwright/test';

test.describe('S3.1 Progression, Tier, and Tier-Gated Ingredients E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Reset DB to default seed state via UI
    await page.goto('/');
    await page.click('#reset-game-btn');
    await page.click('#confirm-reset-btn');
    await expect(page.locator('#status-message')).toContainText('Database reset');
  });

  test('displays Kitchen XP in dashboard header', async ({ page }) => {
    await page.goto('/');
    const xpEl = page.locator('#stat-xp');
    await expect(xpEl).toBeVisible();
    await expect(xpEl).toHaveText('0');
  });

  test('renders locked ingredients as disabled in Cook page for Tier 1 kitchen', async ({ page }) => {
    // Navigate via Cook button on order card
    await page.goto('/');
    await page.locator('.cook-order-btn').first().click();
    await expect(page.locator('h1')).toHaveText('Cook Page');

    // Chicken Breast (id 1, min_tier 1) should be enabled
    const chickenBtn = page.getByTestId('ingredient-1');
    await expect(chickenBtn).toBeEnabled();

    // Truffle Oil (id 6, min_tier 3) should be disabled in Tier 1 kitchen if present
    const truffleBtn = page.getByTestId('ingredient-6');
    if (await truffleBtn.count() > 0) {
      await expect(truffleBtn).toBeDisabled();
      await expect(truffleBtn).toContainText('🔒 Tier 3');
    }
  });

  test('submitting dish awards XP and updates Kitchen XP display', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cook-order-btn').first().click();
    await expect(page.locator('h1')).toHaveText('Cook Page');

    // Select Chicken Breast & Rice
    await page.getByTestId('ingredient-1').click();
    await page.getByTestId('ingredient-2').click();

    // Click Serve Dish
    await page.click('#serve-button');

    // Redirects to Dish Details page
    await page.waitForURL(/\/dishes\/\d+/);
    await expect(page.locator('h1')).toContainText('Details');

    // Return to Kitchen dashboard
    await page.click('a:has-text("← Back to Kitchen")');
    await page.waitForURL('/');

    // Check updated XP display
    const xpEl = page.locator('#stat-xp');
    await expect(xpEl).toBeVisible();
    const xpText = await xpEl.textContent();
    const xpVal = parseInt(xpText || '0', 10);
    expect(xpVal).toBeGreaterThan(0);
  });
});
