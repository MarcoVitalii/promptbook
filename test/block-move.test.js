// Moving a block by dragging the grip in its gutter to another place: mouse, finger (after a hold) and pen.
const { ok, open, serve } = require('./_util');
const path = require('path');
const OUT = process.env.OUT || path.join('.cache', 'out');
(async () => {
  const { srv, url } = await serve();
  const { page, cdp, pen, done, text } = await open({ url, ctx: { hasTouch: true } });
  const ev = (f, a) => page.evaluate(f, a);
  const HEAD = '## Scena 1\n\nANNA: uno due tre {LX 1 | luce}\n\nMARCO: quattro cinque\n& ANNA: insieme a lui\n\n(Entra il guardiano.)\n\n{VID 1 | filmato}\n\nMARCO: sei sette {/LX 1}\n\n';
  const T = HEAD + Array.from({ length: 70 }, (_, k) => (k % 2 ? 'MARCO' : 'ANNA') + ': riga' + k + ' coda' + k + '\n').join('\n');
  const frame = () => ev(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const reset = async () => {
    await page.keyboard.press('Escape');
    await ev(s => { PB.commitText(s); document.querySelector('#desk').scrollTop = 0; }, T);
    await page.waitForTimeout(450);   // past the palm window of an earlier pen
    await frame();
  };
  // the row that shows the word `s`: centre of its grip, its top and bottom edge
  const row = async s => {
    const r = await ev(s => {
      const w = Array.from(document.querySelectorAll('.page.script .w')).find(w => w.textContent === s), row = w && w.closest('.row'), g = row && row.querySelector(':scope > .grip');
      if (!g) return null; const a = g.getBoundingClientRect(), b = row.getBoundingClientRect();
      return { x: a.left + a.width / 2, y: a.top + a.height / 2, top: b.top, bottom: b.bottom, tx: b.left + 250 };
    }, s);
    if (!r) throw new Error('no row with a grip for ' + s);
    return r;
  };
  const marks = () => ev(() => ({ ghost: document.querySelectorAll('.ghost').length, moving: document.querySelectorAll('.row.moving').length, lift: document.querySelectorAll('.lift').length, line: document.querySelectorAll('.dropline').length }));
  const clean = m => m.ghost === 0 && m.moving === 0 && m.lift === 0 && m.line === 0;
  const mouseDrag = async (from, to, up = true) => {
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    if (up) await page.mouse.up();
  };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p.x, y: p.y, radiusX: 8, radiusY: 8 })) });
  const touchPath = async (from, to, n = 8) => { for (let k = 1; k <= n; k++) await touch('touchMove', [{ x: from.x + (to.x - from.x) * k / n, y: from.y + (to.y - from.y) * k / n }]); await frame(); };
  const order = () => ev(() => PB.S.blocks.slice(0, 8).map(b => b.raw.replace(/\s.*$/s, '')).join(' '));

  await ev(s => PB.startMemory(s, {}), T);
  await page.waitForSelector('.page.script .grip');
  await frame();
  ok(await ev(() => PB.serialize()) === T && await order() === '## ANNA: MARCO: & (Entra {VID MARCO: ANNA:', 'the show opens with its blocks in the order written');
  ok(await ev(() => { const P = PB.S.pages[0]; return document.querySelectorAll('.page.script')[0].querySelectorAll('.grip').length === P.items.length; }), 'every row of the first page has one grip: speeches, the heading, the action, the cue on its own line, the two said together as one');
  ok(await ev(() => Array.from(document.querySelectorAll('.page.script .grip')).every(g => g.classList.contains('noprint') && g.getBoundingClientRect().right <= g.closest('.row').querySelector('.nm,.tx').getBoundingClientRect().left + 1)), 'a grip sits in the gutter, left of the names, and is never printed');

  /* ---- nothing may change ---- */
  let from = await row('uno');
  await page.mouse.click(from.x, from.y);
  ok(await page.locator('#pop').isHidden() && await text() === T, 'a click on a grip opens nothing and changes nothing');
  const fp = await page.locator('.page.facing').first().boundingBox();
  await mouseDrag(from, { x: fp.x + fp.width / 2, y: fp.y + 300 }, false);
  let m = await marks();
  ok(m.ghost === 1 && m.moving === 1 && m.line === 0, 'over the facing page a label follows the pointer, the block is dimmed and no place is marked');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled() && clean(await marks()), 'dropped on the facing page: text unchanged, no undo step, nothing left behind');
  let to = await row('quattro');
  await mouseDrag(from, { x: from.tx, y: to.top - 2 }, false);
  ok((await marks()).line === 0, 'just below itself no place is marked');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled(), 'dropped where it is: text unchanged, no undo step');
  to = await row('sei');
  await mouseDrag(from, { x: to.tx, y: to.bottom - 3 }, false);
  ok((await marks()).line === 1, 'before Escape the place is marked with a line');
  await page.keyboard.press('Escape');
  ok(clean(await marks()), 'Escape removes the label and the line at once');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled(), 'Escape during a drag, then release: text unchanged');

  /* ---- mouse ---- */
  await mouseDrag(from, { x: to.tx, y: to.bottom - 3 }, false);
  m = await marks();
  const gh = await ev(() => { const g = document.querySelector('.bghost'), r = g.getBoundingClientRect(), l = document.querySelector('.dropline').getBoundingClientRect(); return { x: r.left, y: r.top, txt: g.textContent, ly: l.top + l.height / 2 }; });
  ok(m.ghost === 1 && m.moving === 1 && m.line === 1 && /^ANNA: uno due tre/.test(gh.txt) && Math.abs(gh.x - (to.tx + 14)) < 2, 'during the drag: a label with the start of the speech beside the pointer, the block dimmed, one line');
  ok(Math.abs(gh.ly - to.bottom) < 8, 'the line is drawn at the lower edge of the block under the pointer');
  await page.screenshot({ path: path.join(OUT, 'block-move-drag.png') });
  await page.mouse.up(); await frame();
  ok(await order() === '## MARCO: & (Entra {VID MARCO: ANNA: ANNA:' && (await text()).includes('MARCO: sei sette {/LX 1}\n\nANNA: uno due tre {LX 1 | luce}\n'), 'mouse: the speech now stands after the block it was dropped under, with its cue, and nowhere else');
  ok(clean(await marks()) && await page.locator('#pop').isHidden(), 'after release: no label, no line, nothing dimmed, no popover');
  ok(await page.locator('#toast').isVisible() && (await page.locator('#toast').textContent()).includes('no longer match'), 'the cue now starts after its end: the move is kept and a message says so');
  await page.keyboard.press('Control+z');
  ok(await text() === T, 'one Ctrl+Z restores the text exactly');
  await page.keyboard.press('Control+y');
  ok(await order() === '## MARCO: & (Entra {VID MARCO: ANNA: ANNA:', 'Ctrl+Y moves the block again');

  /* ---- upwards, a pair said together, a cue line, ink ---- */
  await reset();
  from = await row('quattro'); to = await row('uno');
  await mouseDrag(from, { x: to.tx, y: to.top + 3 });
  await frame();
  ok(await order() === '## MARCO: & ANNA: (Entra {VID MARCO: ANNA:', 'two speeches said together move as one, here above the speech before them');
  await reset();
  from = await ev(() => { const g = document.querySelector('.page.script .row.mark .grip').getBoundingClientRect(); return { x: g.left + g.width / 2, y: g.top + g.height / 2 }; });
  to = await row('uno');
  await mouseDrag(from, { x: to.tx, y: to.bottom - 2 });
  await frame();
  ok(await order() === '## ANNA: {VID MARCO: & (Entra MARCO: ANNA:', 'a cue on its own line moves as a block');
  await reset();
  let bb = await page.locator('.w', { hasText: 'guardiano' }).boundingBox();
  await pen([[bb.x, bb.y + 18], [bb.x + 30, bb.y + 21], [bb.x + 60, bb.y + 18]]);
  await page.waitForTimeout(500);
  const inked = () => ev(() => PB.inkFile().blocks.map(o => o.text + ':' + o.strokes.length).join('|') + ' orphans ' + (PB.inkFile().orphans || []).length);
  const ink0 = await inked();
  from = await row('guardiano.)'); to = await row('uno');
  await mouseDrag(from, { x: to.tx, y: to.top + 2 });
  await frame();
  ok(await order() === '## (Entra ANNA: MARCO: & {VID MARCO: ANNA:' && /guardiano.*:1 orphans 0$/.test(ink0) && await inked() === ink0, 'the ink on a block moves with it: ' + await inked());
  const y1 = await ev(() => { const p = document.querySelector('.page.script .ink path'), w = Array.from(document.querySelectorAll('.page.script .w')).find(w => w.textContent === 'guardiano.)'); return Math.abs(p.getBoundingClientRect().top - w.getBoundingClientRect().top); });
  ok(y1 < 30, 'and is drawn under the words at their new place');

  /* ---- a board: by its tag in the margin, and it changes facing page with its line ---- */
  await reset();
  await ev(s => PB.commitText(s), T.replace('(Entra il guardiano.)', '{BOARD pianta}'));
  await page.waitForSelector('.page.script .tag.btag'); await frame();
  ok(await ev(() => PB.S.pages[0].boards.join()) === 'pianta', 'a board whose line is on the first page faces the first page');
  from = await ev(() => { const r = document.querySelector('.page.script .tag.btag').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; });
  await page.mouse.click(from.x, from.y);
  ok(await page.locator('#pop input').inputValue() === 'pianta', 'a click on the tag of a board still opens its box');
  await page.keyboard.press('Escape');
  const dk2 = await page.locator('#desk').boundingBox();
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.x - 300, dk2.y + dk2.height - 10, { steps: 6 });
  await page.waitForFunction(() => document.querySelector('#desk').scrollTop > 1300, null, { timeout: 15000 });
  await page.mouse.move(from.x - 300, dk2.y + dk2.height / 2, { steps: 4 });
  await page.mouse.up(); await frame();
  ok(await ev(() => PB.S.pages[0].boards.length === 0 && PB.S.pages.some((P, i) => i > 0 && P.boards.join() === 'pianta') && PB.S.boards.has('pianta')), 'dragged by its tag to a later page, the board faces that page and keeps its drawing');

  /* ---- finger: hold, then drag; a swipe scrolls ---- */
  await reset();
  from = await row('uno'); to = await row('sei');
  const top0 = await ev(() => document.querySelector('#desk').scrollTop);
  await touch('touchStart', [from]); await touchPath(from, { x: from.x, y: from.y - 120 }); await touch('touchEnd', []);
  await page.waitForTimeout(700);
  ok(await text() === T && await ev(() => document.querySelector('#desk').scrollTop) > top0 && clean(await marks()), 'a finger that moves at once on a grip scrolls the page and moves no block');
  await reset();
  from = await row('uno'); to = await row('sei');
  await touch('touchStart', [from]); await page.waitForTimeout(380);
  ok((await marks()).lift === 1, 'a finger held 0.3 s on a grip lifts it');
  await touchPath(from, { x: to.tx, y: to.bottom - 3 });
  m = await marks();
  ok(m.ghost === 1 && m.line === 1, 'then the block follows the finger and the place is marked');
  await touch('touchEnd', []); await frame();
  ok(await order() === '## MARCO: & (Entra {VID MARCO: ANNA: ANNA:' && clean(await marks()), 'finger: released, the block is at the new place');

  /* ---- pen: drags, draws no ink ---- */
  await reset();
  from = await row('uno'); to = await row('sei');
  const inkN = () => ev(() => PB.inkFile().blocks.reduce((n, o) => n + o.strokes.length, 0));
  const n0 = await inkN();
  await pen([[from.x, from.y], [from.x + 20, from.y + 30], [to.tx, to.bottom - 20], [to.tx, to.bottom - 3]]);
  await frame();
  ok(await order() === '## MARCO: & (Entra {VID MARCO: ANNA: ANNA:' && await inkN() === n0, 'pen: the block moves and no ink is drawn');

  /* ---- to another page, the list of cues follows ---- */
  await reset();
  await page.waitForTimeout(450);
  from = await row('uno');
  const dk = await page.locator('#desk').boundingBox();
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.tx, dk.y + dk.height - 10, { steps: 6 });
  await page.waitForFunction(() => document.querySelector('#desk').scrollTop > 1300, null, { timeout: 15000 });
  await page.mouse.move(from.tx, dk.y + dk.height / 2, { steps: 4 });
  ok((await marks()).line === 1, 'held at the lower edge the script scrolls, and a place on a later page is marked');
  await page.mouse.up(); await frame();
  const at = await ev(() => PB.S.blocks.findIndex(b => b.raw.startsWith('ANNA: uno due tre')));
  ok(at > 8 && (await text()).split('{LX 1 | luce}').length === 2 && (await text()).length === T.length, 'the block lands further down the script and no text is lost (block ' + at + ')');

  /* ---- not while a block is edited ---- */
  await reset();
  await page.locator('.w', { hasText: 'quattro' }).dblclick();
  from = await row('uno'); to = await row('sei');
  await mouseDrag(from, { x: to.tx, y: to.bottom - 3 }, false);
  ok((await marks()).ghost === 0, 'no drag while a block is being edited');
  await page.mouse.up();
  await page.keyboard.press('Escape');
  ok(await text() === T, 'and the text is unchanged');

  await done(); srv.close();
})();
