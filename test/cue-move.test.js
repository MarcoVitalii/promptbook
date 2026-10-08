// Moving a cue by dragging its tag in the margin to another word: mouse, finger (after a hold) and pen.
const { ok, open, serve } = require('./_util');
const path = require('path');
const OUT = process.env.OUT || path.join('.cache', 'out');
(async () => {
  const { srv, url } = await serve();
  const { page, cdp, pen, done, text } = await open({ url, ctx: { hasTouch: true } });
  const ev = (f, a) => page.evaluate(f, a);
  const HEAD = '## Scena 1\n\nANNA: uno due tre {LX 1 | luce | nota} quattro\n\nMARCO: cinque sei sette otto\n\nANNA: nove dieci undici\n\n{VID 1 | filmato}\n\n'
    + 'MARCO: dodici tredici {SND 5 | musica} quattordici quindici {/SND 5}\n\n{BOARD b1}\n\n'
    + 'ANNA: ' + Array.from({ length: 40 }, (_, k) => 'lunga' + k).join(' ') + '\n\n';
  const T = HEAD + Array.from({ length: 70 }, (_, k) => (k % 2 ? 'MARCO' : 'ANNA') + ': riga' + k + ' coda' + k + '\n').join('\n');
  const frame = () => ev(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const top = () => ev(() => document.querySelector('#desk').scrollTop);
  const reset = async () => {
    await page.keyboard.press('Escape');
    for (let a = -1, b = await top(); a !== b; a = b, b = await top()) await page.waitForTimeout(150);   // let a finger swipe's momentum run out
    await ev(s => { PB.commitText(s); document.querySelector('#desk').scrollTop = 0; }, T);
    await page.waitForTimeout(450);   // past the palm window of an earlier pen, and any toast timing
    await frame();
  };
  // centre of a word of the script, by its text
  const word = async s => {
    const r = await ev(s => { const w = Array.from(document.querySelectorAll('.page.script .w')).find(w => w.textContent === s); const r = w.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, s);
    return Object.assign(r, { cx: r.x + r.w / 2, cy: r.y + r.h / 2 });
  };
  // a point inside the tag whose bold name is `name` (end tags: pass end = true)
  const tag = async (name, end) => {
    const r = await ev(([name, end]) => {
      const g = Array.from(document.querySelectorAll('.page.script .tag:not(.ghost)')).find(g => g.querySelector('b').textContent === name && g.classList.contains('etag') === !!end);
      if (!g) return null; const r = g.getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2, top: r.top };
    }, [name, end]);
    if (!r) throw new Error('no tag ' + name);
    return r;
  };
  const marks = () => ev(() => ({ ghost: document.querySelectorAll('.ghost').length, moving: document.querySelectorAll('.moving').length, lift: document.querySelectorAll('.lift').length, drop: Array.from(document.querySelectorAll('.w.drop')).map(w => w.textContent).join() }));
  const clean = m => m.ghost === 0 && m.moving === 0 && m.lift === 0 && m.drop === '';
  const count = (s, sub) => s.split(sub).length - 1;
  const mouseDrag = async (from, to, up = true) => {
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    if (up) await page.mouse.up();
  };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p.x, y: p.y, radiusX: 8, radiusY: 8 })) });
  const touchPath = async (from, to, n = 8) => { for (let k = 1; k <= n; k++) await touch('touchMove', [{ x: from.x + (to.x - from.x) * k / n, y: from.y + (to.y - from.y) * k / n }]); await frame(); };   // touch moves are delivered with the next frame

  await ev(s => PB.startMemory(s, {}), T);
  await page.waitForSelector('.page.script .tag');
  await frame();
  const names = await ev(() => Array.from(document.querySelectorAll('.page.script .tag b')).map(b => b.textContent).join('|'));
  ok(await ev(() => PB.S.pages.length) >= 2 && await ev(() => PB.serialize()) === T, 'the show has two pages or more and its text is the one given (tags: ' + names + ')');

  /* ---- nothing may change: facing page, Escape, own word, board tag, plain click ---- */
  ok(await page.locator('#bUndo').isDisabled(), 'no undo step at the start');
  let from = await tag('LX 1');
  const fp = await page.locator('.page.facing').first().boundingBox();
  await mouseDrag(from, { x: fp.x + fp.width / 2, y: fp.y + 300 }, false);
  let m = await marks();
  ok(m.ghost === 1 && m.moving === 1 && m.drop === '', 'over the facing page the tag follows the pointer and no word is highlighted');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled() && clean(await marks()), 'dropped on the facing page: text unchanged, no undo step, nothing left behind');

  let to = await word('otto');
  await mouseDrag(from, { x: to.cx, y: to.cy }, false);
  ok((await marks()).drop === 'otto', 'before Escape the word under the pointer is highlighted');
  await page.keyboard.press('Escape');
  ok(clean(await marks()), 'Escape removes the ghost and the highlight at once');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled() && await page.locator('#pop').isHidden(), 'Escape during a drag, then release: text unchanged, nothing opens');

  to = await word('tre');
  await mouseDrag(from, { x: to.cx, y: to.cy }, false);
  ok((await marks()).drop === 'tre', 'the word the cue already follows is highlighted like any other');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#bUndo').isDisabled(), 'dropped on its own word: text unchanged, no undo step');

  await mouseDrag(from, { x: from.x + 30, y: from.y + 3 }, false);
  m = await marks();
  ok(m.ghost === 1 && m.drop === '', 'while the pointer is still on the tag itself no word is highlighted');
  await page.mouse.up();
  ok(await text() === T && await page.locator('#pop').isHidden(), 'released on the tag after a small movement: nothing changes and nothing opens');

  const bt = await ev(() => { const r = document.querySelector('.page.script .tag.btag').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; });
  to = await word('nove');
  await mouseDrag(bt, { x: to.cx, y: to.cy }, false);
  ok((await marks()).ghost === 0, 'a board tag does not lift');
  await page.mouse.up();
  ok(await text() === T && clean(await marks()), 'a board tag cannot be dragged: text unchanged');
  await page.keyboard.press('Escape');

  await page.mouse.click(from.x, from.y);
  ok(await page.locator('#pop').isVisible() && await page.locator('#pop input').count() > 0, 'a click on a tag without movement opens the cue editor');
  await page.keyboard.press('Escape');
  ok(await text() === T && await page.locator('#bUndo').isDisabled(), 'and changes nothing');

  /* ---- mouse ---- */
  to = await word('dieci');
  await mouseDrag(from, { x: to.cx, y: to.cy }, false);
  m = await marks();
  ok(m.ghost === 1 && m.moving === 1 && m.drop === 'dieci', 'during the drag: one ghost tag, the original dimmed, the target word and only it highlighted');
  const gh = await ev(() => { const g = document.querySelector('.tag.ghost'), r = g.getBoundingClientRect(), w = document.querySelector('.w.drop'); return { x: r.left, y: r.top, parent: g.parentNode === document.body, dc: w.style.getPropertyValue('--dc'), c: g.style.getPropertyValue('--c'), txt: g.textContent }; });
  ok(gh.parent && Math.abs(gh.x - (to.cx + 14)) < 2 && Math.abs(gh.y - (to.cy - 36)) < 2 && /LX 1/.test(gh.txt), 'the ghost sits beside the pointer and shows the cue');
  ok(gh.dc !== '' && gh.dc === gh.c, 'the word is highlighted in the colour of the cue');
  await page.screenshot({ path: path.join(OUT, 'cue-move-drag.png') });
  await page.mouse.up();
  await frame();
  const moved = T.replace(' {LX 1 | luce | nota}', '').replace('nove dieci', 'nove dieci {LX 1 | luce | nota}');
  ok(await text() === moved, 'mouse: the token is after the target word two speeches down and nowhere else, all its fields kept');
  ok(clean(await marks()) && await page.locator('#pop').isHidden(), 'after release: no ghost, nothing dimmed, lifted or highlighted, no popover');
  const nt = await tag('LX 1'), nw = await word('dieci');
  ok(Math.abs(nt.top - nw.y) < 30 && nt.top > from.top + 30, 'the tag is drawn beside the new line');
  ok(await ev(() => document.querySelectorAll('.page.script .w.cued').length) > 0 && await ev(() => Array.from(document.querySelectorAll('.page.script .w.cued')).some(w => w.textContent === 'dieci')), 'the box is round the new word');
  await page.keyboard.press('Control+z');
  ok(await text() === T, 'one Ctrl+Z restores the text exactly');
  await page.keyboard.press('Control+y');
  ok(await text() === moved, 'Ctrl+Y moves the cue again');

  /* ---- between words and between lines ---- */
  await reset();
  from = await tag('LX 1');
  let a = await word('sei'), b = await word('sette');
  ok(b.x - (a.x + a.w) > 2 && Math.abs(a.y - b.y) < 1, 'two neighbouring words on one line have a space between them');
  await mouseDrag(from, { x: a.x + a.w + 1, y: a.cy }, false);
  ok((await marks()).drop === 'sei', 'in the space between two words the nearer word is the target');
  await page.mouse.up();
  ok(count(await text(), 'sei {LX 1 | luce | nota} sette') === 1 && count(await text(), '{LX 1') === 1, 'and receives the cue');
  await reset();
  from = await tag('LX 1');
  // two words one above the other in the long speech, and the point half way between their lines
  const gap = await ev(() => {
    const ws = Array.from(document.querySelectorAll('.page.script .w')).filter(w => /^lunga\d+$/.test(w.textContent)).map(w => ({ t: w.textContent, r: w.getBoundingClientRect() }));
    const up = ws[2], low = ws.find(o => o.r.top > up.r.bottom - 2 && o.r.left < up.r.right && o.r.right > up.r.left);
    return low ? { up: up.t, low: low.t, x: Math.max(up.r.left, low.r.left) + 4, y: (up.r.bottom + low.r.top) / 2, free: low.r.top - up.r.bottom } : null;
  });
  ok(gap, 'the long speech wraps onto a second line');
  await mouseDrag(from, { x: gap.x, y: gap.y }, false);
  m = await marks();
  ok(m.drop === gap.up || m.drop === gap.low, 'between two lines of a speech one of the two nearest words is the target (gap ' + Math.round(gap.free * 10) / 10 + ' px): ' + m.drop);
  await page.mouse.up();
  ok(count(await text(), m.drop + ' {LX 1 | luce | nota}') === 1 && count(await text(), '{LX 1') === 1, 'and receives the cue');
  await reset();
  from = await tag('LX 1');
  a = await word('otto');
  await mouseDrag(from, { x: a.x + a.w + 40, y: a.y + a.h + 5 }, false);
  ok((await marks()).drop === 'otto', 'right of a line end and a little below it, the last word of the line is the target');
  await page.mouse.up();
  ok(count(await text(), 'otto {LX 1 | luce | nota}\n') === 1 && count(await text(), '{LX 1') === 1, 'and receives the cue');

  /* ---- a cue on its own line ---- */
  await reset();
  from = await tag('VID 1'); to = await word('undici');
  await mouseDrag(from, { x: to.cx, y: to.cy });
  ok(await text() === T.replace('{VID 1 | filmato}\n\n', '').replace('undici', 'undici {VID 1 | filmato}'), 'a cue on its own line dropped on a word becomes a word cue; its line is gone and no blank line is added');
  await page.keyboard.press('Control+z');
  ok(await text() === T, 'undo puts the line back');

  /* ---- a pair broken by the move ---- */
  await reset();
  from = await tag('SND 5', true); to = await word('cinque');
  await mouseDrag(from, { x: to.cx, y: to.cy });
  ok(count(await text(), 'cinque {/SND 5} sei') === 1 && count(await text(), '{/SND 5}') === 1, 'an end tag can be dragged above its start');
  ok(await page.locator('#toast').isVisible() && /no longer match/.test(await page.locator('#toast').textContent()) && await ev(() => PB.S.pairs.length) === 0, 'the move is kept and a message says the pair is broken');
  await page.keyboard.press('Control+z');
  ok(await text() === T && await ev(() => PB.S.pairs.length) === 1, 'undo restores the pair');
  await reset();
  from = await tag('SND 5'); to = await word('dodici');
  await mouseDrag(from, { x: to.cx, y: to.cy });
  ok(count(await text(), 'dodici {SND 5 | musica} tredici') === 1 && await ev(() => PB.S.pairs.length) === 1, 'a start moved earlier keeps its pair');

  /* ---- finger ---- */
  await reset();
  from = await tag('SND 5');
  await touch('touchStart', [from]);
  await touchPath(from, { x: from.x, y: from.y - 200 });
  m = await marks();
  await touch('touchEnd', []);
  const scrolled = await top();
  ok(scrolled > 100 && m.ghost === 0 && m.lift === 0, 'finger, quick: a swipe that starts on a tag scrolls the page (' + Math.round(scrolled) + ' px) and lifts nothing');
  ok(await text() === T && await page.locator('#pop').isHidden(), 'and the text is unchanged, nothing opens');

  await reset();
  from = await tag('LX 1'); to = await word('sette');
  await touch('touchStart', [from]);
  await page.waitForTimeout(400);
  m = await marks();
  ok(m.lift === 1 && m.ghost === 0, 'finger, hold: after 0.4 s the tag is lifted');
  await touchPath(from, { x: to.cx, y: to.cy });
  m = await marks();
  ok(m.ghost === 1 && m.moving === 1 && m.lift === 0 && m.drop === 'sette', 'then it follows the finger and the word under it is highlighted');
  await touch('touchEnd', []);
  await page.waitForTimeout(120);
  ok(count(await text(), 'sette {LX 1 | luce | nota} otto') === 1 && count(await text(), '{LX 1') === 1, 'lifting the finger moves the cue');
  ok(await top() === 0 && clean(await marks()) && await page.locator('#pop').isHidden() && await page.locator('#editor').isHidden(), 'the page did not scroll, nothing is left behind, nothing opens');

  await reset();
  from = await tag('LX 1');
  await touch('touchStart', [from]);
  await page.waitForTimeout(400);
  await touch('touchEnd', []);
  await page.waitForTimeout(80);
  ok(await page.locator('#pop').isVisible() && await text() === T && clean(await marks()), 'finger, hold and lift without moving: the cue editor opens, nothing moves');
  await page.keyboard.press('Escape');
  await page.touchscreen.tap(from.x, from.y);
  ok(await page.locator('#pop').isVisible() && await page.locator('#pop input').count() > 0, 'a quick finger tap on a tag opens the cue editor');
  await page.keyboard.press('Escape');

  await reset();
  from = await tag('LX 1'); to = await word('sette');
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x - 200, y: from.y + 150, pointerType: 'pen' });
  await touch('touchStart', [from]);
  await page.waitForTimeout(400);
  m = await marks();
  await touchPath(from, { x: to.cx, y: to.cy });
  const m2 = await marks();
  await touch('touchEnd', []);
  await page.waitForTimeout(80);
  ok(m.lift === 0 && m2.ghost === 0 && m2.drop === '', 'finger while the pen hovers: a hand resting on a tag lifts and drags nothing');
  ok(await text() === T && await top() === 0 && await page.locator('#pop').isHidden(), 'and the text, the scroll position and the popovers are untouched');
  // the pen arrives while a finger is already holding a lifted tag
  await page.waitForTimeout(500);
  await touch('touchStart', [from]);
  await page.waitForTimeout(400);
  const lifted = (await marks()).lift;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x - 200, y: from.y + 150, pointerType: 'pen' });
  await touchPath(from, { x: to.cx, y: to.cy });
  m = await marks();
  await touch('touchEnd', []);
  ok(lifted === 1 && m.ghost === 0 && await text() === T && await top() === 0, 'a lifted tag is not dragged once the pen comes near');

  /* ---- pen ---- */
  await reset();
  from = await tag('LX 1'); to = await word('sette');
  const ink0 = await ev(() => PB.S.ink.size);
  await pen([[from.x, from.y], [from.x - 20, from.y + 10], [to.cx + 30, to.cy + 5], [to.cx, to.cy]]);
  ok(count(await text(), 'sette {LX 1 | luce | nota} otto') === 1 && count(await text(), '{LX 1') === 1, 'pen: a drag from a tag to a word moves the cue');
  ok(await ev(() => PB.S.ink.size) === ink0 && await ev(() => document.querySelectorAll('.page.script .ink path').length) === 0 && clean(await marks()), 'and draws no ink');
  await reset();
  from = await tag('LX 1');
  await pen([[from.x, from.y], [from.x + 1, from.y]]);
  ok(await page.locator('#pop').isVisible() && await text() === T, 'a pen tap on a tag opens the cue editor');
  await page.keyboard.press('Escape');
  a = await word('cinque');
  await pen([[a.cx, a.cy + 30], [a.cx + 40, a.cy + 34], [a.cx + 80, a.cy + 30]]);
  ok(await ev(() => PB.S.ink.size) === ink0 + 1, 'the pen still draws on the page after a drag');

  /* ---- carried to another page by the scroll at the edge ---- */
  await reset();
  from = await tag('LX 1');
  const dk = await page.locator('#desk').boundingBox();
  const unit = await ev(() => document.querySelector('.page.script').getBoundingClientRect().height);
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.x - 300, dk.y + dk.height - 20, { steps: 6 });
  const reached = await page.waitForFunction(u => document.querySelector('#desk').scrollTop >= u, unit, { timeout: 20000 }).then(() => true, () => false);
  ok(reached && (await marks()).ghost === 1, 'held near the bottom edge the script scrolls by a page with the tag still in the air (' + Math.round(await top()) + ' px)');
  await page.mouse.move(from.x - 300, dk.y + dk.height / 2, { steps: 3 });
  await frame();
  const s1 = await top(); await page.waitForTimeout(150);
  ok(await top() === s1, 'away from the edge the scrolling stops');
  const far = await ev(() => {
    const d = document.querySelector('#desk').getBoundingClientRect();
    for (const w of document.querySelectorAll('.page.script[data-pi="1"] .w')) { const r = w.getBoundingClientRect(); if (r.top > d.top + 80 && r.bottom < d.bottom - 80) return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: w.textContent, b: +w.closest('.tx').dataset.b }; }
    return null;
  });
  ok(far, 'a word of page 2 is in view');
  await page.mouse.move(far.x, far.y, { steps: 4 });
  ok((await marks()).drop === far.t, 'that word is highlighted');
  await page.mouse.up();
  ok(await ev(f => PB.S.byId.get(f.b).raw.includes(f.t + ' {LX 1 | luce | nota}'), far) && count(await text(), '{LX 1') === 1 && clean(await marks()), 'dropped on a word of page 2: the token is in that speech and nowhere else');
  await page.keyboard.press('Control+z');
  ok(await text() === T, 'undo brings it back to page 1');
  // the same upward
  await frame();
  await ev(() => PB.commitText(PB.serialize().replace('riga60 coda60', 'riga60 {LX 77} coda60')));
  await page.locator('.page.script .tag', { hasText: 'LX 77' }).first().scrollIntoViewIfNeeded();
  await ev(() => { const g = Array.from(document.querySelectorAll('.page.script .tag b')).find(b => b.textContent === 'LX 77').parentNode, d = document.querySelector('#desk'); d.scrollTop += g.getBoundingClientRect().top - d.getBoundingClientRect().top - 300; });
  await frame();
  from = await tag('LX 77');
  const s2 = await top();
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.x - 300, dk.y + 15, { steps: 6 });
  const up = await page.waitForFunction(() => document.querySelector('#desk').scrollTop === 0, null, { timeout: 30000 }).then(() => true, () => false);
  ok(s2 > unit / 2 && up, 'held near the top edge the script scrolls back to its start');
  to = await word('uno');
  await page.mouse.move(to.cx, to.cy, { steps: 4 });
  await page.mouse.up();
  ok(count(await text(), 'uno {LX 77} due') === 1 && count(await text(), '{LX 77}') === 1, 'and the cue lands on a word of page 1');

  await done();
  srv.close();
})().catch(e => { console.log('Error: ' + (e && e.stack || e)); process.exit(1); });
