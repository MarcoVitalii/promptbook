const { ok, open, serve, nameBox, popGone } = require('./_util');
const OUT = process.env.OUT || '.';
(async () => {
  const { srv, url } = await serve();
  const { page, pen, text, done } = await open({ url });
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const ev = f => page.evaluate(f);
  const box = async sel => page.locator(sel).first().boundingBox();
  const menu = async label => { await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: label }).click(); };
  const fig = name => page.locator('.board', { has: page.locator('.bname', { hasText: new RegExp('^' + name + '$') }) });
  const draw = async (f, pts) => { const b = await f.locator('svg').boundingBox(); await pen(pts.map(p => [b.x + p[0], b.y + p[1]])); };

  // 1. templates live in their own view, outside the script
  await menu('Templates');
  ok(await page.locator('#tpl').isVisible() && await page.locator('#zoomwrap').isHidden(), 'Templates view replaces the script on screen');
  await page.locator('.tplbar .btn', { hasText: '+ Template' }).click();
  await draw(fig('Template 1'), [[100, 100], [400, 120], [600, 300]]);
  ok(await ev(() => PB.S.templates.get('Template 1').strokes.length) === 1 && await ev(() => PB.S.cfg.templates.join()) === 'Template 1', 'a template is drawn with the same pen and listed in the configuration');

  // 2. a template based on another; the base shows greyed and locked
  await fig('Template 1').locator('button', { hasText: 'New based on this' }).click();
  ok(await ev(() => PB.S.templates.get('Template 2').base) === 'Template 1', 'new template based on the first');
  ok(await fig('Template 2').locator('.bbase path').count() === 1 && await fig('Template 2').locator('.bstrokes path').count() === 0, 'its base shows underneath, in the greyed layer');
  const fade = await ev(() => { const g = document.querySelector('#tpl .bbase'), c = getComputedStyle(g); return [c.opacity, c.filter]; });
  ok(+fade[0] < 0.5 && fade[1].includes('grayscale'), 'greyed: ' + fade.join(' '));
  await draw(fig('Template 2'), [[200, 400], [500, 420]]);
  // eraser over the base stroke on Template 2 must not touch Template 1
  const b2 = await fig('Template 2').locator('svg').boundingBox();
  await pen([[b2.x + 380, b2.y + 90], [b2.x + 400, b2.y + 125], [b2.x + 420, b2.y + 150]], { button: 'right', buttons: 2 });
  ok(await ev(() => PB.S.templates.get('Template 1').strokes.length) === 1 && await ev(() => PB.S.templates.get('Template 2').strokes.length) === 1, 'erasing on a template leaves what it is based on alone');

  // 3. no loops
  await fig('Template 1').locator('button', { hasText: 'Base:' }).click();
  const ch1 = await page.locator('#pop .pcol .btn').allTextContents();
  await page.keyboard.press('Escape');
  await fig('Template 2').locator('button', { hasText: 'Base:' }).click();
  const ch2 = await page.locator('#pop .pcol .btn').allTextContents();
  await page.keyboard.press('Escape');
  ok(ch1.join('|') === 'none' && ch2.join('|') === 'Template 1|none', 'a template cannot be based on one built on it: [' + ch1 + '] [' + ch2 + ']');

  // 4. with templates and no default, adding a board asks what to draw on
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  ok(await page.locator('#zoomwrap').isVisible() && await page.locator('.tag').count() > 0 && await page.locator('.links path').count() > 0, 'back in the script, pages and cue tags are drawn again');
  await page.locator('.addboard').first().click();
  const pick = await page.locator('#pop .pcol .btn').allTextContents();
  ok(pick.includes('Template 1') && pick.includes('Template 2') && pick.includes('Blank'), 'picker offers templates and blank: ' + pick.join(', '));
  await page.locator('#pop .pcol .btn', { hasText: 'Template 2' }).click();
  ok(await page.locator('#pop input').inputValue() === 'Board 1' && await ev(() => PB.S.boards.size) === 0, 'after the choice the name is asked, and no board exists yet');
  await nameBox(page); await page.keyboard.press('Enter'); await popGone(page);
  await page.waitForSelector('.page.facing .board');
  ok(await ev(() => PB.S.boards.get('Board 1').base) === 'Template 2', 'board is based on the chosen template');
  ok(await page.locator('.page.facing .board .bbase .bstatic').count() === 2 && await page.locator('.page.facing .board .bbase path').count() === 2, 'the whole chain shows under the board');
  ok(/\{BOARD Board 1\}/.test(await text()) && !/Template/.test(await text()), 'templates leave no trace in script.md');

  // 5. board ink is the board's own; the chain is locked
  await draw(page.locator('.page.facing .board'), [[60, 60], [200, 200]]);
  const bb = await page.locator('.page.facing .board svg').boundingBox();
  const s = bb.width / 1000;
  await pen([[bb.x + 380 * s * (940 / 940), bb.y + 100 * s], [bb.x + 400 * s, bb.y + 121 * s], [bb.x + 420 * s, bb.y + 140 * s]].map(p => p), { button: 'right', buttons: 2 });
  ok(await ev(() => [PB.S.templates.get('Template 1').strokes.length, PB.S.templates.get('Template 2').strokes.length, PB.S.boards.get('Board 1').strokes.length].join()) === '1,1,1', 'erasing on a board cannot remove template strokes');

  // 6. live link: change the root template, the board shows it
  await menu('Templates');
  await draw(fig('Template 1'), [[700, 100], [800, 200]]);
  ok(await fig('Template 2').locator('.bbase path').count() === 2, 'a change to a template shows at once on templates built on it');
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  ok(await page.locator('.page.facing .board .bbase path').count() === 3, 'and on every board built on them');
  await page.screenshot({ path: OUT + '/12-board-chain.png', clip: { x: 760, y: 60, width: 740, height: 560 } });

  // 7. default template: adding a board is one tap again
  await menu('Templates');
  await fig('Template 2').locator('button', { hasText: 'Default' }).click();
  ok(await ev(() => PB.S.cfg.defaultTemplate) === 'Template 2', 'default template set');
  await page.screenshot({ path: OUT + '/13-templates.png' });
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  await page.locator('.addboard').first().click();
  ok(await page.locator('#pop .pcol').count() === 0 && await page.locator('#pop input').inputValue() === 'Board 2', 'with a default, "+ Board" asks only the name');
  await nameBox(page); await page.keyboard.press('Enter'); await popGone(page);
  ok(await page.locator('#pop').isHidden() && await ev(() => PB.S.boards.get('Board 2') && PB.S.boards.get('Board 2').base) === 'Template 2', 'and Enter adds the board on the default template');

  // 8. change base, undo; copy a board to the templates
  await fig('Board 2').locator('button', { hasText: 'Base' }).click();
  await page.locator('#pop .pcol .btn', { hasText: 'none' }).click();
  ok(await fig('Board 2').locator('.bbase').count() === 0, 'base removed from a board');
  await page.keyboard.press('Control+z');
  ok(await fig('Board 2').locator('.bbase path').count() === 3, 'undo restores it');
  await fig('Board 1').locator('button', { hasText: 'To templates' }).click();
  ok(await ev(() => { const T = PB.S.templates.get('Board 1'); return !!T && T.tpl && T.base === 'Template 2' && T.strokes.length === 1 && T.strokes !== PB.S.boards.get('Board 1').strokes; }), '"To templates" copies a board; the board itself stays');

  // 9. rename carries; delete is refused while in use, allowed and undoable otherwise
  await menu('Templates');
  await fig('Template 2').locator('button', { hasText: 'Rename' }).click();
  await page.locator('#pop input').fill('Palco A'); await page.keyboard.press('Enter');
  ok(await ev(() => [PB.S.boards.get('Board 1').base, PB.S.templates.get('Board 1').base, PB.S.cfg.defaultTemplate, PB.S.cfg.templates.join()].join(' / ')) === 'Palco A / Palco A / Palco A / Template 1,Palco A,Board 1', 'renaming a template updates everything built on it');
  await fig('Template 1').locator('button', { hasText: 'Delete' }).click();
  ok(await ev(() => PB.S.templates.has('Template 1')) && (await page.locator('#toast').textContent()).includes('Palco A'), 'a template in use cannot be deleted: ' + await page.locator('#toast').textContent());
  await fig('Board 1').locator('button', { hasText: 'Delete' }).click();
  ok(!(await ev(() => PB.S.templates.has('Board 1'))), 'an unused template can be deleted');
  await page.keyboard.press('Control+z');
  ok(await ev(() => PB.S.templates.has('Board 1') && PB.S.cfg.templates.join()) === 'Template 1,Palco A,Board 1', 'and undo brings it back in place');

  // 10. undoing a script edit while in the Templates view does not corrupt the pages
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  await page.locator('.w', { hasText: 'Rispondi!' }).first().click();
  await page.locator('#pop .depts .dbtn', { hasText: 'LX' }).click(); await page.keyboard.press('Escape');
  await menu('Templates');
  await page.keyboard.press('Control+z');
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  const tg = await ev(() => { const pg = document.querySelector('.page.script'); const tags = Array.from(pg.querySelectorAll('.tag')); return [tags.length, tags.every(t => parseFloat(t.style.top) > 50), PB.serialize().includes('Rispondi! {LX')]; });
  ok(tg[0] >= 5 && tg[1] && !tg[2], 'undo from the Templates view, then back: tags laid out correctly: ' + JSON.stringify(tg));

  // 11. never printed
  const n = await ev(() => PB.S.pages.length);
  await menu('Templates');
  await ev(() => { document.body.classList.add('pr-book'); PB.renderAll(); });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT + '/tpl-book.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await ev(() => document.body.classList.remove('pr-book'));
  const { execSync } = require('child_process');
  let pages = -1; try { pages = +/Pages:\s+(\d+)/.exec(execSync('pdfinfo ' + OUT + '/tpl-book.pdf').toString())[1]; } catch (e) { /* pdfinfo missing */ }
  ok(pages === -1 || pages === n * 2, 'print has script and facing pages only, no template sheets: ' + pages + ' pages for ' + n + ' script pages');

  // 12. backup round trip keeps templates
  const before = await ev(() => JSON.stringify([PB.bundle(true).templates, PB.bundle(true).boards, PB.S.cfg.templates, PB.S.cfg.defaultTemplate]));
  const b = await ev(() => PB.bundle(true));
  await page.evaluate(x => PB.loadBundle(x), b);
  ok(before === await ev(() => JSON.stringify([PB.bundle(true).templates, PB.bundle(true).boards, PB.S.cfg.templates, PB.S.cfg.defaultTemplate])), 'backup carries templates, bases and the default');

  // 13. folder: templates/ files and config list; reload restores the chain
  await ev(async () => { const root = await navigator.storage.getDirectory(); try { await root.removeEntry('tshow.promptbook.zip'); } catch (e) {} const fh = await root.getFileHandle('tshow.promptbook.zip', { create: true }); window.showSaveFilePicker = async () => fh; });
  await page.locator('#banner .btn', { hasText: 'Save as show file' }).click();
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);
  const readShow = () => ev(async () => { const out = {}; const m = await PB.readZip(await (await (await navigator.storage.getDirectory()).getFileHandle('tshow.promptbook.zip')).getFile()); for (const [k, b] of m) out[k] = /\.json$|\.md$/.test(k) ? (await b.text()).slice(0, 4000) : b.size; return out; });
  const files = await readShow();
  const cfg = JSON.parse(files['config.json']);
  ok(['templates/template-1.json', 'templates/palco-a.json', 'templates/board-1.json', 'boards/board-1.json'].every(f => f in files), 'template drawings saved under templates/: ' + Object.keys(files).sort().join(', '));
  ok(cfg.templates.join() === 'Template 1,Palco A,Board 1' && cfg.defaultTemplate === 'Palco A' && JSON.parse(files['templates/palco-a.json']).base === 'Template 1' && JSON.parse(files['boards/board-1.json']).base === 'Palco A', 'config.json lists them; bases stored');
  ok(!/Template|Palco/.test(files['script.md']), 'script.md on disk has no template in it');
  await page.reload(); await page.waitForSelector('#start .card');
  await page.getByText('Reopen “tshow”').click();
  await page.waitForSelector('.page.facing .board');
  ok(await ev(() => PB.S.templates.size) === 3 && await fig('Board 1').locator('.bbase path').count() === 3 && await fig('Board 1').locator('.bstrokes path').count() === 1, 'after reload the chain is back under the board');

  // 13b. images: a template's image is stored beside it; shape follows the root; copying a board copies its image
  const png = Buffer.from((await ev(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#eef'; x.fillRect(0, 0, 400, 200); x.strokeRect(20, 20, 360, 160); return c.toDataURL('image/png'); })).split(',')[1], 'base64');
  const setImg = async f => { const fc = page.waitForEvent('filechooser'); await f.locator('button', { hasText: 'Image' }).click(); await (await fc).setFiles({ name: 'plan.png', mimeType: 'image/png', buffer: png }); };
  await menu('Templates');
  await setImg(fig('Template 1'));
  await page.waitForFunction(() => PB.S.templates.get('Template 1').image && document.querySelector('#tpl .board svg image'));
  ok(await ev(() => Array.from(document.querySelectorAll('#tpl .board svg')).map(s => s.getAttribute('viewBox')).join('|')) === '0 0 1000 500|0 0 1000 500|0 0 1000 500', 'templates built on it take the shape of the root template');
  ok(await fig('Palco A').locator('.bbase image').count() === 1 && await page.locator('.tplbar').isVisible(), 'the root image shows greyed under the template built on it');
  await page.locator('.tplbar .btn', { hasText: 'Back to script' }).click();
  await page.waitForSelector('.page.facing .board .bbase image');
  ok(await fig('Board 1').locator('svg').getAttribute('viewBox') === '0 0 1000 500', 'and under the board');
  await setImg(fig('Board 2'));
  await page.waitForFunction(() => PB.S.boards.get('Board 2').image);
  await page.waitForTimeout(200);
  await fig('Board 2').locator('button', { hasText: 'To templates' }).click();
  await page.waitForFunction(() => PB.S.templates.has('Board 2') && !PB.S.store.saving && !PB.S.store.dirty.tpls.size && !PB.S.store.dirty.cfg);
  const zf = Object.keys(await readShow()), ls = n => zf.filter(k => k.startsWith(n + '/') && /\.(png|jpg)$/.test(k)).map(k => k.slice(n.length + 1)).sort();
  const imgs = [ls('boards'), ls('templates'), await ev(() => PB.S.templates.get('Template 1').image), await ev(() => PB.S.boards.get('Board 2').image)];
  ok(imgs[1].includes(imgs[2]) && imgs[0].includes(imgs[3]) && imgs[1].includes(imgs[3]), 'image files: template image in templates/, board image in boards/ and copied to templates/ with the board');
  await page.waitForTimeout(900);
  await page.reload(); await page.waitForSelector('#start .card');
  await page.getByText('Reopen “tshow”').click();
  await page.waitForSelector('.page.facing .board .bbase image');
  ok(await ev(() => PB.S.templates.size) === 4 && await ev(() => !!boardURL(PB.S.templates.get('Board 2')) && !!boardURL(PB.S.templates.get('Template 1'))), 'after reload the template images load again');

  // 14. a show saved by r0.1 (no templates, no runs flags; a runs flag in an old config is ignored) still opens
  await ev(() => PB.startMemory('ANNA: Ciao {SND 1 | a}.\n{BOARD X}\n', { title: 'old', departments: [{ code: 'LX', name: 'Luci', colour: '#c98a00' }, { code: 'SND', name: 'Audio', colour: '#1f6fd6' }], defaultBoard: null }, null, [{ name: 'X', image: null, w: 1000, h: 750, strokes: [] }]));
  ok(await ev(() => PB.S.cfg.departments.map(d => d.code + (d.runs === undefined ? '' : '!')).join() + '|' + PB.S.cfg.templates.length + '|' + PB.S.boards.get('X').base) === 'LX,SND|0|null', 'older show opens: no templates, no "runs" flag any more');
  await page.locator('.addboard').first().click();
  ok(await page.locator('#pop .pcol').count() === 0 && await page.locator('#pop input').count() === 1, 'without templates "+ Board" asks only the name');
  await nameBox(page); await page.keyboard.press('Enter'); await popGone(page);
  ok(await page.locator('#pop').isHidden() && await ev(() => PB.S.boards.size) === 2, 'and Enter adds the board');

  // 15. a template the settings name whose file is not in the show: said, and the name kept until the file is back or the user lets it go (STO-31)
  const tplJSON = (name, n) => JSON.stringify({ name, image: null, w: 1000, h: 750, strokes: Array.from({ length: n }, (_, k) => ({ colour: '#000', width: 2, points: [[100, 100 + 40 * k], [400, 140 + 40 * k]] })) });
  const put = (name, parts) => page.evaluate(async ([n, ps]) => {
    const fh = await (await navigator.storage.getDirectory()).getFileHandle(n, { create: true });
    const w = await fh.createWritable(); await w.write(await PB.buildZip(new Map(ps.map(([k, v]) => [k, new Blob([v])])))); await w.close();
    window.showOpenFilePicker = async () => [fh]; document.querySelector('#toast').hidden = true;
    return await PB.openZipFile();
  }, [name, parts]);
  const inZip = name => page.evaluate(async n => { const m = await PB.readZip(await (await (await navigator.storage.getDirectory()).getFileHandle(n)).getFile()), o = {}; for (const [k, b] of m) o[k] = await b.text(); return o; }, name);
  const listed = async name => JSON.parse((await inZip(name))['config.json']).templates.join();
  const allSaved = async () => { await page.waitForFunction(() => { const s = PB.S.store, d = s.dirty; return !s.saving && !d.script && !d.ink && !d.cfg && !d.boards.size && !d.tpls.size; }); await page.waitForTimeout(100); };
  const toastNow = () => ev(() => { const el = document.querySelector('#toast'); return el.hidden ? '' : el.textContent; });
  const note = page.locator('#tpl .tplgone');
  const GONE = [['script.md', 'ANNA: Ciao.\n'], ['config.json', JSON.stringify({ title: 'Manca', templates: ['Palco', 'Sala Prove', 'Fondale'], defaultTemplate: 'Sala Prove' })], ['templates/palco.json', tplJSON('Palco', 2)]];
  ok(await put('gone.zip', GONE) === true && await ev(() => Array.from(PB.S.templates.keys()).join() + '|' + PB.S.cfg.templates.join()) === 'Palco|Palco' && await page.locator('#banner').isHidden(), 'a show whose settings name templates that have no file opens with the templates it has');
  ok(await toastNow() === 'Templates named in the settings but missing from the show file: Sala Prove, Fondale. See Menu → Templates.', 'and a message names the ones without a file: ' + await toastNow());
  await menu('Templates');
  ok(await page.locator('#tpl .board').count() === 1 && /Sala Prove \(templates\/sala-prove\.json\), Fondale \(templates\/fondale\.json\)/.test(await note.textContent()), 'the Templates view names them too, each with the file it would be read from: ' + await note.textContent());
  await page.locator('.tplbar .btn', { hasText: '+ Template' }).click();
  await page.waitForFunction(() => PB.S.templates.size === 2); await allSaved();
  ok(await listed('gone.zip') === 'Palco,Template 2,Sala Prove,Fondale', 'the next change saves the list with the missing names still in it, after the others: ' + await listed('gone.zip'));
  await fig('Template 2').locator('button', { hasText: 'Rename' }).click();
  await nameBox(page); await page.locator('#pop input').fill('Fondale'); await page.keyboard.press('Enter'); await popGone(page); await allSaved();
  ok(await listed('gone.zip') === 'Palco,Fondale,Sala Prove' && !/Fondale/.test(await note.textContent()), 'a template given a missing name takes it, and the name is listed once: ' + await listed('gone.zip'));
  await fig('Fondale').locator('button', { hasText: 'Delete' }).click(); await allSaved();
  ok(await listed('gone.zip') === 'Palco,Sala Prove' && 'templates/fondale.json' in await inZip('gone.zip'), 'deleted, it is not kept as a missing name: its file would make it a template again at the next opening');
  let gz = await inZip('gone.zip'); gz['templates/sala-prove.json'] = tplJSON('Sala Prove', 3);
  ok(await put('gone.zip', Object.entries(gz)) === true && await ev(() => PB.S.cfg.templates.join() + '|' + PB.S.templates.get('Sala Prove').strokes.length + '|' + PB.S.cfg.defaultTemplate) === 'Palco,Sala Prove|3|Sala Prove' && await toastNow() === '', 'a file put back by hand is a template again, and the default one as it was, with no message');
  await put('gone2.zip', GONE); await menu('Templates');
  await note.locator('button', { hasText: 'Forget these names' }).click(); await allSaved();
  ok(await listed('gone2.zip') === 'Palco' && await note.count() === 0, '"Forget these names" drops them from the saved list: ' + await listed('gone2.zip'));
  ok(await put('gone2.zip', Object.entries(await inZip('gone2.zip'))) === true && await toastNow() === '', 'and the show then opens with no message');
  ok(await put('gone3.zip', GONE.slice(0, 1).concat([['config.json', JSON.stringify({ templates: ['Rotto'] })], ['templates/rotto.json', '{"name":"Rot']])) === true && /templates\/rotto\.json/.test(await page.locator('#banner').textContent()) && await toastNow() === '' && await ev(() => PB.S.store.gone.length) === 0,
    'a template whose file is there but cannot be read is a damaged part, not a missing one');
  await page.locator('#banner .btn', { hasText: 'Close the show' }).click(); await page.waitForSelector('#start .card');

  await done(); srv.close();
})();
