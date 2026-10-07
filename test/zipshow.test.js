// Show file: one .zip instead of a folder. Private browser files stand in for the real file dialogs.
const { ok, open } = require('./_util');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
(async () => {
  const { page, done } = await open();
  const ev = (fn, a) => page.evaluate(fn, a);
  const settle = () => page.waitForFunction(() => !PB.S.store.saving && !PB.S.store.dirty.script && !PB.S.store.dirty.cfg && !PB.S.store.dirty.boards.size);
  const bytes = name => ev(async n => Array.from(new Uint8Array(await (await (await (await navigator.storage.getDirectory()).getFileHandle(n)).getFile()).arrayBuffer())), name).then(a => Buffer.from(a));

  // 1. a show built in memory, with a board that has an image, saved as a show file
  await ev(() => PB.startMemory('# ATTO\n\nANNA: Ciao {LX 1 | luce}.\n{BOARD Pianta}\nMARCO: Ecco.\n', { title: 'Zip' }, null, [{ name: 'Pianta', image: 'p.png', w: 1000, h: 500, strokes: [{ c: '#000', w: 2, p: [[1, 1], [50, 50]] }], imageData: (() => { const c = document.createElement('canvas'); c.width = 40; c.height = 20; c.getContext('2d').fillRect(0, 0, 20, 10); return c.toDataURL('image/png'); })() }]));
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showSaveFilePicker = async () => root.getFileHandle('zip.promptbook.zip', { create: true }); });
  await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: 'Save as show file' }).click();
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);
  const buf = await bytes('zip.promptbook.zip');
  const out = path.join(process.env.OUT || require('os').tmpdir(), 'zip.promptbook.zip');
  fs.writeFileSync(out, buf);
  let names = '';
  try { names = execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(",".join(sorted(z.namelist())))', out]).toString().trim(); } catch (e) { names = 'ERR ' + e.message; }
  ok(/^boards\/p\.png,boards\/pianta\.json,config\.json,script\.ink\.json,script\.md$/.test(names), 'Python reads the archive and every CRC checks out: ' + names);
  ok(await ev(() => PB.S.boards.get('Pianta').imageData === null), 'the board image moved out of the page into the archive');

  // 2. reload, reopen from the start page: script, board, image, settings come back
  await page.reload(); await page.waitForSelector('#start .card');
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showOpenFilePicker = async () => [await root.getFileHandle('zip.promptbook.zip')]; });
  await page.locator('#start .btn', { hasText: 'Open show file' }).click();
  await page.waitForFunction(() => PB.S.loaded && PB.S.store.mode === 'zip');
  ok(await ev(() => PB.serialize().includes('MARCO: Ecco.') && PB.S.boards.get('Pianta').strokes.length === 1 && !!PB.S.urls.get('boards/p.png') && PB.S.cfg.title === 'Zip'), 'opening the file restores script, board strokes, image and title');

  // 3. edits are written back, and only one file changes on disk
  await ev(() => PB.commitText(PB.serialize() + '\nANNA: Ancora.\n'));
  await settle(); await page.waitForTimeout(100);
  const back = await ev(async () => (await PB.readZip(await (await (await navigator.storage.getDirectory()).getFileHandle('zip.promptbook.zip')).getFile())).get('script.md').text());
  ok(back.includes('ANNA: Ancora.'), 'an edit is saved into the zip');

  // 4. changed outside: clean tab reloads, dirty tab asks
  const rewrite = txt => ev(async tx => {
    const fh = await (await navigator.storage.getDirectory()).getFileHandle('zip.promptbook.zip'), m = await PB.readZip(await fh.getFile());
    m.set('script.md', new Blob([tx])); await new Promise(r => setTimeout(r, 30));
    const w = await fh.createWritable(); await w.write(await PB.buildZip(m)); await w.close(); window.dispatchEvent(new Event('focus'));
  }, txt);
  await rewrite('# ATTO\n\nANNA: Fuori.\n');
  await page.waitForFunction(() => PB.serialize().includes('ANNA: Fuori.'));
  ok(await ev(() => PB.S.store.mode === 'zip' && PB.S.boards.size === 0), 'a show file replaced by another program is reloaded when nothing is unsaved');
  await ev(() => { PB.commitText(PB.serialize() + '\nMARCO: Dentro.\n'); });
  await rewrite('# ATTO\n\nANNA: Fuori due.\n');
  await page.waitForSelector('#banner:not([hidden])');
  ok(await page.locator('#banner').textContent().then(x => /changed by another program/.test(x)) && await ev(() => PB.serialize().includes('MARCO: Dentro.')), 'with unsaved edits it asks instead of overwriting');
  await page.locator('#banner .btn', { hasText: 'Keep mine' }).click();
  await settle(); await page.waitForTimeout(100);
  ok((await ev(async () => (await PB.readZip(await (await (await navigator.storage.getDirectory()).getFileHandle('zip.promptbook.zip')).getFile())).get('script.md').text())).includes('MARCO: Dentro.'), '"Keep mine" overwrites the archive');

  // 5. a folder zipped by an operating system (one top-level folder, desktop clutter) opens too
  const odd = await ev(async () => {
    const m = new Map([['myshow/script.md', new Blob(['ANNA: Da cartella.\n'])], ['myshow/config.json', new Blob(['{"title":"Vecchio"}'])], ['__MACOSX/._x', new Blob(['x'])], ['myshow/.DS_Store', new Blob(['x'])]]);
    const root = await navigator.storage.getDirectory(), fh = await root.getFileHandle('odd.zip', { create: true });
    const w = await fh.createWritable(); await w.write(await PB.buildZip(m)); await w.close();
    window.showOpenFilePicker = async () => [fh];
    return await PB.openZipFile();
  });
  ok(odd === true && await ev(() => PB.serialize().includes('Da cartella') && PB.S.cfg.title === 'Vecchio'), 'a zipped show folder opens without unpacking by hand');

  // 6. garbage is refused, current show stays
  await ev(async () => { const fh = await (await navigator.storage.getDirectory()).getFileHandle('bad.zip', { create: true }); const w = await fh.createWritable(); await w.write('not a zip at all'); await w.close(); window.showOpenFilePicker = async () => [fh]; });
  ok(await ev(() => PB.openZipFile()) === false && await ev(() => PB.S.loaded && PB.serialize().includes('Da cartella')), 'a file that is not a zip is refused and the open show stays open');
  await done();
})();
