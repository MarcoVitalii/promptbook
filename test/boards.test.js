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

  await done(); srv.close();
})();
