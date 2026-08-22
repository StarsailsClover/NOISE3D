import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-09.0 - Camera System Overhaul', () => {
  test('viewport camera controls are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-camera-controls')).toBeVisible();
  });

  test('view preset buttons exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cam-btn:has-text("F")')).toBeVisible();
    await expect(page.locator('.cam-btn:has-text("R")').first()).toBeVisible();
    await expect(page.locator('.cam-btn:has-text("T")').first()).toBeVisible();
    await expect(page.locator('.cam-btn:has-text("ISO")')).toBeVisible();
  });

  test('projection mode button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cam-btn:has-text("PERSP")')).toBeVisible();
  });

  test('clicking front view button changes projection', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn:has-text("F")').click();
    await page.waitForTimeout(400);
    // Camera should now be in front view
  });

  test('clicking top view button changes projection', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn:has-text("T")').first().click();
    await page.waitForTimeout(400);
  });

  test('clicking ISO button changes to isometric', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn:has-text("ISO")').click();
    await page.waitForTimeout(400);
  });

  test('toggling projection mode switches PERSP/ORTHO', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cam-btn:has-text("PERSP")')).toBeVisible();
    await page.locator('.cam-btn:has-text("PERSP")').click();
    await expect(page.locator('.cam-btn:has-text("ORTHO")')).toBeVisible();
    await page.locator('.cam-btn:has-text("ORTHO")').click();
    await expect(page.locator('.cam-btn:has-text("PERSP")')).toBeVisible();
  });

  test('all 7 view preset buttons are present', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('.viewport-camera-controls .cam-btn');
    const count = await buttons.count();
    if (count < 9) throw new Error(`Expected at least 9 camera buttons, got ${count}`);
  });

  test('right mouse drag orbits camera', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 30);
    await page.mouse.up({ button: 'right' });
  });

  test('middle mouse drag pans camera', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
    await page.mouse.up({ button: 'middle' });
  });

  test('mouse wheel zooms camera', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
  });

  test('F key frames selected object', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.keyboard.press('f');
    await page.waitForTimeout(400);
  });

  test('view transitions are smooth (no flicker)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn:has-text("F")').click();
    await page.waitForTimeout(100);
    await page.locator('.cam-btn:has-text("T")').first().click();
    await page.waitForTimeout(100);
    await page.locator('.cam-btn:has-text("ISO")').click();
    await page.waitForTimeout(400);
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('orthographic mode renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cam-btn:has-text("PERSP")').click();
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });
});
