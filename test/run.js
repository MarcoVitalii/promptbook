#!/usr/bin/env node
// Runs test files side by side and prints failures only, then one line of totals.
// Usage: node test/run.js [folder or file ...]   (default: test/unit, then test)
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const files = (args.length ? args : ['test/unit', 'test']).flatMap(a => {
  const p = path.resolve(root, a);
  return fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter(f => f.endsWith('.test.js')).sort().map(f => path.join(p, f)) : [p];
});
const OUT = process.env.OUT || path.join(root, '.cache', 'out');
fs.mkdirSync(OUT, { recursive: true });
const JOBS = Number(process.env.JOBS) || Math.max(1, Math.min(4, os.cpus().length - 1));
const MAX_LINES = 20, MAX_CHARS = 300, TIMEOUT = 120000;
const BAD = /^FAIL|PAGEERROR|CONSOLE|Error:/;
// Files listed in test/KNOWN_FAILING still run and are named in the totals, but do not fail the run.
const KNOWN = new Set(fs.readFileSync(path.join(__dirname, 'KNOWN_FAILING'), 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean));

const run = file => new Promise(res => {
  const p = spawn(process.execPath, [file], { cwd: root, env: Object.assign({}, process.env, { OUT }) });
  let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
  const timer = setTimeout(() => { out += '\nError: timed out after ' + TIMEOUT / 1000 + ' s'; p.kill('SIGKILL'); }, TIMEOUT);
  p.on('close', code => {
    clearTimeout(timer);
    const lines = out.split('\n'), bad = lines.filter(l => BAD.test(l));
    if (code && !bad.length) bad.push('Error: exit code ' + code);
    res({ file: path.relative(root, file), pass: lines.filter(l => l.startsWith('PASS')).length, bad, nolibs: /error while loading shared libraries/.test(out) });
  });
});

(async () => {
  const t0 = Date.now(), queue = files.slice(), results = [];
  await Promise.all(Array.from({ length: JOBS }, async () => { while (queue.length) results.push(await run(queue.shift())); }));
  // A file that fails beside the others gets one more run on its own: pen and touch timing is sensitive to load.
  for (let i = 0; i < results.length; i++) if (results[i].bad.length && !results[i].nolibs && !KNOWN.has(results[i].file) && files.length > 1) results[i] = await run(path.resolve(root, results[i].file));
  results.sort((a, b) => a.file < b.file ? -1 : 1);
  const pass = results.reduce((n, r) => n + r.pass, 0);
  const known = results.filter(r => r.bad.length && KNOWN.has(r.file)), failed = results.filter(r => r.bad.length && !KNOWN.has(r.file));
  const fixed = results.filter(r => !r.bad.length && KNOWN.has(r.file));
  const secs = ((Date.now() - t0) / 1000).toFixed(1) + ' s';
  if (fixed.length) console.log('now passing, remove from test/KNOWN_FAILING: ' + fixed.map(r => r.file).join(', '));
  if (!failed.length) return console.log('ok ' + pass + ' checks, ' + files.length + ' files, ' + secs + (known.length ? ', known failing: ' + known.map(r => r.file).join(', ') : ''));
  if (results.some(r => r.nolibs)) console.log('Chromium cannot start: system libraries are missing. Run once: sudo npx playwright install-deps chromium');
  else {
    let left = MAX_LINES;
    for (const r of failed) {
      if (left <= 0) break;
      console.log(r.file);
      for (const l of r.bad.slice(0, Math.max(1, Math.min(4, left)))) { console.log('  ' + l.slice(0, MAX_CHARS)); left--; }
    }
  }
  console.log('FAILED ' + failed.length + ' of ' + files.length + ' files (' + failed.map(r => r.file).join(', ') + '), ' + pass + ' checks passed, ' + secs);
  process.exit(1);
})();
