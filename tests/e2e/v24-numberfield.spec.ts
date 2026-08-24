import { test, expect } from '@playwright/test';

/**
 * v26.1-21.0 - NumberField (Blender-style numeric input)
 * Bindings verified against docs/INTERACTION-REFERENCE.md section 2.
 */

const FIELD = '[data-panel-id="inspector"] .inspector-number';

async function setup(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('.viewport-toolbar button:has-text("Cube")').click();
  await page.waitForTimeout(120);
  return page.locator(FIELD).first();
}

async function display(locator: import('@playwright/test').Locator) {
  return locator.locator('.numfield-display').inputValue();
}

test.describe('NOISE3D v26.1-21.0 - NumberField', () => {
  test('ArrowUp nudges by step (0 -> 0.10)', async ({ page }) => {
    const f = await setup(page);
    await f.focus();
    await page.keyboard.press('ArrowUp');
    await expect(f.locator('.numfield-display')).toHaveValue('0.10');
  });

  test('Shift+ArrowUp nudges x10 (step 0.1 -> +1.0)', async ({ page }) => {
    const f = await setup(page);
    await f.focus();
    await page.keyboard.press('Shift+ArrowUp');
    await expect(f.locator('.numfield-display')).toHaveValue('1.00');
  });

  test('Alt+ArrowDown nudges x0.1 (-0.01)', async ({ page }) => {
    const f = await setup(page);
    await f.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(f.locator('.numfield-display')).toHaveValue('-0.01');
  });

  test('LMB-drag horizontally scrubs value', async ({ page }) => {
    const f = await setup(page);
    const box = await f.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    const v = parseFloat(await display(f));
    expect(v).toBeGreaterThan(0.3);
  });

  test('Ctrl during drag quantizes to 0.5 grid', async ({ page }) => {
    const f = await setup(page);
    const box = await f.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 47, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    await page.keyboard.up('Control');
    const v = parseFloat(await display(f));
    const rem = Math.abs(v / 0.1 - Math.round(v / 0.1));
    expect(rem).toBeLessThan(0.001);
  });

  test('plain click enters edit; typing + Enter commits', async ({ page }) => {
    const f = await setup(page);
    await f.click();
    await page.waitForSelector('.numfield-editing');
    await page.keyboard.type('2.5');
    await page.keyboard.press('Enter');
    await expect(f.locator('.numfield-display')).toHaveValue('2.50');
  });

  test('Escape reverts draft', async ({ page }) => {
    const f = await setup(page);
    await f.click();
    await page.waitForSelector('.numfield-editing');
    await page.keyboard.type('9');
    await page.keyboard.press('Escape');
    await expect(f.locator('.numfield-display')).toHaveValue('0.00');
  });

  test('invalid input flashes red and reverts', async ({ page }) => {
    const f = await setup(page);
    await f.click();
    await page.waitForSelector('.numfield-editing');
    await page.keyboard.type('abc');
    await page.keyboard.press('Enter');
    await expect(f).toHaveClass(/numfield-flash/, { timeout: 200 });
    await expect(f.locator('.numfield-display')).toHaveValue('0.00');
  });

  test('Ctrl+Wheel over field steps value', async ({ page }) => {
    const f = await setup(page);
    const box = await f.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await expect(f.locator('.numfield-display')).toHaveValue('0.10');
  });

  test('hover arrows step on click', async ({ page }) => {
    const f = await setup(page);
    const box = await f.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2);
    await f.locator('.numfield-arrow.right').click();
    await expect(f.locator('.numfield-display')).toHaveValue('0.10');
  });

  test('Minus key negates value', async ({ page }) => {
    const f = await setup(page);
    // First make it non-zero
    await f.focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('-');
    await expect(f.locator('.numfield-display')).toHaveValue('-0.10');
  });

  test('scrub then undo restores pre-gesture value in one step', async ({ page }) => {
    const f = await setup(page);
    const box = await f.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    const after = await display(f);

    await page.keyboard.press('Control+z');
    await expect(f.locator('.numfield-display')).toHaveValue('0.00');
    void after;
  });
});

