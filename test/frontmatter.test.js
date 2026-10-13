// Frontmatter: front page, title, character list and the check of speaker names against it.
const { ok, open, nameBox, popGone } = require('./_util');
(async () => {
  const T = await open(), page = T.page;
  const FM = '---\ntitle: Il mare\nauthor: Marco Vitali\ncompany: "Compagnia del Porto"\nyear:2026\ntags: [teatro]\ncharacters:\n  - ANNA/A - la figlia\n  - MARCO/M/MARCHINO - il pescatore\n  - SOLDATO 1\n  - NONNA\n---\n';
  const BODY = '# ATTO PRIMO\n\n(Buio.)\n\nANNA: Chi è là?\nMARCO: Sono io.\nMARCA: Refuso.\nANNA e MARCO: Insieme!\nANNA e LUCA: Insieme!\nSOLDATO 1: Alt!\nALL BUT ANNA: No!\nALL OTHERS: Sì.\nOTHERS: Sì.\nALL: Sì.\nTUTTI TRANNE MARCO: No.\nGLI ALTRI: Forse.\nTUTTI: Fine.\nA: Con la sigla.\nA e M: Tutti e due.\nM e LUCA: Uno sì.\n';
  await page.evaluate(([a, b]) => PB.startMemory(a + b, { title: 'Dal config' }), [FM, BODY]);
  await page.waitForSelector('.page.script .row.front');

  ok(await T.text() === FM + BODY, 'frontmatter survives a parse and write unchanged');
  const st = await page.evaluate(() => ({ t0: PB.S.blocks[0].type, meta: PB.S.meta && { title: PB.S.meta.title, lines: PB.S.meta.lines, chars: PB.S.meta.chars },
    nos: PB.S.pages.map(P => P.no), first: PB.S.blocks[1].page }));
  ok(st.t0 === 'meta' && st.meta.title === 'Il mare', 'the block between --- lines is read as frontmatter');
  ok(JSON.stringify(st.meta.chars.map(c => c.name)) === '["ANNA","MARCO","SOLDATO 1","NONNA"]' && st.meta.chars[1].desc === 'il pescatore' && st.meta.chars[1].aliases.join() === 'M,MARCHINO', 'characters read, with optional aliases and description');

  const fp = await page.evaluate(() => {
    const pg = document.querySelector('.page.script'), q = s => Array.from(pg.querySelectorAll(s));
    const px = e => parseFloat(getComputedStyle(e).fontSize);
    return { lines: q('.row.front .tx > div').map(e => e.textContent), big: px(q('.ft')[0]), small: Math.max(...q('.fl').map(px)),
      rows: q('.row').length, text: pg.querySelector('.pbody').textContent, head: getComputedStyle(pg.querySelector('.phead')).display, foot: getComputedStyle(pg.querySelector('.pfoot')).display,
      facing: document.querySelector('.page.facing').children.length };
  });
  ok(JSON.stringify(fp.lines) === '["Il mare","Marco Vitali","Compagnia del Porto","2026"]', 'front page shows the values only, in the order written: ' + JSON.stringify(fp.lines));
  ok(fp.big > fp.small * 1.5, 'title is larger than the other lines (' + fp.big + ' vs ' + fp.small + ')');
  ok(fp.rows === 1 && !/ANNA|teatro|author/.test(fp.text), 'front page is alone on its page; keys, characters and tags are not shown');
  ok(fp.head === 'none' && fp.foot === 'none' && fp.facing === 0, 'front page has no running head, no number and nothing on the facing page');
  ok(st.nos.slice(0, 3).join() === '-1,0,1' && st.first === 1, 'front and character pages have no number; the script still starts on page 1');
  const cp = await page.evaluate(() => { PB.renderAll(); const pg = document.querySelectorAll('.page.script')[1];
    return { head: pg.querySelector('.ch').textContent, rows: Array.from(pg.querySelectorAll('.ce')).map(e => e.textContent), n: pg.querySelectorAll('.row').length,
      foot: getComputedStyle(pg.querySelector('.pfoot')).display, fits: pg.querySelector('.cl2').getBoundingClientRect().bottom < pg.getBoundingClientRect().bottom }; });
  ok(cp.head === 'Characters' && JSON.stringify(cp.rows) === '["ANNA / A — la figlia","MARCO / M / MARCHINO — il pescatore","SOLDATO 1","NONNA"]' && cp.n === 1 && cp.foot === 'none' && cp.fits,
    'characters are on a page of their own: name / alias — description: ' + JSON.stringify(cp.rows));
  const al = await page.evaluate(() => PB.S.blocks.filter(b => b.type === 'speech').slice(-3).map(b => b.name + '|' + document.querySelector('.tx[data-b="' + b.id + '"]').closest('.row').querySelector('.nm').textContent));
  ok(JSON.stringify(al) === '["ANNA|ANNA","ANNA e MARCO|ANNA e MARCO","MARCO e LUCA|MARCO e LUCA"]', 'a speech typed with an alias is shown under the full name: ' + JSON.stringify(al));
  ok(await page.evaluate(() => document.querySelector('#showName').textContent === 'Il mare' && document.querySelectorAll('.page.script')[2].querySelector('.phead').textContent.startsWith('Il mare')), 'title from the script wins over the one in Settings');

  const rv = await page.evaluate(() => { const r = PB.reviewData(); return { no: r.noChar.map(o => o.name + '×' + o.n), silent: r.silent, count: r.count }; });
  ok(JSON.stringify(rv.no) === '["MARCA×1","LUCA×2"]', 'only names missing from the list are reported: ' + JSON.stringify(rv.no));
  ok(JSON.stringify(rv.silent) === '["NONNA"]' && rv.count === 2, 'group names (ALL, ALL BUT x, OTHERS, TUTTI TRANNE x, GLI ALTRI) are not checked; unused character listed');
  await page.locator('#bReview').click();
  ok(await page.locator('#drawer h3', { hasText: 'Not in the character list (2)' }).count() === 1 && await page.locator('#drawer h3', { hasText: 'Listed but never speaks (1)' }).count() === 1, 'Review panel shows both lists');
  await page.locator('#bReview').click();

  // "+ Board" on the first script page must not land above the frontmatter
  await page.locator('.addboard').first().click(); await nameBox(page); await page.keyboard.press('Enter'); await popGone(page);
  ok(await page.evaluate(() => PB.serialize().startsWith('---\n') && !!PB.S.meta && PB.S.pages[2].boards.length === 1), 'a board added on page 1 goes below the frontmatter');
  await page.keyboard.press('Control+z');

  // removing and restoring the frontmatter
  const n0 = st.nos.length;
  await page.evaluate(b => PB.commitText(b), BODY);
  ok(await page.evaluate(n => PB.S.meta === null && PB.S.pages.length === n - 2 && PB.S.pages[0].no === 1 && PB.reviewData().noChar.length === 0, n0), 'without frontmatter: no front page, no name check');
  ok(await page.evaluate(() => document.querySelector('#showName').textContent === 'Dal config'), 'title falls back to Settings');
  await page.keyboard.press('Control+z');
  ok(await T.text() === FM + BODY && await page.evaluate(() => PB.S.pages[0].front === true), 'undo brings the front page back');

  // tolerances
  const r1 = await page.evaluate(() => { PB.startMemory('---\ntitle: X\n\nANNA: Ciao.\n', {}); return [PB.S.meta, PB.S.blocks[0].type, PB.serialize()]; });
  ok(r1[0] === null && r1[1] === 'para' && r1[2] === '---\ntitle: X\n\nANNA: Ciao.\n', 'an unclosed --- is not frontmatter and nothing is lost');
  const r2 = await page.evaluate(() => { PB.startMemory('---\n(Buio.)\n---\nANNA: Ciao.\n', {}); return PB.S.meta; });
  ok(r2 === null, 'two --- rules around script text are not taken for frontmatter');
  const r3 = await page.evaluate(() => { PB.startMemory('---\npersonaggi: [ANNA, Marco]\n---\nANNA: Ciao.\nMARCO: Ciao.\nLUCA: Ciao.\n', { title: 'T' }); const r = PB.reviewData();
    return [PB.S.pages.length, PB.S.pages[0].no, PB.S.pages[0].front, r.noChar.map(o => o.name).join(), document.querySelectorAll('.row.front .tx').length]; });
  ok(r3[0] === 2 && r3[1] === 0 && r3[2] && r3[3] === 'LUCA' && r3[4] === 1, 'characters alone (inline list, any case) give the character page and the check, but no front page');

  // ink on the front page, and rails with the page offset
  let long = '---\ntitle: Lungo\n---\nANNA: Via {SND 1 | mare}.\n';
  for (let i = 0; i < 90; i++) long += 'MARCO: ' + 'parola '.repeat(40) + '\n';
  long += 'ANNA: Stop {/SND 1}.\n';
  const r4 = await page.evaluate(tx => { PB.startMemory(tx, {}); PB.renderAll();
    const pgs = Array.from(document.querySelectorAll('.page.script')); return [pgs.length, pgs.filter(p => p.querySelector('.rail')).length, !!pgs[0].querySelector('.rail')]; }, long);
  ok(r4[0] > 3 && r4[1] === r4[0] - 1 && !r4[2], 'running rail drawn on every script page and not on the front page (' + r4[1] + ' of ' + r4[0] + ')');
  await page.evaluate(() => { document.querySelector('#desk').scrollTop = 0; });
  const box = await page.locator('.row.front .ft').boundingBox();
  await T.pen([[box.x, box.y + box.height + 6], [box.x + box.width, box.y + box.height + 8]]);
  ok(await page.evaluate(() => { const f = PB.inkFile(); return f.blocks.length === 1 && f.blocks[0].text.startsWith('---'); }), 'pen ink on the front page is kept with the frontmatter block');
  // ink on the character page stays there
  await page.evaluate(() => { PB.startMemory('---\ntitle: X\npersonaggi:\n  - ANNA/A - la figlia\n---\nA: Ciao.\n', {}); PB.renderAll(); document.querySelectorAll('.page.script')[1].scrollIntoView(); });
  const cb = await page.locator('.ce').first().boundingBox();
  await T.pen([[cb.x, cb.y + cb.height + 4], [cb.x + 120, cb.y + cb.height + 6]]);
  const ik = await page.evaluate(() => { PB.renderAll(); const pgs = document.querySelectorAll('.page.script'); return [PB.inkFile().blocks.length, pgs[0].querySelectorAll('.ink path').length, pgs[1].querySelectorAll('.ink path').length, document.querySelector('.ch').textContent]; });
  ok(ik.join() === '1,0,1,Personaggi', 'ink drawn on the character page is redrawn there and not on the front page; heading follows the key');

  // a character list longer than one page runs on to the next, and nothing of it is cut off (PAG-8)
  const crowd = (n, desc) => '---\ntitle: Folla\ncharacters:\n' + Array.from({ length: n }, (_, k) => '  - PERSONA ' + (k + 1) + ' - ' + desc(k) + '\n').join('') + '---\nPERSONA 1: Ciao.\n';
  const all = n => Array.from({ length: n }, (_, k) => 'PERSONA ' + (k + 1)).join();
  const castPages = (tx, paper) => page.evaluate(([tx, paper]) => { PB.startMemory(tx, { paper }); PB.renderAll();
    const pgs = Array.from(document.querySelectorAll('.page.script')).filter(p => p.querySelector('.tx.cast'));
    return { n: pgs.length, nos: PB.S.pages.map(P => P.no).join(), first: PB.S.blocks[1].page, heads: pgs.map(pg => pg.querySelectorAll('.ch').length).join(''), names: pgs.flatMap(pg => Array.from(pg.querySelectorAll('.ce b'), e => e.textContent)).join(),
      per: pgs.map(pg => pg.querySelectorAll('.ce').length).join('+'), two: pgs.every(pg => !!pg.querySelector('.tx.cast.two')), bare: pgs.every(pg => getComputedStyle(pg.querySelector('.pfoot')).display === 'none' && getComputedStyle(pg.querySelector('.phead')).display === 'none'),
      inside: pgs.every(pg => { const r = pg.querySelector('.row.front').getBoundingClientRect(); return Array.from(pg.querySelectorAll('.ce')).every(e => { const q = e.getBoundingClientRect(); return q.bottom <= r.bottom + 0.5 && q.right <= r.right + 0.5; }); }) }; }, [tx, paper || 'A4']);
  const mixed = crowd(250, k => 'descrizione '.repeat(1 + (k * 7) % 9));
  let c = await castPages(crowd(60, () => 'x'));
  ok(c.n === 1 && c.nos === '-1,0,1' && c.names === all(60) && c.inside && c.two, 'a list that fits one page in two columns stays on one page: ' + c.per);
  c = await castPages(mixed);
  ok(c.n > 2 && c.names === all(250) && c.inside, 'a list longer than one page runs on to as many pages as it needs, every character once and none cut off: ' + c.per);
  ok(c.heads === '1' + '0'.repeat(c.n - 1) && c.bare && c.two, 'the heading is on the first of them only; none has a running head or a number');
  ok(c.nos === Array.from({ length: c.n + 2 }, (_, k) => k - c.n).join() && c.first === 1, 'and the script still starts on page 1: ' + c.nos);
  c = await castPages(mixed, 'Letter');
  ok(c.n > 2 && c.names === all(250) && c.inside, 'the same on Letter paper: ' + c.per);
  c = await castPages(crowd(25, k => 'una descrizione molto lunga '.repeat(3 + (k * 5) % 6)));
  ok(c.n === 2 && c.names === all(25) && c.inside && !c.two && c.heads === '10', 'a list of 30 or fewer whose descriptions fill more than a page runs on in one column: ' + c.per);
  await page.emulateMedia({ media: 'print' });
  c = await castPages(mixed);
  ok(c.n > 2 && c.names === all(250) && c.inside, 'in print too the whole list is on its pages: ' + c.per);
  await page.emulateMedia({ media: 'screen' });
  await T.done();
})();
