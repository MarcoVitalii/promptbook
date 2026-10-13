// r1.11: show mode. Read only, focus, the line, the page in steps, timing in rehearsal, the calls, the map (SHW-1 to 26).
const { open, ok } = require('./_util');
const OUT = process.env.OUT;
(async () => {
  const { page, pen, done, text } = await open();
  const T = ['# ATTO PRIMO', '', 'ANNA: Chi è là? {LX 1 | lanterna} Rispondi!', 'MARCO: Sono io.', '',
    ...Array.from({ length: 120 }, (_, i) => (i === 60 ? '# ATTO SECONDO\n\n' : '') + 'ANNA: Battuta numero ' + i + ' con il timone in mano e la lanterna spenta sul molo.' + (i === 40 ? ' {SND 7 | sirena} {LX 8}' : '') + (i === 44 ? ' {LX 9}' : ''))].join('\n');
  await page.evaluate(t => PB.startMemory(t), T);
  await page.waitForSelector('.page .tag');
  const ev = f => page.evaluate(f);
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(60); };
  const top = () => ev(() => document.querySelector('#desk').scrollTop);
  const lineY = () => ev(() => parseFloat(document.querySelector('#showLine').style.top));
  const sh = () => ev(() => { const s = PB.S.show; return { on: s.on, playing: s.playing, follow: s.follow, pos: PB.showNow() }; });
  const later = s => page.evaluate(s => { PB.S.show.t0 -= s * 1000; PB.showTick(); }, s);   // the clock, s seconds on
  const cards = () => ev(() => [...document.querySelectorAll('#shCalls .call')].map(c => c.className.replace('call ', '') + ' ' + [...c.querySelectorAll('.chip')].map(x => x.textContent).join('+') + ' ' + (c.querySelector('.cd') || {}).textContent).join(', '));
  const word = async (txt, n = 0) => (await page.locator('.page.script .w', { hasText: txt }).nth(n).boundingBox());
  const box = sel => page.locator(sel).boundingBox();
  const off = () => ev(() => document.querySelector('#showLine').getBoundingClientRect().top - document.querySelector('#desk').getBoundingClientRect().top);
  const hgt = () => ev(() => document.querySelector('#desk').clientHeight);
  const t0 = await text(), z0 = await ev(() => PB.S.view.zoom);

  // SHW-1, SHW-3: entering, focus
  ok(await page.locator('#showside').isHidden() && await page.locator('#shProg').isHidden() && await page.locator('#showLine').isHidden(), 'outside show mode there is no panel, no map and no line');
  ok(await ev(() => PB.S.view.facing) === true, 'the facing page is shown before the show');
  await page.click('#bShow'); await page.waitForTimeout(80);
  ok((await sh()).on && await page.locator('#showside').isVisible() && await page.locator('#shProg').isVisible(), '"Show" enters show mode and brings the panel and the map');
  ok(await page.locator('#bar').isHidden() && await page.locator('#dock').isHidden() && await page.locator('#banner').isHidden(), 'the top bar, the corner dock and the banner are gone');
  ok(await ev(() => PB.S.view.facing) === false && await page.locator('.page.facing').first().isHidden() && await ev(() => PB.S.view.zoom) > z0, 'the facing page is gone and the script is larger: ' + await ev(() => PB.S.view.zoom));
  ok(await page.locator('#showLine').isVisible() && !(await sh()).playing && (await sh()).pos === 0, 'the line is on the first block, stopped');
  const bd = await box('#showBand'), ln = await box('#showLine'), r0 = await page.locator('.page.script .row').nth(1).boundingBox();
  ok(await page.locator('#showBand').isVisible() && Math.abs(bd.y - r0.y) < 10 && Math.abs(bd.height - r0.height) < 10 && bd.width > 900 && ln.width < 60 && ln.x === bd.x, 'the block the line is in is lit across the page, and the line is a small mark on its left edge: ' + JSON.stringify([bd, ln, r0]));
  ok((await cards()).startsWith('standby LX 1 0:0'), 'a cue a few words ahead is in standby from the start: ' + await cards());

  // SHW-2: read only
  let b = await word('Rispondi!');
  await page.mouse.click(b.x + 8, b.y + 8); await page.waitForTimeout(120);
  ok(await page.locator('#pop').isHidden(), 'a tap on a word pins nothing');
  await page.waitForTimeout(450);
  await page.locator('.page.script .tag', { hasText: 'LX 1' }).first().click(); await page.waitForTimeout(120);
  ok(await page.locator('#pop').isHidden(), 'a tap on a cue tag opens no cue editor');
  const tg = await page.locator('.page.script .tag', { hasText: 'LX 1' }).first().boundingBox(), mb = await word('Sono');
  await page.mouse.move(tg.x + 8, tg.y + 8); await page.mouse.down(); await page.mouse.move(tg.x - 60, tg.y + 20, { steps: 4 }); await page.mouse.move(mb.x + 6, mb.y + 8, { steps: 4 }); await page.mouse.up();
  ok(await text() === t0, 'a cue tag cannot be dragged');
  await pen([[b.x - 40, b.y + 60], [b.x + 20, b.y + 70], [b.x + 90, b.y + 62]]);
  ok(await ev(() => PB.S.ink.size) === 0 && await ev(() => document.querySelectorAll('.page.script svg.ink path').length) === 0, 'the pen draws no ink');
  await key('e'); await key('f'); await key('b'); await key('r'); await key('2');
  ok(await ev(() => PB.S.tool.mode) === 'pen' && await ev(() => PB.S.tool.finger) === false && await ev(() => PB.S.view.facing) === false && await ev(() => PB.S.drawer) === null, 'the keys of the editing tools, of the facing page and of Review do nothing');
  await page.keyboard.press('Control+z');
  ok(await text() === t0 && await ev(() => PB.S.hist.length) === 0, 'nothing was changed and nothing is there to undo');

  // SHW-9: a double tap puts the line on a word
  b = await word('numero', 3);
  await page.mouse.click(b.x + 8, b.y + 8); await page.waitForTimeout(60); await page.mouse.click(b.x + 8, b.y + 8); await page.waitForTimeout(120);
  const p3 = (await sh()).pos;
  ok(p3 > 20 && await ev(() => PB.S.editing) === false && await page.locator('#editor').isHidden(), 'a double click on a word puts the line there and opens no editor: ' + p3);
  const y3 = await lineY();
  b = await word('numero', 3);
  ok(Math.abs((await ev(() => document.querySelector('#showLine').getBoundingClientRect().top)) - b.y) < 30, 'the line is drawn at that block');
  await key('ArrowDown');
  const p4 = (await sh()).pos;
  ok(p4 > p3 && await lineY() > y3, 'Arrow down moves the line to the next block');
  await key('ArrowUp'); await key('ArrowUp');
  ok((await sh()).pos < p3, 'Arrow up moves it back');

  // SHW-5, 7, 8: running; the page stands still, then jumps a third; leaving the line and coming back
  await ev(() => { PB.showSet(PB.showTl().list[20].at); PB.showBack(); });
  const third = await hgt() / 3;
  ok(Math.abs(await off() - third) < 12, 'a line put somewhere else is shown a third of the way down the window: ' + await off() + ' of ' + third);
  await key(' ');
  ok((await sh()).playing, 'Space starts the line');
  const a = await sh(), s0 = await top(); await later(4); const c = await sh();
  ok(Math.abs(c.pos - a.pos - 130 / 15) < 0.5, 'in 4 seconds the line covers 4 seconds of words at 130 a minute: ' + (c.pos - a.pos));
  ok(await top() === s0 && await off() > third + 10 && c.follow, 'the page stands still while the line goes down it: ' + await off());
  let n = 0; while (await top() === s0 && n++ < 60) await later(4);
  const jump = await top() - s0;
  ok(jump >= third - 2 && jump < third + 90, 'once the line is two thirds down, the page jumps a third of the window: ' + jump + ' of ' + third);
  ok(await off() >= third - 12 && await off() < third + 90 && (await sh()).follow, 'which puts the line a third of the way down again: ' + await off());
  ok(await page.locator('#shBack').isHidden(), 'while the line is followed there is no "Back to the line"');
  await page.mouse.move(600, 500); await page.mouse.wheel(0, 900); await page.waitForTimeout(250);
  ok(!(await sh()).follow && await page.locator('#shBack').isVisible(), 'scrolling lets go of the line and shows "Back to the line"');
  const s2 = await top(), p5 = (await sh()).pos; await later(30);
  ok(Math.abs(await top() - s2) < 2 && (await sh()).pos > p5 + 60, 'the page stays where it was put and the line keeps running');
  await key('Enter'); await page.waitForTimeout(80);
  ok((await sh()).follow && Math.abs(await off() - third) < 12 && await page.locator('#shBack').isHidden(), 'Enter returns to the line');
  await key('PageDown'); await page.waitForTimeout(250);
  ok(!(await sh()).follow, 'Page Down lets go of the line too');
  await page.click('#shBack'); await page.waitForTimeout(80);
  ok((await sh()).follow, '"Back to the line" returns to it');
  await key(' ');
  ok(!(await sh()).playing, 'Space stops the line');
  const p6 = (await sh()).pos; await later(30);
  ok((await sh()).pos === p6, 'a stopped line stays');

  // SHW-12 to 15: the calls
  const at = name => page.evaluate(n => PB.S.show.cues.find(q => q.name === n).at, name);
  const put = async pos => { await page.evaluate(p => { PB.showSet(p); PB.showBack(); }, pos); };
  const snd = await at('SND 7'), lx9 = await at('LX 9');
  await put(snd - 130 * 5);
  ok(await cards() === 'later SND 7+LX 8 5:00, later LX 9 5:30', 'far from any cue the next ones are named with the time to each, cues on the same word as one call: ' + await cards());
  await put(snd - 130 * 1.5);
  ok(await cards() === 'warning SND 7+LX 8 1:30, warning LX 9 2:00', 'within two minutes cues are in warning: ' + await cards());
  ok((await page.locator('#shCalls .call').first().textContent()).includes('sirena'), 'a call shows the margin text of its cue');
  await put(snd - 130 / 3);
  ok(/^standby SND 7\+LX 8 0:20, warning LX 9 0:50$/.test(await cards()), 'within 30 seconds it is in standby, the next one in warning: ' + await cards());
  ok(await ev(() => document.querySelector('.tag[data-st=standby]').textContent.includes('SND 7')) && await ev(() => document.querySelectorAll('.tag[data-st=warning]').length) === 1, 'and the tags of those cues are marked on the page');
  if (OUT) await page.screenshot({ path: OUT + '/show-book.png' });
  await put(snd + 2);
  ok((await cards()).startsWith('go SND 7+LX 8 , standby LX 9 0:2'), 'a cue just passed is shown as GO: ' + await cards());
  await put(lx9 + 130);
  ok(await page.locator('#shCalls').textContent() === 'No more cues' && await ev(() => document.querySelectorAll('.tag[data-st]').length) === 0, 'after the last cue the panel says so, and no tag stays marked');

  // SHW-24, 25: the length of the show, the map
  await put(snd);
  const ck = await ev(() => PB.showClock());
  ok(/^\d+′\/ \d+′\d+′ left · ends ~\d\d:\d\d$/.test(await page.locator('#shClock').textContent()), 'the panel shows how far the show is, how long, what is left and when it would end: ' + await page.locator('#shClock').textContent());
  ok(Math.abs(ck.total - await ev(() => PB.showTl().total) / 130 * 60000) < 1 && ck.at > 0 && Math.abs(ck.left - (ck.total - ck.at)) < 1, 'the length of the show is the sum of the block times');
  ok(await page.locator('#shProg .seg').count() === 2 && await page.locator('#shProg .seg.act').count() === 2 && await page.locator('#shProg .tick').count() === 4, 'the map has a stretch per scene and a tick per cue');
  ok(Math.abs(parseFloat(await ev(() => document.querySelector('#shProg').style.getPropertyValue('--p'))) - ck.at / ck.total * 100) < 0.2, 'and marks how far the line is');
  let m = await box('#shProg');
  const sA = await box('#shProg .seg >> nth=0'), sB = await box('#shProg .seg >> nth=1');
  ok(m.height > 500 && m.x > 1400 && Math.abs(sA.height / sB.height - 62 / 60) < 0.1, 'the map is a spine down the right edge, each stretch as long as its time: ' + sA.height + ', ' + sB.height);
  const s3 = await top();
  await page.mouse.click(m.x + m.width / 2, m.y + m.height * 0.8); await page.waitForTimeout(150);
  ok(await top() > s3 + 2000 && !(await sh()).follow && Math.abs((await sh()).pos - snd) < 1e-6, 'a press on the map shows that place and leaves the line where it is');
  await key('Enter');

  // SHW-10, 11: the pace of the night
  ok(await page.locator('#shWpm').textContent() === '100%', 'the pace of the night starts at 100%');
  await key(']');
  ok(await ev(() => PB.S.show.tempo) === 1.05 && await page.locator('#shWpm').textContent() === '105%' && await ev(() => PB.S.cfg.show.wpm) === 130, '] makes the line 5% faster and leaves the pace of the show alone');
  await page.click('#shSlow'); await page.click('#shSlow');
  ok(await ev(() => PB.S.show.tempo) === 0.95, 'the − button makes it slower');
  ok(await page.locator('#shUse').isHidden(), 'no measured pace is offered before there is one');
  await ev(() => { PB.S.show.cal = { want: 108000, ms: 120000 }; PB.showTick(); });
  ok(await page.locator('#shUse').isVisible() && (await page.locator('#shUse').textContent()).includes('90%'), 'after a measured run the panel offers its pace: ' + await page.locator('#shUse').textContent());
  await page.click('#shUse');
  ok(await ev(() => PB.S.show.tempo) === 0.9 && await page.locator('#shUse').isHidden(), 'one press adopts it');
  await key(']'); await key(']');

  // SHW-20, 22: timing in rehearsal
  ok(!(await ev(() => PB.S.show.learn)) && await page.locator('#shLearnBox').isHidden(), '"Time it" is off when show mode is entered');
  await page.click('#shLearn');
  ok(await page.locator('#shLearnBox').isVisible() && /^This block: ~7\.4 s, estimated$/.test(await page.locator('#shBlk').textContent()) && await page.locator('#shShare').textContent() === '0% of the show timed', 'with it on, the panel shows the time of the block the line is in and how much is timed: ' + await page.locator('#shBlk').textContent());
  await put(await ev(() => PB.showTl().list[10].at)); await ev(() => { PB.S.show.anchor = null; }); await key(' ');   // the line is started where the chunk starts
  await later(30); await key('ArrowDown'); await key(' ');   // the show is only at the start of the next block but one
  const tm = await ev(() => PB.S.cfg.show.times), lst = await ev(() => PB.showTl().list.slice(10, 20).map(e => e.own));
  ok(Object.keys(tm).length > 0 && lst[0] && Math.abs(Object.values(tm).reduce((x, y) => x + y, 0) - 30) < 0.3, 'a mark while the line runs times the blocks since the mark before: ' + JSON.stringify(tm));
  ok(/^Timed 30(\.\d)? s, was \d/.test(await page.locator('#shLast').textContent()) && await page.locator('#shUndo').isVisible(), 'the panel says what was timed: ' + await page.locator('#shLast').textContent());
  ok(await ev(() => PB.S.store.dirty.cfg) === true || await ev(() => PB.S.store.mode) !== 'none', 'and the times are saved with the show');
  await page.click('#shUndo');
  ok(Object.keys(await ev(() => PB.S.cfg.show.times)).length === 0 && await page.locator('#shUndo').isHidden(), '"Undo" takes the chunk back');
  await page.click('#shUp');
  ok(/^This block: 12\.4 s, timed$/.test(await page.locator('#shBlk').textContent()) && Object.values(await ev(() => PB.S.cfg.show.times)).join() === '12.4', '+5 s sets the time of the block the line is in: ' + await page.locator('#shBlk').textContent());
  await page.click('#shLearn');
  ok(await page.locator('#shLearnBox').isHidden(), '"Time it" off hides its box');

  // SHW-29: a press on a call shows its place
  await put(snd - 130 * 5);
  const s5 = await top(), p7 = (await sh()).pos; await key(' '); await later(2); const p8 = (await sh()).pos;
  await page.locator('#shCalls .call').first().click(); await page.waitForTimeout(150);
  const tb = await page.locator('.page.script .tag', { hasText: 'SND 7' }).first().boundingBox();
  ok(await top() > s5 + 500 && tb && tb.y > 0 && tb.y < 800 && !(await sh()).follow && await page.locator('#shBack').isVisible(), 'a press on a call shows the place of its cue: ' + (await top() - s5));
  ok((await sh()).playing && Math.abs((await sh()).pos - p8) < 1 && p8 > p7 && Object.keys(await ev(() => PB.S.cfg.show.times)).length === 1, 'the line runs on from where it was, and nothing is timed');
  await key(' '); await key('Enter');

  // SHW-26: the rail
  const side = await box('#showside');
  ok(side.width === 300 && side.x > 1100 && (await box('#desk')).width <= side.x, 'the panel is a rail on the right of the script');

  // SHW-3: what still works
  await key('n');
  ok(await ev(() => PB.S.view.night) === true, 'N still switches night mode');
  if (OUT) await page.screenshot({ path: OUT + '/show-night.png' });
  ok(JSON.parse(await ev(() => localStorage.getItem('promptbook:view'))).facing === true, 'the facing page is not forgotten by the device while the show hides it');
  await page.click('#shNight');
  ok(await ev(() => PB.S.view.night) === false, 'and so does its button in the panel');
  await key('l');
  ok(await ev(() => PB.S.drawer) === 'cues', 'L still opens the cue list');
  await key('l');

  // SHW-30: ? lists the keys of show mode only
  await key('?');
  let kt = await page.locator('#dlg table.keys').textContent();
  ok(kt.includes('Start or stop the line') && kt.includes('Leave show mode') && !kt.includes('Undo') && !kt.includes('Eraser') && !kt.includes('Find'), 'in show mode ? lists the keys of show mode and none of the editing ones: ' + kt);
  await key('s');
  ok((await sh()).on && !(await ev(() => PB.S.show.leave)), 'no key acts behind that list');
  await key('Escape');
  await key('s');
  ok((await sh()).on && (await page.locator('#shLeave').textContent()) === 'Press again to leave', 'S asks to leave, as one press on "Leave" does');
  await key('s'); await page.waitForTimeout(80);
  ok(!(await sh()).on, 'S again leaves show mode');
  await key('?'); kt = await page.locator('#dlg table.keys').textContent();
  ok(kt.includes('Undo') && kt.includes('Show mode') && !kt.includes('Start or stop the line'), 'outside show mode ? lists the editing keys, S among them, and none of show mode');
  await key('Escape'); await key('s'); await page.waitForTimeout(80);
  ok((await sh()).on && await page.locator('#showside').isVisible(), 'S enters show mode');

  // SHW-1: leaving takes two presses
  await page.click('#shLeave');
  ok((await sh()).on && (await page.locator('#shLeave').textContent()) === 'Press again to leave', 'one press on "Leave" only asks for a second one');
  await page.click('#shLeave'); await page.waitForTimeout(80);
  ok(!(await sh()).on && await page.locator('#showside').isHidden() && await page.locator('#shProg').isHidden() && await page.locator('#showLine').isHidden() && await page.locator('#bar').isVisible(), 'the second press leaves show mode');
  ok(await ev(() => PB.S.view.facing) === true && await ev(() => PB.S.view.zoom) === z0, 'the facing page and the zoom are as they were');
  await page.waitForTimeout(450);
  await key('Home'); await page.waitForTimeout(150);
  b = await word('Rispondi!');
  await page.mouse.click(b.x + 4, b.y + 8); await page.waitForTimeout(120);
  ok(await page.locator('#pop').isVisible(), 'and a tap on a word pins a cue again');
  await key('Escape');
  ok(await text() === t0, 'the script is as it was before the show');

  // Settings hold the pace, the two times, and can forget the timed blocks
  await page.click('#bMenu'); await page.locator('#menu button', { hasText: 'Settings' }).click();
  await page.locator('#dlg .snav button', { hasText: 'Show mode timings' }).click();
  const nums = page.locator('#dlg input[type=number]');
  ok(await nums.count() === 3 && await nums.nth(0).inputValue() === '130', 'Settings show the pace of blocks not timed: ' + await nums.nth(0).inputValue());
  await page.locator('#dlg button', { hasText: 'Forget 1 timed blocks' }).click();
  await nums.nth(1).fill('45'); await nums.nth(2).fill('0');
  await page.locator('#dlg .btn.pri').click();
  ok(await ev(() => JSON.stringify(PB.S.cfg.show)) === '{"wpm":130,"standby":45,"warning":0,"times":{}}', 'and save the standby and warning times, and forget the timed blocks when asked: ' + await ev(() => JSON.stringify(PB.S.cfg.show)));
  await done();
})();
