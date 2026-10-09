// Keyboard shortcuts, the corner dock and the look of a cue tag (UI-9 to UI-11, CUE-7).
const { open, ok } = require('./_util');
const OUT = process.env.OUT;
(async () => {
  const { page, done } = await open();
  const T = ['# ATTO PRIMO', '', 'ANNA: Chi è là? {LX 1 | lanterna} Rispondi! {SND 2}', 'MARCO: Sono io. {/LX 1}', '',
    ...Array.from({ length: 90 }, (_, i) => 'ANNA: Battuta numero ' + i + ' con il timone in mano.')].join('\n');
  await page.evaluate(t => PB.startMemory(t), T);
  await page.waitForSelector('.page .tag');
  const ev = f => page.evaluate(f);
  const view = () => ev(() => { const v = PB.S.view; return [v.facing, v.cues, v.ink, v.night].join(); });
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(60); };

  // view toggles
  ok(await view() === 'true,true,true,false', 'the show opens with boards, cues and ink shown');
  await key('b'); await key('c'); await key('i'); await key('n');
  ok(await view() === 'false,false,false,true', 'B, C, I and N toggle boards, cues, ink and night: ' + await view());
  if (OUT) await page.screenshot({ path: OUT + '/shortcuts-night.png' });
  await key('b'); await key('c'); await key('i'); await key('n');
  ok(await view() === 'true,true,true,false', 'the same keys toggle them back');

  // tools
  await key('2');
  ok(await ev(() => PB.S.tool.mode === 'pen' && PB.S.tool.colour === document.querySelectorAll('#pens .sw')[1].dataset.c), '2 picks the second pen');
  await key('e');
  ok(await ev(() => PB.S.tool.mode) === 'erase', 'E picks the eraser');
  await key('e');
  ok(await ev(() => PB.S.tool.mode) === 'pen', 'E again goes back to the pen');
  await key('f');
  ok(await ev(() => PB.S.tool.finger) === true, 'F lets the finger draw');
  await key('f');

  // zoom and pages
  const z0 = await ev(() => PB.S.view.zoom);
  await key('+');
  ok(await ev(() => PB.S.view.zoom) > z0 && await ev(() => PB.S.view.fit) === false, '+ zooms in');
  await key('-'); await key('-');
  ok(await ev(() => PB.S.view.zoom) < z0, '− zooms out');
  await key('0');
  ok(await ev(() => PB.S.view.fit) === true, '0 fits the page to the window');
  const top = () => ev(() => document.querySelector('#desk').scrollTop);
  ok(await ev(() => PB.S.pages.length) >= 3, 'the script runs over three pages or more');
  await key('PageDown'); const t1 = await top();
  await key('PageDown'); const t2 = await top();
  ok(t1 > 0 && t2 > t1, 'Page Down goes to the next page, twice: ' + [t1, t2].join());
  await key('PageUp');
  ok(Math.abs(await top() - t1) < 2, 'Page Up goes back one page');
  await key('End'); ok(await top() > t2, 'End goes to the end of the script');
  await key('Home'); ok(await top() === 0, 'Home goes to the start');

  // panels
  await key('l');
  ok(await ev(() => PB.S.drawer) === 'cues', 'L opens the cue list');
  await key('r');
  ok(await ev(() => PB.S.drawer) === 'review', 'R opens Review');
  await key('r');
  ok(await ev(() => PB.S.drawer) === null && await page.locator('#drawer').isHidden(), 'R again closes it');

  // find, and no shortcut while typing
  await key('/');
  ok(await ev(() => document.activeElement.id) === 'search', '/ puts the cursor in Find');
  await page.keyboard.type('bin 89');
  ok(await view() === 'true,true,true,false' && await page.locator('#search').inputValue() === 'bin 89', 'letters typed in a field are text, not shortcuts');
  await ev(() => { document.querySelector('#search').value = ''; document.activeElement.blur(); });

  // Ctrl+P is taken over, Ctrl+S saves
  await key('Control+p');
  ok((await page.locator('#pop .btn').count()) === 2, 'Ctrl+P opens the tool’s own print choices');
  await key('b');
  ok(await view() === 'true,true,true,false', 'a single key does nothing while a box is open');
  await key('Escape');
  await key('Control+s');

  // the shortcuts dialog
  await key('?');
  const rows = await page.locator('#dlg table.keys tr').count();
  ok(rows >= 15 && (await page.locator('#dlg header').textContent()) === 'Keyboard shortcuts', '? lists the shortcuts: ' + rows + ' rows');
  await key('n');
  ok(await view() === 'true,true,true,false', 'no shortcut acts behind a dialog');
  await key('Escape');
  ok(await page.locator('#dlg').isHidden(), 'Escape closes the list');
  await page.locator('#bKeys').click();
  ok(await page.locator('#dlg table.keys').isVisible(), 'the ? button in the corner opens it too');
  await page.locator('#dlg footer .btn').click();
  await page.locator('#bMenu').click();
  ok(await page.locator('#menu button', { hasText: 'Keyboard shortcuts' }).count() === 1, 'and so does the menu');
  await key('Escape');

  // tooltips name the key
  ok((await page.locator('#bCues').getAttribute('title')).endsWith('(C)') && (await page.locator('#bPrint').getAttribute('title')).endsWith('(Ctrl+P)'), 'a tooltip names the key of its button');

  // toolbar and dock
  const lay = await ev(() => {
    const r = id => document.querySelector(id).getBoundingClientRect(), bar = r('#bar'), dk = r('#dock'), desk = r('#desk');
    return { barH: bar.height, inDock: ['#bNight', '#zIn', '#zOut', '#zFit', '#bKeys'].every(i => document.querySelector(i).closest('#dock')),
      corner: dk.right <= desk.right && dk.bottom <= desk.bottom && dk.left > desk.left + desk.width / 2 && dk.top > desk.top + desk.height / 2 };
  });
  ok(lay.barH < 60, 'the toolbar is one row at 1500 px: ' + lay.barH);
  ok(lay.inDock && lay.corner, 'night, zoom and help sit in the bottom right corner of the desk');
  await page.setViewportSize({ width: 1280, height: 800 });
  ok(await ev(() => document.querySelector('#bar').getBoundingClientRect().height) < 60, 'and still one row at 1280 px');
  await page.setViewportSize({ width: 1500, height: 900 });

  // cue tags: a filled label for a start, an outlined one for an end
  const tags = await ev(() => Array.from(document.querySelectorAll('.page .tag')).map(tg => {
    const b = tg.querySelector('b'), c = getComputedStyle(b), d = PB.S.cfg.departments.find(q => tg.textContent.startsWith(q.code));
    const hex = d.colour, rgb = 'rgb(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')';
    return { end: tg.classList.contains('etag'), filled: c.backgroundColor === rgb, ink: c.color, h: tg.offsetHeight, code: d.code };
  }));
  const starts = tags.filter(x => !x.end), ends = tags.filter(x => x.end);
  ok(starts.length === 2 && starts.every(x => x.filled), 'the label of a cue is filled with the department colour');
  ok(starts.find(x => x.code === 'LX').ink === 'rgb(22, 21, 15)' && starts.find(x => x.code === 'SND').ink === 'rgb(255, 255, 255)', 'its text is dark on a light colour and white on a dark one');
  ok(ends.length === 1 && !ends[0].filled, 'the label of an end is not filled');
  ok(tags.every(x => x.h <= 22), 'a one-line tag is no taller than a line of script: ' + tags.map(x => x.h).join());
  if (OUT) await page.screenshot({ path: OUT + '/shortcuts-day.png' });
  await done();
})();
