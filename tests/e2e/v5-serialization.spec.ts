import { test, expect } from '@playwright/test';

test.describe('NOISE3D v5 - Scene Serialization', () => {
  test('file menu button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.toolbar-btn:has-text("File")')).toBeVisible();
  });

  test('file menu opens on click', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu')).toBeVisible();
  });

  test('file menu has New Scene option', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("New Scene")')).toBeVisible();
  });

  test('file menu has scene name input', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-input')).toBeVisible();
  });

  test('file menu has save and load options', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("Save to Browser")')).toBeVisible();
    await expect(page.locator('.file-menu-item:has-text("Load from Browser")')).toBeVisible();
  });

  test('file menu has download and import options', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("Download")')).toBeVisible();
    await expect(page.locator('.file-menu-item:has-text("Import")')).toBeVisible();
  });

  test('new scene clears existing objects', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await expect(page.locator('.hierarchy-item')).toHaveCount(3);

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("New Scene")').click();
    await expect(page.locator('.hierarchy-item')).toHaveCount(1);
  });

  test('save and load scene from browser storage', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('TestScene');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await expect(page.locator('.console-message').last()).toContainText('saved');

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("New Scene")').click();
    await expect(page.locator('.hierarchy-item')).toHaveCount(1);

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('TestScene');
    await page.locator('.file-menu-item:has-text("Load from Browser")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });

  test('scene name displays in toolbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.scene-name')).toContainText('Untitled');
  });

  test('save updates scene name', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('MyProject');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await expect(page.locator('.scene-name')).toContainText('MyProject');
  });

  test('file menu closes on overlay click', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu')).toBeVisible();
    await page.locator('.file-menu-overlay').click();
    await expect(page.locator('.file-menu')).not.toBeVisible();
  });

  test('file menu shows current scene name', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('DisplayTest');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-info')).toContainText('DisplayTest');
  });

  test('console logs save action', async ({ page }) => {
    await page.goto('/');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('LogTest');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await expect(page.locator('.console-message').last()).toContainText('Scene saved');
  });

  test('loaded scene preserves lights', async ({ page }) => {
    await page.goto('/');
    await page.locator('.light-panel .panel-btn:has-text("Point")').click();

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('LightTest');
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("New Scene")').click();

    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-input').fill('LightTest');
    await page.locator('.file-menu-item:has-text("Load from Browser")').click();
    await expect(page.locator('.light-item').filter({ hasText: 'Point Light' })).toBeVisible();
  });
});
