import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-08.0 - WebGPU & Scripting', () => {
  test('backend badge is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.backend-badge')).toBeVisible();
  });

  test('backend badge shows WEBGPU or WEBGL2', async ({ page }) => {
    await page.goto('/');
    const badge = page.locator('.backend-badge');
    const text = await badge.textContent();
    expect(text).toMatch(/WEBGPU|WEBGL2/);
  });

  test('code editor panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.code-editor-panel')).toBeVisible();
  });

  test('code editor has textarea', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.code-textarea')).toBeVisible();
  });

  test('code editor has Run button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.code-editor-panel .panel-btn:has-text("Run")')).toBeVisible();
  });

  test('code editor has Reset button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.code-editor-panel .panel-btn:has-text("Reset")')).toBeVisible();
  });

  test('code editor shows default script content', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('.code-textarea');
    await expect(textarea).toContainText('NOISE3D Script API');
  });

  test('running script produces output', async ({ page }) => {
    await page.goto('/');
    await page.locator('.code-editor-panel .panel-btn:has-text("Run")').click();
    await expect(page.locator('.code-output')).toBeVisible();
  });

  test('script error shows in output', async ({ page }) => {
    await page.goto('/');
    await page.locator('.code-textarea').fill('throw new Error("test error");');
    await page.locator('.code-editor-panel .panel-btn:has-text("Run")').click();
    await expect(page.locator('.code-output-text')).toContainText('Error: test error');
  });

  test('script can log to console', async ({ page }) => {
    await page.goto('/');
    await page.locator('.code-textarea').fill('log("hello from script");');
    await page.locator('.code-editor-panel .panel-btn:has-text("Run")').click();
    await expect(page.locator('.code-output-text')).toContainText('hello from script');
    await expect(page.locator('.console-message').last()).toContainText('hello from script');
  });

  test('script can access scene nodes', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.code-textarea').fill('log(nodes.length + " nodes");');
    await page.locator('.code-editor-panel .panel-btn:has-text("Run")').click();
    await expect(page.locator('.code-output-text')).toContainText('1 nodes');
  });

  test('reset button restores default script', async ({ page }) => {
    await page.goto('/');
    await page.locator('.code-textarea').fill('custom code');
    await page.locator('.code-editor-panel .panel-btn:has-text("Reset")').click();
    await expect(page.locator('.code-textarea')).toContainText('NOISE3D Script API');
  });

  test('script can modify node position', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.code-textarea').fill('nodes[0].position.x = 5; log("done");');
    await page.locator('.code-editor-panel .panel-btn:has-text("Run")').click();
    await expect(page.locator('.code-output-text')).toContainText('done');
    await expect(page.locator('.console-message').last()).toContainText('done');
  });

  test('version displays new format', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-version')).toContainText('v26.1-08.0.RC');
  });
});
