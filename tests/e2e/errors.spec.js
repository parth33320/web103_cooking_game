import { test, expect } from '@playwright/test';

test.describe('Graceful Error Handling E2E', () => {
  test.beforeEach(async ({ request }) => {
    // Reset database to ensure clean seed state before each E2E test
    await request.post('http://localhost:3001/api/game/reset');
  });

  test('renders 404 page for unmatched routes', async ({ page }) => {
    await page.goto('/unknown-page-route');
    const notFoundPage = page.locator('#not-found-page');
    await expect(notFoundPage).toBeVisible();
    await expect(notFoundPage).toContainText('404');

    // Test link back to home
    const homeLink = page.locator('#go-home-link');
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('error boundary catches JS rendering errors gracefully', async ({ page }) => {
    // Navigate to page with error query param or test route
    await page.goto('/?triggerError=true');
    const errorBoundary = page.locator('#error-boundary-fallback');
    await expect(errorBoundary).toBeVisible();
    await expect(errorBoundary).toContainText('Something went wrong');
  });

  test('toast notification displays on action and can be dismissed', async ({ page }) => {
    await page.goto('/');

    // Trigger Reset Game action which fires a toast notification
    const resetBtn = page.locator('#reset-game-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    const confirmResetBtn = page.locator('#confirm-reset-btn');
    await expect(confirmResetBtn).toBeVisible();
    await confirmResetBtn.click();

    const toast = page.locator('#toast-container');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('reset successfully');

    const closeBtn = page.locator('#close-toast-btn');
    await closeBtn.click();
    await expect(toast).not.toBeVisible();
  });
});
