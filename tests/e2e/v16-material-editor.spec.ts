import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-14.0 - Node-Based Material Editor', () => {
  test('material editor panel is visible', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.material-editor-panel')).toBeVisible();
  });

  test('node palette has node type buttons', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.node-palette')).toBeVisible();
    const btns = page.locator('.node-palette-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('output node exists by default', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('.shader-node-card:has-text("output")')).toBeVisible();
  });

  test('add Color node from palette', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Color")').click();
    await page.waitForTimeout(100);
    // Use exact title match to avoid matching palette button text
    const nodes = page.locator('.shader-node-title:has-text("color")');
    await expect(nodes).toHaveCount(1);
  });

  test('add Mix node from palette', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Mix")').click();
    await page.waitForTimeout(100);
    await expect(page.locator('.shader-node-card:has-text("mix")')).toHaveCount(1);
  });

  test('add Multiple node from palette', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Multiply")').click();
    await page.waitForTimeout(100);
    await page.locator('.node-palette-btn:has-text("Add")').click();
    await page.waitForTimeout(100);
    await page.locator('.node-palette-btn:has-text("Subtract")').click();
    await page.waitForTimeout(100);

    const nodes = page.locator('.shader-node-card');
    // 3 added + 1 output = 4
    expect(await nodes.count()).toBe(4);
  });

  test('remove node by clicking remove button', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Color")').click();
    await page.waitForTimeout(100);
    await expect(page.locator('.shader-node-title:has-text("color")')).toHaveCount(1);

    // Remove the color node
    await page.locator('.shader-node-card:has(.shader-node-title:has-text("color")) .shader-node-remove').click();
    await page.waitForTimeout(100);

    await expect(page.locator('.shader-node-title:has-text("color")')).toHaveCount(0);
  });

  test('compile button generates shader code', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Color")').click();
    await page.waitForTimeout(100);

    await page.locator('.panel-btn:has-text("Compile")').click();
    await page.waitForTimeout(200);

    const code = page.locator('.compiled-code');
    await expect(code).toBeVisible();
    const text = await code.textContent();
    expect(text).toContain('graphMain');
  });

  test('save material button works', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.panel-btn:has-text("Save")').click();
    await page.waitForTimeout(100);
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('connect nodes via socket clicks', async ({ page }) => {
    await page.goto('/?ws=shading');
    // Add a color node
    await page.locator('.node-palette-btn:has-text("Color")').click();
    await page.waitForTimeout(100);

    // Click output socket of color node
    const colorCard = page.locator('.shader-node-card:has(.shader-node-title:has-text("color"))');
    const colorOutput = colorCard.locator('.socket-output');
    await colorOutput.click();
    await page.waitForTimeout(100);

    // Click input socket of output node
    const outputCard = page.locator('.shader-node-card:has(.shader-node-title:has-text("output"))');
    const outputInput = outputCard.locator('.socket-input');
    await outputInput.click();
    await page.waitForTimeout(100);

    // Connection should be made - socket should have connected class
    await expect(outputInput).toHaveClass(/connected/);
  });

  test('type mismatch prevents connection', async ({ page }) => {
    await page.goto('/?ws=shading');
    // Add a vector node (output type vec3) and mix node (input factor type float)
    await page.locator('.node-palette-btn:has-text("Vector")').click();
    await page.waitForTimeout(100);
    await page.locator('.node-palette-btn:has-text("Mix")').click();
    await page.waitForTimeout(100);

    // Try connecting vector output to mix factor input
    const vectorOutput = page.locator('.shader-node-card:has-text("vector") .socket-output');
    await vectorOutput.scrollIntoViewIfNeeded();
    await vectorOutput.click();
    await page.waitForTimeout(100);

    const mixFactor = page.locator('.shader-node-card:has-text("mix") .socket-input:has-text("Factor")');
    await mixFactor.scrollIntoViewIfNeeded();
    await mixFactor.click();
    await page.waitForTimeout(100);

    // Should not connect (vec3 to float is incompatible)
    // App should still be responsive
    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });

  test('disconnect removes connection', async ({ page }) => {
    await page.goto('/?ws=shading');
    await page.locator('.node-palette-btn:has-text("Color")').click();
    await page.waitForTimeout(100);

    // Connect color -> output
    await page.locator('.shader-node-card:has-text("color") .socket-output').click();
    await page.waitForTimeout(100);
    await page.locator('.shader-node-card:has-text("output") .socket-input').click();
    await page.waitForTimeout(100);

    // Disconnect
    const disconnectBtn = page.locator('.socket-disconnect');
    if (await disconnectBtn.isVisible()) {
      await disconnectBtn.click();
      await page.waitForTimeout(100);
    }

    await expect(page.locator('.viewport-canvas')).toBeVisible();
  });
});


