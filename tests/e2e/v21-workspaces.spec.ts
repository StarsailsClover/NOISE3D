import { test, expect } from '@playwright/test';

test.describe('NOISE3D v26.1-19.0 - Workspace System', () => {
  test('workspace tabs are visible in toolbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.workspace-tabs')).toBeVisible();
  });

  test('all five workspace tabs exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.workspace-tab:has-text("Layout")')).toBeVisible();
    await expect(page.locator('.workspace-tab:has-text("Modeling")')).toBeVisible();
    await expect(page.locator('.workspace-tab:has-text("Shading")')).toBeVisible();
    await expect(page.locator('.workspace-tab:has-text("Animation")')).toBeVisible();
    await expect(page.locator('.workspace-tab:has-text("Rendering")')).toBeVisible();
  });

  test('layout is the default workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.workspace-tab:has-text("Layout")')).toHaveClass(/active/);
  });

  test('layout workspace shows hierarchy, timeline, inspector', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hierarchy-panel')).toBeVisible();
    await expect(page.locator('.timeline-panel')).toBeVisible();
    await expect(page.locator('.inspector-panel')).toBeVisible();
  });

  test('switching to Modeling shows mesh-edit and hides timeline', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Modeling")').click();
    await expect(page.locator('[data-workspace="modeling"]')).toHaveCount(1);
    await expect(page.locator('.mesh-edit-panel')).toBeVisible();
    await expect(page.locator('.timeline-panel')).not.toBeVisible();
  });

  test('switching to Shading shows material-editor and render-settings', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Shading")').click();
    await expect(page.locator('.material-editor-panel')).toBeVisible();
    await expect(page.locator('.render-settings-panel')).toBeVisible();
    await expect(page.locator('.environment-panel')).toBeVisible();
  });

  test('switching to Animation shows curve-editor and particle panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Animation")').click();
    await expect(page.locator('.curve-editor-panel')).toBeVisible();
    await expect(page.locator('.particle-panel')).toBeVisible();
    await expect(page.locator('.timeline-panel')).toBeVisible();
  });

  test('switching to Rendering shows light panel and code editor', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Rendering")').click();
    await expect(page.locator('.light-panel')).toBeVisible();
    await expect(page.locator('.code-editor-panel')).toBeVisible();
    await expect(page.locator('.timeline-panel')).not.toBeVisible();
  });

  test('active tab class updates on switch', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Modeling")').click();
    await expect(page.locator('.workspace-tab:has-text("Modeling")')).toHaveClass(/active/);
    await expect(page.locator('.workspace-tab:has-text("Layout")')).not.toHaveClass(/active/);
  });

  test('viewport is visible in every workspace', async ({ page }) => {
    await page.goto('/');
    for (const ws of ['Layout', 'Modeling', 'Shading', 'Animation', 'Rendering']) {
      await page.locator(`.workspace-tab:has-text("${ws}")`).click();
      await expect(page.locator('.viewport-canvas')).toBeVisible();
    }
  });

  test('workspace choice persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('.workspace-tab:has-text("Animation")').click();
    await expect(page.locator('[data-workspace="animation"]')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-workspace="animation"]')).toHaveCount(1);
  });

  test('?ws= URL parameter selects workspace directly', async ({ page }) => {
    await page.goto('/?ws=shading');
    await expect(page.locator('[data-workspace="shading"]')).toHaveCount(1);
    await expect(page.locator('.material-editor-panel')).toBeVisible();
  });

  test('clicking panel header title collapses panel body', async ({ page }) => {
    await page.goto('/');
    const slot = page.locator('[data-panel-id="hierarchy"]');
    await expect(slot.locator('.hierarchy-panel')).toBeVisible();
    await slot.locator('.panel-title').click();
    await expect(slot).toHaveClass(/slot-collapsed/);
    await expect(slot.locator('.panel-body')).not.toBeVisible();
  });

  test('collapse chevron indicator exists on panels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.collapse-chevron').first()).toBeVisible();
  });

  test('collapsed state persists per workspace after reload', async ({ page }) => {
    await page.goto('/');
    const slot = page.locator('[data-panel-id="inspector"]');
    await slot.locator('.panel-title').click();
    await expect(slot).toHaveClass(/slot-collapsed/);
    await page.reload();
    await expect(page.locator('[data-panel-id="inspector"]')).toHaveClass(/slot-collapsed/);
  });

  test('collapse state is independent between workspaces', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-panel-id="inspector"] .panel-title').click();
    await expect(page.locator('[data-panel-id="inspector"]')).toHaveClass(/slot-collapsed/);

    await page.locator('.workspace-tab:has-text("Modeling")').click();
    await expect(page.locator('[data-panel-id="inspector"]')).not.toHaveClass(/slot-collapsed/);
  });

  test('clicking buttons inside panel header does not collapse', async ({ page }) => {
    await page.goto('/');
    const slot = page.locator('[data-panel-id="hierarchy"]');
    await slot.locator('.panel-header .panel-btn').first().click();
    await expect(slot).not.toHaveClass(/slot-collapsed/);
  });
});
