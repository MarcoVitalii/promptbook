// History: revisions and variants kept as a git repository inside the show, locked page numbers, changes per character.
const { ok, open, serve } = require('./_util');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const OUT = process.env.OUT || os.tmpdir();
const long = 'la notte porta il vento sul molo e nessuno guarda le barche che tornano piano dal largo con le reti vuote '.repeat(9).trim() + '.';
const L = ['---', 'title: Storia', 'characters:', '  - ANNA', '  - MARCO', '---', '# ATTO', '', '## Scena 1', ''];
for (let i = 1; i <= 240; i++) {
  if (i === 121) L.push('', '## Scena 2', '');
  L.push((i % 2 ? 'ANNA' : 'MARCO') + ': Battuta numero ' + i + ' della prova.' + (i % 7 === 0 ? ' ' + long : '') + (i === 10 ? ' {LX 1 | luce}' : ''));
}
const TEXT = L.join('\n') + '\n';
(async () => {
  const { srv, url } = await serve();
  const { page, done } = await open({ url });
  const ev = (fn, a) => page.evaluate(fn, a);
  const menu = async label => { await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: label }).click(); };
  const history = async () => { await menu('History'); await page.waitForSelector('#dlg .dbox'); };
  const toast = re => page.waitForFunction(r => { const el = document.querySelector('#toast'); return !el.hidden && new RegExp(r).test(el.textContent); }, re);
  const labels = () => ev(() => PB.S.pages.map(P => P.label + (P.chg ? '*' : '')).join(' '));
  const labelOf = n => ev(n => { const b = PB.S.blocks.find(b => b.plain.includes('Battuta numero ' + n + ' ')); return PB.S.pages[b.page - 1 + PB.S.pageOff].label; }, n);
  const loaded = () => page.waitForFunction(() => PB.S.loaded && !PB.S.store.saving);
  let repoN = 0;
  const repo = async () => {   // the show file as it is on disk, unzipped: a git repository
    const buf = Buffer.from(await ev(async () => Array.from(new Uint8Array(await (await (await (await navigator.storage.getDirectory()).getFileHandle('hist.promptbook.zip')).getFile()).arrayBuffer()))));
    const dir = path.join(OUT, 'hist-repo-' + (++repoN)); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dir + '.zip', buf);
    execFileSync('python3', ['-c', 'import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', dir + '.zip', dir]);
    return (...a) => { try { return execFileSync('git', a, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); } catch (e) { return 'ERR ' + (e.stderr || e.message); } };
  };

  // 1. history needs a show file
  await ev(tx => PB.startMemory(tx, {}), TEXT);
  await menu('History'); await toast('Save as show file');
  ok(await ev(() => document.querySelector('#dlg').hidden), 'a show that is not on disk has no history, and says why');
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showSaveFilePicker = async () => root.getFileHandle('hist.promptbook.zip', { create: true }); });
  await menu('Save as show file');
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);

  // 2. a revision, with the page numbers locked
  const before = await labels(), n0 = before.split(' ').length;
  await history();
  ok(/No revision yet/.test(await page.locator('#dlg').textContent()), 'the history starts empty');
  await page.locator('#hiName').fill('Prova 1'); await page.locator('#dlg .chk input').check();
  await page.locator('#dlg .btn', { hasText: 'Save revision' }).click(); await toast('Prova 1');
  const lock = await ev(() => PB.S.cfg.lock);
  ok(lock && lock.name === 'Prova 1' && lock.rev === 'Prova-1' && lock.pages.split(' ').length === n0 - 2, 'saving a revision with the box ticked locks every numbered page');
  ok(await labels() === before && !before.includes('*') && n0 > 6, 'locking changes no page number and marks no page: ' + before);
  ok(lock.cont.includes('1'), 'the sample has a page that opens in the middle of a speech, so that case is covered');
  let git = await repo();
  ok(git('fsck', '--strict') .indexOf('ERR') < 0, 'git fsck accepts the repository inside the show file: ' + git('fsck', '--strict'));
  ok(git('log', '--format=%s') === 'Prova 1' && git('tag') === 'Prova-1' && git('branch', '--show-current') === 'main', 'git sees one commit, its tag and the branch main');
  ok(git('show', 'Prova-1:script.md') + '\n' === TEXT && /"lock"/.test(git('show', 'HEAD:config.json')), 'the commit holds the script and the settings');
  git('reset', '-q');
  ok(git('status', '--porcelain') === '', 'after "git reset" the unzipped show is a clean working tree');

  // 3. text added on page 2: later pages keep their numbers, the overflow goes to lettered pages
  const far = await labelOf(200), lastLabel = before.split(' ').pop();
  const add = Array.from({ length: 40 }, (x, k) => 'MARCO: Riga nuova ' + (k + 1) + '.').join('\n');
  await ev(a => { const b = PB.S.blocks.find(b => b.page === 2 && b.type === 'speech'); PB.commitText(PB.serialize().replace(b.raw + '\n', b.raw + '\n' + a + '\n').replace('numero 3 della prova.', 'numero 3, cambiata.')); }, add);
  const after = await labels(), info = await ev(() => PB.S.lockInfo);
  ok(/ \d+[A-Z]\*/.test(after) && after.split(' ').length > n0, 'the pages that take the overflow are lettered and marked: ' + after);
  ok(await labelOf(200) === far && after.split(' ').pop() === lastLabel, 'a line further on is still on page ' + far + ' and the last page is still ' + lastLabel);
  ok(info.changed.includes('1') && info.changed.includes('2') && !info.changed.includes(far) && info.changed.length < 8, 'only the pages touched count as changed: ' + info.changed.join(' '));
  ok(new Set(after.replace(/\*/g, '').split(' ').filter(Boolean)).size === after.split(' ').filter(Boolean).length, 'no page label is used twice');
  await ev(() => PB.jumpTo(PB.S.blocks.find(b => b.page === 2)));
  ok(/changed since “Prova 1”/.test(await page.locator('.page.script .pfoot.chg').first().textContent()), 'a changed page says so at its foot');
  await ev(() => { document.body.classList.add('pr-script', 'pr-changed'); PB.renderAll(); });
  await page.emulateMedia({ media: 'print' });
  const shown = await ev(() => Array.from(document.querySelectorAll('.spread')).filter(s => getComputedStyle(s).display !== 'none').length);
  await page.pdf({ path: path.join(OUT, 'changed-pages.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' }); await ev(() => document.body.classList.remove('pr-script', 'pr-changed'));
  const sheets = +(/\/Count (\d+)/.exec(fs.readFileSync(path.join(OUT, 'changed-pages.pdf'), 'latin1')) || [])[1];
  ok(shown === info.changed.length && sheets === shown, '"Print changed pages" prints those ' + info.changed.length + ' pages and no other, with no empty sheet: ' + sheets);
  await ev(() => { const cl = PB.collectCues(); window.__p = cl[0].page; });
  ok(typeof await ev(() => window.__p) === 'string', 'the cue list gives the page as its label');

  // 4. what changed, for everyone and for one character
  await history();
  ok(/Changed pages: 1, 2/.test(await page.locator('#dlg').textContent()), 'History lists the changed pages');
  await page.locator('#dlg .rev .btn', { hasText: 'Changes' }).first().click();
  await page.waitForSelector('#dlg .df .de');
  ok(await page.locator('#dlg .df .de').count() === 41, 'against the revision: 40 lines added and one changed');
  const who = await page.locator('#dfWho option').allTextContents();
  ok(who.includes('ANNA (1)') && who.includes('MARCO (41)'), 'each character is offered with the number of changes that reach them: ' + who.join(', '));
  await page.locator('#dfWho').selectOption('ANNA');
  const anna = await page.locator('#dlg .df').innerText();
  ok(await page.locator('#dlg .df .de').count() === 1 && await page.locator('#dlg .df del').textContent() === '3 della prova.' && await page.locator('#dlg .df ins').textContent() === '3, cambiata.' && /changed · p\. 1/.test(anna), 'ANNA sees only her changed line, word by word, with its page');
  await page.locator('#dfWho').selectOption('MARCO');
  ok(/numero 3[\s\S]*the line before yours/.test(await page.locator('#dlg .df .de').first().innerText()) && await page.locator('#dlg .df .de').count() === 41, 'MARCO sees his new lines and the changed line he answers, marked as the line before his');
  await page.locator('#dlg .btn', { hasText: 'Close' }).click();

  // 5. a variant for a venue: its cut stays there
  await ev(() => PB.histSave('Prova 2', false));
  await history();
  await page.locator('#dlg input[placeholder^="Name of a new variant"]').fill('Teatro Verdi');
  await page.locator('#dlg .btn', { hasText: 'New variant' }).click(); await toast('Teatro Verdi');
  ok(await ev(async () => (await PB.histState()).branch) === 'Teatro-Verdi', 'a new variant starts from the show as it is and becomes the current one');
  const full = await ev(() => PB.serialize());
  await ev(() => PB.commitText(PB.serialize().replace(/## Scena 2[\s\S]*$/, '')));
  await ev(() => PB.histSave('Verdi, senza scena 2', false));
  await history(); await page.locator('#hiVar').selectOption('main'); await toast('main'); await loaded();
  ok(await ev(() => PB.serialize()) === full && await ev(() => PB.S.cfg.lock.name) === 'Prova 1', 'going back to main brings back the whole text and its locked pages');
  await ev(() => PB.histSwitch('Teatro-Verdi')); await loaded();
  ok(!(await ev(() => PB.serialize())).includes('Scena 2'), 'the venue variant still has its cut');

  // 6. restore: an older revision comes back and what was there is kept
  await ev(() => PB.commitText(PB.serialize() + '\nANNA: Non salvata.\n'));
  const first = await ev(async () => { const st = await PB.histState(); return st.log[st.log.length - 1].sha; });
  await history(); await page.locator('#dlg .rev .btn', { hasText: 'Restore' }).last().click(); await toast('Back to “Prova 1”'); await loaded();
  const st = await ev(async () => { const s = await PB.histState(); return s.log.map(c => c.msg); });
  ok(await ev(() => PB.serialize()) === TEXT, 'restoring the first revision brings its text back exactly');
  ok(/^Before going to “Prova 1”/.test(st[0]) && st.length === 4, 'the unsaved state was committed first: ' + st.join(' | '));
  ok(await ev(async sha => { const s = await PB.histState(); await PB.histRestore(s.log[0].sha); return PB.serialize().includes('ANNA: Non salvata.'); }, first), 'and can be restored in turn');
  git = await repo();
  ok(git('fsck', '--strict').indexOf('ERR') < 0 && git('branch', '--format=%(refname:short)').split('\n').sort().join() === 'Teatro-Verdi,main', 'git accepts it all and sees both variants as branches');
  ok(/script\.md/.test(git('diff', '--stat', 'main', 'Teatro-Verdi')) && git('tag').split('\n').length === 3, 'git diff between the variants works, and the three revisions are tags');

  // 7. the history is still there after closing and reopening the file
  await page.reload(); await page.waitForSelector('#start .card');
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showOpenFilePicker = async () => [await root.getFileHandle('hist.promptbook.zip')]; });
  await page.locator('#start .btn', { hasText: 'Open show file' }).click(); await loaded();
  ok(await ev(async () => { const s = await PB.histState(); return s.branch === 'Teatro-Verdi' && s.log.length === 5 && s.heads.size === 2; }), 'reopened: same variant, same revisions');

  // 8. unlocking gives plain numbers again
  await ev(() => PB.histSwitch('main')); await loaded();
  await ev(() => PB.unlockPages());
  ok(/^ {0,2}1 2 3 4/.test((await labels()).trim()) && !/[A-Z*]/.test(await labels()), 'unlocked, the pages are numbered 1, 2, 3 again');

  // 9. an older show folder keeps its history in a .git folder beside the script
  ok(await ev(async tx => {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('hshow', { create: true });
    const w = await (await dir.getFileHandle('script.md', { create: true })).createWritable(); await w.write(tx); await w.close();
    return PB.openFolder(dir);
  }, 'ANNA: Uno.\nMARCO: Due.\n'), 'a show folder opens');
  await ev(() => PB.histSave('Uno', false));
  await ev(() => PB.commitText('ANNA: Uno.\nMARCO: Tre.\n'));
  await ev(() => PB.histSave('Due', false));
  const fold = await ev(async () => {
    const s = await PB.histState(); await PB.histRestore(s.log[1].sha);
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('hshow');
    const head = await (await (await (await dir.getDirectoryHandle('.git')).getFileHandle('HEAD')).getFile()).text();
    return { n: s.log.length, head, disk: await (await (await dir.getFileHandle('script.md')).getFile()).text(), now: PB.serialize() };
  });
  ok(fold.n === 2 && fold.head === 'ref: refs/heads/main\n' && fold.disk === 'ANNA: Uno.\nMARCO: Due.\n' && fold.now === fold.disk, 'revisions are written under .git in the folder and a restore rewrites script.md');

  await done(); srv.close();
})();
