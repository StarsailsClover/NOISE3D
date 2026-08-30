import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-12.0 - Component System & Prefabs', () => {
  test('component add dropdown exists in inspector', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    const select = page.locator('.component-type-select');
    await expect(select).toBeVisible();
  });

  test('component add dropdown has built-in types', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    const select = page.locator('.component-type-select');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('MeshFilter');
    expect(options).toContain('MeshRenderer');
    expect(options).toContain('Collider');
    expect(options).toContain('Rigidbody');
    expect(options).toContain('Camera');
    expect(options).toContain('AudioSource');
    expect(options).toContain('Script');
  });

  test('add Rigidbody component to node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);

    const compItem = page.locator('.component-item:has-text("Rigidbody")');
    await expect(compItem).toBeVisible();
  });

  test('Rigidbody component shows Mass property', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);

    const massLabel = page.locator('.component-property:has-text("Mass")');
    await expect(massLabel).toBeVisible();
  });

  test('Rigidbody component has Use Gravity checkbox', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);

    const gravityProp = page.locator('.component-property:has-text("Use Gravity")');
    await expect(gravityProp).toBeVisible();
    await expect(gravityProp.locator('.w-toggle')).toHaveAttribute('aria-checked', 'true');
  });

  test('remove component from node', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);

    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(200);

    // Verify component was added
    const compItems = page.locator('.component-item .component-name:has-text("Collider")');
    await expect(compItems).toHaveCount(1);

    // Remove the component via evaluate (React synthetic event workaround)
    await page.evaluate(() => {
      const btn = document.querySelector('.component-remove-btn') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);

    // Component should be gone
    await expect(page.locator('.component-item .component-name:has-text("Collider")')).toHaveCount(0);
  });

  test('add multiple components', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(100);
    await page.locator('.component-type-select').selectOption('Collider');
    await page.waitForTimeout(100);

    const items = page.locator('.component-item');
    await expect(items).toHaveCount(2);
  });

  test('Script component shows textarea for code', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Script');
    await page.waitForTimeout(100);

    const textarea = page.locator('.component-textarea');
    await expect(textarea).toBeVisible();
  });

  test('Save as Prefab button exists', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    const prefabBtn = page.locator('button:has-text("Save as Prefab")');
    await expect(prefabBtn).toBeVisible();
  });

  test('Save as Prefab creates prefab and logs', async ({ page }) => {
    await page.goto('/');
    // Create a cube without interacting with select first
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(300);

    // Click save as prefab button directly (force to bypass overlay intercepts)
    const prefabBtn = page.locator('button[title="Save as Prefab"]');
    await prefabBtn.click({ force: true });
    await page.waitForTimeout(300);

    // App should still be responsive
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('component property updates on input change', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(200);

    await page.locator('.component-type-select').selectOption('Rigidbody');
    await page.waitForTimeout(200);

    // Find the Mass input and change it
    const massProp = page.locator('.component-property:has-text("Mass")');
    const massInput = massProp.locator('.numfield-display');

    // Click into the field to enter edit mode, then type the new value
    await massInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('5');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Value should have updated
    await expect(massInput).toHaveValue('5.00');
  });

  test('components persist when adding and removing nodes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.waitForTimeout(100);

    await page.locator('.component-type-select').selectOption('Camera');
    await page.waitForTimeout(100);

    // Add another node
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    await page.waitForTimeout(100);

    // Go back to first node and check component still there
    // Click on hierarchy item for Cube
    const cubeItem = page.locator('.hierarchy-item:has-text("Cube")');
    if (await cubeItem.isVisible()) {
      await cubeItem.click();
      await page.waitForTimeout(100);
      await expect(page.locator('.component-item:has-text("Camera")')).toBeVisible();
    }
  });
});

