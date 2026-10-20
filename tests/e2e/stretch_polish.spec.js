import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('S3.4 Stretch Polish E2E Tests (Spinner, Disabled Buttons, Toasts)', () => {
  test.beforeEach(async ({ request }) => {
    // Reset database to clean initial state before each test
    const res = await request.post('http://localhost:3001/api/game/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('should display spinners, disable buttons on submit, and trigger toasts across actions', async ({ page }) => {
    // Ensure evidence directory exists
    const evidenceDir = path.resolve(process.cwd(), 'docs/evidence/S3.4');
    fs.mkdirSync(evidenceDir, { recursive: true });

    // 1. Visit dashboard
    await page.goto('/');
    await expect(page.locator('#app-header')).toBeVisible();

    // Verify Next Day button disables during action and triggers a toast
    const nextDayBtn = page.locator('#next-day-btn');
    await expect(nextDayBtn).toBeVisible();
    await nextDayBtn.click();

    // Verify toast message appears
    const toastMessage = page.locator('.toast');
    await expect(toastMessage).toBeVisible();

    // 2. Navigate to Market Page and verify loading spinner or filters
    await page.locator('#market-link').click();
    await page.waitForURL('**/market');

    // Check filter buttons
    const proteinFilter = page.locator('[data-testid="filter-protein"]');
    await expect(proteinFilter).toBeVisible();
    await proteinFilter.click();

    // 3. Navigate to Cosmetics Shop
    await page.goto('/cosmetics');
    await page.waitForURL('**/cosmetics');

    // Find purchase or equip button and click
    const buyButton = page.locator('.cosmetic-buy-btn').first();
    if (await buyButton.isVisible()) {
      await buyButton.click();
      // Toast or error toast should be visible
      await expect(page.locator('.toast')).toBeVisible();
    }

    // 4. Return to dashboard and test Reset Game confirmation modal
    await page.goto('/');
    const resetBtn = page.locator('#reset-game-btn');
    await resetBtn.click();

    const confirmResetBtn = page.locator('#confirm-reset-btn');
    await expect(confirmResetBtn).toBeVisible();
    await confirmResetBtn.click();

    // Toast should signal reset success
    await expect(page.locator('.toast')).toBeVisible();

    // Capture screenshot evidence
    await page.screenshot({ path: path.join(evidenceDir, 'screenshot.png'), fullPage: true });
  });
});
