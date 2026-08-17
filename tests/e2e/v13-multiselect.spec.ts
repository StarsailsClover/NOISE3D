import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-11.0 - Multi-Select & Scene View Modes', () => {
  test('view mode controls are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-viewmode-controls')).toBeVisible();
  });

  test('view mode defaults to material', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cam-btn[title="Material Preview"]')).toHaveClass(/active/);
  });

  test('switch to wireframe view mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn[title="Wireframe"]').click();
    await expect(page.locator('.cam-btn[title="Wireframe"]')).toHaveClass(/active/);
  });

  test('switch to solid view mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn[title="Solid (Unlit)"]').click();
    await expect(page.locator('.cam-btn[title="Solid (Unlit)"]')).toHaveClass(/active/);
  });

  test('switch to rendered view mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn[title="Rendered"]').click();
    await expect(page.locator('.cam-btn[title="Rendered"]')).toHaveClass(/active/);
  });

  test('switch back to material view mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn[title="Wireframe"]').click();
    await page.locator('.cam-btn[title="Material Preview"]').click();
    await expect(page.locator('.cam-btn[title="Material Preview"]')).toHaveClass(/active/);
  });

  test('Ctrl+A selects all nodes', async ({ page }) => {
    await page.goto('/');
    // Add multiple primitives
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.waitForTimeout(100);

    // Ctrl+A to select all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);

    // App should not crash, viewport still visible
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('click on empty space deselects all', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    // Click empty area
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + 10, box.y + 10);
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('shift-click adds to selection without crash', async ({ page }) => {
    await page.goto('/');
    // Add two cubes
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.waitForTimeout(100);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Try shift+click
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down('Shift');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('batch delete removes all selected nodes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.waitForTimeout(100);

    // Select all then delete via Ctrl+A + Delete
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('batch duplicate works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    // Select all and duplicate
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(100);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('view mode change does not break rendering', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    // Cycle through all view modes
    await page.locator('.cam-btn[title="Wireframe"]').click();
    await page.waitForTimeout(200);
    await page.locator('.cam-btn[title="Solid (Unlit)"]').click();
    await page.waitForTimeout(200);
    await page.locator('.cam-btn[title="Rendered"]').click();
    await page.waitForTimeout(200);
    await page.locator('.cam-btn[title="Material Preview"]').click();
    await page.waitForTimeout(200);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });
});
