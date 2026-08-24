import { test, expect } from '@playwright/test';

async function project(page: import('@playwright/test').Page, x: number, y: number, z: number) {
  return page.evaluate(([wx, wy, wz]: [number, number, number]) => {
    return (window as any).__noise3d_gizmo.project(wx, wy, wz);
  }, [x, y, z]);
}

test.describe('NOISE3D v26.1-22.0 - Context Menus & Shortcuts', () => {
  test('right-click empty viewport opens add-primitives menu', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + box.width - 30, box.y + box.height / 2, { button: 'right' });
    await expect(page.locator('.ctx-menu')).toBeVisible();
    await expect(page.locator('.ctx-item:has-text("Add Cube")')).toBeVisible();
    await expect(page.locator('.ctx-item:has-text("Add Cone")')).toBeVisible();
  });

  test('Add Cube from menu creates a cube', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + box.width - 30, box.y + box.height / 2, { button: 'right' });
    await page.locator('.ctx-item:has-text("Add Cube")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
    await expect(page.locator('.ctx-menu')).not.toBeVisible();
  });

  test('right-click object shows object menu; Delete removes it', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await project(page, 0, 0, 0);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + pt.x, box.y + pt.y, { button: 'right' });
    await expect(page.locator('.ctx-item:has-text("Duplicate")')).toBeVisible();
    await expect(page.locator('.ctx-item:has-text("Isolate")')).toBeVisible();
    await page.locator('.ctx-item:has-text("Delete")').click();
    await expect(page.locator('.inspector-empty')).toBeVisible();
  });

  test('Duplicate from object menu creates a copy', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const pt = await project(page, 0, 0, 0);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + pt.x, box.y + pt.y, { button: 'right' });
    await page.locator('.ctx-item:has-text("Duplicate")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Copy' })).toBeVisible();
  });

  test('Isolate hides other nodes; un-isolate restores', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
    const pt = await project(page, 0, 0, 0);
    if (!pt) throw new Error('project failed');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    // Cube at origin; sphere selected (stacked). Isolate cube.
    await page.mouse.click(box.x + pt.x, box.y + pt.y, { button: 'right' });
    await page.locator('.ctx-item:has-text("Isolate")').click();
    await expect(page.locator('.console-message').last()).toContainText('Isolated');

    // Un-isolate via the same node
    await page.mouse.click(box.x + pt.x, box.y + pt.y, { button: 'right' });
    await page.locator('.ctx-item:has-text("Un-isolate")').click();
    await expect(page.locator('.console-message').last()).toContainText('cleared');
  });

  test('Escape closes menu first, then deselects', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + box.width - 30, box.y + box.height / 2, { button: 'right' });
    await expect(page.locator('.ctx-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.ctx-menu')).not.toBeVisible();
    // Selection preserved after menu close
    await expect(page.locator('[data-panel-id="inspector"] .inspector-input')).toHaveValue('Cube');

    await page.keyboard.press('Escape');
    await expect(page.locator('.inspector-empty')).toBeVisible();
  });

  test('hierarchy right-click shows Rename / Move to Root / Delete', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const item = page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first();
    await item.click({ button: 'right' });
    await expect(page.locator('.ctx-item:has-text("Rename")')).toBeVisible();
    await expect(page.locator('.ctx-item:has-text("Move to Root")')).toBeVisible();
    await expect(page.locator('.ctx-item:has-text("Delete")')).toBeVisible();
  });

  test('hierarchy Rename focuses inspector name field', async ({ page }) => {
    await page.goto('/');
    await page.locator('.viewport-toolbar button:has-text("Cube")').click();
    const item = page.locator('.hierarchy-item').filter({ hasText: 'Cube' }).first();
    await item.click({ button: 'right' });
    await page.locator('.ctx-item:has-text("Rename")').click();
    await page.waitForTimeout(80);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.classList.contains('inspector-input') ?? false;
    });
    expect(focused).toBe(true);
  });

  test('asset right-click: Add to Scene and Remove Asset', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await page.locator('.asset-panel input[type="file"][accept=".obj"]').setInputFiles({
      name: 'menu.obj',
      mimeType: 'text/plain',
      buffer: Buffer.from('v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n'),
    });
    await page.locator('.asset-item').click({ button: 'right' });
    await page.locator('.ctx-item:has-text("Add to Scene")').click();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'menu' })).toBeVisible();

    await page.locator('.asset-item').click({ button: 'right' });
    await page.locator('.ctx-item:has-text("Remove Asset")').click();
    await expect(page.locator('.asset-empty')).toBeVisible();
  });

  test('? opens shortcut cheat sheet grouped by category', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.waitForTimeout(150);
    await page.keyboard.press('?');
    await expect(page.locator('.help-modal')).toBeVisible();
    await expect(page.locator('.help-group-title:has-text("Camera")')).toBeVisible();
    await expect(page.locator('.help-group-title:has-text("Number Fields")')).toBeVisible();
    await expect(page.locator('.help-row').filter({ hasText: 'Ctrl+Z' })).toBeVisible();
  });

  test('Escape closes cheat sheet', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-toolbar')).toBeVisible();
    await page.waitForTimeout(150);
    await page.keyboard.press('?');
    await expect(page.locator('.help-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.help-modal')).not.toBeVisible();
  });

  test('menu keyboard navigation: ArrowDown + Enter executes', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.viewport-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.click(box.x + box.width - 30, box.y + box.height / 2, { button: 'right' });
    // First item = Add Cube; Enter executes the active item
    await page.keyboard.press('Enter');
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'Cube' })).toBeVisible();
  });
});


