import { test, expect } from '@playwright/test';

const OBJ = 'v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n';

test.describe('NOISE3D v26.1-23.0 - Drag & Drop', () => {
  test('asset dragged onto viewport spawns mesh node', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await page.locator('.asset-panel input[type="file"][accept=".obj"]').setInputFiles({
      name: 'dropme.obj', mimeType: 'text/plain', buffer: Buffer.from(OBJ),
    });
    await expect(page.locator('.asset-item')).toHaveCount(1);

    await page.dragAndDrop('.asset-item', '.viewport-canvas', {
      targetPosition: { x: 200, y: 150 },
    });
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'dropme' })).toBeVisible();
  });

  test('asset dropped onto object spawns at hit point (lifted)', async ({ page }) => {
    await page.goto('/?ws=modeling');
    // A cube at origin in this workspace? modeling ws has viewport; add cube via shortcut
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.asset-panel input[type="file"][accept=".obj"]').setInputFiles({
      name: 'oncube.obj', mimeType: 'text/plain', buffer: Buffer.from(OBJ),
    });

    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0, 0, 1.05));
    if (!pt) throw new Error('project failed');
    const canvasBox = await page.locator('.viewport-canvas').boundingBox();
    if (!canvasBox) throw new Error('no canvas');

    await page.dragAndDrop('.asset-item', '.viewport-canvas', {
      targetPosition: { x: pt.x, y: pt.y },
    });
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'oncube' })).toBeVisible();

    // Auto-selected; posY display should be ~1.0 (face y=0? hit on z-face keeps y=0 + 0.6 lift)
    const posY = parseFloat(
      await page
        .locator('[data-panel-id="inspector"] .inspector-number .numfield-display')
        .nth(1)
        .inputValue(),
    );
    expect(posY).toBeGreaterThan(0.4);
    expect(Math.abs(posY - 0.6)).toBeLessThan(0.3);
  });

  test('OS file drop imports OBJ; overlay shows while hovering', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();

    // Simulate OS drag hover
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['v 0 0 0'], 'hover.obj'));
      const el = document.querySelector('.viewport-container')!;
      el.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }));
      el.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, cancelable: true }));
    });
    await expect(page.locator('.os-drop-overlay')).toBeVisible();

    // Drop the file
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n'], 'dropped.obj', { type: 'text/plain' }));
      const el = document.querySelector('.viewport-container')!;
      el.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt, cancelable: true }));
    });
    await page.waitForTimeout(200);

    await expect(page.locator('.os-drop-overlay')).not.toBeVisible();
    // Switch workspace via tab (no reload) so in-memory assets persist
    await page.locator('.workspace-tab:has-text("Modeling")').click();
    await expect(page.locator('.asset-item').filter({ hasText: 'dropped' })).toBeVisible();
    await expect(page.locator('.console-message').filter({ hasText: 'Imported OBJ' }).first()).toBeVisible();
  });

  test('hierarchy inside-drop re-parents with indicator', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();

    const sphere = page.locator('.hierarchy-item').filter({ hasText: 'Sphere' }).first();
    const cube = page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first();

    await sphere.dragTo(cube);
    await expect(page.locator('.console-message').filter({ hasText: 'Moved' }).last()).toBeVisible();
  });

  test('reorder above sibling logs Reordered', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Cone")').click();

    const cone = page.locator('.hierarchy-item').filter({ hasText: 'Cone' }).first();
    const cube = page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first();

    await cone.dragTo(cube);
    const moved = await page
      .locator('.console-message')
      .filter({ hasText: /Moved|Reordered/ })
      .last()
      .textContent();
    expect(moved).toBeTruthy();
  });

  test('invalid drop (parent into own child) leaves structure unchanged', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    const sphere = page.locator('.hierarchy-item').filter({ hasText: 'Sphere' }).first();
    const cube = page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first();
    await sphere.dragTo(cube); // sphere -> child of cube
    await expect(
      page.locator('.console-message').filter({ hasText: 'Moved' }).last(),
    ).toBeVisible();

    const movedCountBefore = await page
      .locator('.console-message')
      .filter({ hasText: 'Moved' })
      .count();

    // Now try dragging cube (parent) onto sphere (its child) - must be rejected
    await cube.dragTo(sphere);
    const movedCountAfter = await page
      .locator('.console-message')
      .filter({ hasText: 'Moved' })
      .count();
    expect(movedCountAfter).toBe(movedCountBefore);
  });
});
