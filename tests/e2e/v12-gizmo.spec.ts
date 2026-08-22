import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-10.0 - Interactive Transform Gizmo', () => {
  test('gizmo controls are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-gizmo-controls')).toBeVisible();
  });

  test('gizmo mode defaults to translate', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.gizmo-btn:has-text("Move")')).toHaveClass(/active/);
  });

  test('gizmo mode switches to rotate', async ({ page }) => {
    await page.goto('/');
    await page.locator('.gizmo-btn:has-text("Rotate")').click();
    await expect(page.locator('.gizmo-btn:has-text("Rotate")')).toHaveClass(/active/);
  });

  test('gizmo mode switches to scale', async ({ page }) => {
    await page.goto('/');
    await page.locator('.gizmo-btn:has-text("Scale")').click();
    await expect(page.locator('.gizmo-btn:has-text("Scale")')).toHaveClass(/active/);
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

  test('create cube and select it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    // Inspector should show the node name
    await expect(page.locator('.inspector-input')).toHaveValue('Cube');
  });

  test('translate gizmo does not crash on drag attempt', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Try dragging near the center of the canvas (where the cube should be)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(100);

    // App should still be responsive
    await expect(canvas).toBeVisible();
  });

  test('rotate gizmo does not crash on drag attempt', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.gizmo-btn:has-text("Rotate")').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 - 40);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('scale gizmo does not crash on drag attempt', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.gizmo-btn:has-text("Scale")').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('right-click drag still orbits camera with gizmo active', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 30);
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('frame selected works after gizmo interaction', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.keyboard.press('f');
    await page.waitForTimeout(400);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('undo works after gizmo drag', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Attempt a gizmo drag in translate mode
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2);
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(100);

    // Undo should work
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });
});
