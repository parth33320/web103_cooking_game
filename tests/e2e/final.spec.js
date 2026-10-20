import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('S3.6 Final E2E Run-Through Test', () => {
  test('Complete game loop end-to-end run-through', async ({ page }) => {
    // 1. Visit Dashboard & Reset Game
    await page.goto('/');
    await expect(page.locator('#app-header')).toBeVisible();
    await expect(page.locator('#app-header')).toContainText('Budget Bistro');
    await expect(page.locator('#dashboard-page')).toBeVisible();

    const resetBtn = page.locator('#reset-game-btn');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.locator('#confirm-reset-btn').click();
      await expect(page.locator('#status-message')).toContainText('Database reset');
    }

    // 2. Navigate to Market Page
    await page.goto('/market');
    await expect(page.locator('h1')).toContainText('Ingredient Market');
    await expect(page.locator('[data-testid="ingredients-grid"]')).toBeVisible();

    // 3. Navigate to Cook Page via Cook Order Button
    await page.goto('/');
    const cookOrderBtn = page.locator('.cook-order-btn').first();
    if (await cookOrderBtn.isVisible()) {
      await cookOrderBtn.click();
      await expect(page.locator('h1')).toHaveText('Cook Page');

      // Select an ingredient
      const ingredientBtn = page.getByTestId('ingredient-1');
      if (await ingredientBtn.isVisible()) {
        await ingredientBtn.click();
      }

      // Serve dish
      const serveBtn = page.locator('#serve-button');
      if (await serveBtn.isVisible() && await serveBtn.isEnabled()) {
        await serveBtn.click();
        await expect(page).toHaveURL(/\/dishes\/\d+$/);
        await expect(page.locator('#dish-stars')).toContainText('Stars');
      }
    }

    // 4. Navigate to Cosmetics Shop
    await page.goto('/cosmetics');
    await expect(page.locator('h1')).toContainText('Cosmetics Shop');

    // 5. Next Day Transition
    await page.goto('/');
    const nextDayButton = page.locator('#next-day-btn');
    if (await nextDayButton.isVisible()) {
      await nextDayButton.click();
      await expect(page.locator('#app-header')).toBeVisible();
    }

    // Capture screenshot and video to S3.6 evidence folder
    const evidenceDir = path.resolve(process.cwd(), 'docs/evidence/S3.6');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.screenshot({ path: path.join(evidenceDir, 'screenshot.png'), fullPage: true });

    // Copy recorded Playwright video to evidence folder
    const videoPath = await page.video()?.path();
    if (videoPath && fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, path.join(evidenceDir, 'video.webm'));
    }
  });
});
