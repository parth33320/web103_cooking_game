import { test, expect } from '@playwright/test';

test.describe('Suppliers & VIP Orders E2E Flow', () => {
  test('User can view Suppliers & Trust section on Market Page', async ({ page }) => {
    // 1. Reset game state
    await page.request.post('/api/game/reset');

    // 2. Navigate to Market Page
    await page.goto('/market');

    // 3. Verify Suppliers & Trust panel is displayed
    const suppliersHeading = page.locator('text=Suppliers & Trust');
    await expect(suppliersHeading).toBeVisible();

    // 4. Verify supplier cards are present
    const primeCuts = page.locator('text=Prime Cuts Co.');
    await expect(primeCuts).toBeVisible();

    // 5. Navigate to Dashboard/Orders page and verify open orders heading
    await page.goto('/orders');
    const orderHeader = page.locator('text=Today\'s Open Orders');
    await expect(orderHeader).toBeVisible();
  });
});
