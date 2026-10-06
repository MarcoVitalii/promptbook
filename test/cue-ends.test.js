const { ok, open } = require('./_util');
const OUT = process.env.OUT || '.';
(async () => {
  const { page, pen, text, done } = await open();
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const cue = (sel) => page.evaluate(sel);

  // 1. the popover offers the open cues, "runs" departments first
  await page.locator('.w', { hasText: 'domande.' }).first().click();
  const offered = await page.locator('#pop .ends .ebtn').allTextContents();
  ok(offered[0] === 'SND 1' && offered.includes('LX 2'), 'open cues offered as ends, sound first: ' + offered.join(', '));
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
  ok(csv[0].includes('End p.') && /sfuma in 3s$/.test(csv[1]), 'CSV carries the end columns: ' + csv[1]);
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
  const rv = await cue(() => { const r = PB.reviewData(); return [r.ends.length, r.running.map(o => o.c.dept + o.c.label).join(','), r.count]; });
  ok(rv[0] === 2 && rv[1] === 'VID3' && rv[2] === 2, 'review: loose ends counted, still-running cues listed but not counted: ' + JSON.stringify(rv));
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
  await done();
})();
