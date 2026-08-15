import { test, expect } from '@playwright/test';

test.describe('NOISE3D v1 - Core Editor', () => {
  test('editor loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NOISE3D/);
  });

  test('main toolbar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await expect(page.locator('.app-title')).toContainText('NOISE3D');
  });

  test('hierarchy panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hierarchy-panel')).toBeVisible();
    await expect(page.locator('.hierarchy-panel .panel-title')).toContainText('Hierarchy');
  });

  test('viewport canvas exists', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', /.+/);
  });

  test('inspector panel shows empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.inspector-panel')).toBeVisible();
    await expect(page.locator('.inspector-empty')).toContainText('No object selected');
  });

  test('console panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.console-panel')).toBeVisible();
  });

  test('add cube via toolbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await expect(page.locator('.inspector-panel')).toBeVisible();
  });

  test('add sphere and select it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    const sphereItem = page.locator('.hierarchy-item').filter({ hasText: 'Sphere' });
    await expect(sphereItem).toBeVisible();
    await sphereItem.click();
    await expect(page.locator('.inspector-input')).toHaveValue('Sphere');
  });

  test('grid toggle works', async ({ page }) => {
    await page.goto('/');
    const gridBtn = page.locator('.viewport-toolbar button:has-text("Grid")');
    await expect(gridBtn).toBeVisible();
    await gridBtn.click();
  });

  test('multiple primitives can be added', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.locator('.viewport-toolbar button:has-text("Plane")').click();
    const items = page.locator('.hierarchy-item');
    await expect(items).toHaveCount(4);
  });

  test('delete node from hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await page.locator('.hierarchy-delete').click();
    await expect(page.locator('.inspector-empty')).toBeVisible();
  });

  test('console logs primitive creation', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.console-message')).toContainText(/Created cube/);
  });
});
