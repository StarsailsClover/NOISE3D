import { test, expect } from '@playwright/test';

/**
 * v26.1-20.0 - Gizmo Interaction Polish
 *
 * Uses window.__noise3d_gizmo debug hooks for deterministic picking:
 * project(x,y,z) returns css-px viewport coords of a world point.
 */

async function selectCube(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('.viewport-toolbar button:has-text("Cube")').click();
  // Cube spawns at origin; ensure selected
  await expect(page.locator('[data-panel-id="inspector"] .inspector-input')).toHaveValue('Cube');
}

test.describe('NOISE3D v26.1-20.0 - Gizmo Polish', () => {
  test('debug hooks exposed after selection', async ({ page }) => {
    await selectCube(page);
    const has = await page.evaluate(() => typeof (window as any).__noise3d_gizmo?.project === 'function');
    expect(has).toBe(true);
  });

  test('hovering X axis arm sets hover state and grab cursor', async ({ page }) => {
    await selectCube(page);
    // Project a point 60% along +X world arm (worldScale ~ computed; use origin+0.5)
    const pt = await page.evaluate(() => {
      const p = (window as any).__noise3d_gizmo.project(0.55, 0, 0);
      return p ? { x: p.x, y: p.y } : null;
    });
    expect(pt).not.toBeNull();
    if (!pt) return;

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.waitForTimeout(80);

    const st = await page.evaluate(() => (window as any).__noise3d_gizmo.state());
    expect(st.hover).not.toBeNull();
    expect(['axis', 'plane', 'ring']).toContain(st.hover.kind);
    const cursor = await canvas.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('grab');
  });

  test('dragging X arm translates cube on X only (one undo step)', async ({ page }) => {
    await selectCube(page);
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    const startX = await page.locator('[data-panel-id="inspector"] .inspector-number').first().inputValue();

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    // Wiggle several times to prove no extra undo snapshots mid-gesture
    for (const d of [10, -6, 14, 22]) {
      await page.mouse.move(box.x + pt.x + d, box.y + pt.y);
      await page.waitForTimeout(30);
    }
    const cursorDuring = await canvas.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursorDuring).toBe('grabbing');
    await page.mouse.up();

    const endX = await page.locator('[data-panel-id="inspector"] .inspector-number').first().inputValue();
    expect(parseFloat(endX)).not.toBeCloseTo(parseFloat(startX), 2);

    // Exactly one undo restores original position
    await page.keyboard.press('Control+z');
    const undoneX = await page.locator('[data-panel-id="inspector"] .inspector-number').first().inputValue();
    expect(parseFloat(undoneX)).toBeCloseTo(parseFloat(startX), 1);
  });

  test('Ctrl-snap quantizes translate to 0.5 grid', async ({ page }) => {
    await selectCube(page);
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.keyboard.down('Control');
    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    await page.mouse.move(box.x + pt.x + 37, box.y + pt.y);
    await page.mouse.up();
    await page.keyboard.up('Control');

    const xStr = await page.locator('[data-panel-id="inspector"] .inspector-number').first().inputValue();
    const x = parseFloat(xStr);
    const remainder = Math.abs(x / 0.5 - Math.round(x / 0.5));
    expect(remainder).toBeLessThan(0.001);
  });

  test('plane handle hover detected between axes', async ({ page }) => {
    await selectCube(page);
    // Point inside XY plane quad
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.18, 0.18, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.waitForTimeout(60);
    const st = await page.evaluate(() => (window as any).__noise3d_gizmo.state());
    expect(st.hover).not.toBeNull();
  });

  test('rotate mode: ring drag with Ctrl snaps to 15 degrees', async ({ page }) => {
    await selectCube(page);
    await page.locator('.gizmo-btn:has-text("Rotate")').click();

    const center = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0, 0, 0));
    if (!center) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    // Start on outer ring (~1.28x arm) or inner rings; arms target ~45 css px
    let started = false;
    for (const rpx of [58, 45, 52, 40, 35, 65]) {
      const sx = box.x + center.x + rpx;
      const sy = box.y + center.y;
      await page.mouse.move(sx, sy);
      await page.waitForTimeout(40);
      const st = await page.evaluate(() => (window as any).__noise3d_gizmo.state());
      if (st.hover && st.hover.kind === 'ring') {
        await page.keyboard.down('Control');
        await page.mouse.down();
        await page.mouse.move(box.x + center.x - rpx, box.y + center.y, { steps: 8 });
        await page.mouse.up();
        await page.keyboard.up('Control');
        started = true;
        break;
      }
    }
    expect(started).toBe(true);

    const rotX = parseFloat(
      await page.locator('[data-panel-id="inspector"] .inspector-number').nth(3).inputValue(),
    );
    const degMod = Math.abs((rotX % 15 + 15) % 15);
    expect(degMod < 0.01 || Math.abs(degMod - 15) < 0.01).toBe(true);
  });

  test('scale mode drag changes scale', async ({ page }) => {
    await selectCube(page);
    await page.locator('.gizmo-btn:has-text("Scale")').click();
    const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    await page.mouse.move(box.x + pt.x, box.y + pt.y);
    await page.mouse.down();
    await page.mouse.move(box.x + pt.x + 50, box.y + pt.y);
    await page.mouse.up();

    const sx = parseFloat(
      await page.locator('[data-panel-id="inspector"] .inspector-number').nth(6).inputValue(),
    );
    expect(sx).toBeGreaterThan(1.05);
  });
});
