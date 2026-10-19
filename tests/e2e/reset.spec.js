import { test, expect } from '@playwright/test';

test('S2.2 New game + reset: Reset DB via modal confirmation', async ({ page, request }) => {
  await request.post('/api/game/reset');
  await page.goto('/');

  // Verify dashboard title and kitchen stats
  await expect(page.locator('h1')).toContainText('Budget Bistro');
  const statsBox = page.locator('#kitchen-stats');
  await expect(statsBox).toBeVisible();

  await expect(page.locator('#stat-wallet')).toContainText('$100.00');
  await expect(page.locator('#stat-reputation')).toContainText('50');

  // Click Reset Game button
  const resetBtn = page.locator('#reset-game-btn');
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();

  // Confirmation modal appears
  const modal = page.locator('#confirm-reset-modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Reset Game Database?');

  // Click Confirm Reset
  const confirmBtn = page.locator('#confirm-reset-btn');
  await confirmBtn.click();

  // Modal closes and success status message appears
  await expect(modal).not.toBeVisible();
  const statusMsg = page.locator('#status-message');
  await expect(statusMsg).toBeVisible();
  await expect(statusMsg).toContainText('Database reset to default seed state!');
});
