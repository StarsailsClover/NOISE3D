import { test, expect } from '@playwright/test';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

test.describe('NOISE3D v26.1-26.0 - Command Palette & Search', () => {
  test('Ctrl+K opens the palette', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.locator('.palette')).toBeVisible();
    await expect(page.locator('.palette-input')).toBeFocused();
  });

  test('typing "cub" surfaces Add Cube; Enter runs it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('cub');
    await expect(page.locator('.palette-item:has-text("Add Cube")').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await expect(page.locator('.palette')).not.toBeVisible();
  });

  test('shortcut badge is shown for commands with keys', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('Add Cube');
    await expect(page.locator('.palette-item:has-text("Add Cube") .palette-keys')).toHaveText('1');
  });

  test('Escape closes palette without executing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('Add Cube');
    await page.keyboard.press('Escape');
    await expect(page.locator('.palette')).not.toBeVisible();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
  });

  test('recent commands section populated after running one', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('cub');
    await page.keyboard.press('Enter');

    await page.keyboard.press('Control+k');
    await expect(page.locator('.palette-group:has-text("Recent")')).toBeVisible();
    await expect(page.locator('.palette-item:has-text("Add Cube")').first()).toBeVisible();
  });

  test('workspaces reachable from palette', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('workspace shad');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-workspace="shading"]')).toHaveCount(1);
  });

  test('plugin tools appear when plugins installed', async ({ page }) => {
    await page.goto('/');
    await page.locator('.plugin-manager-panel .panel-btn:has-text("Install")').click();
    // Enable the first plugin so its tool registers in getTools()
    await page.locator('.plugin-toggle').first().click();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('Log Scene Stats');
    await expect(page.locator('.palette-item:has-text("Log Scene Stats")')).toBeVisible();
  });

  test('hierarchy search filters the tree live', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    const input = page.locator('.hierarchy-search-input');
    await input.fill('sph');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Sphere' })).toBeVisible();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
    await input.fill('');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });
});
