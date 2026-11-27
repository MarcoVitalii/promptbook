// Rehearse: the book is written in while the line is there (SHW-38 to SHW-42, SHW-45).
const { open, ok } = require('./_util');
(async () => {
  const { page, pen, done, text } = await open();
  const T = ['# ATTO PRIMO', '', 'ANNA: Chi è là? {LX 1 | lanterna} Rispondi!', 'MARCO: Sono io, con la lanterna in mano e il timone sulle spalle.', 'ANNA: Allora entra e chiudi la porta.', '',
    ...Array.from({ length: 30 }, (_, i) => 'ANNA: Battuta numero ' + i + ' con il timone in mano e la lanterna spenta sul molo.')].join('\n');
  await page.evaluate(t => PB.startMemory(t), T);
  await page.waitForSelector('.page .tag');
  const ev = f => page.evaluate(f);
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(60); };
  const word = async txt => (await page.locator('.page.script .w', { hasText: txt }).first().boundingBox());
  const tap = async b => { await page.mouse.click(b.x + 6, b.y + 8); await page.waitForTimeout(120); };
  const ink = () => ev(() => JSON.stringify(PB.inkFile()));
  const where = () => ev(() => { const p = PB.showNow(), L = PB.showTl().list; let i = 0; while (i + 1 < L.length && L[i + 1].at <= p + 1e-9) i++; return { i, f: (p - L[i].at) / L[i].w }; });
  const vis = sel => page.locator(sel).isVisible();

  // SHW-45, SHW-40: the whole bench; "Timing" brings the line
  ok(await ev(() => PB.S.phase) === 'rehearse' && !(await ev(() => PB.S.show.on)) && await page.locator('#showside').isHidden() && await vis('#bTiming'), 'Rehearse opens without the line: "Timing" is a toggle in the bar');
  await key('t');
  ok(await ev(() => PB.S.phase) === 'rehearse' && !(await ev(() => PB.showLocked())) && await ev(() => document.body.classList.contains('reh')), 'the book is in Rehearse and nothing is locked');
  ok(await vis('#bar') && await vis('#pens') && await vis('#bErase') && await vis('#bFinger') && await vis('#bUndo') && await vis('#bRedo') && await vis('#who'), 'the top bar has the pens, the eraser, undo, redo and the state of the save');
  ok(await vis('#bMenu') && await vis('#search') && await vis('#outline') && await vis('#bFacing') && await vis('#bList') && await vis('#bPrint') && await vis('#bRehearse'), 'and the menu, Find, the jump menu, the toggles, the cue list, print and the phase switch');
  ok(!(await vis('#bText')) && !(await vis('#bReview')), '"Text…" and Review belong to Write and are not there');
  ok(await vis('#showside') && await vis('#showLine') && await vis('#shProg') && await vis('#dock') && await vis('#shLearnBox') && await vis('#shMRough'), 'the panel with the ways of timing, the line, the map and the corner dock are there');
  ok(!(await vis('#shSlow')) && !(await vis('#shLeave')) && !(await vis('#shNight')), 'no pace of the night, no "Leave": those are of Show');
  ok(await ev(() => PB.S.view.facing) === true && await page.locator('.page.facing').first().isVisible() && await page.locator('#shCalls').isHidden(), 'the facing page stays as it was, and no cue is called in Rehearse');
  ok(await page.locator('.grip').count() > 0, 'blocks keep their grips: they can be moved');

  const i0 = await ink(), m = await word('Sono');
  await pen([[m.x, m.y + 4], [m.x + 40, m.y + 10], [m.x + 90, m.y + 5]]); await page.waitForTimeout(80);
  ok(await ink() !== i0, 'the pen draws');
  await key('Control+z');
  ok(await ink() === i0, 'Ctrl+Z takes the stroke back');
  await key('Control+y');
  ok(await ink() !== i0, 'Ctrl+Y puts it back');
  await key('Control+z');
  await key('e');
  ok(await page.locator('#bErase').evaluate(el => el.classList.contains('on')), 'E chooses the eraser');
  await key('e');

  let b = await word('Rispondi!');
  await tap(b);
  ok(await vis('#pop'), 'a tap on a word opens the cue pin');
  await page.locator('#pop .dbtn', { hasText: 'TODO' }).first().click(); await page.waitForTimeout(120);
  ok(/Rispondi! \{TODO/.test(await text()), 'and a note is pinned on the word: ' + (await text()).split('\n')[2]);
  await page.keyboard.type('più forte'); await key('Enter'); await page.waitForTimeout(450);
  const t1 = await text();
  ok(/\{TODO \| più forte\}/.test(t1) && !(await vis('#pop')), 'its text is typed and kept: ' + t1.split('\n')[2]);

  // SHW-39: the double tap is the mark
  ok((await where()).i === 0, 'the line is on the first block');
  b = await word('Sono');
  await page.mouse.click(b.x + 6, b.y + 8); await page.waitForTimeout(90); await page.mouse.click(b.x + 6, b.y + 8); await page.waitForTimeout(150);
  ok((await where()).i === 1, 'a double tap on a word puts the line in its block');
  ok(!(await vis('#pop')) && !(await vis('#editor')) && await text() === t1, 'the cue pin of its first tap is closed, nothing is pinned and no text is opened');
  await page.waitForTimeout(450);

  // SHW-42, SHW-47: an edit does not move the line; the phase cannot change while a text is open
  await ev(() => PB.showSet(PB.showTl().list[2].at + PB.showTl().list[2].w / 2));
  const w0 = await where();
  await tap(await word('Rispondi!'));
  await page.locator('#pop button', { hasText: 'Edit text' }).click(); await page.waitForTimeout(100);
  ok(await vis('#editor textarea'), '"Edit text" in the cue pin opens the text of the block');
  await page.click('#bShow'); await page.waitForTimeout(80);
  ok(await ev(() => PB.S.phase) === 'rehearse' && (await page.locator('#toast').textContent()) === 'Close the editor first.', 'the phase cannot change while a text is open, and a message says so');
  const ta = page.locator('#editor textarea');
  await ta.fill((await ta.inputValue()).replace('Chi è là?', 'Chi è là, a quest’ora della notte?'));
  await page.locator('#editor .btn.pri').click(); await page.waitForTimeout(150);
  const w1 = await where();
  ok((await text()).includes('a quest’ora della notte?') && w1.i === w0.i && Math.abs(w1.f - w0.f) < 1e-6, 'five words added above the line: the line is in the same block, as far in: ' + JSON.stringify([w0, w1]));
  ok((await ev(() => PB.S.show.cues.map(q => q.name).join())) === 'LX 1' && await ev(() => PB.S.blocks.includes(PB.S.show.cues[0].b)), 'the calls are those of the script as it is now');
  await key('Control+z');
  ok(!(await text()).includes('quest’ora') && Math.abs((await where()).f - w0.f) < 1e-6 && (await where()).i === w0.i, 'undo takes the edit back and the line stays');

  // SHW-46: Show locks the book and keeps the line; Leave comes back here
  await page.waitForTimeout(450);
  await page.click('#bShow'); await page.waitForTimeout(80);
  ok(await ev(() => PB.showLocked()) && await page.locator('#bar').isHidden() && !(await ev(() => document.body.classList.contains('reh'))), 'Show: read only, the top bar gone');
  ok((await where()).i === w0.i && Math.abs((await where()).f - w0.f) < 1e-6 && !(await ev(() => PB.S.show.playing)), 'the line is where the rehearsal left it, stopped');
  const t2 = await text();
  await tap(await word('Rispondi!'));
  ok(!(await vis('#pop')), 'a tap pins nothing');
  await key('Control+z');
  ok(await text() === t2, 'and undo does nothing');
  await key('s'); await key('s'); await page.waitForTimeout(80);
  ok(await ev(() => PB.S.phase) === 'rehearse' && await ev(() => document.body.classList.contains('reh')) && await vis('#bMenu') && (await where()).i === w0.i, 'leaving Show comes back to Rehearse, the whole top bar and the line still there');
  await done();
})();
