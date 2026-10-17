import { test, expect } from '@playwright/test';

test('health check page displays API status ok', async ({ page }) => {
  await page.goto('/');
  const statusElement = page.locator('#health-status');
  await expect(statusElement).toHaveText(/API Status: ok/);
});
