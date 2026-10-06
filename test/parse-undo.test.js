const { chromium } = require('./_pw');
const path = require('path');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 800 }, locale: 'en-GB' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message + e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('promptbook.html'));
  await page.waitForSelector('#start .card');
  // file:// storage facilities used by "reopen last folder"
  console.log('file:// idb', await page.evaluate(async () => { await idbSet('probe', { a: 1 }); const v = await idbGet('probe'); let opfs = 'n/a'; try { const d = await navigator.storage.getDirectory(); await idbSet('h', d); const hh = await idbGet('h'); opfs = hh && hh.kind; } catch (e) { opfs = 'err ' + e.name; } return [JSON.stringify(v), opfs]; }));
  // start from pasted text with messy input
  await page.getByText('Start from pasted text').click();
  await page.waitForSelector('#dlg textarea');
  const messy = 'ATTO PRIMO\r\n\r\nSCENA 1: Il porto\r\n\r\n(Entra ANNA.)\r\nANNA:Chi è là?   \r\nmarco: sono io\r\nMARCO : Sono io.\r\nANNA E MARCO: Insieme!\r\nPoi una riga che continua la battuta.\r\n\r\nUna riga orfana dopo uno spazio.\r\n(un’azione che\r\ncontinua su due righe)\r\nSOLDATO 1: Alt! Sono le 10:30.\r\nNOTA: questo è un commento del regista\r\n';
  await page.locator('#dlg textarea').fill(messy);
  await page.locator('#dlg .btn', { hasText: 'Save' }).click();
  await page.waitForSelector('.page.script .row');
  const bl = await page.evaluate(() => PB.S.blocks.map(b => b.type + (b.level || '') + ':' + (b.name || '') + ':' + b.plain.replace(/\n/g, '⏎').slice(0, 44)));
  console.log(bl.join('\n'));
  const rv = await page.evaluate(() => { const r = PB.reviewData(); return [r.paras.length, Array.from(r.chars.keys()).join('|')]; });
  console.log('review', JSON.stringify(rv));
  ok(bl[0].startsWith('h1') && bl[1].startsWith('h2'), 'unmarked ATTO / SCENA lines become headings');
  ok(bl.some(x => x.startsWith('speech:ANNA:')) && bl.some(x => x.startsWith('speech:MARCO:')) && bl.some(x => x.startsWith('speech:ANNA E MARCO:')) && bl.some(x => x.startsWith('speech:SOLDATO 1:')), 'speakers found, including "ANNA:Chi", "MARCO :" and "ANNA E MARCO"');
  ok(bl.some(x => x.includes('Insieme!⏎Poi una riga')), 'a following unnamed line continues the speech');
  ok(bl.some(x => x.startsWith('para::marco: sono io')) || bl.some(x => x.includes('⏎marco: sono io')), 'lower-case "marco:" is not taken for a speaker');
  ok(bl.some(x => x.startsWith('action') && x.includes('⏎continua su due righe)')), 'two-line action kept together');
  ok(rv[0] >= 1, 'unrecognised lines listed for review: ' + rv[0]);
  // undo across several text edits uses span history
  const t0 = await page.evaluate(() => PB.serialize());
  await page.evaluate(() => { PB.commitText(PB.serialize().replace('Alt!', 'Alt! {LX 1}')); PB.commitText(PB.serialize().replace('Chi è là?', 'Chi va là?')); PB.commitText(PB.serialize() + '\nANNA: fine.\n'); });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Control+z');
  ok(await page.evaluate(t => PB.serialize() === t, t0), 'three undos return to the starting text exactly');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Control+Shift+z');
  ok(await page.evaluate(() => /Alt! \{LX 1\}/.test(PB.serialize()) && /Chi va là\?/.test(PB.serialize()) && /ANNA: fine\.\n$/.test(PB.serialize())), 'three redos reapply them');
  // empty show: board on an empty page, then text
  await page.evaluate(() => PB.startMemory('', {}));
  await page.locator('.addboard').first().click();
  ok(await page.evaluate(() => PB.serialize()) === '{BOARD Board 1}\n', 'board can be added to an empty show');
  console.log(errs.join('\n') || 'no page errors');
  await browser.close();
})();
