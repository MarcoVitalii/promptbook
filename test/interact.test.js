const { chromium } = require('./_pw');
const { nameBox, popGone } = require('./_util');
const path = require('path');
const OUT = process.env.OUT;
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'en-GB' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('promptbook.html'));
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const text = () => page.evaluate(() => PB.serialize());
  const cdp = await ctx.newCDPSession(page);
  const pen = async (pts, opts = {}) => {
    const b = opts.buttons || 1, button = opts.button || 'left';
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pts[0][0], y: pts[0][1], pointerType: 'pen' });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button, buttons: b, clickCount: 1, pointerType: 'pen' });
    for (const p of pts.slice(1)) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], button, buttons: b, pointerType: 'pen' });
    const l = pts[pts.length - 1];
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: l[0], y: l[1], button, buttons: 0, clickCount: 1, pointerType: 'pen' });
  };
  const box = async sel => { const b = await page.locator(sel).first().boundingBox(); return b; };

  // 1. pin a cue on a word with the mouse, give it a number and description
  const w = page.locator('.w', { hasText: 'Rispondi!' }).first();
  await w.click();
  await page.waitForSelector('#pop:not([hidden]) .depts .dbtn');
  ok((await page.locator('#pop .pt').textContent()).includes('Rispondi!'), 'pin popover names the word');
  await page.locator('#pop .depts .dbtn', { hasText: 'LX' }).click();
  ok((await text()).includes('Rispondi! {LX}'), 'one tap creates the cue in the text');
  const at = () => page.evaluate(() => { const a = document.activeElement, f = Array.from(document.querySelectorAll('#pop .pin')); return f.indexOf(a); });
  ok(await at() === 1, 'on a cue just pinned the cursor waits in the margin text');
  await page.keyboard.press('Tab');
  ok(await at() === 2, 'Tab goes on to the description');
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
  ok(await at() === 0, 'Shift+Tab goes back to the number');
  await page.keyboard.type('12');
  await page.keyboard.press('Tab');
  await page.keyboard.type('cambio luce');
  await page.keyboard.press('Enter');
  ok((await text()).includes('Rispondi! {LX 12 | cambio luce}'), 'typed label and description land in the token: ' + (await text()).match(/Rispondi![^\n]*/)[0]);
  ok(await page.locator('#pop').isHidden(), 'popover closed on Enter');
  ok(await page.locator('.tag', { hasText: 'LX 12' }).count() === 1, 'margin tag rendered');

  // 2. keyboard: tap word, press S
  await page.locator('.w', { hasText: 'porto.' }).first().click();
  await page.keyboard.press('s');
  ok((await text()).includes('porto. {SND}'), 'department letter pins from the keyboard');
  await page.keyboard.press('Escape');
  ok((await text()).includes('porto. {SND 2}'), 'a number left blank becomes the last of the department plus one');

  // 3. own-line cue
  await page.locator('.w', { hasText: 'domande.' }).first().click();
  await page.locator('#pop .chk input').check();
  await page.locator('#pop .depts .dbtn', { hasText: 'VID' }).click();
  await page.keyboard.press('Escape');
  ok(/domande\.\n\{VID 1\}\nANNA: Allora/.test(await text()), 'own-line cue sits after the speech');

  // 4. edit an existing cue from its tag, change department, delete another
  await page.locator('.tag', { hasText: /^SND 2$/ }).first().click();
  await page.locator('#pop .depts .dbtn', { hasText: 'VID' }).click();
  await page.locator('#pop input').first().fill('3A');
  await page.locator('#pop .btn', { hasText: 'Done' }).click();
  ok((await text()).includes('porto. {VID 3A}'), 'cue edited from its tag: ' + (await text()).match(/porto\.[^\n]*/)[0]);
  await page.locator('.tag', { hasText: 'VID 3A' }).click();
  await page.locator('#pop .btn', { hasText: 'Delete' }).click();
  ok((await text()).includes('svegli tutto il porto.\n'), 'cue deleted cleanly');

  // 5. undo / redo
  await page.keyboard.press('Control+z');
  ok((await text()).includes('porto. {VID 3A}'), 'undo restores the cue');
  await page.keyboard.press('Control+y');
  ok(!(await text()).includes('VID 3A'), 'redo removes it again');

  // 6. pen ink on a speech
  let bb = await box('.w:has-text("anni")');
  await pen([[bb.x - 20, bb.y - 4], [bb.x + 30, bb.y + 2], [bb.x + 90, bb.y + 10], [bb.x + 140, bb.y + 4]]);
  let ink = await page.evaluate(() => Array.from(PB.S.ink.entries()).map(([id, e]) => [PB.S.byId.get(id).plain.slice(0, 20), e.strokes.length, e.strokes[0].points.length, e.strokes[0].points[0]]));
  ok(ink.length === 1 && ink[0][0].startsWith('ANNA: Tu.') && ink[0][1] === 1, 'pen stroke stored on the block it started in: ' + JSON.stringify(ink));
  ok(await page.locator('.ink path').count() === 1, 'stroke drawn');
  ok(await page.locator('#pop').isHidden(), 'pen did not open a popover');
  // a mouse click right after must still work
  await page.waitForTimeout(500);

  // 7. cue added to inked block does not flag; text edit flags
  await page.locator('.w', { hasText: 'anni' }).first().click();
  await page.locator('#pop .depts .dbtn', { hasText: 'LX' }).click();
  await page.keyboard.press('Escape');
  ok(await page.locator('.flag').count() === 0 && await page.locator('.ink path').count() === 1, 'adding a cue keeps the ink and raises no flag');
  await page.locator('.w', { hasText: 'anni' }).first().dblclick();
  await page.waitForSelector('#editor textarea');
  const raw = await page.locator('#editor textarea').inputValue();
  ok(raw.startsWith('ANNA: Tu. Dopo tre anni {LX 13}'), 'editor shows the raw line: ' + raw);
  await page.locator('#editor textarea').fill(raw.replace('senza una parola', 'senza nemmeno una parola, come un ladro'));
  await page.keyboard.press('Control+Enter');
  ok(await page.locator('.flag').count() === 1, 'editing inked text raises the check flag');
  ok(await page.locator('.ink path').count() === 1, 'ink still drawn after the edit');
  await page.locator('.flag').click();
  await page.locator('#pop .btn', { hasText: 'Ink is fine' }).click();
  ok(await page.locator('.flag').count() === 0, 'flag cleared by "Ink is fine"');
  await page.screenshot({ path: OUT + '/03-ink.png' });

  // 8. eraser (pen eraser button = button 5 / buttons 32)
  bb = await box('.w:has-text("anni")');
  await pen([[bb.x + 20, bb.y - 20], [bb.x + 30, bb.y + 2], [bb.x + 40, bb.y + 20]], { button: 'right', buttons: 2 });
  ok(await page.evaluate(() => PB.S.ink.size) === 0 && await page.locator('.ink path').count() === 0, 'pen eraser removes the stroke');
  await page.keyboard.press('Control+z');
  ok(await page.evaluate(() => PB.S.ink.size) === 1 && await page.locator('.ink path').count() === 1, 'undo brings the stroke back');

  // 9. boards
  await page.locator('.addboard').first().click(); await nameBox(page); await page.keyboard.press('Enter'); await popGone(page);
  await page.waitForSelector('.board svg');
  ok(/\{BOARD Board 1\}/.test(await text()), 'board token inserted: ' + (await text()).match(/\{BOARD[^}]*\}/)[0]);
  bb = await box('.board svg');
  await pen([[bb.x + 60, bb.y + 60], [bb.x + 160, bb.y + 90], [bb.x + 260, bb.y + 200]]);
  ok(await page.evaluate(() => PB.S.boards.get('Board 1').strokes.length) === 1, 'ink stored on the board');
  // image
  const png = Buffer.from((await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#eef'; x.fillRect(0, 0, 400, 200); x.strokeStyle = '#335'; x.lineWidth = 6; x.strokeRect(20, 20, 360, 160); return c.toDataURL('image/png'); })).split(',')[1], 'base64');
  const fc = page.waitForEvent('filechooser');
  await page.locator('.bcap button', { hasText: 'Image' }).click();
  await (await fc).setFiles({ name: 'plan.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('.board svg image');
  ok(await page.evaluate(() => { const B = PB.S.boards.get('Board 1'); return B.h === 500 && !!B.imageData; }), 'image set, board takes its 2:1 shape');
  await page.screenshot({ path: OUT + '/04-board.png' });

  // 10. cue list
  await page.locator('#bList').click();
  await page.waitForSelector('#drawer table.cl');
  const rows = await page.locator('#drawer tr.cr').count();
  ok(rows === 8, 'cue list rows: ' + rows);
  await page.locator('#drawer .chip', { hasText: 'SND' }).click();
  ok(await page.locator('#drawer tr.cr').count() === 2, 'filter by department');
  const dl = page.waitForEvent('download');
  await page.locator('#drawer .btn', { hasText: 'CSV' }).click();
  const d = await dl; const fs = require('fs'); const csv = fs.readFileSync(await d.path(), 'utf8');
  ok(csv.split('\r\n').length === 4 && csv.includes('mare, loop basso'), 'CSV export: ' + JSON.stringify(csv.split('\r\n')[1]));
  await page.screenshot({ path: OUT + '/05-cuelist.png' });
  await page.locator('#bList').click();

  // 11. review panel: unknown department + unclassified line
  await page.evaluate(() => PB.commitText(PB.serialize() + '\nuna riga senza nome\n\nANNA: fine {FLY 1 | cielo}\n'));
  ok((await page.locator('#bReview').textContent()).includes('2'), 'review badge counts: ' + await page.locator('#bReview').textContent());

  // 12. search + outline
  await page.locator('#search').fill('timone');
  await page.locator('#search').press('Enter');
  ok(await page.locator('.row.flash').count() >= 1, 'search jumps and flashes');

  console.log(errs.join('\n') || 'no page errors');
  await browser.close();
})();
