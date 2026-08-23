import { test } from '@playwright/test';

test('diag raycast at cube face', async ({ page }) => {
  await page.goto('/');
  await page.locator('.viewport-toolbar button:has-text("Cube")').click();
  await page.waitForTimeout(200);
  const out = await page.evaluate(() => {
    const api = (window as any).__noise3d_gizmo;
    const cam = (window as any).__noise3d_cam;
    const p1 = api.project(0, 0, 0.9);
    const p2 = api.project(0, 0, 0);
    const p3 = api.project(0.55, 0, 0);
    return {
      cam,
      projFace: p1, projCenter: p2, projArm: p3,
      rayFace: api.raycast(p1?.x ?? -1, p1?.y ?? -1),
      rayCenter: api.raycast(p2?.x ?? -1, p2?.y ?? -1),
      pickArm: api.pick(p3?.x ?? -1, p3?.y ?? -1),
    };
  });
  console.log(JSON.stringify(out, null, 2));
});
