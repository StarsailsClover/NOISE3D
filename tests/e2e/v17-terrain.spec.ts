import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-15.0 - Terrain & Environment', () => {
  test('environment panel is visible', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.environment-panel')).toBeVisible();
  });

  test('environment shows empty terrain state', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.env-empty')).toContainText('No terrain');
  });

  test('add terrain button exists', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.environment-panel .panel-btn:has-text("Add")')).toBeVisible();
  });

  test('adding terrain shows terrain controls', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.environment-panel .panel-btn:has-text("Add")').click();
    await expect(page.locator('.inspector-label:has-text("Terrain")')).toBeVisible();
    await expect(page.locator('.env-btn:has-text("Generate")')).toBeVisible();
    await expect(page.locator('.env-btn:has-text("Flatten")')).toBeVisible();
  });

  test('terrain generate logs to console', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.environment-panel .panel-btn:has-text("Add")').click();
    await page.locator('.env-btn:has-text("Generate")').click();
    await expect(page.locator('.console-message').last()).toContainText('Terrain generated');
  });

  test('remove terrain returns to empty state', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.environment-panel .panel-btn:has-text("Add")').click();
    await expect(page.locator('.inspector-label:has-text("Terrain")')).toBeVisible();
    await page.locator('.environment-panel .panel-btn:has-text("Del")').click();
    await expect(page.locator('.env-empty')).toBeVisible();
  });

  test('sky type selector has three options', async ({ page }) => {
    await page.goto('/?ws=shading');
    const select = page.locator('.env-select');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
  });

  test('sky type can be changed', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.env-select').selectOption('procedural');
    await expect(page.locator('.env-select')).toHaveValue('procedural');
  });

  test('fog checkbox toggles', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.inspector-label:has-text("Fog")')).toBeVisible();
    const fogCheckbox = page.locator('.environment-panel input[type="checkbox"]');
    await expect(fogCheckbox).not.toBeChecked();
    await fogCheckbox.check({ force: true });
    await expect(fogCheckbox).toBeChecked();
  });

  test('fog density slider is visible', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.inspector-sublabel:has-text("Density")')).toBeVisible();
  });

  test('sky color pickers are visible', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.inspector-sublabel:has-text("Top Color")')).toBeVisible();
    await expect(page.locator('.inspector-sublabel:has-text("Bottom Color")')).toBeVisible();
    const colors = page.locator('.environment-panel .inspector-color');
    await expect(colors).toHaveCount(2);
  });

  test('brush strength slider visible when terrain exists', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.environment-panel .panel-btn:has-text("Add")').click();
    await expect(page.locator('.inspector-sublabel:has-text("Brush Strength")')).toBeVisible();
  });
});

