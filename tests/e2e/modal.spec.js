import { test, expect } from '@playwright/test';

test.describe('S2.6 Slide-out / Modal E2E', () => {
  test('Opens Order Detail Modal and Market Event News Slide-out', async ({ page }) => {
    // 1. Reset database state first
    await page.goto('/');
    await page.click('#reset-game-btn');
    await page.click('#confirm-reset-btn');
    await expect(page.locator('#status-message')).toContainText('Database reset');

    // 2. Test Order Details Modal
    // Click "View Order Details" button on Order #1
    const viewOrderBtn = page.locator('.view-order-details-btn').first();
    await expect(viewOrderBtn).toBeVisible();
    await viewOrderBtn.click();

    // Verify modal appears with ID #order-detail-modal
    const orderModal = page.locator('#order-detail-modal');
    await expect(orderModal).toBeVisible();
    await expect(orderModal).toContainText('Details');
    await expect(orderModal).toContainText('Budget:');
    await expect(orderModal).toContainText('Target Protein:');

    // Close Order Modal
    await page.click('#close-order-modal');
    await expect(orderModal).not.toBeVisible();

    // Open Order Modal again and click Cook Order from inside modal
    await viewOrderBtn.click();
    await expect(orderModal).toBeVisible();
    await page.click('#modal-cook-btn');
    await expect(page).toHaveURL(/\/orders\/\d+\/cook$/);

    // Return to Dashboard
    await page.goto('/');

    // 3. Test Market News Slide-out Panel
    // Click "View Market News" button or trigger Next Day to open slide-out
    const viewNewsBtn = page.locator('#view-market-news-btn');
    await expect(viewNewsBtn).toBeVisible();
    await viewNewsBtn.click();

    const newsSlideout = page.locator('#market-news-slideout');
    await expect(newsSlideout).toBeVisible();
    await expect(newsSlideout).toContainText('Market News & Event Flash');

    // Close News Slide-out
    await page.click('#close-news-slideout');
    await expect(newsSlideout).not.toBeVisible();

    // Trigger Next Day and verify slide-out auto-opens
    await page.click('#next-day-btn');
    await expect(newsSlideout).toBeVisible();
  });
});
