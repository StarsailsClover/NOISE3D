import { test, expect } from '@playwright/test';

test.describe('NOISE3D v4 - Lighting System', () => {
  test('light panel is visible', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.light-panel')).toBeVisible();
  });

  test('default directional light (Sun) exists', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await expect(page.locator('.light-item').filter({ hasText: 'Sun' })).toBeVisible();
  });

  test('add point light', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Point")').click();
    await expect(page.locator('.light-item').filter({ hasText: 'Point Light' })).toBeVisible();
  });

  test('add spot light', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Spot")').click();
    await expect(page.locator('.light-item').filter({ hasText: 'Spot Light' })).toBeVisible();
  });

  test('add directional light', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Sun")').click();
    await expect(page.locator('.light-item').filter({ hasText: 'Directional Light' })).toBeVisible();
  });

  test('light can be selected', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-item').first().click();
    await expect(page.locator('.light-item.selected')).toBeVisible();
  });

  test('light inspector shows intensity slider when selected', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-item').first().click();
    await expect(page.locator('.light-inspector .inspector-label:has-text("Intensity")')).toBeVisible();
  });

  test('light toggle on/off', async ({ page }) => {
    await page.goto('/?ws=rendering');
    const toggle = page.locator('.light-toggle').first();
    await expect(toggle).toContainText('ON');
    await toggle.click();
    await expect(toggle).toContainText('OFF');
  });

  test('light can be removed', async ({ page }) => {
    await page.goto('/?ws=rendering');
    const initialCount = await page.locator('.light-item').count();
    await page.locator('.light-delete').first().click();
    await expect(page.locator('.light-item')).toHaveCount(initialCount - 1);
  });

  test('spot light shows cone angle sliders', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Spot")').click();
    await page.locator('.light-item').last().click();
    await expect(page.locator('.inspector-label:has-text("Inner Cone")')).toBeVisible();
    await expect(page.locator('.inspector-label:has-text("Outer Cone")')).toBeVisible();
  });

  test('point light shows range slider', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Point")').click();
    await page.locator('.light-item').last().click();
    await expect(page.locator('.inspector-label:has-text("Range")')).toBeVisible();
  });

  test('directional light does not show range slider', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-item').first().click();
    await expect(page.locator('.light-inspector .inspector-label:has-text("Range")')).not.toBeVisible();
  });

  test('intensity slider updates value', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-item').first().click();
    const slider = page.locator('.light-inspector .inspector-slider').first();
    await slider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '5');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.light-inspector .inspector-slider-value').first()).toContainText('5');
  });

  test('light color picker exists', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-item').first().click();
    await expect(page.locator('.light-inspector .inspector-color')).toBeVisible();
  });

  test('multiple lights can coexist', async ({ page }) => {
    await page.goto('/?ws=rendering');
    await page.locator('.light-panel .panel-btn:has-text("Point")').click();
    await page.locator('.light-panel .panel-btn:has-text("Spot")').click();
    await page.locator('.light-panel .panel-btn:has-text("Sun")').click();
    const items = page.locator('.light-item');
    await expect(items).toHaveCount(4);
  });
});

