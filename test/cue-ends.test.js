const { ok, open } = require('./_util');
const OUT = process.env.OUT || '.';
(async () => {
  const { page, pen, text, done } = await open();
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const cue = (sel) => page.evaluate(sel);

  // 1. the popover offers the open cues, most recent first
  await page.locator('.w', { hasText: 'domande.' }).first().click();
  const offered = await page.locator('#pop .ends .ebtn').allTextContents();
  ok(offered.includes('SND 1') && offered.includes('LX 2') && offered[0] === 'LX 2', 'open cues offered as ends, newest first: ' + offered.join(', '));
  await page.locator('#pop .ends .ebtn', { hasText: 'SND 1' }).click();
  ok((await text()).includes('domande. {/SND 1}'), 'one tap places the end token');
  ok((await page.locator('#pop .pt').first().textContent()).includes('End of SND 1'), 'end editor names the cue it closes: ' + await page.locator('#pop .pt').first().textContent());
  await page.locator('#pop input').nth(1).fill('sfuma in 3s');
  await page.keyboard.press('Enter');
  ok((await text()).includes('domande. {/SND 1 | sfuma in 3s}'), 'end keeps its own description');

  // 2. pairing, margin, rail, list
  const pr = await cue(() => { const s = PB.S.blocks.flatMap(b => b.cues).find(c => c.dept === 'SND' && c.label === '1' && !c.end); return [!!s.endRef, s.endRef && s.endRef.desc, PB.S.pairs.length]; });
  ok(pr[0] && pr[1] === 'sfuma in 3s' && pr[2] === 1, 'end paired with its cue');
  ok(await page.locator('.tag.etag').count() === 1 && await page.locator('.links path.rail').count() === 1, 'outlined end tag and one running rail drawn');
  const rail = await cue(() => { const p = document.querySelector('.links path.rail').getBBox(); const a = Array.from(document.querySelectorAll('.tag')).find(t => t.textContent.startsWith('SND 1') && !t.classList.contains('etag')), z = document.querySelector('.tag.etag'); return [p.y, p.y + p.height, a.offsetTop, z.offsetTop + z.offsetHeight]; });
  ok(rail[0] >= rail[2] && rail[1] <= rail[3] && rail[1] - rail[0] > 100, 'rail runs from the cue tag to the end tag');
  await page.screenshot({ path: OUT + '/11-ends.png', clip: { x: 0, y: 60, width: 760, height: 560 } });
  await page.locator('#bList').click();
  const rows = await page.locator('#drawer tr.cr').count();
  const endl = await page.locator('#drawer tr.cr', { hasText: 'mare, loop basso' }).locator('.endl').textContent();
  ok(rows === 5 && endl.includes('ends p. 1') && endl.includes('sfuma in 3s'), 'cue list: still one row per cue, end shown on it: ' + endl);
  const dl = page.waitForEvent('download');
  await page.locator('#drawer .btn', { hasText: 'CSV' }).click();
  const csv = require('fs').readFileSync(await (await dl).path(), 'utf8').split('\r\n');
  ok(csv[0].includes('End p.') && csv[0].includes('Ended by') && csv[0].includes('Notes') && csv[1].includes('sfuma in 3s'), 'CSV carries the end columns: ' + csv[1]);
  await page.locator('#bList').click();

  // 3. renaming the cue carries its end, as one undo step
  await page.locator('.tag:not(.etag)', { hasText: 'SND 1' }).click();
  await page.locator('#pop input').first().fill('1A');
  await page.keyboard.press('Enter');
  let t = await text();
  ok(t.includes('{SND 1A | mare, loop basso}') && t.includes('{/SND 1A | sfuma in 3s}'), 'renumbering a cue renumbers its end');
  await page.keyboard.press('Control+z');
  t = await text();
  ok(t.includes('{SND 1 | mare, loop basso}') && t.includes('{/SND 1 | sfuma in 3s}'), 'one undo restores both');
  await page.locator('.tag:not(.etag)', { hasText: 'SND 1' }).click();
  await page.locator('#pop .depts .dbtn', { hasText: 'VID' }).click();
  await page.keyboard.press('Escape');
  t = await text();
  ok(t.includes('{VID 1 | mare, loop basso}') && t.includes('{/VID 1 | sfuma in 3s}'), 'changing department carries to the end');
  await page.keyboard.press('Control+z');

  // 4. deleting the cue deletes its end; undo restores both
  await page.locator('.tag:not(.etag)', { hasText: 'SND 1' }).click();
  await page.locator('#pop .btn', { hasText: 'Delete' }).click();
  t = await text();
  ok(!t.includes('SND 1') && t.includes('domande.\n'), 'deleting a cue removes its end too');
  await page.keyboard.press('Control+z');
  ok((await text()).includes('{/SND 1 | sfuma in 3s}') && await cue(() => PB.S.pairs.length) === 1, 'undo brings the pair back');

  // 5. pairing rules with missing and repeated numbers, loose ends, hints
  await page.evaluate(() => PB.startMemory([
    'ANNA: uno {SND 7 | a} due {SND 7 | b} tre {SND | c} quattro {LX 1} cinque.',
    'MARCO: sei {/SND} sette {/SND 7} otto {/SND 7} nove {/SND 7} dieci {/LX 99}.',
    'ANNA: fine {VID 3 | loop}.'].join('\n'), {}));
  const P = await cue(() => PB.S.blocks.flatMap(b => b.cues).map(c => [c.end ? '/' : '', c.dept, c.label, c.desc, c.endRef ? c.endRef.ord : '', c.startRef ? c.startRef.ord : ''].join(' ')));
  console.log(P.join(' | '));
  const st = await cue(() => { const cs = PB.S.blocks.flatMap(b => b.cues); const by = d => cs.find(c => c.desc === d); return [by('c').endRef.ord, by('b').endRef.ord, by('a').endRef.ord, cs.filter(c => c.end && !c.startRef).map(c => c.dept + c.label).join(',')]; });
  ok(st[0] === 4 && st[1] === 5 && st[2] === 6 && st[3] === 'SND7,LX99', 'unnumbered end closes the nearest open cue; repeated numbers close newest first; extra ends stay loose: ' + JSON.stringify(st));
  const rv = await cue(() => { const r = PB.reviewData(); return [r.ends.length, r.count, 'running' in r]; });
  ok(rv[0] === 2 && rv[1] === 2 && !rv[2], 'review: loose ends counted, open cues are no longer reported: ' + JSON.stringify(rv));
  const loose = await cue(() => PB.collectCues().filter(o => o.loose).length);
  ok(loose === 2 && await cue(() => PB.collectCues().length) === 7, 'loose ends get their own rows in the cue list');
  // only cues an end token could really reach are offered
  await page.evaluate(() => PB.startMemory('ANNA: uno {SND 7 | a} due {SND 7 | b} tre {SND 8 | c} quattro {SND | d} cinque sei.', {}));
  await page.locator('.w', { hasText: 'sei.' }).click();
  const off2 = await page.locator('#pop .ends .ebtn').allTextContents();
  ok(off2.join('|') === 'SND|SND 8|SND 7', 'older cue with a repeated number is not offered twice: ' + off2.join('|'));
  await page.locator('#pop .ends .ebtn', { hasText: 'SND 7' }).click();
  await page.keyboard.press('Escape');
  ok(await cue(() => { const cs = PB.S.blocks.flatMap(b => b.cues); return cs.find(c => c.desc === 'b').endRef && !cs.find(c => c.desc === 'a').endRef; }), 'it closes the newer of the two');

  // 6. rail across pages, and ink is not flagged by an end
  const words = 'la notte porta il vento sul molo e nessuno guarda le barche che tornano piano dal largo'.split(' ');
  const lines = ['# ATTO 1', '', 'ANNA: Inizio {SND 1 | musica} adesso.'];
  for (let i = 0; i < 150; i++) lines.push((i % 2 ? 'MARCO' : 'ANNA') + ': ' + words.slice(i % 7).concat(words).join(' ') + '.');
  lines.push('ANNA: Basta {/SND 1 | stop} così.');
  await page.evaluate(tx => PB.startMemory(tx, {}), lines.join('\n'));
  const span = await cue(() => PB.S.pages.map(P => P.rails.length));
  ok(span.length >= 4 && span.every(n => n === 1), 'a cue that ends pages later has a rail on every page between: ' + span.join(''));
  await page.evaluate(() => { PB.jumpTo(PB.S.pages[1].items[0].g.b); });
  await page.waitForTimeout(100);
  const mid = await cue(() => { const pg = PB.S.els[1].a, p = pg.querySelector('.links path.rail'); if (!p) return null; const b = p.getBBox(); return [b.y, b.height]; });
  ok(mid && mid[0] < 60 && mid[1] > 1000, 'on a middle page the rail runs top to bottom: ' + JSON.stringify(mid));
  await page.evaluate(() => { document.querySelector('#desk').scrollTop = 0; }); await page.waitForTimeout(80);
  let bb = await page.locator('.w', { hasText: 'Inizio' }).boundingBox();
  await pen([[bb.x, bb.y + 22], [bb.x + 60, bb.y + 24]]);
  await page.waitForTimeout(500);
  await page.locator('.w', { hasText: 'adesso.' }).click();
  await page.locator('#pop .depts .dbtn', { hasText: 'SND' }).click(); await page.keyboard.press('Escape');
  await page.locator('.w', { hasText: 'adesso.' }).click();
  await page.locator('#pop .ends .ebtn').first().click(); await page.keyboard.press('Escape');
  ok(await page.locator('.flag').count() === 0 && await page.locator('.ink path').count() === 1, 'adding a cue and its end to an inked line raises no flag');

  // 7. print keeps tags and rails
  await page.evaluate(() => { document.body.classList.add('pr-script'); PB.renderAll(); });
  ok(await cue(() => document.querySelectorAll('.links path.rail').length) >= 5, 'rails present on all pages for print');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT + '/ends.pdf', preferCSSPageSize: true, printBackground: true });
  // 8. a cue can end other cues: {SND 6 / SND 5}
  await page.emulateMedia({ media: 'screen' }); await page.evaluate(() => document.body.classList.remove('pr-script'));
  const T = [
    'ANNA: uno {SND 5 | mare | Traccia 03, -12 dB} due {SND 6 / SND 5 | sfuma 3s | parte sulla battuta} tre {VID 2 | loop} {LX 1/2}',
    'MARCO: quattro {SND 9 / SND 6 / VID 2 | stop tutto} cinque {SND 7 / SND 99} sei {SND / SND 9} sette.'].join('\n');
  await page.evaluate(tx => PB.startMemory(tx, {}), T);
  const all = () => cue(() => PB.S.blocks.flatMap(b => b.cues).map(c => ({ n: c.dept + c.label, links: c.links.map(l => l.dept + l.label).join('+'), desc: c.desc, notes: c.notes, end: c.endRef ? c.endRef.dept + c.endRef.label : '', un: c.unresolved.length, lane: c.lane })));
  let cs = await all();
  const g = n => cs.find(c => c.n === n);
  ok(g('SND6').links === 'SND5' && g('SND6').desc === 'sfuma 3s' && g('SND6').notes === 'parte sulla battuta', 'link, short text and notes are read apart: ' + JSON.stringify(g('SND6')));
  ok(g('SND5').notes === 'Traccia 03, -12 dB' && g('SND5').end === 'SND6' && g('SND6').end === 'SND9', 'a linking cue closes its target and can be closed itself');
  ok(g('SND9').links === 'SND6+VID2' && g('VID2').end === 'SND9', 'one cue ends several, across departments');
  ok(g('LX1/2').links === '' && g('SND7').un === 1 && g('SND').links === 'SND9', 'a label such as 1/2 is not a link; a missing target is counted; an unnumbered cue can link');
  ok(g('SND5').lane === g('SND6').lane, 'a crossfade chain keeps one rail lane');
  ok(await page.locator('.links path.rail').count() === 4, 'one rail per ended cue: ' + await page.locator('.links path.rail').count());
  const lt = page.locator('.tag', { hasText: 'SND 6' }).first();
  ok(await lt.evaluate(e => e.classList.contains('etag')) && (await lt.getAttribute('title')).includes('SND 5') && await page.locator('.tag .nd').count() === 2, 'a linking cue is drawn like a plain end (outlined, stop square, rail); a dot marks notes');
  ok(await page.locator('.tag.etag').count() === 4, 'every linking cue is outlined: ' + await page.locator('.tag.etag').count());
  const rt = await cue(() => PB.S.blocks.flatMap(b => b.cues).filter(c => !c.end && !c.board).every(c => fmtToken(c.dept, c.label, c.desc, false, c.links, c.notes) === PB.S.blocks.find(b => b === c.b).raw.slice(c.s, c.e)));
  ok(rt, 'every token is written back exactly as it was read');
  const rv2 = await cue(() => PB.reviewData().ends.map(o => o.c.dept + o.c.label).join());
  ok(rv2 === 'SND7', 'review lists the link with nothing to end: ' + rv2);

  // 8b. editing carries through links, one undo each
  const tag = tx => page.locator('.tag', { hasText: tx }).first();
  await tag('SND 5').click(); await page.locator('#pop input').first().fill('5A'); await page.keyboard.press('Enter');
  t = await text();
  ok(t.includes('{SND 5A | mare | Traccia 03, -12 dB}') && t.includes('{SND 6 / SND 5A | sfuma 3s | parte sulla battuta}'), 'renumbering a cue rewrites the link to it');
  await page.keyboard.press('Control+z');
  ok((await text()).includes('{SND 6 / SND 5 | sfuma 3s'), 'one undo restores both');
  await tag('SND 5').click(); await page.locator('#pop .btn', { hasText: 'Delete' }).click();
  t = await text();
  ok(!t.includes('{SND 5 ') && t.includes('{SND 6 | sfuma 3s | parte sulla battuta}'), 'deleting a cue keeps the cue that linked to it, minus the link');
  await page.keyboard.press('Control+z');
  await tag('SND 6').click(); await page.locator('#pop .btn', { hasText: 'Delete' }).click();
  cs = await all();
  ok(!(await text()).includes('{SND 6') && g('SND5').end === '', 'deleting a linking cue leaves its target open again');
  await page.keyboard.press('Control+z');

  // 8c. an end becomes a cue, and back
  await page.evaluate(() => PB.startMemory('ANNA: uno {SND 1 | mare} due {/SND 1} tre.', {}));
  await page.locator('.tag.etag').click();
  await page.locator('#pop .btn', { hasText: 'Make it a cue' }).click();
  ok((await text()).includes('due {SND / SND 1}'), 'an end becomes a cue that ends the same cue: ' + await text());
  await page.locator('#pop input').first().fill('2'); await page.keyboard.press('Enter');
  ok((await text()).includes('{SND 2 / SND 1}') && await cue(() => PB.S.pairs.length) === 1, 'it takes a number and still pairs');
  await tag('SND 2').click();
  await page.locator('#pop .btn', { hasText: 'plain end' }).click(); await page.keyboard.press('Escape');
  ok((await text()).includes('{/SND 1}'), 'and goes back to a plain end');

  // 8d. notes: typed in a field, shown in the cue list and the CSV, not in the margin text
  await tag('SND 1').click();
  await page.locator('#pop textarea').fill('Traccia 03; -12 dB'); await page.keyboard.press('Enter');
  ok((await text()).includes('{SND 1 | mare | Traccia 03; -12 dB}'), 'notes are written as a second bar');
  await page.evaluate(() => PB.startMemory('ANNA: uno {SND 1 | | solo note} due {LX 4 | buio} tre {SND 2 | mare | note audio} quattro {VID 1 | clip}.', {}));
  ok(await cue(() => PB.S.blocks[0].cues[0].desc === '' && PB.S.blocks[0].cues[0].notes === 'solo note'), 'an empty short text can have notes');
  await page.locator('#bList').click();
  ok(await page.locator('#drawer .notes', { hasText: 'note audio' }).count() === 1, 'notes appear in the cue list');

  // 8e. exports by department
  const dl2 = page.waitForEvent('download');
  await page.locator('#drawer .btn', { hasText: '.zip' }).click();
  const zip = require('fs').readFileSync(await (await dl2).path());
  const ent = {}; for (let i = 0; (i = zip.indexOf('PK\x03\x04', i)) >= 0; i += 4) { const n = zip.readUInt16LE(i + 26), x = zip.readUInt16LE(i + 28), sz = zip.readUInt32LE(i + 18); ent[zip.toString('utf8', i + 30, i + 30 + n)] = zip.toString('utf8', i + 30 + n + x, i + 30 + n + x + sz); }
  const names = Object.keys(ent).sort().join();
  ok(names === 'cues-LX.csv,cues-SND.csv,cues-VID.csv', 'one CSV per department in a zip: ' + names);
  ok(!/\bLX\b/.test(ent['cues-SND.csv'].split('\n').slice(1).join('')) && ent['cues-SND.csv'].includes('note audio') && ent['cues-SND.csv'].split('\n').length === 4, 'each file holds only its own department');
  await page.evaluate(() => doPrint('cues', true));
  const sheets = await cue(() => Array.from(document.querySelectorAll('#cuePrint section.dsec')).map(s => s.querySelector('h1').textContent.split(' · ').pop() + ':' + s.querySelectorAll('tr.cr, tr:not(:first-child)').length));
  ok(sheets.join() === 'LX:1,SND:2,VID:1', 'print has one sheet per department: ' + sheets.join());

  await done();
})();
