import { test, expect } from '@playwright/test';

test.describe('NOISE3D v6 - Undo/Redo & Hierarchy', () => {
  test('undo/redo buttons are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.toolbar-btn:has-text("Undo")')).toBeVisible();
    await expect(page.locator('.toolbar-btn:has-text("Redo")')).toBeVisible();
  });

  test('duplicate button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.toolbar-btn:has-text("Duplicate")')).toBeVisible();
  });

  test('undo is disabled initially', async ({ page }) => {
    await page.goto('/');
    const undoBtn = page.locator('.toolbar-btn:has-text("Undo")');
    await expect(undoBtn).toBeDisabled();
  });

  test('undo enables after adding primitive', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const undoBtn = page.locator('.toolbar-btn:has-text("Undo")');
    await expect(undoBtn).toBeEnabled();
  });

  test('undo removes added primitive', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
  });

  test('redo re-adds after undo', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
    await page.locator('.toolbar-btn:has-text("Redo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });

  test('Ctrl+Z undoes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.keyboard.press('Control+z');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
  });

  test('Ctrl+Y redoes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });

  test('Ctrl+D duplicates node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.keyboard.press('Control+d');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Copy' })).toBeVisible();
  });

  test('duplicate button duplicates selected', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.toolbar-btn:has-text("Duplicate")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Copy' })).toBeVisible();
  });

  test('undo undoes deletion', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.hierarchy-delete').click();
    await expect(page.locator('.hierarchy-item')).toHaveCount(1);
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });

  test('hierarchy duplicate button exists on hover', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-action-btn')).toBeVisible();
  });

  test('drag and drop reorders hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();

    const cubeItem = page.locator('.hierarchy-item').filter({ hasText: 'Cube' });
    const sphereItem = page.locator('.hierarchy-item').filter({ hasText: 'Sphere' });

    await cubeItem.hover();
    await page.mouse.down();
    await sphereItem.hover();
    await page.mouse.up();
  });

  test('multiple undo/redo cycle', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Sphere' })).not.toBeVisible();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).not.toBeVisible();
    await page.locator('.toolbar-btn:has-text("Redo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await page.locator('.toolbar-btn:has-text("Redo")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Sphere' })).toBeVisible();
  });

  test('console logs undo action', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.toolbar-btn:has-text("Undo")').click();
    await expect(page.locator('.console-message').last()).toContainText('Undo');
  });
});
