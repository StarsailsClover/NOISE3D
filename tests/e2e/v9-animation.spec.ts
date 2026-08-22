import { test, expect } from '@playwright/test';

test.describe('NOISE3D v9 - Animation, Particles, 2D Mode', () => {
  test('timeline panel is visible', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.timeline-panel')).toBeVisible();
  });

  test('timeline shows empty state', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.timeline-empty')).toContainText('No animation clips');
  });

  test('add clip button creates clip', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.clip-btn')).toBeVisible();
  });

  test('timeline play button exists', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.timeline-panel .panel-btn:has-text("Play")')).toBeVisible();
  });

  test('timeline slider is visible after clip created', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.timeline-slider')).toBeVisible();
  });

  test('keyframe buttons appear when node selected', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.keyframe-btn:has-text("+ Pos")')).toBeVisible();
    await expect(page.locator('.keyframe-btn:has-text("+ Rot")')).toBeVisible();
    await expect(page.locator('.keyframe-btn:has-text("+ Scl")')).toBeVisible();
  });

  test('adding keyframe logs to console', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.keyframe-btn:has-text("+ Pos")').click();
    await expect(page.locator('.console-message').last()).toContainText('Keyframe');
  });

  test('keyframe track appears after adding', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.keyframe-btn:has-text("+ Pos")').click();
    await expect(page.locator('.timeline-track-item')).toBeVisible();
  });

  test('particle panel is visible', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.particle-panel')).toBeVisible();
  });

  test('particle panel shows empty state', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.particle-empty')).toContainText('No particle systems');
  });

  test('add particle system', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.particle-panel .panel-btn:has-text("+")').click();
    await expect(page.locator('.particle-item')).toBeVisible();
  });

  test('particle system has emission rate slider', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.particle-panel .panel-btn:has-text("+")').click();
    await expect(page.locator('.inspector-sublabel:has-text("Emission Rate")')).toBeVisible();
  });

  test('particle system has lifetime slider', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.particle-panel .panel-btn:has-text("+")').click();
    await expect(page.locator('.inspector-sublabel:has-text("Lifetime")')).toBeVisible();
  });

  test('particle system can be removed', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.particle-panel .panel-btn:has-text("+")').click();
    await expect(page.locator('.particle-item')).toBeVisible();
    await page.locator('.particle-delete').click();
    await expect(page.locator('.particle-empty')).toBeVisible();
  });

  test('2D/3D mode toggle button exists', async ({ page }) => {
    await page.goto('/?ws=animation');
    const modeBtn = page.locator('.toolbar-btn:has-text("3D")');
    await expect(modeBtn).toBeVisible();
  });

  test('2D/3D mode toggles', async ({ page }) => {
    await page.goto('/?ws=animation');
    const modeBtn = page.locator('.toolbar-btn:has-text("3D")');
    await expect(modeBtn).toContainText('3D');
    await modeBtn.click();
    await expect(page.locator('.toolbar-btn:has-text("2D")')).toBeVisible();
    await page.locator('.toolbar-btn:has-text("2D")').click();
    await expect(page.locator('.toolbar-btn:has-text("3D")')).toBeVisible();
  });

  test('timeline time display updates on slider change', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    const slider = page.locator('.timeline-slider');
    await slider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '2.5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.timeline-time')).toContainText('2.50');
  });

  test('multiple clips can be created', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.timeline-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.clip-btn')).toHaveCount(2);
  });
});

