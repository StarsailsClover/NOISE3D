import { test, expect } from '@playwright/test';

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
    const metallicSlider = page.locator('.inspector-slider-row').first().locator('input');
    await expect(metallicSlider).toHaveValue('0');
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
    const metallicSlider = page.locator('.inspector-slider-row').first().locator('input');
    await metallicSlider.evaluate((el: HTMLInputElement) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value'
      )?.set;
      nativeInputValueSetter?.call(el, '1');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.inspector-slider-value').first()).toContainText('1.0');
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
    await intensitySlider.evaluate((el: HTMLInputElement) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value'
      )?.set;
      nativeInputValueSetter?.call(el, '2.5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.inspector-slider-value').nth(2)).toContainText('2.5');
  });

  test('texture UV tiling inputs are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-label:has-text("Texture UV")')).toBeVisible();
  });

  test('double sided checkbox is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await expect(page.locator('.inspector-checkbox-row')).toBeVisible();
  });

  test('double sided checkbox toggles', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const checkbox = page.locator('.inspector-checkbox-row input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();
  });

  test('applying Metal preset sets metallic to 1', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.material-preset-btn:has-text("Metal")').click();
    const metallicSlider = page.locator('.inspector-slider-row').first().locator('input');
    await expect(metallicSlider).toHaveValue('1');
  });

  test('material persists when switching nodes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.material-preset-btn:has-text("Emissive")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).click();
    const metallicSlider = page.locator('.inspector-slider-row').first().locator('input');
    await expect(metallicSlider).toHaveValue('0');
  });
});
