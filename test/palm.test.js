const { chromium } = require('./_pw');
const path = require('path');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('promptbook.html'));
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const cdp = await ctx.newCDPSession(page);
  const st = () => page.evaluate(() => document.querySelector('#desk').scrollTop);
  const strokes = () => page.evaluate(() => Array.from(PB.S.ink.values()).reduce((a, e) => a + e.strokes.length, 0));
  // pen hovers, palm lands and drags: must not scroll
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 300, y: 300, pointerType: 'pen' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 420, y: 600, radiusX: 12, radiusY: 12 }] });
  for (let y = 590; y >= 400; y -= 30) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 420, y, radiusX: 12, radiusY: 12 }] });
  ok(await st() === 0, 'a hand sliding while the pen hovers does not scroll');
  // pen writes while the hand is still resting
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 300, y: 300, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 340, y: 306, button: 'left', buttons: 1, pointerType: 'pen' });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 340, y: 306, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' });
  ok(await strokes() === 1, 'pen writes with the hand resting on the screen');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
  ok(await page.locator('#pop').isHidden() && await page.locator('#editor').isHidden(), 'lifting the hand opens nothing');
  // pen still hovering: a quick finger tap on a word pins
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 345, y: 300, pointerType: 'pen' });
  await page.waitForTimeout(500);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 346, y: 300, pointerType: 'pen' });
  const wb = await page.locator('.w', { hasText: 'domande.' }).first().boundingBox();
  await page.touchscreen.tap(wb.x + 10, wb.y + 8);
  ok(await page.locator('#pop .depts .dbtn').count() === 3, 'a quick finger tap still pins while the pen hovers');
  console.log(errs.join('\n') || 'no page errors');
  await browser.close();
})();
