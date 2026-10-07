const { chromium } = require('./_pw');
const path = require('path'), fs = require('fs'), http = require('http');
const OUT = process.env.OUT;
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const words = 'la notte porta il vento sul molo e nessuno guarda le barche che tornano piano dal largo con le reti vuote mentre il faro gira ancora sopra le case spente del porto'.split(' ');
function rnd(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; }
function big() {
  const r = rnd(7), names = ['ANNA', 'MARCO', 'IL GUARDIANO', 'LA SIGNORA DELL’ULTIMO PIANO', 'ÈLIA'], out = [];
  let cue = 1;
  for (let a = 1; a <= 3; a++) {
    out.push('# ATTO ' + a, '');
    for (let s = 1; s <= 8; s++) {
      out.push('## Scena ' + s, '', '(Cambio luce. ' + words.slice(0, 12).join(' ') + '.) {LX ' + (cue++) + ' | stato ' + a + '.' + s + '}', '');
      for (let k = 0; k < 110; k++) {
        const n = r() < 0.04 ? 260 + Math.floor(r() * 500) : 3 + Math.floor(r() * 30);
        let t = []; for (let i = 0; i < n; i++) t.push(words[Math.floor(r() * words.length)]);
        let line = names[Math.floor(r() * names.length)] + ': ' + t.join(' ') + '.';
        if (r() < 0.12) line += ' {SND ' + (cue++) + ' | effetto}';
        out.push(line);
        if (r() < 0.1) out.push('', '(' + words.slice(0, 5 + Math.floor(r() * 10)).join(' ') + '.)', '');
      }
      out.push('');
    }
  }
  return out.join('\n');
}
(async () => {
  const html = fs.readFileSync(path.resolve('promptbook.html'));
  const srv = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(html); }).listen(0);
  const url = 'http://localhost:' + srv.address().port + '/promptbook.html';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'it-IT', hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(url);
  await page.waitForSelector('#start .card');
  ok((await page.locator('#start').textContent()).includes('Apri il file'), 'Italian UI picked from the browser language');

  // ---- large script, timing ----
  const text = big();
  const t = await page.evaluate(tx => { const t0 = performance.now(); PB.startMemory(tx, { title: 'Prova lunga' }); return performance.now() - t0; }, text);
  const info = await page.evaluate(() => ({ pages: PB.S.pages.length, blocks: PB.S.blocks.length, words: PB.S.blocks.reduce((a, b) => a + b.tokens.filter(q => q.k === 'w').length, 0), cues: PB.collectCues().length, splits: PB.S.pages.reduce((a, P) => a + P.items.filter(i => !i.whole && !i.first).length, 0), over: PB.S.pages.filter(P => { const l = P.items[P.items.length - 1]; return l.y + l.h > 1010.5; }).length, dom: document.querySelectorAll('*').length }));
  console.log('load ms', Math.round(t), JSON.stringify(info));
  ok(info.over === 0, 'no page overflows');
  ok(info.splits > 0, 'long speeches split across pages: ' + info.splits);
  // round trip
  ok(await page.evaluate(tx => PB.serialize() === tx.replace(/\n+$/, '') + '\n', text), 'text round-trips unchanged');
  // pin timing in the middle of the document
  const tp = await page.evaluate(() => {
    const b = PB.S.blocks[Math.floor(PB.S.blocks.length / 2)]; PB.jumpTo(b);
    const i = PB.S.blocks.indexOf(b), w = b.tokens.find(q => q.k === 'w');
    const t0 = performance.now();
    PB.commitText(PB.serialize().split('\n').map((l, k) => l).join('\n').replace(b.raw, b.raw.slice(0, w.e) + ' {LX 999 | prova}' + b.raw.slice(w.e)));
    return performance.now() - t0;
  });
  console.log('cue commit ms (full reparse + relayout + render)', Math.round(tp));
  // edit near the top: everything reflows
  const te = await page.evaluate(() => { const t0 = performance.now(); PB.commitText(PB.serialize().replace('## Scena 1\n', '## Scena 1\n\nANNA: una riga nuova in cima.\n')); return performance.now() - t0; });
  console.log('insert-at-top ms', Math.round(te));
  await page.evaluate(() => { const P = PB.S.pages.findIndex(P => P.items.some(i => !i.whole && !i.first)); PB.jumpTo(PB.S.pages[P].items.find(i => !i.whole && !i.first).g.b); document.querySelector('#desk').scrollTop -= 200; });
  await page.waitForTimeout(100);
  await page.screenshot({ path: OUT + '/06-split.png' });

  // ---- touch: tap pins, drag scrolls ----
  await page.evaluate(() => { document.querySelector('#desk').scrollTop = 0; });
  await page.waitForTimeout(100);
  const wb = await page.locator('.page.script .row.speech .w').nth(3).boundingBox();
  await page.touchscreen.tap(wb.x + wb.width / 2, wb.y + wb.height / 2);
  ok(await page.locator('#pop .depts .dbtn').count() === 4, 'finger tap opens the pin popover');
  await page.keyboard.press('Escape');
  const cdp = await ctx.newCDPSession(page);
  const st0 = await page.evaluate(() => document.querySelector('#desk').scrollTop);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 400, y: 700 }] });
  for (let y = 680; y >= 300; y -= 40) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 400, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(400);
  const st1 = await page.evaluate(() => document.querySelector('#desk').scrollTop);
  ok(st1 - st0 >= 380, 'finger drag scrolls the script: ' + Math.round(st1 - st0) + 'px');
  ok(await page.locator('#pop').isHidden(), 'drag did not pin');

  // ---- print: PDF page count ----
  await page.evaluate(() => PB.startMemory(PB.S.blocks.slice(0, 400).map(b => b.raw).join('\n'), { title: 'Stampa' }));
  const n = await page.evaluate(() => PB.S.pages.length);
  await page.evaluate(() => { document.body.classList.add('pr-book'); PB.renderAll(); });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT + '/book.pdf', preferCSSPageSize: true, printBackground: true });
  await page.evaluate(() => { document.body.classList.remove('pr-book'); document.body.classList.add('pr-script'); });
  await page.pdf({ path: OUT + '/script.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => document.body.classList.remove('pr-script'));
  console.log('script pages', n);

  // ---- folder mode through the same file API (browser-private folder) ----
  const res = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('show', { create: true });
    const w = await (await dir.getFileHandle('script.md', { create: true })).createWritable();
    await w.write('# ATTO PRIMO\n\nANNA: Chi è là? Rispondi!\nMARCO: Sono io.\n'); await w.close();
    window.__dir = dir;
    return await PB.openFolder(dir);
  });
  ok(res === true, 'folder opened');
  const pen = async pts => {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
    for (const p of pts.slice(1)) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], button: 'left', buttons: 1, pointerType: 'pen' });
    const l = pts[pts.length - 1];
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: l[0], y: l[1], button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' });
  };
  await page.locator('.w', { hasText: 'Rispondi!' }).click();
  await page.locator('#pop .depts .dbtn', { hasText: 'LX' }).click();
  await page.keyboard.type('1'); await page.keyboard.press('Enter');
  let bb = await page.locator('.w', { hasText: 'Sono' }).boundingBox();
  await pen([[bb.x, bb.y + 20], [bb.x + 40, bb.y + 24], [bb.x + 90, bb.y + 20]]);
  await page.locator('.addboard').first().click();
  await page.waitForSelector('.board svg');
  bb = await page.locator('.board svg').boundingBox();
  await pen([[bb.x + 50, bb.y + 50], [bb.x + 150, bb.y + 150]]);
  await page.waitForTimeout(1500);
  const files = await page.evaluate(async () => {
    const out = {}; const walk = async (d, p) => { for await (const [n, h] of d.entries()) { if (h.kind === 'file') out[p + n] = (await (await h.getFile()).text()).slice(0, 400); else await walk(h, p + n + '/'); } };
    await walk(window.__dir, ''); return out;
  });
  console.log(JSON.stringify(files, null, 1));
  ok(files['script.md'] && files['script.md'].includes('Rispondi! {LX 1}') && /\{BOARD Tavola 1\}/.test(files['script.md']), 'script.md written with cue and board token');
  ok(files['script.ink.json'] && JSON.parse(files['script.ink.json']).blocks[0].text === 'MARCO: Sono io.', 'script.ink.json keyed by block text');
  ok(!!files['boards/tavola-1.json'], 'board file written');
  ok((await page.locator('#status').textContent()).startsWith('Salvato'), 'status shows saved: ' + await page.locator('#status').textContent());

  // reload page, reopen the folder: everything comes back
  await page.reload(); await page.waitForSelector('#start .card');
  ok((await page.locator('#start').textContent()).includes('Riapri «show»'), 'start screen offers to reopen the last folder');
  await page.getByText('Riapri «show»').click();
  await page.waitForSelector('.page.script .row');
  await page.waitForSelector('.ink path');
  ok(await page.locator('.ink path').count() === 1 && await page.locator('.flag').count() === 0, 'ink restored on the same block, no flag');
  ok(await page.locator('.bstrokes path').count() === 1, 'board ink restored');
  ok(await page.locator('.tag', { hasText: 'LX 1' }).count() === 1, 'cue restored');

  // external edit of another block while open -> auto reload on focus, ink stays
  await page.evaluate(async () => { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('show'); const fh = await d.getFileHandle('script.md'); const tx = await (await fh.getFile()).text(); await new Promise(r => setTimeout(r, 30)); const w = await fh.createWritable(); await w.write(tx.replace('ANNA: Chi è là?', 'ANNA: Chi va là?')); await w.close(); window.dispatchEvent(new Event('focus')); });
  await page.waitForTimeout(600);
  ok(await page.evaluate(() => PB.serialize().includes('Chi va là?')), 'outside edit picked up without re-import');
  ok(await page.locator('.ink path').count() === 1 && await page.locator('.flag').count() === 0, 'ink on the untouched block is undisturbed');
  ok(await page.locator('.tag', { hasText: 'LX 1' }).count() === 1, 'cue survives the outside edit');
  // external edit of the INKED block -> flag
  await page.evaluate(async () => { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('show'); const fh = await d.getFileHandle('script.md'); const tx = await (await fh.getFile()).text(); await new Promise(r => setTimeout(r, 30)); const w = await fh.createWritable(); await w.write(tx.replace('MARCO: Sono io.', 'MARCO: Sono io, tuo fratello.')); await w.close(); window.dispatchEvent(new Event('focus')); });
  await page.waitForTimeout(600);
  ok(await page.locator('.ink path').count() === 1 && await page.locator('.flag').count() === 1, 'outside edit of the inked line keeps the ink and flags it');
  // conflict: unsaved local change + outside change
  await page.evaluate(async () => { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('show'); const fh = await d.getFileHandle('script.md'); const tx = await (await fh.getFile()).text(); await new Promise(r => setTimeout(r, 30)); const w = await fh.createWritable(); await w.write(tx + '\nANNA: aggiunta fuori.\n'); await w.close(); PB.commitText(PB.serialize() + '\nMARCO: aggiunta dentro.\n'); });
  await page.waitForTimeout(1500);
  ok(await page.locator('#banner').isVisible() && (await page.locator('#banner').textContent()).includes('script.md'), 'conflict banner instead of overwriting: ' + await page.locator('#banner').textContent());
  const disk = await page.evaluate(async () => { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('show'); return (await (await d.getFileHandle('script.md')).getFile()).text(); });
  ok(disk.includes('aggiunta fuori') && !disk.includes('aggiunta dentro'), 'file on disk untouched while the conflict is open');

  console.log(errs.join('\n') || 'no page errors');
  await browser.close(); srv.close();
})();
