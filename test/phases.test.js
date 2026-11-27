// The three phases: Write as the whole text, Rehearse with "Timing" as a toggle, Show (SHW-43 to SHW-48, SHW-50, UI-14, TXT-32).
const { open, ok } = require('./_util');
(async () => {
  const { page, pen, done, text } = await open({ phase: 'write' });
  const T = ['# ATTO PRIMO', '', 'ANNA: Chi è là? {LX 1 | lanterna} Rispondi!', 'MARCO: Sono io, con la lanterna in mano e il timone sulle spalle.', 'ANNA: Allora entra e chiudi la porta.', '',
    ...Array.from({ length: 40 }, (_, i) => 'ANNA: Battuta numero ' + i + ' con il timone in mano e la lanterna spenta sul molo.')].join('\n');
  const load = async () => { await page.evaluate(t => PB.startMemory(t), T); await page.waitForTimeout(150); };
  await load();
  const ev = f => page.evaluate(f);
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(80); };
  const word = async txt => (await page.locator('.page.script .w', { hasText: txt }).first().boundingBox());
  const tap = async b => { await page.mouse.click(b.x + 6, b.y + 8); await page.waitForTimeout(120); };
  const vis = sel => page.locator(sel).first().isVisible();
  const phase = () => ev(() => PB.S.phase);
  const lit = () => ev(() => ['#bWrite', '#bRehearse', '#bShow'].filter(s => document.querySelector(s).classList.contains('on')).join());
  const pref = () => ev(() => JSON.parse(localStorage.getItem('promptbook:view') || '{}'));
  const ta = page.locator('#wtext');
  const box = () => ev(() => { const t = document.querySelector('#wtext'); return { v: t.value, a: t.selectionStart, e: t.selectionEnd, focus: document.activeElement === t }; });
  const comp = () => ev(() => { const c = document.querySelector('#wcomp'); return c.hidden ? null : [...c.children].map(d => d.textContent); });
  const t0 = await text();

  // SHW-43, SHW-44, UI-14: Write is the whole text
  ok(await phase() === 'write' && await lit() === '#bWrite' && await ev(() => document.body.classList.contains('write')), 'the first time, a show opens in Write, and the switch shows it');
  ok(await vis('#writer') && (await box()).v === t0 && (await box()).focus && await page.locator('#desk').isHidden(), 'Write is the whole script in one box, with the cursor in it, and no pages');
  ok(await vis('#bSyntax') && await vis('#outline') && await vis('#search') && await vis('#bList') && await vis('#bPrint') && !(await vis('#pens')) && !(await vis('#bUndo')) && !(await vis('#bFacing')) && !(await vis('#bTiming')), 'the top bar of Write: the phases, "Syntax", the jump menu, Find, the cue list, print; no pens, no undo, no toggles');
  ok(await page.locator('#showside').isHidden() && await page.locator('#shProg').isHidden() && !(await ev(() => PB.S.show.on)), 'no line, no panel, no map');
  await page.click('#bSyntax');
  ok(await vis('#wsyntax') && (await page.locator('#wsyntax').textContent()).includes('ANNA: Dialogue') && (await pref()).syntax === true, '"Syntax" shows the forms of the script beside the text, and the browser remembers it');
  await page.click('#bSyntax');
  ok(await page.locator('#wsyntax').isHidden(), 'and hides them again');

  // TXT-32: completion for characters and cues
  await ta.focus(); await ev(() => { const t = document.querySelector('#wtext'); t.setSelectionRange(t.value.length, t.value.length); });
  await page.keyboard.type('ma'); await page.waitForTimeout(80);
  ok((await comp() || []).join() === 'MARCO', 'at the start of a line the characters that fit are offered: ' + JSON.stringify(await comp()));
  await key('Enter');
  ok((await box()).v.endsWith('MARCO: ') && !(await comp()), 'Enter takes the name, with its colon');
  await page.keyboard.type('Vado {'); await page.waitForTimeout(80);
  const dl = await comp();
  ok(dl && dl[0].startsWith('LX') && dl[0].includes('next 2') && dl.some(x => x.startsWith('TODO')), 'after { the departments are offered, each with its next number: ' + JSON.stringify(dl));
  await key('Enter');
  const b1 = await box();
  ok(b1.v.endsWith('Vado {LX 2 | }') && b1.a === b1.v.length - 1, 'Enter puts the department and its number, the cursor before the brace: ' + JSON.stringify(b1.v.slice(-20)));
  await page.keyboard.type('buio'); await page.waitForTimeout(80);
  ok(!(await comp()), 'the margin text is typed with no list');
  await page.waitForTimeout(1700);
  ok((await text()).includes('MARCO: Vado {LX 2 | buio}') && await ev(() => PB.S.blocks.some(b => b.cues.some(c => c.dept === 'LX' && c.label === '2'))), 'after a pause what was typed is in the show, cue included');
  await ev(() => { const t = document.querySelector('#wtext'); t.setSelectionRange(t.value.length, t.value.length); });
  await page.keyboard.type(' via {/'); await page.waitForTimeout(80);
  ok((await comp() || []).join() === 'LX 2,LX 1', 'after {/ the cues open there are offered, newest first: ' + JSON.stringify(await comp()));
  await key('ArrowDown'); await key('Tab');
  ok((await box()).v.endsWith('via {/LX 1}'), 'Arrow down and Tab take the second');
  await page.keyboard.type('x'); await page.waitForTimeout(80);
  ok(!(await comp()), 'nothing fitting, no list');
  await key('Escape');
  ok(!(await box()).focus && (await text()).includes('{/LX 1}x'), 'Escape takes the cursor out of the box and commits');

  // out of the box the single keys act; Find and the jump menu work on the box
  await key('v');
  ok(await ev(() => PB.S.drawer) === 'review', 'V opens Review');
  await key('v');
  await key('?');
  let kt = await page.locator('#dlg table.keys').textContent();
  ok(kt.includes('Write: the text') && kt.includes('forms the script') && kt.includes('Review') && !kt.includes('Pen colour') && !kt.includes('Start or stop the line'), 'in Write ? lists the phases, Syntax, Review, and no pen or line: ' + kt);
  await key('Escape');
  await page.locator('#search').fill('timone'); await page.locator('#search').press('Enter'); await page.waitForTimeout(80);
  let bx = await box();
  ok(bx.v.slice(bx.a, bx.e) === 'timone' && bx.a === bx.v.indexOf('timone'), 'Find selects the first match in the box');
  await page.locator('#search').press('Enter'); await page.waitForTimeout(80);
  bx = await box();
  ok(bx.v.slice(bx.a, bx.e) === 'timone' && bx.a > bx.v.indexOf('timone'), 'Enter again the next one');
  await page.locator('#search').press('Escape');
  await page.selectOption('#outline', { index: 1 }); await page.waitForTimeout(80);
  bx = await box();
  ok(bx.a === 0 && bx.v.slice(bx.a, bx.e) === '# ATTO PRIMO', 'the jump menu selects the heading in the box');
  const tb = await ev(() => document.querySelector('#wtext').value);

  // SHW-45: Rehearse, "Timing" as a toggle
  await key('Escape'); await key('r');
  ok(await phase() === 'rehearse' && await lit() === '#bRehearse' && await ev(() => document.body.classList.contains('reh')) && (await pref()).phase === 'rehearse', 'R goes to Rehearse, and the browser remembers it');
  ok((await ev(() => PB.serialize())).includes('MARCO: Vado {LX 2 | buio} via {/LX 1}x') && await vis('#desk') && await page.locator('#writer').isHidden() && await ev(() => PB.S.blocks.some(b => b.cues.some(c => c.dept === 'LX' && c.label === '2'))), 'the text of the box is the show, and the pages are back with the new cue');
  ok(await vis('#pens') && await vis('#bErase') && await vis('#bFinger') && await vis('#bUndo') && await vis('#bFacing') && await vis('#bTiming') && !(await vis('#bSyntax')) && !(await vis('#bReview')), 'the top bar of Rehearse: the pens, undo, the toggles with "Timing"; no Syntax, no Review');
  ok(!(await ev(() => PB.S.show.on)) && await page.locator('#showside').isHidden() && await page.locator('#showLine').isHidden() && await ev(() => PB.S.view.facing) === true, 'without "Timing" there is no line and no panel; the facing page is as it was');
  let b = await word('Rispondi!');
  await tap(b);
  ok(await vis('#pop') && await page.locator('#editor').isHidden(), 'a tap on a word opens the cue pin');
  await key('Escape');
  await key('t');
  ok(await ev(() => PB.S.show.on && PB.S.show.learn && !PB.S.show.playing) && await vis('#showside') && await vis('#shProg') && await vis('#showLine') && await vis('#shLearnBox') && await vis('#shPlay') && (await pref()).timing === true, 'T brings the line, stopped, the panel with the clock, Start and the ways of timing, and the map; the browser remembers it');
  ok(await page.locator('#shCalls').isHidden() && !(await vis('#shSlow')) && !(await vis('#shLeave')) && await ev(() => document.querySelectorAll('.tag[data-st]').length) === 0, 'no call, no pace of the night, no "Leave" in Rehearse');
  ok(await ev(() => PB.S.view.facing) === true && await vis('.page.facing'), 'the facing page stays');
  await key('?');
  kt = await page.locator('#dlg table.keys').textContent();
  ok(kt.includes('Start or stop the line') && kt.includes('Pen colour') && kt.includes('each block learns its time') && !kt.includes('Review'), 'in Rehearse ? lists the keys of the line, of the pens and T: ' + kt);
  await key('Escape');
  await key(' ');
  ok(await ev(() => PB.S.show.playing), 'Space starts the line');
  await key('t');
  ok(!(await ev(() => PB.S.show.on)) && await page.locator('#showside').isHidden() && await page.locator('#showLine').isHidden(), 'T again takes the line and the panel away');
  await key(' ');
  ok(!(await ev(() => PB.S.show.on || PB.S.show.playing)), 'and Space does nothing without the line');
  await key('t');

  // SHW-46, SHW-50: Show from Rehearse keeps the line and shows the calls; Leave comes back
  await ev(() => { PB.showSet(PB.showTl().list[5].at); PB.showBack(); });
  await key('s');
  ok(await phase() === 'show' && await page.locator('#bar').isHidden() && await page.locator('#dock').isHidden() && !(await ev(() => PB.S.show.learn)) && !(await ev(() => PB.S.view.facing)), 'S goes to Show: the bar and the dock go, nothing is learned, the script is alone');
  ok(Math.abs(await ev(() => PB.showNow() - PB.showTl().list[5].at)) < 1e-6 && !(await ev(() => PB.S.show.playing)), 'the line is where Rehearse left it, stopped');
  ok(await vis('#shCalls') && await page.locator('#shCalls .call').count() > 0 && await vis('#shSlow'), 'the calls and the pace of the night are there');
  ok((await pref()).phase === 'rehearse', 'the browser never remembers Show');
  await key('w'); await key('r');
  ok(await phase() === 'show', 'W and R do nothing in Show');
  await key('s'); await key('s');
  ok(await phase() === 'rehearse' && await ev(() => PB.S.view.facing) === true && Math.abs(await ev(() => PB.showNow() - PB.showTl().list[5].at)) < 1e-6, 'S twice leaves Show back to Rehearse, the facing page and the line as they were');

  // SHW-47: Write stops the line and keeps what was timed
  await ev(() => { PB.S.cfg.show.times.x = 12; PB.showPlay(true); });
  await key('w');
  ok(await phase() === 'write' && !(await ev(() => PB.S.show.on)) && await page.locator('#showside').isHidden() && await ev(() => PB.S.cfg.show.times.x) === 12 && (await pref()).phase === 'write' && (await box()).focus, 'W stops the line, hides the panel, keeps the times, opens the box, and the browser remembers Write');
  await key('Escape'); await key('s');
  ok(await phase() === 'show' && await ev(() => PB.showNow()) === 0, 'S from Write enters Show with the line on the block being read');
  await key('s'); await key('s');
  ok(await phase() === 'write' && await vis('#writer'), 'and leaving goes back to Write');

  // SHW-43: the browser remembers Write or Rehearse across a reload; another show opens in it
  await key('Escape'); await key('r');
  await page.reload(); await page.waitForSelector('#start .card');
  await page.getByText('Try the sample scene').click(); await page.waitForSelector('.page.script .row'); await page.waitForTimeout(100);
  ok(await phase() === 'rehearse' && await vis('#pens') && await ev(() => PB.S.show.on) && await vis('#showside'), 'after a reload the sample opens in Rehearse with Timing on, as the browser was left');
  await key('w');
  await load();
  ok(await phase() === 'write' && await vis('#writer'), 'another show opens in Write once Write was chosen');
  await done();
})();
