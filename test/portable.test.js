// A browser without the file dialogs of Chrome and Edge: the show file is opened through the browser's file box and leaves as a download (STO-28 to STO-30).
const { ok, open, serve } = require('./_util');
const fs = require('fs');
(async () => {
  const { srv, url } = await serve();   // the draft is kept per origin: one http origin for the whole run
  const { page, done } = await open({ url });
  const ev = (fn, a) => page.evaluate(fn, a);
  const noPickers = () => ev(() => { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; });
  const settle = () => page.waitForFunction(() => !PB.S.store.saving && !PB.S.store.dirty.script && !PB.S.store.dirty.cfg && !PB.S.store.dirty.ink);
  const names = buf => ev(async a => Array.from((await PB.readZip(new File([new Uint8Array(a)], 'x.zip'))).keys()).sort(), Array.from(buf));
  const part = (buf, name) => ev(async ([a, n]) => (await PB.readZip(new File([new Uint8Array(a)], 'x.zip'))).get(n).text(), [Array.from(buf), name]);
  const status = () => page.locator('#status').textContent();
  await page.addInitScript(() => { if (sessionStorage.getItem('nopick')) { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; } });   // before the start screen is drawn
  await ev(() => sessionStorage.setItem('nopick', '1')); await noPickers();

  // STO-29: a show that is only in the browser becomes a show file by download
  await ev(() => PB.startMemory('# ATTO\n\nANNA: Ciao {LX 1 | luce}.\n{BOARD Pianta}\nMARCO: Ecco.\n', { title: 'Il molo' }, null, [{ name: 'Pianta', image: 'p.png', w: 1000, h: 500, strokes: [{ colour: '#000', width: 2, points: [[1, 1], [50, 50]] }], imageData: (() => { const c = document.createElement('canvas'); c.width = 40; c.height = 20; return c.toDataURL('image/png'); })() }]));
  await page.waitForSelector('.page .tag');
  ok((await page.locator('#banner').textContent()).includes('Download show file'), 'the banner of a show in the browser offers the download');
  await page.locator('#bMenu').click();
  ok(await page.locator('#menu button', { hasText: 'Download show file' }).isEnabled() && await page.locator('#menu button', { hasText: 'Open show file' }).isEnabled(), 'the menu offers "Download show file" and "Open show file…"');
  let dl = page.waitForEvent('download');
  await page.locator('#menu button', { hasText: 'Download show file' }).click();
  let d = await dl, buf = fs.readFileSync(await d.path());
  ok(d.suggestedFilename() === 'il-molo.promptbook.zip', 'the file is named after the title: ' + d.suggestedFilename());
  ok((await names(buf)).join() === 'boards/p.png,boards/pianta.json,config.json,script.ink.json,script.md', 'and holds the script, the ink, the settings, the board and its image: ' + (await names(buf)).join());
  ok(await ev(() => PB.S.store.mode === 'zip' && PB.S.store.handle === null && !PB.S.store.unsent) && await page.locator('#banner').isHidden() && /^Saved /.test(await status()), 'the show is a show file now, downloaded, and the banner is gone: ' + await status());

  // a history made here travels in the file
  await ev(() => PB.histSave('Prima prova', false)); await settle();
  ok(await status() === 'Not downloaded' && await page.locator('#banner').isVisible(), 'a revision of the history is a change that waits for a download');
  dl = page.waitForEvent('download');
  await page.locator('#banner button', { hasText: 'Download show file' }).click();
  d = await dl; buf = fs.readFileSync(await d.path());
  ok((await names(buf)).some(n => n.startsWith('.git/refs/tags/')), 'the downloaded file holds the history');

  // STO-28: the file is opened through the file box of the browser
  await page.reload(); await page.waitForSelector('#start .card');
  const ob = page.locator('#start .btn', { hasText: 'Open show file' });
  ok(await ob.isEnabled() && (await page.locator('#start .card').textContent()).includes('cannot write into a show file by itself'), 'the start screen opens a show file here too, and says how saving works');
  let fc = page.waitForEvent('filechooser');
  await ob.click();
  await (await fc).setFiles({ name: 'il-molo.promptbook.zip', mimeType: 'application/zip', buffer: buf });
  await page.waitForFunction(() => PB.S.loaded && PB.S.store.mode === 'zip');
  ok(await ev(() => PB.S.store.handle === null && PB.serialize().includes('MARCO: Ecco.') && PB.S.boards.get('Pianta').strokes.length === 1 && !!PB.S.urls.get('boards/p.png') && PB.S.cfg.title === 'Il molo'), 'the show opens whole: script, board, image, title');
  ok((await ev(async () => (await PB.histState()).log.map(c => c.msg).join())) .includes('Prima prova'), 'with its history');
  ok(await page.locator('#banner').isHidden() && await status() === 'il-molo', 'nothing waits for a download yet: ' + await status());

  // STO-30: changes are kept in the browser until the download
  await ev(() => PB.commitText(PB.serialize().replace('Ecco.', 'Ecco la lanterna.'))); await settle();
  await page.waitForFunction(() => PB.S.store.unsent);
  ok(await status() === 'Not downloaded', 'after a change the status says "Not downloaded"');
  ok(await page.locator('#banner').isVisible() && (await page.locator('#banner').textContent()).includes('kept in this browser only'), 'and a banner says the changes are in this browser only');
  const draft = await ev(() => JSON.parse(localStorage.getItem('promptbook:draft')));
  ok(draft.script.includes('Ecco la lanterna.') && /^data:image\/png/.test(draft.boards[0].imageData || ''), 'the draft in the browser has the change and the image of the board');
  ok(await ev(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; }), 'leaving the page asks first');
  dl = page.waitForEvent('download');
  await page.locator('#banner button', { hasText: 'Download show file' }).click();
  d = await dl; buf = fs.readFileSync(await d.path());
  ok(d.suggestedFilename() === 'il-molo.promptbook.zip' && (await part(buf, 'script.md')).includes('Ecco la lanterna.') && (await names(buf)).some(n => n.startsWith('.git/')), 'the download has the change, under the name of the file opened, and still the history');
  ok(await page.locator('#banner').isHidden() && /^Saved /.test(await status()) && !(await ev(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })), 'after it the banner is gone, the status says "Saved" and leaving asks nothing');

  // where the file dialogs exist nothing changes
  await ev(() => sessionStorage.removeItem('nopick'));
  await page.reload(); await page.waitForSelector('#start .card');
  ok((await page.locator('#start .card').textContent()).includes('Continue the unsaved draft'), 'the draft is offered at the next start');
  ok(!(await page.locator('#start .card').textContent()).includes('cannot write into a show file'), 'in a browser with the file dialogs the start screen says nothing of downloads');
  await done(); srv.close();
})();
