import { test, expect } from '@playwright/test';

async function setSliderValue(page: import('@playwright/test').Page, row: import('@playwright/test').Locator, frac: number) {
  const box = await row.boundingBox();
  if (!box) throw new Error('no slider box');
  const x = box.x + Math.max(2, Math.min(box.width - 2, box.width * frac));
  await page.mouse.click(x, box.y + box.height / 2);
}
test.describe('NOISE3D v3 - Material System', () => {
  test('material presets are visible when node selected', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.material-presets')).toBeVisible();
  });

  test('material preset buttons exist', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.material-preset-btn:has-text("Default")')).toBeVisible();
    await expect(page.locator('.material-preset-btn:has-text("Metal")')).toBeVisible();
    await expect(page.locator('.material-preset-btn:has-text("Plastic")')).toBeVisible();
    await expect(page.locator('.material-preset-btn:has-text("Emissive")')).toBeVisible();
    await expect(page.locator('.material-preset-btn:has-text("Glass-like")')).toBeVisible();
  });

  test('metallic slider is visible and has default value', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-slider').first()).toBeVisible();
    await expect(page.locator('.inspector-slider .w-slider-text').first()).toHaveText('0.00');
  });

  test('roughness slider is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const sliders = page.locator('.inspector-slider');
    await expect(sliders.nth(1)).toBeVisible();
  });

  test('metallic slider value updates', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    // Click near the right end of the track (metallic range 0..1)
    const track = page.locator('.inspector-slider').first();
    const box = await track.boundingBox();
    if (!box) throw new Error('no slider box');
    await track.click({ position: { x: box.width - 2, y: box.height / 2 } });
    await expect(page.locator('.inspector-slider .w-slider-text').first()).toHaveText('1.00');
  });

  test('base color picker is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const colorPickers = page.locator('.inspector-color');
    await expect(colorPickers.first()).toBeVisible();
  });

  test('emissive color section is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-label:has-text("Emission")')).toBeVisible();
  });

  test('emissive intensity slider works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const emissiveSliders = page.locator('.inspector-slider');
    const intensitySlider = emissiveSliders.nth(2);
    const ib = await intensitySlider.boundingBox();
    if (!ib) throw new Error('no slider box');
    await intensitySlider.click({ position: { x: ib.width * 0.5, y: ib.height / 2 } });
    await expect(page.locator('.inspector-slider .w-slider-text').nth(2)).toHaveText('2.5');
  });

  test('texture UV tiling inputs are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-label:has-text("Texture UV")')).toBeVisible();
  });

  test('double sided checkbox is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.w-toggle').first()).toBeVisible();
  });

  test('double sided checkbox toggles', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const toggle = page.locator('.w-toggle').first();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('applying Metal preset sets metallic to 1', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.material-preset-btn:has-text("Metal")').click();
    await expect(page.locator('.inspector-slider .w-slider-text').first()).toHaveText('1.00');
  });

  test('material persists when switching nodes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.material-preset-btn:has-text("Emissive")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).click();
    await expect(page.locator('.inspector-slider .w-slider-text').first()).toHaveText('0.00');
  });
});




