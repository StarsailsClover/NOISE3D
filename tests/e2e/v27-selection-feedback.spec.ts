import { test, expect } from '@playwright/test';

async function project(page: import('@playwright/test').Page, x: number, y: number, z: number) {
  return page.evaluate(([wx, wy, wz]: [number, number, number]) => {
    return (window as any).__noise3d_gizmo.project(wx, wy, wz);
  }, [x, y, z]);
}

test.describe('NOISE3D v26.1-24.0 - Selection & Hover Feedback', () => {
  test('hovering an object raises hover state; empty space clears it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await project(page, 0.75, 0.7, 0.75);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.waitForTimeout(80);
    let hover = await page.evaluate(() => (window as any).__noise3d_gizmo.state().hoverObj);
    expect(hover).not.toBeNull();

    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await page.waitForTimeout(80);
    hover = await page.evaluate(() => (window as any).__noise3d_gizmo.state().hoverObj);
    expect(hover).toBeNull();
  });

  test('hover is throttled but settles within ~100ms', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await project(page, 0.75, 0.7, 0.75);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    const t0 = Date.now();
    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.waitForTimeout(120);
    const hover = await page.evaluate(() => (window as any).__noise3d_gizmo.state().hoverObj);
    expect(hover).not.toBeNull();
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  test('shift-click multi-selects; sel hook reports both ids', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    // Sphere selected; shift-click cube at origin adds it
    const pt = await project(page, 0.75, 0.7, 0.75);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.keyboard.down('Shift');
    await page.mouse.click(box.x + pt.x, box.y + pt.y);
    await page.keyboard.up('Shift');

    const sel = await page.evaluate(() => (window as any).__noise3d_gizmo.sel());
    expect(sel.ids.length).toBe(2);
    expect(sel.ids).toContain(sel.primary);
  });

  test('selecting via hierarchy flashes the item', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    // Select Cube in hierarchy -> flash class on its row
    await page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first().click();
    await expect(page.locator('[data-node-id]').filter({ hasText: 'Cube' }).first()).toHaveClass(
      /hierarchy-flash/,
      { timeout: 300 },
    );
  });

  test('hierarchy selection pings ground marker', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.locator('.hierarchy-item').filter({ hasText: 'Sphere' }).first().click();
    const sel = await page.evaluate(() => (window as any).__noise3d_gizmo.sel());
    expect(sel.marker).not.toBeNull();
    expect(sel.marker.id).toBe(sel.primary);
    expect(Date.now() - sel.marker.ts).toBeLessThan(1500);
  });

  test('double-click empty space frames all', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const posY = page.locator('[data-panel-id="inspector"] .inspector-number').nth(1);
    await posY.click();
    await page.waitForSelector('.numfield-editing');
    await page.keyboard.type('6');
    await page.keyboard.press('Enter');

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.dblclick(box.x + box.width - 20, box.y + box.height / 2);
    await page.waitForTimeout(700);

    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(Math.abs(cam.target.y - 6)).toBeLessThan(1.5);
  });
});

