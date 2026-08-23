import { test, expect } from '@playwright/test';

/**
 * v26.1-20.1 - Camera & Selection Hotfix
 * 1. Object selection wins over gizmo plane handles
 * 2. Flythrough camera (RMB + WASD/QE, Shift fast, wheel speed)
 * 3. Home/ISO actually frame scene content
 */

async function project(page: import('@playwright/test').Page, x: number, y: number, z: number) {
  return page.evaluate(([wx, wy, wz]: [number, number, number]) => {
    return (window as any).__noise3d_gizmo.project(wx, wy, wz);
  }, [x, y, z]);
}

test.describe('NOISE3D v26.1-20.1 - Camera & Selection Fixes', () => {
  test('clicking second object selects it while first has active gizmo', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    // Move sphere to x=3
    const posX = page.locator('[data-panel-id="inspector"] .inspector-number').first();
    await posX.fill('3');
    await posX.press('Tab');
    await page.waitForTimeout(100);

    // Gizmo now sits on sphere at (3,0,0). Click the CUBE body at origin.
    const pt = await project(page, 0, 0, 0.9);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + pt.x, box.y + pt.y);
    await page.waitForTimeout(80);

    const name = await page.locator('[data-panel-id="inspector"] .inspector-input').inputValue();
    expect(name).toBe('Cube');
  });

  test('clicking empty space deselects even with active gizmo', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('[data-panel-id="inspector"] .inspector-input')).toHaveValue('Cube');

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + box.width - 20, box.y + box.height / 2);
    await page.waitForTimeout(80);

    await expect(page.locator('.inspector-empty')).toBeVisible();
  });

  test('flythrough: RMB look + WASD movement', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();

    const cam0 = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(cam0.flying).toBe(false);

    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    // Enter fly mode
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.waitForTimeout(60);
    let cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(cam.flying).toBe(true);

    // Look up-right a bit
    await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2 - 40, { steps: 5 });

    // Fly forward for ~0.7s
    const before = await page.evaluate(() => (window as any).__noise3d_cam.pos);
    await page.keyboard.down('w');
    await page.waitForTimeout(700);
    await page.keyboard.up('w');
    const after = await page.evaluate(() => (window as any).__noise3d_cam.pos);

    const d = Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
    expect(d).toBeGreaterThan(1);

    // Exit fly
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(50);
    cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(cam.flying).toBe(false);
  });

  test('Home key frames all content (target moves to bbox center)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const posY = page.locator('[data-panel-id="inspector"] .inspector-number').nth(1);
    await posY.fill('6');
    await posY.press('Tab');
    // Blur so global shortcuts receive the Home key
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(80);
    await page.keyboard.press('Home');
    await page.waitForTimeout(700); // transition 0.35s

    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(Math.abs(cam.target.y - 6)).toBeLessThan(1.5);
    expect(cam.dist).toBeGreaterThan(3);
  });

  test('ISO button reframes content too', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const posY = page.locator('[data-panel-id="inspector"] .inspector-number').nth(1);
    await posY.fill('-5');
    await posY.press('Tab');

    await page.locator('.cam-btn:has-text("PERSP")').waitFor();
    await page.locator('.cam-btn[title="Isometric - frames all content"]').click();
    await page.waitForTimeout(700);

    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(Math.abs(cam.target.y - (-5))).toBeLessThan(1.5);
  });

  test('camera debug hook exposed', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const cam = await page.evaluate(() => (window as any).__noise3d_cam);
    expect(cam).not.toBeNull();
    expect(typeof cam.dist).toBe('number');
  });
});

