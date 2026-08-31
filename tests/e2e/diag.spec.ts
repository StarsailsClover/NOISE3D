import { test } from '@playwright/test';

test('diag numeric entry v2', async ({ page }) => {
  await page.goto('/');
  await page.locator('.viewport-toolbar button:has-text("Cube")').click();
  await page.waitForTimeout(200);
  const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.55, 0, 0));
  const box = await page.locator('.viewport-canvas').boundingBox();
  if (!box || !pt) throw new Error('fail');

  const readY = () => page.evaluate(() => {
    const st = (window as any).__noise3d_store.getState();
    const node = st.selectedNodeId !== null ? st.scene.getNode(st.selectedNodeId) : null;
    return { y: node?.position.y, drag: (window as any).__noise3d_gizmo.state().dragging };
  });

  await page.mouse.move(box.x + pt.x, box.y + pt.y);
  await page.mouse.down();
  console.log('down:', JSON.stringify(await readY()));

  await page.keyboard.down('y');
  console.log('y-down:', JSON.stringify(await readY()));

  await page.keyboard.type('3');
  console.log('typed-3:', JSON.stringify(await readY()));

  await page.keyboard.type('.');
  console.log('typed-dot:', JSON.stringify(await readY()));

  await page.keyboard.type('5');
  console.log('typed-5:', JSON.stringify(await readY()));

  await page.keyboard.up('y');
  await page.mouse.up();
  console.log('done:', JSON.stringify(await readY()));
});
