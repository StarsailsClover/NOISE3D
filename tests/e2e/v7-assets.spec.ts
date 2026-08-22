import { test, expect } from '@playwright/test';

async function importOBJ(page: any, name: string, content: string) {
  await page.locator('.asset-panel input[type="file"][accept=".obj"]').setInputFiles({
    name,
    mimeType: 'text/plain',
    buffer: Buffer.from(content),
  });
}

test.describe('NOISE3D v7 - Asset Management', () => {
  test('asset panel is visible', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await expect(page.locator('.asset-panel')).toBeVisible();
  });

  test('asset panel shows empty state', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await expect(page.locator('.asset-empty')).toContainText('No assets');
  });

  test('OBJ import button exists', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await expect(page.locator('.asset-panel .panel-btn:has-text("OBJ")')).toBeVisible();
  });

  test('texture import button exists', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await expect(page.locator('.asset-panel .panel-btn:has-text("Tex")')).toBeVisible();
  });

  test('OBJ import adds asset to list', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'test.obj', 'v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n');
    await expect(page.locator('.asset-item')).toHaveCount(1);
    await expect(page.locator('.asset-label')).toContainText('test');
  });

  test('imported OBJ shows as MESH type icon', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'cube.obj', 'v -1 -1 -1\nv 1 -1 -1\nv 1 1 -1\nv -1 1 -1\nv -1 -1 1\nv 1 -1 1\nv 1 1 1\nv -1 1 1\nf 1 2 3 4\nf 5 6 7 8\n');
    await expect(page.locator('.asset-type-icon.asset-mesh')).toBeVisible();
  });

  test('double-click mesh asset adds node to scene', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'model.obj', 'v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n');
    await page.locator('.asset-item').dblclick();
    await expect(page.locator('.hierarchy-item').filter({ hasText: 'model' })).toBeVisible();
  });

  test('console logs OBJ import', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'logged.obj', 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
    await expect(page.locator('.console-message').last()).toContainText('Imported OBJ');
  });

  test('custom mesh node has custom type', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'custom.obj', 'v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n');
    await page.locator('.asset-item').dblclick();
    await page.locator('.inspector-input').waitFor();
    const nameInput = page.locator('.inspector-input');
    await expect(nameInput).toHaveValue('custom');
  });

  test('multiple assets can be imported', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'a.obj', 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
    await importOBJ(page, 'b.obj', 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
    await expect(page.locator('.asset-item')).toHaveCount(2);
  });

  test('added custom mesh can be selected', async ({ page }) => {
    await page.goto('/?ws=modeling');
    await importOBJ(page, 'select.obj', 'v -1 -1 0\nv 1 -1 0\nv 0 1 0\nf 1 2 3\n');
    await page.locator('.asset-item').dblclick();
    await page.locator('.hierarchy-item').filter({ hasText: 'select' }).click();
    await expect(page.locator('.hierarchy-item.selected')).toBeVisible();
  });

  test('OBJ parser handles complex geometry', async ({ page }) => {
    await page.goto('/?ws=modeling');
    const objContent = [
      'v -1 -1 -1',
      'v 1 -1 -1',
      'v 1 1 -1',
      'v -1 1 -1',
      'v -1 -1 1',
      'v 1 -1 1',
      'v 1 1 1',
      'v -1 1 1',
      'vn 0 0 -1',
      'vn 0 0 1',
      'vn 0 -1 0',
      'vn 0 1 0',
      'vn -1 0 0',
      'vn 1 0 0',
      'f 1//1 2//1 3//1 4//1',
      'f 5//2 8//2 7//2 6//2',
      'f 1//3 5//3 6//6 2//3',
    ].join('\n');
    await importOBJ(page, 'complex.obj', objContent);
    await expect(page.locator('.asset-item')).toHaveCount(1);
  });
});

