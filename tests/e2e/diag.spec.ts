import { test } from '@playwright/test';

test('diag shift-click', async ({ page }) => {
  await page.goto('/');
  await page.locator('.viewport-toolbar button:has-text("Cube")').click();
  await page.locator('.viewport-toolbar button:has-text("Sphere")').click();
  await page.waitForTimeout(150);

  await page.evaluate(() => {
    (window as any).__cap = [];
    const c = document.querySelector('.viewport-canvas');
    ['mousedown', 'mouseup', 'click'].forEach((t) =>
      c.addEventListener(t, (e: any) => (window as any).__cap.push({ t, shift: e.shiftKey })),
    );
  });

  const pt = await page.evaluate(() => (window as any).__noise3d_gizmo.project(0.75, 0.7, 0.75));
  const box = await page.locator('.viewport-canvas').boundingBox();
  await page.keyboard.down('Shift');
  await page.mouse.move(box!.x + pt.x - 30, box!.y + pt.y);
  await page.mouse.click(box!.x + pt.x, box!.y + pt.y);
  const cap = await page.evaluate(() => (window as any).__cap);
  const sel = await page.evaluate(() => (window as any).__noise3d_gizmo.sel());
  await page.keyboard.up('Shift');
  console.log(JSON.stringify({ cap, sel }, null, 2));
});
