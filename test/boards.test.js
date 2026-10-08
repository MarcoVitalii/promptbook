// Boards on a facing page: one column up to two boards, two columns from three on, at most 8 through the interface.
const { ok, open, serve } = require('./_util');
const OUT = process.env.OUT || '.';
(async () => {
  const { srv, url } = await serve();
  const { page, pen, done } = await open({ url });
  const ev = (f, a) => page.evaluate(f, a);
  const script = n => '## Scena 1\n\nANNA: Ciao.\n' + Array.from({ length: n }, (_, k) => '{BOARD b' + (k + 1) + '}\n').join('');
  const near = (a, b) => Math.abs(a - b) <= 1;
  const figs = page.locator('.page.facing .board');
  // boxes of the figures, of the page body and of the "+ Board" button, once n figures are drawn
  const set = async n => {
    await ev(s => PB.commitText(s), script(n));
    await page.waitForFunction(k => document.querySelectorAll('.page.facing .board').length === k, n);
    const bx = []; for (let k = 0; k < n; k++) bx.push(await figs.nth(k).boundingBox());
    return { bx, body: await page.locator('.page.facing .fbody').first().boundingBox(), add: await page.locator('.page.facing .addboard').first().boundingBox(), pg: await page.locator('.page.facing').first().boundingBox() };
  };
  const inside = (b, o) => b.x >= o.x - 0.5 && b.y >= o.y - 0.5 && b.x + b.width <= o.x + o.width + 0.5 && b.y + b.height <= o.y + o.height + 0.5;

  await ev(s => PB.startMemory(s, {}), script(1));
  await page.waitForSelector('.page.facing .board');
  ok(await ev(() => PB.S.pages[0].boards.length) === 1 && await ev(() => document.querySelector('.page.facing .board').style.width) === '733px', 'one blank board on A4 is 733 px wide, as before');

  let L = await set(2);
  ok(near(L.bx[0].x, L.bx[1].x) && L.bx[1].y >= L.bx[0].y + L.bx[0].height, '2 boards: one column, the second below the first');
  ok(near(L.bx[0].width, L.bx[1].width) && inside(L.bx[1], L.body), '2 boards: same width, inside the page body');

  L = await set(3);
  ok(near(L.bx[0].y, L.bx[1].y) && L.bx[1].x >= L.bx[0].x + L.bx[0].width, '3 boards: the second is to the right of the first, on the same row');
  ok(near(L.bx[2].x, L.bx[0].x) && L.bx[2].y >= L.bx[0].y + L.bx[0].height, '3 boards: the third is under the first');
  ok(await page.locator('.page.facing .fgrid > *').count() === 3, '3 boards: the fourth cell stays empty');
  ok(L.bx[0].width > L.body.width * 0.4, '3 boards: each takes close to half the page width: ' + Math.round(L.bx[0].width) + ' of ' + Math.round(L.body.width));

  L = await set(4);
  ok(near(L.bx[2].y, L.bx[3].y) && near(L.bx[3].x, L.bx[1].x) && near(L.bx[2].width, L.bx[3].width) && near(L.bx[0].width, L.bx[1].width), '4 boards: two rows of two, the boards of a row equally wide');
  // drawing on the second board of a row lands on that board, in its own coordinates
  const sb = await figs.nth(1).locator('svg').boundingBox();
  await pen([[sb.x + sb.width * 0.25, sb.y + sb.height * 0.5], [sb.x + sb.width * 0.5, sb.y + sb.height * 0.6], [sb.x + sb.width * 0.75, sb.y + sb.height * 0.5]]);
  const ink = await ev(() => ({ n: ['b1', 'b2', 'b3', 'b4'].map(k => PB.S.boards.get(k).strokes.length).join(), p: (PB.S.boards.get('b2').strokes[0] || { points: [[-1, -1]] }).points[0] }));
  ok(ink.n === '0,1,0,0', 'a stroke drawn on the second board of a row is stored on that board: ' + ink.n);
  ok(near(ink.p[0], 250) && near(ink.p[1], 375), 'its first point is in board coordinates: ' + ink.p.map(Math.round));

  L = await set(5);
  ok(near(L.bx[4].x, L.bx[2].x) && near(L.bx[4].x, L.bx[0].x) && L.bx[4].y >= L.bx[2].y + L.bx[2].height, '5 boards: the fifth is under the third, on the left');
  ok(L.bx.every(b => inside(b, L.body)), '5 boards: all inside the page body');
  await page.setViewportSize({ width: 1500, height: 1300 });   // the whole page in view, for the picture
  await page.locator('.page.facing').first().screenshot({ path: OUT + '/boards-5.png' });
  await page.setViewportSize({ width: 1500, height: 900 });

  for (const n of [6, 7]) { L = await set(n); ok(L.bx.every(b => inside(b, L.body)) && near(L.bx[n - 1].x, L.bx[(n - 1) % 2].x), n + ' boards: in two columns, inside the page body'); }

  L = await set(8);
  ok(L.bx.every(b => inside(b, L.body)), '8 boards: every figure lies inside the page body');
  ok(L.bx.every((b, k) => near(b.x, L.bx[k % 2].x) && near(b.y, L.bx[k - k % 2].y)) && L.bx[7].y > L.bx[5].y, '8 boards: four rows of two, filled row by row');
  ok(L.add.y >= L.bx[7].y + L.bx[7].height && inside(L.add, L.pg) && inside(L.add, L.body), '8 boards: "+ Board" is below the last figure and inside the page');
  const before = await ev(() => PB.S.boards.size);
  await page.locator('.page.facing .addboard').first().click();
  ok(await ev(() => PB.S.boards.size) === before && await ev(() => PB.S.pages[0].boards.length) === 8, 'with 8 boards "+ Board" adds nothing');
  ok(await page.locator('#toast').isVisible() && (await page.locator('#toast').textContent()).includes('8'), 'and a message says a page holds 8 at most');

  L = await set(9);
  ok(L.bx.length === 9 && L.bx.every(b => inside(b, L.body)) && near(L.bx[8].x, L.bx[0].x), '9 boards typed in the text are all drawn, in two columns, inside the page body');
  ok(L.add.y >= L.bx[8].y + L.bx[8].height && inside(L.add, L.body), '9 boards: "+ Board" still below them, inside the page body');

  // a page with room still takes a board
  L = await set(7);
  await page.locator('.page.facing .addboard').first().click();
  await page.waitForFunction(() => document.querySelectorAll('.page.facing .board').length === 8);
  ok(await ev(() => PB.S.pages[0].boards.length) === 8, 'with 7 boards "+ Board" adds the eighth');

  // ---- names under the drawings, buttons above (one "⋯" when the figure is narrow) ----
  const names = () => page.locator('.page.facing .bname');
  const below = async f => { const s = await f.locator('svg').boundingBox(), n = await f.locator('.bname').boundingBox(); return n.y >= s.y + s.height - 0.5 && n.height > 10 && n.x >= s.x - 0.5 && n.x + n.width <= s.x + s.width + 0.5; };
  const shot = async file => { await page.setViewportSize({ width: 1500, height: 1300 }); await page.locator('.page.facing').first().screenshot({ path: OUT + '/' + file }); await page.setViewportSize({ width: 1500, height: 900 }); };

  L = await set(1);
  ok((await figs.first().locator('.bcap button').allTextContents()).join('|') === 'Image…|To templates|Clear ink|Remove', '1 board: the four buttons are shown directly, no "⋯"');
  ok(await below(figs.first()) && await names().first().textContent() === 'b1', '1 board: its name is under the drawing');
  L = await set(2);
  ok(await figs.nth(1).locator('.bcap button').count() === 4 && L.bx.every(b => inside(b, L.body)), '2 boards: the buttons are still shown directly, and both figures fit the page');

  L = await set(4);
  let nmOk = true; for (let k = 0; k < 4; k++) nmOk = nmOk && await names().nth(k).isVisible() && await below(figs.nth(k));
  ok(nmOk, '4 boards: every name is visible, under its drawing and no wider than it');
  ok((await names().allTextContents()).join() === 'b1,b2,b3,b4', '4 boards: each name is the name of its board');
  ok((await page.locator('.page.facing .board .bcap button').allTextContents()).join('') === '⋯⋯⋯⋯', '4 boards: each figure shows exactly one button, "⋯"');
  await shot('boards-names-4.png');
  const s2 = await figs.nth(1).locator('svg').boundingBox();
  const had = await ev(() => PB.S.boards.get('b2').strokes.length);
  await pen([[s2.x + 40, s2.y + 40], [s2.x + 90, s2.y + 60], [s2.x + 140, s2.y + 40]]);
  ok(await ev(() => PB.S.boards.get('b2').strokes.length) === had + 1, 'a stroke is drawn on the second board');
  await figs.nth(1).locator('.bcap button').click();
  ok(await page.locator('#pop').isVisible() && (await page.locator('#pop .pcol .btn').allTextContents()).join('|') === 'Image…|To templates|Clear ink|Remove', '"⋯" opens a list with Image…, To templates, Clear ink, Remove');
  await page.locator('#pop .btn', { hasText: 'Clear ink' }).click();
  ok(await ev(() => PB.S.boards.get('b2').strokes.length) === 0 && await page.locator('#pop').isHidden(), '"Clear ink" from the list empties that board and closes the list');
  await figs.nth(2).locator('.bcap button').click();
  await page.locator('#pop .btn', { hasText: 'Remove' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.page.facing .board').length === 3);
  const txt = await ev(() => PB.serialize());
  ok(!txt.includes('{BOARD b3}') && txt.includes('{BOARD b2}') && txt.includes('{BOARD b4}'), '"Remove" from the list takes that board\'s token out of the text, and no other');

  // a tap on a name renames
  L = await set(4);
  await names().nth(1).click();
  ok(await page.locator('#pop input').isVisible() && await page.locator('#pop input').inputValue() === 'b2', 'a click on a name opens the rename popover with that name');
  await page.locator('#pop input').fill('Salotto');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.page.facing .bname')).some(n => n.textContent === 'Salotto'));
  ok((await ev(() => PB.serialize())).includes('{BOARD Salotto}') && !(await ev(() => PB.serialize())).includes('{BOARD b2}'), 'typing a name and Enter renames the token in the text');
  ok((await names().allTextContents()).join() === 'b1,Salotto,b3,b4' && await ev(() => PB.S.boards.has('Salotto') && !PB.S.boards.has('b2')), 'and the name under the drawing');

  // the pen does not draw on a name
  const count = () => ev(() => Array.from(PB.S.boards.values()).reduce((s, B) => s + B.strokes.length, 0));
  const c0 = await count(), nb = await names().nth(0).boundingBox();
  await pen([[nb.x + nb.width / 2, nb.y + nb.height / 2], [nb.x + nb.width / 2 + 20, nb.y - 30], [nb.x + nb.width / 2 + 40, nb.y - 60]]);
  ok(await count() === c0, 'a pen stroke that starts on a name adds no stroke to any board');
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 300);   // close whatever the tap opened

  // a long name is cut, not spilled
  await ev(s => PB.commitText(s), '## Scena 1\n\nANNA: Ciao.\n{BOARD Atto primo, scena seconda: il salotto di casa Rossi al tramonto con tutti i mobili}\n{BOARD b2}\n{BOARD b3}\n');
  await page.waitForFunction(() => document.querySelectorAll('.page.facing .board').length === 3);
  const cut = await ev(() => { const n = document.querySelector('.page.facing .bname'), f = n.closest('.board'); return [n.scrollWidth > n.clientWidth, n.getBoundingClientRect().width <= f.querySelector('svg').getBoundingClientRect().width + 0.5, getComputedStyle(n).textOverflow]; });
  ok(cut[0] && cut[1] && cut[2] === 'ellipsis', 'a name wider than the drawing is cut with an ellipsis: ' + cut.join());

  // 8 boards with the taller figure; on paper too
  L = await set(8);
  ok(near(L.bx[0].height / L.bx[0].width * 244, 229), 'on screen a figure is as tall as its drawing, the button row and the name: ' + (L.bx[0].height / L.bx[0].width * 244).toFixed(1));
  ok(L.bx.every(b => inside(b, L.body)) && inside(L.add, L.body), '8 boards with names: every figure and "+ Board" inside the page body');
  nmOk = true; for (let k = 0; k < 8; k++) nmOk = nmOk && await names().nth(k).isVisible() && await below(figs.nth(k));
  ok(nmOk && (await names().allTextContents()).join() === 'b1,b2,b3,b4,b5,b6,b7,b8', '8 boards: every name is visible under its drawing');
  await shot('boards-names-8.png');
  await page.emulateMedia({ media: 'print' });
  await ev(() => document.body.classList.add('pr-book'));
  const pr = await ev(() => Array.from(document.querySelectorAll('.page.facing .board')).map(f => ({ fw: parseFloat(f.style.width), sh: f.querySelector('svg').getBoundingClientRect().height, w: f.querySelector('svg').getBoundingClientRect().width, h: f.getBoundingClientRect().height, cap: getComputedStyle(f.querySelector('.bcap')).visibility, capH: f.querySelector('.bcap').getBoundingClientRect().height, nm: getComputedStyle(f.querySelector('.bname')).visibility, nmH: f.querySelector('.bname').getBoundingClientRect().height })));
  ok(pr.every(f => f.cap === 'hidden' && f.capH === 26), 'in print the button row is not shown but keeps its height');
  ok(pr.every((f, k) => f.nm === 'visible' && f.nmH === 20 && f.w === f.fw && near(f.h, f.sh + 46)), 'in print the names show and a figure is as tall as the layout counts: drawing + 46');
  await shot('boards-names-print.png');
  await page.pdf({ path: OUT + '/boards-names.pdf', format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  await ev(() => document.body.classList.remove('pr-book'));
  await page.emulateMedia({ media: 'screen' });

  // templates use the same figure
  await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: 'Templates' }).click();
  await page.locator('.tplbar .btn', { hasText: '+ Template' }).click();
  const tf = page.locator('#tpl .board').first();
  ok(await below(tf) && await tf.locator('.bname').textContent() === 'Template 1', 'Templates view: the name is under the drawing');
  ok(await tf.locator('.bcap button').count() === 7 && await tf.locator('.bcap button', { hasText: '⋯' }).count() === 0, 'Templates view: the buttons are shown above, no "⋯"');
  await tf.locator('.bcap button', { hasText: 'Rename' }).click();
  await page.locator('#pop input').fill('Pianta'); await page.keyboard.press('Enter');
  ok(await ev(() => PB.S.templates.has('Pianta')) && await page.locator('#tpl .bname').first().textContent() === 'Pianta', 'Templates view: "Rename" still works and the name under the drawing follows');
  await page.locator('#tpl .bname').first().click();
  ok(await page.locator('#pop input').inputValue() === 'Pianta', 'Templates view: a click on the name opens the rename popover');
  await page.keyboard.press('Escape');

  await done(); srv.close();
})();
