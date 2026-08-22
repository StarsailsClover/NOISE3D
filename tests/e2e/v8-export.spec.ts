import { test, expect } from '@playwright/test';

test.describe('NOISE3D v8 - Export & Post-Processing', () => {
  test('render settings panel is visible', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.render-settings-panel')).toBeVisible();
  });

  test('exposure slider is visible', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.render-settings-panel .inspector-label:has-text("Exposure")')).toBeVisible();
  });

  test('bloom threshold slider is visible', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.render-settings-panel .inspector-sublabel:has-text("Bloom Threshold")')).toBeVisible();
  });

  test('bloom intensity slider is visible', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.render-settings-panel .inspector-sublabel:has-text("Bloom Intensity")')).toBeVisible();
  });

  test('exposure slider has default value', async ({ page }) => {
    await page.goto('/?ws=rendering');
    const slider = page.locator('.render-settings-panel .inspector-slider').first();
    await expect(slider).toHaveValue('1');
  });

  test('exposure slider updates value', async ({ page }) => {
    await page.goto('/?ws=rendering');
    const slider = page.locator('.render-settings-panel .inspector-slider').first();
    await slider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '2');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.render-settings-panel .inspector-slider-value').first()).toContainText('2');
  });

  test('file menu has export OBJ option', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("Export OBJ")')).toBeVisible();
  });

  test('file menu has export JSON option', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("Export JSON")')).toBeVisible();
  });

  test('file menu has export PNG option', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await expect(page.locator('.file-menu-item:has-text("Export PNG")')).toBeVisible();
  });

  test('export PNG logs to console', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("Export PNG")').click();
    await expect(page.locator('.console-message').last()).toContainText('Exported PNG');
  });

  test('export OBJ logs to console', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("Export OBJ")').click();
    await expect(page.locator('.console-message').last()).toContainText('Exported OBJ');
  });

  test('export JSON logs to console', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.toolbar-btn:has-text("File")').click();
    await page.locator('.file-menu-item:has-text("Export JSON")').click();
    await expect(page.locator('.console-message').last()).toContainText('Exported JSON');
  });

  test('bloom intensity slider updates value', async ({ page }) => {
    await page.goto('/?ws=rendering');
    const sliders = page.locator('.render-settings-panel .inspector-slider');
    const bloomSlider = sliders.nth(2);
    await bloomSlider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '1.5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.render-settings-panel .inspector-slider-value').nth(2)).toContainText('1.5');
  });
});

