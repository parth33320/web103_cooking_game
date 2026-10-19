import { test, expect } from '@playwright/test';

test('S3.2 Cosmetics Shop - Purchase and equip theme', async ({ page }) => {
  // Navigate to root first and reset game state
  await page.goto('/');
  await page.click('#reset-game-btn');
  await page.click('#confirm-reset-btn');
  await page.waitForTimeout(500);

  // Navigate to cosmetics shop
  await page.click('#cosmetics-shop-link');
  await expect(page.locator('h1')).toContainText('Cosmetics Shop');

  // Verify cosmetics grid is displayed
  const grid = page.locator('#cosmetics-grid');
  await expect(grid).toBeVisible();

  // Buy Item #2 (Neon Cyber-Diner)
  const buyBtn = page.locator('#buy-cosmetic-2-btn');
  await expect(buyBtn).toBeVisible();
  await buyBtn.click();

  // Wait for success toast and purchase completion
  await expect(page.getByText('Successfully purchased Neon Cyber-Diner!')).toBeVisible();

  // Verify equip button appears for Item #2 and click equip
  const equipBtn = page.locator('#equip-cosmetic-2-btn');
  await expect(equipBtn).toBeVisible();
  await equipBtn.click();

  // Wait for equipped status toast and button text update
  await expect(page.getByText('Equipped Neon Cyber-Diner!')).toBeVisible();
  await expect(page.locator('#cosmetic-card-2 button')).toContainText('Equipped ✓');

  // Verify body class updated to theme-neon
  const bodyClass = await page.evaluate(() => document.body.className);
  expect(bodyClass).toBe('theme-neon');

  // Save screenshot evidence
  await page.screenshot({ path: 'docs/evidence/S3.2/screenshot.png', fullPage: true });
});
