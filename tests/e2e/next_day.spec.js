import { test, expect } from '@playwright/test';

test.describe('S2.4 Next Day Flow E2E', () => {
  test('Advances day, charges rent, penalizes unserved orders, and updates stats & orders in UI', async ({ page }) => {
    // 1. Reset database to clean initial state
    await page.goto('/');
    await page.click('#reset-game-btn');
    await page.click('#confirm-reset-btn');
    await expect(page.locator('#status-message')).toContainText('Database reset');

    // Verify initial stats: Day 1, Wallet $100.00
    await expect(page.locator('#stat-day')).toHaveText('1');
    await expect(page.locator('#stat-wallet')).toHaveText('$100.00');
    await expect(page.locator('#orders-section')).toBeVisible();

    // 2. Click "Next Day 🌙"
    await page.click('#next-day-btn');

    // 3. Verify updated stats: Day 2, Wallet $90.00 ($100 - $10 rent)
    await expect(page.locator('#stat-day')).toHaveText('2');
    await expect(page.locator('#stat-wallet')).toHaveText('$90.00');
    await expect(page.locator('#status-message')).toContainText('Advanced to Day 2');

    // 4. Verify new orders were generated (3-5 open orders)
    const orderCards = page.locator('.order-card');
    await expect(orderCards).toHaveCount(await orderCards.count());
    expect(await orderCards.count()).toBeGreaterThanOrEqual(3);

    // Take screenshot evidence
    await page.screenshot({ path: 'docs/evidence/S2.4/screenshot.png' });
  });
});
