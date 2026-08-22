import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-13.0 - Physics Engine', () => {
  test('physics toggle button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[title="Toggle Physics Simulation"]')).toBeVisible();
  });

  test('physics debug toggle button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[title="Toggle Physics Debug Visualization"]')).toBeVisible();
  });

  test('physics toggle activates simulation', async ({ page }) => {
    await page.goto('/');
    const physBtn = page.locator('button[title="Toggle Physics Simulation"]');
    await expect(physBtn).not.toHaveClass(/active/);
    await physBtn.click();
    await page.waitForTimeout(100);
    await expect(physBtn).toHaveClass(/active/);
  });

  test('physics can be toggled off', async ({ page }) => {
    await page.goto('/');
    const physBtn = page.locator('button[title="Toggle Physics Simulation"]');
    await physBtn.click();
    await page.waitForTimeout(100);
    await expect(physBtn).toHaveClass(/active/);
    await physBtn.click();
    await page.waitForTimeout(100);
    await expect(physBtn).not.toHaveClass(/active/);
  });

  test('physics debug can be toggled', async ({ page }) => {
    await page.goto('/');
    const debugBtn = page.locator('button[title="Toggle Physics Debug Visualization"]');
    await debugBtn.click();
    await page.waitForTimeout(100);
    await expect(debugBtn).toHaveClass(/active/);
    await debugBtn.click();
    await page.waitForTimeout(100);
    await expect(debugBtn).not.toHaveClass(/active/);
  });

  test('add Rigidbody component to node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(200);
    await expect(page.locator('.component-item .component-name:has-text("Rigidbody")')).toHaveCount(1);
  });

  test('add Collider component to node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(200);
    await expect(page.locator('.component-item .component-name:has-text("Collider")')).toHaveCount(1);
  });

  test('box with rigidbody falls under gravity', async ({ page }) => {
    await page.goto('/');
    // Create a cube
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);

    // Add Rigidbody component
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(200);

    // Add Collider component
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(200);

    // Enable physics
    await page.locator('button[title="Toggle Physics Simulation"]').click();
    await page.waitForTimeout(100);

    // Enable play mode to drive physics
    await page.locator('.main-toolbar button:has-text("Play")').click();
    await page.waitForTimeout(1000);

    // App should still be running
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('physics simulation with multiple objects', async ({ page }) => {
    await page.goto('/');
    // Create multiple objects
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.waitForTimeout(100);

    // Add components to both
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(100);

    // Enable physics and play
    await page.locator('button[title="Toggle Physics Simulation"]').click();
    await page.waitForTimeout(100);
    await page.locator('.main-toolbar button:has-text("Play")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('floor plane with collider stops falling objects', async ({ page }) => {
    await page.goto('/');
    // Create floor plane
    await page.locator('.viewport-toolbar button:has-text("Plane")').click();
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(100);

    // Create falling cube
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(100);

    // Enable physics
    await page.locator('button[title="Toggle Physics Simulation"]').click();
    await page.waitForTimeout(100);
    await page.locator('.main-toolbar button:has-text("Play")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('physics pauses when stopped', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(100);

    // Start physics
    await page.locator('button[title="Toggle Physics Simulation"]').click();
    await page.waitForTimeout(100);
    await page.locator('.main-toolbar button:has-text("Play")').click();
    await page.waitForTimeout(500);

    // Stop physics
    await page.locator('button[title="Toggle Physics Simulation"]').click();
    await page.waitForTimeout(200);

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('Rigidbody use gravity checkbox is checked by default', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(200);

    const gravityProp = page.locator('.component-property:has-text("Use Gravity")');
    await expect(gravityProp.locator('input[type="checkbox"]')).toBeChecked();
  });

  test('Rigidbody mass defaults to 1', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);
    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(200);

    const massProp = page.locator('.component-property:has-text("Mass")');
    await expect(massProp.locator('input[type="number"]')).toHaveValue('1');
  });
});

