// r1.10: notes for the cast, "Send to cast…", and the script for the actors (promptbook-cast.html).
const { ok, open } = require('./_util');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.resolve(__dirname, '..', '.cache', 'out');
(async () => {
  const { page, ctx, text, errs, done } = await open();
  const ev = f => page.evaluate(f);
  const menu = async label => { await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: label }).click(); };
  const SRC = '---\ntitle: Il molo\ncharacters:\n  - ANNA/A - la figlia\n  - MARCO\n---\n# ATTO PRIMO\n\n(Buio. Si sente il mare.)\n\n'
    + 'ANNA: Chi è là? Rispondi subito! {LX 1 | luce}\nMARCO: Sono io, non gridare.\n%%\nMARCO: Battuta tagliata.\n%%\n'
    + 'ANNA e MARCO: Insieme adesso.\nTUTTI: Coro finale.\nANNA: Ultima battuta di Anna. {TODO | rivedere}\n';
  await page.evaluate(s => PB.startMemory(s, {}), SRC);
  await page.waitForSelector('.page.script .row');

  // 1. main tool: a department for the cast, added from the dialog
  await menu('Send to cast');
  ok(await page.locator('#dlg .btn', { hasText: 'Add a “Notes” department' }).count() === 1, 'with no cast department the dialog offers to add one');
  await page.locator('#dlg .btn', { hasText: 'Add a “Notes” department' }).click();
  const d1 = await ev(() => PB.S.cfg.departments.filter(d => d.cast).map(d => d.code + ':' + d.review).join());
  ok(d1 === 'NOTE:true', 'the department is added, for the cast and under Review: ' + d1);
  ok((await page.locator('#dlg .body').textContent()).includes('No note for the cast yet'), 'the dialog says that no note is waiting');
  await page.locator('#dlg .btn', { hasText: 'Close' }).click();

  await menu('Settings');
  await page.locator('#dlg .snav button', { hasText: 'Departments' }).click();
  const boxes = () => page.evaluate(() => Array.from(document.querySelectorAll('#dlg .drow')).map(r => r.querySelectorAll('input[type=checkbox]')[1].checked ? 'c' : '-').join(''));
  ok(await boxes() === '----c', 'Settings shows which department is for the cast: ' + await boxes());
  await page.locator('#dlg .drow').nth(2).locator('input[type=checkbox]').nth(1).check();
  await page.locator('#dlg .btn', { hasText: 'Save' }).click();
  const d1b = await ev(() => PB.S.cfg.departments.map(d => d.code + (d.cast ? '*' : '') + (d.review ? '!' : '')).join());
  ok(d1b === 'LX,SND,VID*!,TODO!,NOTE*!', 'ticking "Cast" on a department makes it a cast and review department: ' + d1b);
  await ev(() => { PB.S.cfg.departments[2].cast = false; PB.S.cfg.departments[2].review = false; });

  // 2. a note for one actor: the label is who it is for, picked from the characters
  await ev(() => PB.jumpTo(PB.S.blocks.find(b => b.plain.includes('subito'))));
  await page.locator('.w', { hasText: 'subito!' }).first().click();
  await page.locator('#pop .depts .dbtn', { hasText: 'NOTE' }).click();
  await page.waitForSelector('#pop .who .chip');
  ok((await page.locator('#pop .who .chip').allTextContents()).join() === 'Everyone,ANNA,MARCO', 'the note box offers everyone and the characters of the script');
  ok((await page.locator('#pop .pin').first().getAttribute('placeholder')) === 'For: blank = ANNA' && await page.locator('#pop .who .chip.on').count() === 0, 'left blank, the note is for whoever speaks the line');
  await page.locator('#pop .who .chip', { hasText: 'Everyone' }).click();
  ok(await page.locator('#pop .pin').first().inputValue() === 'EVERYONE', '"Everyone" overrides the speaker');
  await page.locator('#pop .who .chip', { hasText: 'MARCO' }).click();
  ok(await page.locator('#pop .pin').first().inputValue() === 'MARCO', 'and a name overrides both');
  await page.keyboard.type('più piano');
  await page.keyboard.press('Enter');
  ok((await text()).includes('{NOTE MARCO | più piano}'), 'the note is a token in the script, its label the addressee: ' + JSON.stringify((await text()).split('\n')[10]));
  await page.evaluate(() => PB.commitText(PB.serialize().replace('non gridare.', 'non gridare. {NOTE | pausa prima}').replace('Coro finale.', 'Coro finale. {NOTE | guarda il pubblico}').replace('Si sente il mare.)', 'Si sente il mare.) {NOTE | silenzio in quinta}')));
  const r2 = await ev(() => [PB.collectCues().map(o => o.c.dept).join(), PB.collectCues(true).map(o => o.c.dept).join()]);
  ok(r2[0] === 'LX' && r2[1] === 'NOTE,NOTE,NOTE,NOTE,TODO', 'notes for the cast are not cues; they are listed under Review: ' + r2.join(' | '));
  await page.locator('#bReview').click();
  ok((await page.locator('#drawer h3').allTextContents()).some(s => s.startsWith('Notes for the cast (4)')), 'Review lists them under a heading of their own');
  await page.locator('#bReview').click();

  // 3. the cast file: the reader with the show inside
  await menu('Send to cast');
  ok((await page.locator('#dlg .body').textContent()).includes('Everyone ×1  ·  MARCO ×2  ·  TUTTI ×1'), 'the dialog counts the notes per addressee, the speaker when none is named');
  const dl = page.waitForEvent('download');
  await page.locator('#dlg .btn', { hasText: '.html' }).click();
  const d = await dl, file = path.join(OUT, 'cast-test.html');
  await d.saveAs(file);
  ok(d.suggestedFilename() === 'il-molo-cast.html', 'the file is named after the show: ' + d.suggestedFilename());
  const html = fs.readFileSync(file, 'utf8');
  const a0 = html.indexOf('id="pack">') + 10, inside = html.slice(a0, html.indexOf('<' + '/script', a0));
  ok(JSON.parse(inside).notes.length === 4 && !inside.includes('rivedere') && !inside.includes('tagliata') && !inside.includes('luce'), 'the show is inside the file; no to-do note, comment or cue leaves the prompt book');

  const cp = await ctx.newPage();
  cp.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  cp.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await cp.setViewportSize({ width: 390, height: 800 });
  await cp.goto('file://' + file);
  await cp.waitForSelector('#text .b');
  const cv = f => cp.evaluate(f);
  const closeSheet = () => cp.locator('#sheet header .btn').click();
  const shownText = await cp.locator('#text .tx').allTextContents();
  ok(shownText.join('|').includes('Chi è là? Rispondi subito!') && (await cp.locator('.meta').textContent()).includes('Il molo') && !/[{}]|tagliata/.test(shownText.join('|')), 'the cast file shows the script, title page included, with no token');
  ok(await cv(() => document.documentElement.scrollWidth <= window.innerWidth), 'nothing runs off a phone screen');
  // the file carries the policy of the prompt book, without images or fetch: it asks no host for anything (STO-22, CST-7)
  const e0 = errs.length;
  const refused = await cv(async () => {
    const seen = [], on = e => seen.push(e.effectiveDirective); document.addEventListener('securitypolicyviolation', on);
    const f = await fetch('http://127.0.0.1:9/beacon').then(() => 'sent', () => 'refused');
    const i = await new Promise(r => { const im = new Image(); im.onload = () => r('loaded'); im.onerror = () => r('refused'); im.src = 'http://127.0.0.1:9/beacon.png'; });
    for (let n = 0; n < 80 && seen.length < 2; n++) await new Promise(r => setTimeout(r, 25));
    document.removeEventListener('securitypolicyviolation', on);
    return [f, i, seen.sort().join()].join(' ');
  });
  const said = errs.splice(e0);
  ok(refused === 'refused refused connect-src,img-src' && said.length >= 2 && said.every(e => /Content Security Policy/.test(e)), 'the cast file refuses a fetch and an image from a host: ' + refused);
  ok(await cp.locator('.note.in').count() === 4, 'before a part is ticked every note is there');
  const n3 = await cv(() => Array.from(document.querySelectorAll('.note.in')).map(n => n.closest('.b').className.split(' ')[1] + '>' + n.querySelector('.nh').textContent).join('|'));
  ok(n3 === 'action>Notes|speech>Notes · for MARCO|speech>Notes · for MARCO|speech>Notes · for TUTTI', 'a note belongs to its whole block and names who wrote it and who it is for: ' + n3);

  // 3b. notes are beside the text: the page is as long with them as without
  const tops = () => cp.evaluate(() => Array.from(document.querySelectorAll('#text .b')).map(b => b.offsetTop + ':' + b.offsetHeight).join());
  const withNotes = await tops();
  await cv(() => { const n = PBC.C.notes; PBC.C.notes = []; PBC.render(); PBC.C.keep = n; });
  const without = await tops();
  await cv(() => { PBC.C.notes = PBC.C.keep; PBC.render(); });
  ok(withNotes === without, 'on a phone every block is where it is without notes');
  ok(await cp.locator('.side .dot:visible').count() === 4 && await cp.locator('.side .note:visible').count() === 0, 'on a phone a block with notes shows one round button in the margin');
  ok((await cp.locator('.b.speech', { hasText: 'Chi è là' }).locator('.dot').textContent()) === '1' && await cp.locator('.dot.new').count() === 4, 'the button counts the notes of its block and is filled while one is unread');
  await cp.setViewportSize({ width: 1200, height: 800 });
  const wide1 = await tops();
  await cv(() => { PBC.C.notes = []; PBC.render(); });
  const wide0 = await tops();
  await cv(() => { PBC.C.notes = PBC.C.keep; PBC.render(); });
  ok(wide1 === wide0, 'on a wide screen too');
  const geo = await cv(() => Array.from(document.querySelectorAll('.side')).map(s => { const r = s.getBoundingClientRect(), t = s.parentElement.querySelector('.tx').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), r.left >= t.right]; }));
  ok(await cp.locator('.side .note:visible').count() === 4 && geo.every(g => g[2]), 'on a wide screen the notes are written out to the right of the text');
  ok(geo.every((g, k) => !k || g[0] >= geo[k - 1][1]), 'the notes of one block never cover those of the block before: ' + JSON.stringify(geo));
  await cp.setViewportSize({ width: 390, height: 800 });

  // 4. my part: one box per speaker name as written, groups included
  await cp.locator('#bHide').click();
  ok(await cp.locator('#sheet .pick').count() === 4 && !(await cv(() => PBC.C.st.hide)), 'hiding with no part ticked opens the list of names instead');
  ok((await cp.locator('#sheet .pick span').allTextContents()).join('|') === 'ANNA|MARCO|ANNA e MARCO|TUTTI', 'the list has every speaker name as the script writes it');
  await cp.locator('#sheet .pick', { hasText: /^ANNA×/ }).locator('input').check();
  await cp.locator('#sheet .pick', { hasText: 'TUTTI' }).locator('input').check();
  await closeSheet();
  ok(await cp.locator('.b.mine').count() === 3, 'the lines under the ticked names are mine: ' + await cp.locator('.b.mine').count());
  ok(await cp.locator('.note.in').count() === 2 && await cv(() => PBC.unread()) === 2, 'now only the notes for me (the one on the TUTTI line) and for everyone are there and counted');
  ok((await cp.locator('#bNotes b').textContent()) === '2', 'the Notes button counts the unread ones');

  // 5. hide my lines; a tap shows one, a tap covers it again
  await cp.locator('#bHide').click();
  const col = () => cp.evaluate(() => Array.from(document.querySelectorAll('.b.speech')).map(b => getComputedStyle(b.querySelector('.ln')).color === 'rgba(0, 0, 0, 0)' ? 'x' : '-').join(''));
  ok(await col() === 'x--xx', 'my lines are covered, the others stay readable: ' + await col());
  ok((await cp.locator('.b.mine .nm').first().textContent()) === 'ANNA', 'the name above a covered line stays');
  await cp.locator('.b.mine .ln').first().click();
  ok(await col() === '---xx', 'a tap on a covered line shows it');
  await cp.locator('.b.mine .ln').first().click();
  ok(await col() === 'x--xx', 'a second tap covers it again');

  // 6. my own note on a line; a received note marked as read
  const before = await tops();
  await cp.locator('.b.speech', { hasText: 'Sono io' }).locator('.tx').click();
  ok(await cp.locator('.b.sel .dot.plus').count() === 1 && await tops() === before, 'a tap on a line offers a note button in its margin and moves nothing');
  await cp.locator('.b.sel .dot').click();
  await cp.locator('#sheet .ed textarea').fill('entrare da sinistra');
  await cp.locator('#sheet .ed .btn', { hasText: 'Save' }).click();
  await closeSheet();
  ok((await cp.locator('.b.speech', { hasText: 'Sono io' }).locator('.note.own').textContent()) === 'entrare da sinistra' && await tops() === before, 'my note is kept in the margin of its line and the text stays where it was');
  await cp.locator('.b.speech', { hasText: 'Coro finale' }).locator('.dot').click();
  await cp.locator('#sheet .note.in button').click();
  await closeSheet();
  ok(await cp.locator('.note.in.read').count() === 1 && (await cp.locator('#bNotes b').textContent()) === '1' && await cp.locator('.dot.new').count() === 1, 'a note ticked as read is dimmed and no longer counted');
  await cp.reload();
  await cp.waitForSelector('#text .b');
  const st = await cv(() => [PBC.C.st.chars.join(), PBC.C.st.hide, PBC.C.st.own.length, PBC.C.st.read.length, document.querySelectorAll('.note.own').length, PBC.C.news, document.querySelector('#sheet').hidden]);
  ok(st.join('|') === 'ANNA,TUTTI|true|1|1|1|false|true', 'part, hiding, my note and the read mark are still there after closing; the same file again announces nothing: ' + st.join('|'));

  // 7. the next file from the stage manager meets what the actor has
  await page.evaluate(() => PB.commitText(PB.serialize().replace('Sono io, non gridare.', 'Sono io, ti prego non gridare.').replace('Ultima battuta di Anna.', 'Ultima battuta di Anna, riscritta.').replace('Chi è là?', 'Chi è là? {NOTE | voltati}')));
  const p2 = await ev(() => PB.castPack());
  ok(p2.show && p2.show === JSON.parse(inside).show, 'every file of a show carries the same id');
  await cp.evaluate(p => PBC.readCastFile(JSON.stringify(p)), p2);
  const news = (await cp.locator('#sheet .body').textContent());
  ok((await cp.locator('#sheet header').textContent()).startsWith('What is new') && news.includes('Notes to read: 2') && news.includes('Lines changed since the file before: 2, mine 1') && news.includes('My notes on a line that changed: 1'),
    'a newer file says what is new: notes to read, changed lines, my notes to check: ' + news);
  await closeSheet();
  const own = await cv(() => { const n = PBC.C.st.own[0]; return [PBC.C.blocks[n.idx].plain, n.moved, document.querySelector('.note.own.moved').closest('.b').querySelector('.tx').textContent]; });
  ok(own[0] === 'MARCO: Sono io, ti prego non gridare.' && own[1] === true && own[2] === 'Sono io, ti prego non gridare.', 'my note follows its line into the new text and is flagged for a look: ' + own[0]);
  ok(await cp.locator('.b.chg').count() === 2 && await cp.locator('.b.mine.chg').count() === 1, 'the lines that changed are marked, mine among them');
  ok(await cv(() => PBC.C.st.read.length === 1 && document.querySelectorAll('.note.in.read').length === 1), 'a note already read stays read in the new file');
  await cp.locator('.b.speech', { hasText: 'ti prego' }).locator('.dot').click();
  ok((await cp.locator('#sheet .hint.warn').textContent()).startsWith('The line has changed'), 'the note says that its line changed');
  await cp.locator('#sheet .ed .btn', { hasText: 'Save' }).first().click();
  await closeSheet();
  ok(await cp.locator('.note.own.moved').count() === 0, 'saving it settles the note on the new line');

  // an older file by mistake: asked first, and nothing the actor has is touched
  let asked = '';
  cp.once('dialog', d => { asked = d.message(); d.dismiss(); });
  await cp.evaluate(s => PBC.readCastFile(s), inside);
  ok(asked.startsWith('This file is older than the one you have') && await cv(() => PBC.C.pack.script.includes('ti prego')), 'an older file is opened only after a yes');

  // a line that is cut: the note is kept aside and can be put on another line
  const p3 = await page.evaluate(() => { PB.commitText(PB.serialize().replace(/MARCO: Sono io[^\n]*\n/, '')); return PB.castPack(); });
  await cp.evaluate(p => PBC.readCastFile(JSON.stringify(p)), p3);
  ok((await cp.locator('#sheet .body').textContent()).includes('My notes whose line was cut: 1'), 'the next file says that a note of mine lost its line');
  await closeSheet();
  ok(await cv(() => PBC.C.st.own[0].idx === -1 && !document.querySelector('.note.own')), 'when its line is cut, my note leaves the page');
  await cp.locator('#bNotes').click();
  ok((await cp.locator('#sheet h3').allTextContents()).some(s => s.startsWith('My notes whose line has changed (1)')) && (await cp.locator('#sheet').textContent()).includes('entrare da sinistra'), 'and is kept in the notes list with the line it was on');
  await cp.locator('#sheet .chip', { hasText: 'All' }).click();
  ok(await cp.locator('.note.in').count() === 4 && await cp.locator('.note.in', { hasText: 'for MARCO' }).count() === 1, '"All" shows the notes for the others too: ' + await cp.locator('.note.in').count());
  await closeSheet();
  await cp.locator('.b.speech', { hasText: 'Insieme adesso' }).locator('.tx').click();
  await cp.locator('.b.sel .dot').click();
  await cp.locator('#sheet .btn', { hasText: 'Put on this line' }).click();
  await closeSheet();
  ok((await cp.locator('.b.speech', { hasText: 'Insieme adesso' }).locator('.note.own').textContent()) === 'entrare da sinistra' && await cv(() => PBC.C.st.own[0].idx >= 0), 'a note that lost its line is put on another one by hand');

  // 8. the reader alone opens a cast file of either kind
  const sp = await ctx.newPage();
  sp.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  await sp.goto('file://' + path.resolve(__dirname, '..', 'promptbook-cast.html'));
  await sp.evaluate(() => { localStorage.removeItem('promptbook-cast:pack'); });
  await sp.reload();
  await sp.waitForSelector('#text .card');
  ok(await sp.locator('.card .btn', { hasText: 'Open a cast file' }).count() === 1 && await sp.locator('#bHide').isHidden(), 'with no show inside, the reader asks for a cast file');
  ok(await sp.evaluate(() => { try { PBC.readCastFile('{"format":"promptbook"}'); return false; } catch (e) { return e.message === 'This is not a cast file.'; } }), 'another kind of file is refused');
  await sp.evaluate(s => PBC.readCastFile(s, true), html);
  ok(await sp.locator('#text .b.speech').count() === 5 && (await sp.locator('#ttl').textContent()) === 'Il molo', 'it opens the .html cast file too');
  ok(await sp.evaluate(() => PBC.C.st.chars.join() === 'ANNA,TUTTI' && PBC.C.st.own.length === 1), 'and finds the part and the notes this device already has for that show');
  await sp.reload();
  await sp.waitForSelector('#text .b');
  ok(await sp.locator('#text .b.speech').count() === 5, 'and comes back to that show when reopened');

  await done();
})();
