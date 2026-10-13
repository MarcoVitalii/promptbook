// Leaks: the addresses of board images (object URLs) and the IndexedDB connections do not pile up over a day of reloads, restores and variant switches.
const { ok, open, serve } = require('./_util');
(async () => {
  const { srv, url } = await serve();
  const { page, done } = await open({ url });
  const ev = (fn, a) => page.evaluate(fn, a);
  // counted in the page, from before the first line of the tool runs: every object URL made and not yet revoked, every database connection opened and not yet closed
  await page.addInitScript(() => {
    const L = window.LEAK = { urls: new Set(), made: 0, opened: 0, dbs: new Set() };
    const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = b => { const u = mk(b); L.urls.add(u); L.made++; return u; };
    URL.revokeObjectURL = u => { L.urls.delete(u); return rv(u); };
    const op = IDBFactory.prototype.open, cl = IDBDatabase.prototype.close;
    IDBFactory.prototype.open = function (...a) { const r = op.apply(this, a); r.addEventListener('success', () => { L.opened++; L.dbs.add(r.result); }); return r; };
    IDBDatabase.prototype.close = function () { L.dbs.delete(this); return cl.call(this); };
  });
  await page.reload(); await page.waitForSelector('#start .card');
  const menu = async label => { await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: label }).click(); };
  const settle = () => page.waitForFunction(() => { const s = PB.S.store, d = s.dirty; return PB.S.loaded && !s.saving && !d.script && !d.ink && !d.cfg && !d.boards.size && !d.tpls.size; });
  const live = () => ev(() => LEAK.urls.size);
  // every image drawn on the page: how many, whether each address is one still held, and whether each still loads
  const drawn = () => ev(async () => {
    const hrefs = Array.from(document.querySelectorAll('.board image')).map(i => i.getAttribute('href'));
    const loads = await Promise.all(hrefs.map(u => new Promise(r => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = u; })));
    return { n: hrefs.length, blob: hrefs.filter(u => u.startsWith('blob:')).length, held: hrefs.every(u => !u.startsWith('blob:') || LEAK.urls.has(u)), loads: loads.every(Boolean) };
  });
  const shows = async (n, what) => { const d = await drawn(); ok(d.n === n && d.blob === n && d.held && d.loads, what + ': ' + JSON.stringify(d)); };
  const png = (w, hh, col) => ev(([w, hh, col]) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, w, hh); x.strokeRect(4, 4, w - 8, hh - 8); return c.toDataURL('image/png'); }, [w, hh, col]);
  const fig = name => page.locator('.page.facing .board[data-name="' + name + '"]');
  const act = async (name, label) => {   // a button of a board: on the figure when it is wide, in the "⋯" list when it is narrow
    const b = fig(name).locator('.bcap button', { hasText: label });
    if (await b.count()) await b.click(); else { await fig(name).locator('.bcap button').click(); await page.locator('#pop button', { hasText: label }).click(); }
  };

  // 1. a show with a board image and a template image, saved as a show file
  const text = '---\ntitle: Perdite\n---\n# ATTO\n\nANNA: Ciao.\n{BOARD Pianta}\nMARCO: Ecco.\n{BOARD Palco}\nANNA: Fine.\n';
  await ev(([tx, a, b]) => PB.startMemory(tx, { title: 'Perdite', templates: ['Fondale'] }, null,
    [{ name: 'Pianta', image: 'p.png', h: 500, strokes: [], imageData: a }, { name: 'Palco', h: 500, strokes: [], base: 'Fondale' }],
    [{ name: 'Fondale', image: 't.png', h: 500, strokes: [], imageData: b }]), [text, await png(40, 20, '#eef'), await png(40, 20, '#fee')]);
  ok(await live() === 0, 'a show kept in the browser holds no object URL: its images are in the page');
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showSaveFilePicker = async () => root.getFileHandle('leaks.promptbook.zip', { create: true }); });
  await menu('Save as show file');
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);
  ok(await live() === 2 && await ev(() => PB.S.urls.size === 2), 'saved as a show file, it holds one object URL for each image file');

  // 2. changed outside and reloaded, several times: the count stays, the images show
  const rewrite = line => ev(async ln => {
    const fh = await (await navigator.storage.getDirectory()).getFileHandle('leaks.promptbook.zip'), m = await PB.readZip(await fh.getFile());
    m.set('script.md', new Blob([(await m.get('script.md').text()) + ln + '\n'])); await new Promise(r => setTimeout(r, 30));
    const w = await fh.createWritable(); await w.write(await PB.buildZip(m)); await w.close(); window.dispatchEvent(new Event('focus'));
  }, line);
  const counts = [];
  for (let k = 1; k <= 4; k++) {
    await rewrite('MARCO: Da fuori ' + k + '.');
    await page.waitForFunction(k => PB.S.loaded && PB.serialize().includes('Da fuori ' + k + '.'), k);
    counts.push(await live());
  }
  ok(counts.join() === '2,2,2,2', 'four reloads after a change from outside leave as many object URLs as one: ' + counts.join());
  await shows(2, 'after the reloads the board image and the template image under the other board are drawn and load');

  // 3. an image replaced on a board: the address of the old one goes once the save has dropped its file
  const one = await ev(() => PB.histSave('Uno', false));
  const newPng = Buffer.from((await png(60, 20, '#efe')).split(',')[1], 'base64');
  const replace = async () => {
    const was = await ev(() => PB.S.boards.get('Pianta').image), fc = page.waitForEvent('filechooser');
    await act('Pianta', 'Image');
    await (await fc).setFiles({ name: 'nuova.png', mimeType: 'image/png', buffer: newPng });
    await page.waitForFunction(w => PB.S.boards.get('Pianta').image !== w, was);
    await settle(); await page.waitForTimeout(40);   // the file name of an image carries the time
  };
  for (let k = 0; k < 3; k++) await replace();
  await page.waitForSelector('.page.facing .board[data-name="Pianta"] svg > image');
  ok(await live() === 2 && await ev(() => PB.S.urls.size === 2 && !PB.S.urls.has('boards/p.png') && PB.S.urls.has('boards/' + PB.S.boards.get('Pianta').image)), 'an image replaced three times on a board leaves one object URL for that board: ' + await live());
  await shows(2, 'the new image is drawn and loads');

  // 3b. an image put on a board while a save is under way stays in the show file. The save reads the drawings, waits, then drops the images none of them names:
  //     the new image is in the show by then and its board is not written yet. One part whose text the save has to wait for holds it there, so nothing rests on timing.
  await ev(() => {
    const b = new Blob(['{}']), text = b.text.bind(b); let go; const gate = new Promise(r => { go = r; });
    b.text = () => { window.HELD = true; return gate.then(text); }; window.GATE = go;
    PB.S.store.files.set('held.json', b); PB.S.store.dirty.script = true; PB.saveNow();
  });
  await page.waitForFunction(() => window.HELD === true);
  {
    const was = await ev(() => PB.S.boards.get('Pianta').image), fc = page.waitForEvent('filechooser');
    await act('Pianta', 'Image');
    await (await fc).setFiles({ name: 'durante.png', mimeType: 'image/png', buffer: newPng });
    await page.waitForFunction(w => { const i = PB.S.boards.get('Pianta').image; return i !== w && PB.S.store.files.has('boards/' + i); }, was);
    ok(await ev(() => PB.S.store.saving), 'the save is still under way when the new image is on its board');
    await ev(() => window.GATE()); await settle();
    const kept = await ev(async w => {
      const f = 'boards/' + PB.S.boards.get('Pianta').image, fh = await (await navigator.storage.getDirectory()).getFileHandle('leaks.promptbook.zip'), m = await PB.readZip(await fh.getFile());
      PB.S.store.files.delete('held.json');
      return { mem: PB.S.store.files.has(f), disk: m.has(f), old: m.has('boards/' + w) };
    }, was);
    ok(kept.mem && kept.disk, 'an image put on a board while a save was under way is in the show file after it: ' + JSON.stringify(kept));
    ok(!kept.old && await live() === 2, 'and the image it replaced is dropped by the save that follows, with its object URL: ' + await live());
    await page.waitForTimeout(40);
  }

  // 4. revisions restored in turn
  const two = await ev(() => PB.histSave('Due', false));
  const turns = async (n, go) => {   // n times: go(k), then the count of object URLs, the image of the board, and whether both images are drawn and load
    const out = { live: [], img: new Set(), shown: true };
    for (let k = 0; k < n; k++) {
      await go(k); await settle();
      out.live.push(await live()); out.img.add(await ev(() => PB.S.boards.get('Pianta').image));
      const d = await drawn(); out.shown = out.shown && d.n === 2 && d.blob === 2 && d.held && d.loads;
    }
    return out;
  };
  let r = await turns(6, k => ev(sha => PB.histRestore(sha), k % 2 ? two : one));
  ok(r.live.join() === '2,2,2,2,2,2' && r.img.size === 2 && r.img.has('p.png'), 'six restores, to and fro between two revisions with another image, leave as many object URLs as one: ' + r.live.join());
  ok(r.shown, 'after each restore the two images are drawn and load');

  // 5. variants switched in turn
  await ev(() => PB.histVariant('Tour'));
  await replace();
  r = await turns(6, k => ev(b => PB.histSwitch(b), k % 2 ? 'Tour' : 'main'));
  ok(r.live.join() === '2,2,2,2,2,2' && r.img.size === 2, 'six switches between two variants with another image leave as many object URLs as one: ' + r.live.join());
  ok(r.shown, 'after each switch the two images are drawn and load');

  // 6. a board copied to the templates: the same image, the same address
  await act('Pianta', 'To templates');
  await page.waitForFunction(() => PB.S.templates.has('Pianta')); await settle();
  ok(await live() === 2 && await ev(() => { const f = PB.S.boards.get('Pianta').image, u = PB.S.urls; return u.size === 3 && !!u.get('boards/' + f) && u.get('templates/' + f) === u.get('boards/' + f); }), 'a board copied to the templates shares the object URL of its image with the copy: ' + await live());
  await menu('Templates'); await page.waitForSelector('#tpl .board[data-name="Pianta"] svg > image');
  const tp = await ev(async () => {
    const hrefs = Array.from(document.querySelectorAll('#tpl .board image')).map(i => i.getAttribute('href'));
    const loads = await Promise.all(hrefs.map(u => new Promise(r => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = u; })));
    return hrefs.length === 2 && hrefs.every(u => LEAK.urls.has(u)) && loads.every(Boolean);
  });
  ok(tp, 'in the Templates view the image of each template is drawn and loads');
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();

  // 6b. an address that a drawn figure still shows is never revoked, even when nothing else holds it (a state no button leads to: the path is taken away by hand)
  const save = () => ev(async () => { PB.S.store.dirty.cfg = true; await PB.saveNow(); });
  await page.waitForSelector('.page.facing .board[data-name="Palco"] .bbase image');
  await ev(() => { PB.S.urls.delete('templates/t.png'); });
  await save();
  ok(await live() === 2, 'a save does not revoke an object URL that a figure on the page still shows: ' + await live());
  await shows(2, 'and that figure still shows its image');
  await ev(() => PB.relayout(true)); await save();
  ok(await live() === 1 && await ev(() => document.querySelectorAll('.board image').length === 1), 'it is revoked at the save after the figure was redrawn without it: ' + await live());

  // 7. closed and opened again from the start page; then another show takes its place
  await menu('Close show'); await page.waitForSelector('#start .card .btn.pri');
  await page.locator('#start .btn', { hasText: 'Reopen “leaks”' }).click();
  await settle();
  ok(await live() === 3 && await ev(() => PB.S.urls.size === 3), 'the show closed and opened again holds one object URL for each image file, and none of the ones before: ' + await live());
  await shows(2, 'and its images are drawn and load');
  await ev(() => PB.startMemory('ANNA: Ciao.\n', {}));
  ok(await live() === 0 && await ev(() => document.querySelectorAll('.board image').length === 0), 'when another show takes its place, every object URL of the show file is revoked: ' + await live());

  // 8. the database: the show file was remembered at every open, reload, restore and switch, and read at each start page
  const closed = await page.waitForFunction(() => LEAK.dbs.size === 0, null, { timeout: 3000 }).then(() => true, () => false);
  const db = await ev(() => ({ opened: LEAK.opened, open: LEAK.dbs.size, made: LEAK.made }));
  ok(closed && db.opened >= 18, 'every connection to the database is closed again: ' + db.opened + ' opened, ' + db.open + ' still open');
  await done(); srv.close();
})();
