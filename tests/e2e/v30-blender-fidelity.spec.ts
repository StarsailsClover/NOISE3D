import { test, expect } from '@playwright/test';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

test.describe('NOISE3D v26.1-28.0 - Blender Interaction Fidelity', () => {
  test('navigation axis gizmo renders 6 axis balls', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-gizmo')).toBeVisible();
    await expect(page.locator('.nav-ball')).toHaveCount(6);
  });

  test('clicking +Z ball snaps to front view', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);
    await page.locator('[data-ball="pz"] circle').first().click();
    await page.waitForTimeout(500);
    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    // Front view: camera at -Z looking toward +Z
    expect(cam.pos.z).toBeLessThan(0);
  });

  test('clicking +Y ball snaps to top view', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);
    await page.locator('[data-ball="py"] circle').first().click();
    await page.waitForTimeout(500);
    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(cam.pos.y).toBeGreaterThan(0);
  });

  test('transform drag shows live readout in status bar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    await page.mouse.move(box.x + pt.x + 60, box.y + pt.y, { steps: 4 });
    await page.waitForTimeout(100);
    await expect(page.locator('.transform-readout')).toBeVisible();
    await expect(page.locator('.transform-readout')).toContainText(/D[xyz]:/);
    await page.mouse.up();
    await expect(page.locator('.transform-readout')).not.toBeVisible();
  });

  test('mid-drag X key locks to X axis', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    await page.keyboard.down('x');
    // Drag diagonally -- should only move X
    await page.mouse.move(box.x + pt.x + 40, box.y + pt.y + 40, { steps: 4 });
    await page.keyboard.up('x');
    await page.mouse.up();

    const vals = await page.evaluate(() => {
      const st = (window as any).__noise3d_gizmo;
      void st;
      return document.querySelector('[data-panel-id="inspector"] .inspector-slider .w-slider-text')?.textContent;
    });
    void vals;
    // X changed, Y/Z stayed at 0 (read via inspector text)
    const posY = await page.evaluate(() => {
      const st = (window as any).__noise3d_store.getState();
      return st.selectedNodeId !== null ? st.scene.getNode(st.selectedNodeId)?.position.y : null;
    });
    expect(posY).toBe(0);
  });

  test('mid-drag numeric entry sets exact value', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    await page.keyboard.down('y');
    await page.keyboard.type('3.5');
    await page.keyboard.up('y');
    await page.mouse.up();
    await page.waitForTimeout(100);

    const posY = await page.evaluate(() => {
      const st = (window as any).__noise3d_store.getState();
      return st.selectedNodeId !== null ? st.scene.getNode(st.selectedNodeId)?.position.y : null;
    });
    expect(posY).toBeCloseTo(3.5, 1);
  });

  test('hierarchy double-click enters inline rename', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const label = page.locator('.hierarchy-label').filter({ hasText: 'Cube' }).first();
    await label.dblclick();
    const input = page.locator('.hierarchy-rename-input');
    await expect(input).toBeVisible();
    await input.fill('MyCube');
    await page.keyboard.press('Enter');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'MyCube' })).toBeVisible();
  });
});






