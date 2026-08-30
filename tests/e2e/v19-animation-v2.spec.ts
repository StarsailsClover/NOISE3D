import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-17.0 - Animation V2', () => {
  test('curve editor panel is visible', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.curve-editor-panel')).toBeVisible();
  });

  test('curve editor shows no clips initially', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.curve-empty')).toContainText('No clips');
  });

  test('add clip button creates clip', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.curve-clips .clip-btn')).toBeVisible();
    await expect(page.locator('.console-message').last()).toContainText('animation clip');
  });

  test('key buttons appear after clip created and node selected', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await expect(page.locator('.env-btn:has-text("Pos")')).toBeVisible();
    await expect(page.locator('.env-btn:has-text("Rot")')).toBeVisible();
    await expect(page.locator('.env-btn:has-text("Scl")')).toBeVisible();
  });

  test('adding bezier keyframe logs', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.env-btn:has-text("Pos")').click();
    await expect(page.locator('.console-message').last()).toContainText('Bezier keyframe');
  });

  test('interpolation selector appears when track exists', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.env-btn:has-text("Pos")').click();
    await expect(page.locator('.inspector-label:has-text("Interpolation")')).toBeVisible();
  });

  test('interpolation modes include bezier and easing presets', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.env-btn:has-text("Pos")').click();
    await page.locator('.curve-editor-panel .w-dropdown-btn').click();
    const items = page.locator('.curve-editor-panel .w-dropdown-item');
    const texts = await items.allTextContents();
    expect(texts).toContain('bezier');
    expect(texts).toContain('ease-in');
    expect(texts).toContain('ease-out');
    expect(texts).toContain('ease-in-out');
    expect(texts).toContain('linear');
    expect(texts).toContain('step');
    await page.keyboard.press('Escape');
  });

  test('changing interpolation logs', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.curve-editor-panel .panel-btn:has-text("Clip")').click();
    await page.locator('.env-btn:has-text("Pos")').click();
    await page.locator('.curve-editor-panel .w-dropdown-btn').click();
    await page.locator('.curve-editor-panel .w-dropdown-item:has-text("ease-in-out")').click();
    await expect(page.locator('.console-message').last()).toContainText('ease-in-out');
  });

  test('skeleton rig section exists', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.inspector-label:has-text("Skeleton Rig")')).toBeVisible();
  });

  test('create humanoid rig works', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.mesh-op-btn:has-text("Create Humanoid Rig")').click();
    await expect(page.locator('.skeleton-info')).toContainText(/bones rigged/);
    await expect(page.locator('.console-message').last()).toContainText('Skeleton created');
  });

  test('IK solver controls exist', async ({ page }) => {
    await page.goto('/?ws=animation');
    await expect(page.locator('.inspector-label:has-text("IK Solver")')).toBeVisible();
    await expect(page.locator('.mesh-op-btn:has-text("Solve IK")')).toBeVisible();
  });

  test('IK solver produces result', async ({ page }) => {
    await page.goto('/?ws=animation');
    await page.locator('.mesh-op-btn:has-text("Solve IK")').click();
    await expect(page.locator('.ik-result')).toBeVisible();
    await expect(page.locator('.console-message').last()).toContainText('IK solved');
  });
});

