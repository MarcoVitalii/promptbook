const { chromium } = require('./_pw');
const path = require('path'), fs = require('fs'), http = require('http');
const OUT = process.env.OUT;
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const html = fs.readFileSync(path.resolve('promptbook.html'));
  const srv = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(html); }).listen(0);
  const url = 'http://localhost:' + srv.address().port + '/promptbook.html';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'en-GB', hasTouch: true, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(url);
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const cdp = await ctx.newCDPSession(page);
  const pen = async (pts, opts = {}) => {
    const b = opts.buttons || 1, button = opts.button || 'left', pt = opts.type || 'pen';
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button, buttons: b, clickCount: 1, pointerType: pt });
    for (const p of pts.slice(1)) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], button, buttons: b, pointerType: pt });
    const l = pts[pts.length - 1];
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: l[0], y: l[1], button, buttons: 0, clickCount: 1, pointerType: pt });
  };
  const text = () => page.evaluate(() => PB.serialize());
  const bbox = async (sel, has) => (has ? page.locator(sel, { hasText: has }) : page.locator(sel)).first().boundingBox();

  // zoom: stroke drawn at a different zoom lands on the same word
  await page.locator('#zIn').click(); await page.locator('#zIn').click();
  let bb = await bbox('.w', 'gridare,');
  await pen([[bb.x, bb.y + bb.height], [bb.x + bb.width / 2, bb.y + bb.height + 1], [bb.x + bb.width, bb.y + bb.height]]);
  await page.locator('#zFit').click();
  await page.waitForTimeout(100);
  const chk = await page.evaluate(() => {
    const w = Array.from(document.querySelectorAll('.w')).find(x => x.textContent === 'gridare,'), r = w.getBoundingClientRect(), p = document.querySelector('.ink path').getBoundingClientRect();
    return [Math.abs(p.left - r.left), Math.abs(p.right - r.right), Math.abs(p.bottom - r.bottom)];
  });
  ok(chk.every(v => v < 3), 'underline drawn at 132% still sits under the same word at fit zoom: ' + chk.map(v => v.toFixed(1)));

  // simultaneous speech: ink goes to the column it starts in
  bb = await bbox('.simcell .w', 'vita.');
  await pen([[bb.x, bb.y + 4], [bb.x + 30, bb.y + 12]]);
  const who = await page.evaluate(() => Array.from(PB.S.ink.keys()).map(id => PB.S.byId.get(id).plain));
  ok(who.includes('& MARCO: Allora ho sbagliato vita.'), 'ink in a simultaneous column belongs to that speech');

  // delete an inked block -> orphan, undo -> ink back
  await page.locator('.w', { hasText: 'gridare,' }).first().dblclick();
  await page.locator('#editor textarea').fill('');
  await page.locator('#editor .btn', { hasText: 'Save' }).click();
  let st = await page.evaluate(() => [PB.S.orphans.length, PB.S.ink.size, PB.serialize().includes('gridare')]);
  ok(st[0] === 1 && st[1] === 1 && !st[2], 'deleting an inked line keeps its ink as orphaned, not lost');
  ok((await page.locator('#bReview').textContent()).includes('1'), 'review badge shows it');
  await page.keyboard.press('Control+z');
  st = await page.evaluate(() => [PB.S.orphans.length, PB.S.ink.size]);
  ok(st[0] === 0 && st[1] === 2 && await page.locator('.flag').count() === 0, 'undo re-attaches the ink with no flag');

  // split a speech into two by editing: ink follows the closest text
  await page.locator('.w', { hasText: 'gridare,' }).first().dblclick();
  const raw = await page.locator('#editor textarea').inputValue();
  await page.locator('#editor textarea').fill(raw.replace(' Non gridare', '\nANNA: (interrompe) E allora?\nMARCO: Non gridare'));
  await page.keyboard.press('Control+Enter');
  const inked = await page.evaluate(() => Array.from(PB.S.ink.keys()).map(id => PB.S.byId.get(id).plain));
  ok(inked.some(p => p.startsWith('MARCO: Non gridare')), 'after splitting a speech the ink follows the matching part: ' + JSON.stringify(inked));

  // pen tap on a margin tag edits the cue (UI inside the page answers the pen)
  bb = await bbox('.tag', 'LX 2');
  await pen([[bb.x + 20, bb.y + 8]]);
  ok(await page.locator('#pop input').count() === 2, 'pen tap on a tag opens the cue editor');
  await page.keyboard.press('Escape');

  // touch long press opens the editor (after the palm-rejection window that follows a pen stroke)
  await page.waitForTimeout(600);
  bb = await bbox('.w', 'domande.');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bb.x + 5, y: bb.y + 8 }] });
  await page.waitForTimeout(750);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(await page.locator('#editor textarea').isVisible(), 'long press opens the text editor');
  await page.keyboard.press('Escape');
  ok(await page.locator('#editor').isHidden() && await page.locator('#pop').isHidden(), 'Esc closes it, no stray popover');

  // finger-draw mode: mouse draws
  await page.locator('#bFinger').click();
  bb = await bbox('.w', 'domande.');
  const n0 = await page.evaluate(() => Array.from(PB.S.ink.values()).reduce((a, e) => a + e.strokes.length, 0));
  await page.mouse.move(bb.x, bb.y + 30); await page.mouse.down(); await page.mouse.move(bb.x + 40, bb.y + 34, { steps: 4 }); await page.mouse.up();
  const n1 = await page.evaluate(() => Array.from(PB.S.ink.values()).reduce((a, e) => a + e.strokes.length, 0));
  ok(n1 === n0 + 1 && await page.locator('#pop').isHidden(), 'with Finger on, the mouse draws and does not pin');
  const lit = () => page.evaluate(() => [document.querySelector('#bFinger').classList.contains('on'), document.querySelector('#bErase').classList.contains('on')].join());
  await page.locator('#bErase').click();
  ok(await lit() === 'false,true', 'choosing Eraser unlights Finger');
  await page.mouse.move(bb.x + 20, bb.y + 32); await page.mouse.down(); await page.mouse.move(bb.x + 22, bb.y + 32, { steps: 2 }); await page.mouse.up();
  const n2 = await page.evaluate(() => Array.from(PB.S.ink.values()).reduce((a, e) => a + e.strokes.length, 0));
  ok(n2 === n0, 'the mouse still erases while Eraser is on');
  await page.locator('#bFinger').click();
  ok(await lit() === 'true,false', 'choosing Finger leaves the eraser');
  await page.locator('#bFinger').click();
  ok(await lit() === 'false,false', 'Finger then turns off as before');

  // Letter paper + settings + new department
  await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: 'Settings' }).click();
  await page.locator('#dlg select').first().selectOption('Letter');
  await page.locator('#dlg .btn', { hasText: '+ Department' }).click();
  const rowsN = await page.locator('#dlg .drow').count();
  await page.locator('#dlg .drow').nth(rowsN - 1).locator('input[type=text]').first().fill('fly');
  await page.locator('#dlg .drow').nth(rowsN - 1).locator('input[type=text]').nth(1).fill('Flys');
  await page.locator('#dlg .btn', { hasText: 'Save' }).click();
  const g = await page.evaluate(() => [getComputedStyle(document.querySelector('.page')).width, PB.S.cfg.departments.map(d => d.code).join(','), PB.S.pages.length]);
  ok(g[0] === '816px' && g[1] === 'LX,SND,VID,TODO,FLY', 'paper and departments change from settings: ' + g.join(' | '));
  await page.locator('.w', { hasText: 'domande.' }).first().click();
  ok(await page.locator('#pop .depts .dbtn').count() === 5, 'new department offered when pinning');
  await page.keyboard.press('Escape');

  // night mode + screenshot
  await page.locator('#bNight').click();
  await page.evaluate(() => { document.querySelector('#desk').scrollTop = 0; });
  await page.screenshot({ path: OUT + '/07-night.png' });
  await page.locator('#bNight').click();

  // export backup, import it back
  const dl = page.waitForEvent('download');
  await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: 'Export backup' }).click();
  const d = await dl, file = OUT + '/backup.promptbook.json'; await d.saveAs(file);
  const before = await page.evaluate(() => JSON.stringify([PB.serialize(), PB.inkFile(), PB.S.cfg]));
  await page.evaluate(() => PB.startMemory('ANNA: altro.', {}));
  const fc = page.waitForEvent('filechooser');
  await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: 'Import backup' }).click();
  await (await fc).setFiles(file);
  await page.waitForFunction(() => PB.S.blocks.length > 5);
  const after = await page.evaluate(() => JSON.stringify([PB.serialize(), PB.inkFile(), PB.S.cfg]));
  ok(before === after, 'backup export then import restores script, ink and settings exactly');

  // save from the browser into a show file (picker replaced by a private file for the test)
  await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); const fh = await root.getFileHandle('show2.promptbook.zip', { create: true }); window.showSaveFilePicker = async () => fh; });
  await page.locator('#banner .btn', { hasText: 'Save as show file' }).click();
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);
  const names = await page.evaluate(async () => { const f = await (await (await navigator.storage.getDirectory()).getFileHandle('show2.promptbook.zip')).getFile(); return Array.from((await PB.readZip(f)).keys()).sort().join(','); });
  ok(names.includes('config.json') && names.includes('script.md') && names.includes('script.ink.json'), 'show written into the zip: ' + names);
  ok(await page.locator('#banner').isHidden(), 'banner gone once the show is on disk');

  // cue list PDF
  await page.evaluate(() => { document.body.classList.add('pr-cues'); const cp = document.querySelector('#cuePrint'); cp.textContent = ''; cp.appendChild(document.createElement('h1')).textContent = 'Cue list'; cp.appendChild(cueTable(collectCues(), false)); });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT + '/cues.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  console.log(errs.join('\n') || 'no page errors');
  await browser.close(); srv.close();
})();
