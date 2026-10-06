// Shared helpers for the browser checks.
const pw = require('./_pw');
const path = require('path'), fs = require('fs'), http = require('http');
exports.ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
exports.file = path.resolve(__dirname, '..', 'promptbook.html');
exports.serve = () => new Promise(res => {
  const html = fs.readFileSync(exports.file);
  const srv = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(html); }).listen(0, () => res({ srv, url: 'http://localhost:' + srv.address().port + '/promptbook.html' }));
});
exports.open = async (opts = {}) => {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1500, height: 900 }, locale: 'en-GB', acceptDownloads: true }, opts.ctx || {}));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(opts.url || 'file://' + exports.file);
  await page.waitForSelector('#start .card');
  const cdp = await ctx.newCDPSession(page);
  const pen = async (pts, o = {}) => {
    const b = o.buttons || 1, button = o.button || 'left';
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button, buttons: b, clickCount: 1, pointerType: 'pen' });
    for (const p of pts.slice(1)) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], button, buttons: b, pointerType: 'pen' });
    const l = pts[pts.length - 1];
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: l[0], y: l[1], button, buttons: 0, clickCount: 1, pointerType: 'pen' });
  };
  const done = async () => { console.log(errs.join('\n') || 'no page errors'); await browser.close(); };
  return { browser, ctx, page, cdp, pen, errs, done, text: () => page.evaluate(() => PB.serialize()) };
};
