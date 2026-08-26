import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-25.0 - Status Bar, Tooltips, Onboarding', () => {
  test('status bar is visible with hints', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.status-bar')).toBeVisible();
    await expect(page.locator('.status-hints')).toContainText('LMB');
    await expect(page.locator('.status-hints')).toContainText('Orbit');
    await expect(page.locator('.status-hints')).toContainText('Fly');
  });

  test('status bar shows scene name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.status-scene')).toContainText('Untitled');
  });

  test('dirty dot appears after edit and clears on save', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.status-dirty')).not.toBeVisible();
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.status-dirty')).toBeVisible();

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('DirtyTest');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await expect(page.locator('.status-dirty')).not.toBeVisible();
  });

  test('status bar shows node and light counts', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.status-stat').filter({ hasText: 'Nodes' })).toContainText(/\d+/);
    await expect(page.locator('.status-stat').filter({ hasText: 'Lights' })).toBeVisible();
  });

  test('FPS readout shows a number', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(700);
    await expect(page.locator('.status-fps')).toContainText(/FPS \d/);
  });

  test('styled tooltip appears on toolbar hover', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    const btn = page.locator('.main-toolbar button[title="Add Cube"]');
    await btn.hover();
    await page.waitForTimeout(450);
    const tip = page.locator('.tooltip-layer');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText('Add Cube');
  });

  test('onboarding tour shows on first visit with 4 steps', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('noise3d:tour-done'));
    await page.reload();
    await expect(page.locator('.tour-overlay')).toBeVisible();
    await expect(page.locator('.tour-step-count')).toContainText('1 / 4');
    await page.locator('.tour-btn:has-text("Next")').click();
    await expect(page.locator('.tour-step-count')).toContainText('2 / 4');
  });

  test('tour skip persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('noise3d:tour-done'));
    await page.reload();
    await expect(page.locator('.tour-overlay')).toBeVisible();
    await page.locator('.tour-btn:has-text("Skip")').click();
    await expect(page.locator('.tour-overlay')).not.toBeVisible();
    await page.reload();
    await expect(page.locator('.tour-overlay')).not.toBeVisible();
  });
});
