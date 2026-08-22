import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-18.0 - Plugin System', () => {
  test('plugin manager panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.plugin-manager-panel')).toBeVisible();
  });

  test('plugin manager shows empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.plugin-empty')).toContainText('No plugins installed');
  });

  test('install button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.plugin-manager-panel .panel-btn:has-text("Install")')).toBeVisible();
  });

  test('installing built-in plugins adds them to list', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await expect(page.locator('.plugin-item')).toHaveCount(2);
  });

  test('installed plugin shows name and version', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await expect(page.locator('.plugin-name:has-text("Screenshot Tool")')).toBeVisible();
    await expect(page.locator('.plugin-meta').first()).toContainText('v1.0.0');
  });

  test('plugins are disabled by default', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    const toggles = page.locator('.plugin-toggle');
    await expect(toggles.first()).toContainText('OFF');
  });

  test('enabling plugin activates it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await page.locator('.plugin-toggle').first().click();
    await expect(page.locator('.plugin-toggle').first()).toContainText('ON');
    await expect(page.locator('.console-message').last()).toContainText('enabled');
  });

  test('enabled plugin shows its panel content', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await page.locator('.plugin-toggle').first().click();
    await expect(page.locator('.plugin-panel-preview')).toBeVisible();
    await expect(page.locator('.plugin-panel-title')).toContainText('Scene Stats');
  });

  test('enabled plugin shows tool buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await page.locator('.plugin-toggle').first().click();
    await expect(page.locator('.mesh-op-btn:has-text("Log Scene Stats")')).toBeVisible();
  });

  test('executing plugin tool logs message', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await page.locator('.plugin-toggle').first().click();
    await page.locator('.mesh-op-btn:has-text("Log Scene Stats")').click();
    await expect(page.locator('.console-message').last()).toContainText('Screenshot tool executed');
  });

  test('disabling plugin hides panels and tools', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    await page.locator('.plugin-toggle').first().click();
    await expect(page.locator('.plugin-panel-preview')).toBeVisible();
    await page.locator('.plugin-toggle').first().click();
    await expect(page.locator('.plugin-panel-preview')).not.toBeVisible();
    await expect(page.locator('.console-message').last()).toContainText('disabled');
  });
});
