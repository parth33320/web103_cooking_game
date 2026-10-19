import { test, expect } from '@playwright/test';

test.describe('Live Deployment Smoke Tests', () => {
  const liveUrl = process.env.LIVE_URL;

  test('GET /api/health returns status ok', async ({ request, baseURL }) => {
    const targetUrl = liveUrl || baseURL || 'http://localhost:3001';
    const response = await request.get(`${targetUrl}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('Live web app loads dashboard and header correctly', async ({ page, baseURL }) => {
    const targetUrl = liveUrl || baseURL || 'http://localhost:5173';
    await page.goto(targetUrl);
    await expect(page.locator('#app-header')).toBeVisible();
    await expect(page.locator('#app-header')).toContainText('Budget Bistro');
    await expect(page.locator('#dashboard-page')).toBeVisible();
  });
});
