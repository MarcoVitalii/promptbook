const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT;
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, locale: 'en-GB', deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message + e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('promptbook.html'));
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  // geometry of every word before and after adding cues must be identical (the box may not move text)
  const geo = () => page.evaluate(() => Array.from(document.querySelectorAll('.page.script .w')).map(w => { const r = w.getBoundingClientRect(); return [w.textContent, Math.round(r.left * 100), Math.round(r.top * 100), Math.round(r.width * 100)].join('|'); }).join('\n'));
  await page.evaluate(() => PB.commitText(PB.serialize().replace(/\{[^}]*\}\s?/g, '')));
  const g0 = await geo();
  await page.evaluate(() => PB.commitText(PB.serialize()
    .replace('Rispondi!', 'Rispondi! {LX 12 | cambio}')
    .replace('svegli tutto', 'svegli {SND 3 | campana} {LX 13 | flash} {VID 1 | onde} tutto')
    .replace('senza una', 'senza {LX 14} una')
    .replace('Una barca.', 'Una {SND 4} barca. {VID 2}')));
  const g1 = await geo();
  ok(g0 === g1, 'adding boxed cues moves no word');
  const st = await page.evaluate(() => Array.from(document.querySelectorAll('.w.cued')).map(w => { const c = getComputedStyle(w); return [w.textContent, c.boxShadow.split('rgb').length - 1, c.backgroundColor !== 'rgba(0, 0, 0, 0)']; }));
  console.log(JSON.stringify(st));
  ok(st.length === 5 && st.every(x => x[1] >= 1 && x[2]), 'every cue word has a ring and a tint');
  ok(st.find(x => x[0] === 'svegli')[1] === 3, 'a word with three departments gets three rings');
  // connector starts at the box corner
  const chk = await page.evaluate(() => { const w = Array.from(document.querySelectorAll('.w.cued')).find(x => x.textContent === 'Rispondi!'), r = w.getBoundingClientRect(), pg = w.closest('.page'), pr = pg.getBoundingClientRect(), z = pr.width / 793; const d = Array.from(pg.querySelectorAll('.links path')).map(p => p.getAttribute('d')); const m = d.map(s => /^M([\d.]+) ([\d.]+)H/.exec(s)).filter(Boolean).map(m => [+m[1], +m[2]]); const want = [(r.right - pr.left) / z + 1.5, (r.bottom - pr.top) / z + 0.75]; return m.some(p => Math.abs(p[0] - want[0]) < 0.2 && Math.abs(p[1] - want[1]) < 0.2); });
  ok(chk, 'connector leaves from the bottom-right corner of the box');
  await page.evaluate(() => { document.querySelector('#bFacing').click(); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: OUT + '/09-box.png', clip: { x: 150, y: 60, width: 1200, height: 520 } });
  await page.locator('#bCues').click();
  ok(await page.evaluate(() => Array.from(document.querySelectorAll('.w.cued')).every(w => getComputedStyle(w).boxShadow === 'none' && getComputedStyle(w).backgroundColor === 'rgba(0, 0, 0, 0)')), 'boxes hide with the Cues toggle');
  await page.locator('#bCues').click(); await page.locator('#bNight').click(); await page.waitForTimeout(100);
  await page.screenshot({ path: OUT + '/10-box-night.png', clip: { x: 150, y: 60, width: 1200, height: 300 } });
  await page.locator('#bNight').click();
  await page.evaluate(() => { document.body.classList.add('pr-script'); PB.renderAll(); });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT + '/box.pdf', preferCSSPageSize: true, printBackground: true });
  console.log(errs.join('\n') || 'no page errors');
  await browser.close();
})();
