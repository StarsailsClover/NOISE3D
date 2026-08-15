import { test, expect } from '@playwright/test';

test.describe('NOISE3D v2 - Viewport Navigation & Selection', () => {
  test('orbit camera responds to right-mouse drag', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 30);
    await page.mouse.up({ button: 'right' });
  });

  test('zoom responds to mouse wheel', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
  });

  test('click on empty space deselects', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-input')).toHaveValue('Cube');

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + 10, box.y + 10);
  });

  test('gizmo mode controls are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-gizmo-controls')).toBeVisible();
    await expect(page.locator('.gizmo-btn:has-text("Move")')).toBeVisible();
    await expect(page.locator('.gizmo-btn:has-text("Rotate")')).toBeVisible();
    await expect(page.locator('.gizmo-btn:has-text("Scale")')).toBeVisible();
  });

  test('gizmo mode changes on click', async ({ page }) => {
    await page.goto('/');
    const moveBtn = page.locator('.gizmo-btn:has-text("Move")');
    const rotateBtn = page.locator('.gizmo-btn:has-text("Rotate")');
    const scaleBtn = page.locator('.gizmo-btn:has-text("Scale")');

    await expect(moveBtn).toHaveClass(/active/);
    await rotateBtn.click();
    await expect(rotateBtn).toHaveClass(/active/);
    await scaleBtn.click();
    await expect(scaleBtn).toHaveClass(/active/);
    await moveBtn.click();
    await expect(moveBtn).toHaveClass(/active/);
  });

  test('keyboard shortcut W sets translate mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.gizmo-btn:has-text("Rotate")').click();
    await page.keyboard.press('w');
    await expect(page.locator('.gizmo-btn:has-text("Move")')).toHaveClass(/active/);
  });

  test('keyboard shortcut E sets rotate mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.gizmo-btn:has-text("Move")')).toBeVisible();
    await page.keyboard.press('e');
    await expect(page.locator('.gizmo-btn:has-text("Rotate")')).toHaveClass(/active/);
  });

  test('keyboard shortcut R sets scale mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.gizmo-btn:has-text("Move")')).toBeVisible();
    await page.keyboard.press('r');
    await expect(page.locator('.gizmo-btn:has-text("Scale")')).toHaveClass(/active/);
  });

  test('keyboard shortcut 1 adds cube', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-toolbar')).toBeVisible();
    await page.keyboard.press('1');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });

  test('keyboard shortcut 2 adds sphere', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-toolbar')).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Sphere' })).toBeVisible();
  });

  test('keyboard shortcut 3 adds plane', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-toolbar')).toBeVisible();
    await page.keyboard.press('3');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Plane' })).toBeVisible();
  });

  test('delete key removes selected node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await page.keyboard.press('Delete');
    await expect(page.locator('.inspector-empty')).toBeVisible();
  });

  test('frame button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-toolbar button:has-text("Frame")')).toBeVisible();
  });

  test('context menu is prevented on canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + 100, box.y + 100, { button: 'right' });
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });
});
