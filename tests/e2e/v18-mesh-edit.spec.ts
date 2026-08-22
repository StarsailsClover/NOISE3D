import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-16.0 - UV & Mesh Edit', () => {
  test('mesh edit panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mesh-edit-panel')).toBeVisible();
  });

  test('mesh edit shows empty state without selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mesh-edit-empty')).toContainText('Select a mesh node');
  });

  test('mesh edit shows target when node selected', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.mesh-edit-target')).toContainText('Cube');
  });

  test('UV unwrap mode selector has four modes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const select = page.locator('.mesh-edit-panel select');
    const options = select.locator('option');
    await expect(options).toHaveCount(4);
  });

  test('unwrap UVs button works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.mesh-op-btn:has-text("Unwrap UVs")').click();
    await expect(page.locator('.console-message').last()).toContainText('Applied UV');
  });

  test('subdivide button works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.mesh-op-btn:has-text("Subdivide")').click();
    await expect(page.locator('.console-message').last()).toContainText('Applied subdivide');
  });

  test('extrude controls are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-sublabel:has-text("Extrude Distance")')).toBeVisible();
    await expect(page.locator('.mesh-op-btn:has-text("Extrude Faces")')).toBeVisible();
  });

  test('bevel controls are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-sublabel:has-text("Bevel Amount")')).toBeVisible();
    await expect(page.locator('.mesh-op-btn:has-text("Bevel Edges")')).toBeVisible();
  });

  test('edit mode buttons exist', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.edit-mode-btn:has-text("Vertex")')).toBeVisible();
    await expect(page.locator('.edit-mode-btn:has-text("Edge")')).toBeVisible();
    await expect(page.locator('.edit-mode-btn:has-text("Face")')).toBeVisible();
  });

  test('vertex edit mode active by default', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const vertexBtn = page.locator('.edit-mode-btn:has-text("Vertex")');
    await expect(vertexBtn).toHaveClass(/active/);
  });
});
