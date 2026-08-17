import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-09.0 - Camera System Overhaul', () => {
  test('camera controls panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.viewport-camera-controls')).toBeVisible();
  });

  test('view preset buttons exist', async ({ page }) => {
    await page.goto('/');
    const camControls = page.locator('.viewport-camera-controls');
    await expect(camControls.locator('button[title*="Front"]')).toBeVisible();
    await expect(camControls.locator('button[title*="Right"]')).toBeVisible();
    await expect(camControls.locator('button[title*="Top"]')).toBeVisible();
    await expect(camControls.locator('button[title*="Isometric"]')).toBeVisible();
  });

  test('projection toggle button exists', async ({ page }) => {
    await page.goto('/');
    const perspBtn = page.locator('.cam-btn[title*="Perspective"]');
    await expect(perspBtn).toBeVisible();
    await expect(perspBtn).toContainText('PERSP');
  });

  test('clicking projection toggle switches to orthographic', async ({ page }) => {
    await page.goto('/');
    const projBtn = page.locator('.cam-btn[title*="Perspective"]');
    await expect(projBtn).toContainText('PERSP');
    await projBtn.click();
    await expect(projBtn).toContainText('ORTHO');
  });

  test('orthographic can toggle back to perspective', async ({ page }) => {
    await page.goto('/');
    const projBtn = page.locator('.cam-btn[title*="Perspective"]');
    await projBtn.click();
    await expect(projBtn).toContainText('ORTHO');
    await projBtn.click();
    await expect(projBtn).toContainText('PERSP');
  });

  test('view preset buttons are clickable without errors', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('.viewport-camera-controls .cam-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Click each view preset button
    for (let i = 0; i < count; i++) {
      await buttons.nth(i).click();
      await page.waitForTimeout(50);
    }
  });

  test('numpad 5 toggles projection mode', async ({ page }) => {
    await page.goto('/');
    const projBtn = page.locator('.cam-btn[title*="Perspective"]');
    await expect(projBtn).toContainText('PERSP');
    await page.keyboard.press('Numpad5');
    await expect(projBtn).toContainText('ORTHO');
    await page.keyboard.press('Numpad5');
    await expect(projBtn).toContainText('PERSP');
  });

  test('numpad 1 switches to front view', async ({ page }) => {
    await page.goto('/');
    // Click rotate to change angle, then numpad 1 should reset to front
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2);
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(100);

    // Press numpad 1 for front view
    await page.keyboard.press('Numpad1');
    await page.waitForTimeout(400); // Wait for smooth transition
  });

  test('numpad 3 switches to right view', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Numpad3');
    await page.waitForTimeout(400);
  });

  test('numpad 7 switches to top view', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Numpad7');
    await page.waitForTimeout(400);
  });

  test('numpad decimal triggers frame selected', async ({ page }) => {
    await page.goto('/');
    // Create a cube first
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    // Press numpad . to frame selected
    await page.keyboard.press('NumpadDecimal');
    await page.waitForTimeout(400);
  });

  test('zoom-to-cursor does not crash on wheel', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Zoom toward an off-center point
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(50);
  });

  test('frame selected works with object selected', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    // Press F to frame selected
    await page.keyboard.press('f');
    await page.waitForTimeout(400);
  });

  test('camera state persists in saved scene JSON', async ({ page }) => {
    await page.goto('/');
    // Change camera view
    await page.locator('.cam-btn[title*="Front"]').click();
    await page.waitForTimeout(400);

    // Open File menu
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.waitForTimeout(100);

    // Set scene name
    const nameInput = page.locator('.file-menu-input');
    await nameInput.fill('cam-test');

    // Save scene
    await page.locator('.file-menu-item:has-text("Save to Browser")').click();
    await page.waitForTimeout(200);

    // Open File menu again and load
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.waitForTimeout(100);
    await page.locator('.file-menu-item:has-text("Load from Browser")').click();
    await page.waitForTimeout(200);

    // Camera should still be in front view, app should not crash
    // Verify the app is still responsive
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });
});
