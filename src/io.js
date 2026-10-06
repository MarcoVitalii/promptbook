/* =====================================================================
   STORE: show folder (Chrome, Edge) or in-browser fallback
   ===================================================================== */
function resetStore() {
  const s = S.store;
  s.mode = 'none'; s.dir = null; s.name = ''; s.stamp = {}; s.conflict = false; s.lastSave = null; s.err = null; s.saving = false; s.again = false;
  s.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() };
}
async function dirFor(sub) { return sub ? S.store.dir.getDirectoryHandle(sub, { create: true }) : S.store.dir; }
async function readFile(name, sub) {
  try { const d = await dirFor(sub); return await (await d.getFileHandle(name)).getFile(); }
  catch (e) { if (e && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) return null; throw e; }
}
async function readText(name, sub) {
  const f = await readFile(name, sub); if (!f) return null;
  if (!sub) S.store.stamp[name] = f.lastModified;
  return f.text();
}
async function readJSON(name, sub) {
  const tx = await readText(name, sub); if (tx == null) return null;
  try { return JSON.parse(tx); } catch (e) { console.warn('Unreadable JSON: ' + name); return null; }
}
async function writeBlob(sub, name, blob) {
  const d = await dirFor(sub), fh = await d.getFileHandle(name, { create: true });
  const w = await fh.createWritable(); await w.write(blob); await w.close();
  return fh;
}
async function writeText(name, text) {
  const fh = await writeBlob(null, name, text);
  S.store.stamp[name] = (await fh.getFile()).lastModified;
}
function cfgFile() {
  const c = JSON.parse(JSON.stringify(S.cfg));
  if (S.store.mode === 'folder' && c.defaultBoard) delete c.defaultBoard.imageData;
  return c;
}
function boardFile(B, withData) {
  const o = { name: B.name, image: B.image || null, w: BOARD_W, h: B.h, strokes: B.strokes };
  if (B.base) o.base = B.base;
  if (withData && B.imageData) o.imageData = B.imageData;
  return o;
}
function boardNames(text) {
  const out = new Set(), re = /\{BOARD[ \t]+([^{}|]+?)[ \t]*(?:\|[^{}]*)?\}/gi; let m;
  while ((m = re.exec(text))) out.add(m[1].trim());
  return out;
}
async function changedOutside() {
  const s = S.store;
  try { const f = await readFile('script.md'); return !!f && f.lastModified !== s.stamp['script.md']; } catch (e) { return false; }
}
let saveT = 0;
function markDirty(what, name) {
  if (!S.loaded) return;
  const d = S.store.dirty;
  if (what === 'board') d.boards.add(name); else if (what === 'tpl') d.tpls.add(name); else d[what] = true;
  setStatus();
  clearTimeout(saveT); saveT = setTimeout(saveNow, 700);
}
function saveError(e) { S.store.err = e; console.error(e); setStatus(); }
async function saveNow(force) {
  const s = S.store, d = s.dirty;
  if (s.saving) { s.again = true; return; }
  clearTimeout(saveT);
  if (s.mode === 'none') return;
  s.saving = true; setStatus();
  try {
    if (s.mode === 'folder') {
      if (d.script) {
        if (force !== true && !s.conflict && await changedOutside()) { s.conflict = true; showConflict(); }
        if (!s.conflict || force === true) {
          d.script = false;
          try { await writeText('script.md', serialize()); } catch (e) { d.script = true; throw e; }
          s.conflict = false; showMemBanner();
        }
      }
      if (d.ink) { d.ink = false; try { await writeText('script.ink.json', JSON.stringify(inkFile())); } catch (e) { d.ink = true; throw e; } }
      if (d.cfg) { d.cfg = false; try { await writeText('config.json', JSON.stringify(cfgFile(), null, 2)); } catch (e) { d.cfg = true; throw e; } }
      if (d.boards.size) {
        const names = Array.from(d.boards); d.boards.clear();
        for (const n of names) {
          const B = S.boards.get(n); if (!B) continue;
          try { await writeBlob('boards', slug(B.name) + '.json', JSON.stringify(boardFile(B))); } catch (e) { d.boards.add(n); throw e; }
        }
      }
      if (d.tpls.size) {
        const names = Array.from(d.tpls); d.tpls.clear();
        for (const n of names) {
          const T = S.templates.get(n); if (!T) continue;
          try { await writeBlob('templates', slug(T.name) + '.json', JSON.stringify(boardFile(T))); } catch (e) { d.tpls.add(n); throw e; }
        }
      }
      s.lastSave = new Date(); s.err = null;
    } else {
      d.script = d.ink = d.cfg = false; d.boards.clear(); d.tpls.clear();
      saveDraft();
    }
  } catch (e) { s.err = e; console.error(e); }
  s.saving = false; setStatus();
  if (s.again) { s.again = false; saveNow(); }
}
function bundle(withImages) {
  return { format: 'promptbook', version: 1, when: new Date().toISOString(), config: JSON.parse(JSON.stringify(S.cfg)), script: serialize(), ink: inkFile(),
    boards: Array.from(S.boards.values()).map(B => boardFile(B, withImages)),
    templates: S.cfg.templates.map(n => S.templates.get(n)).filter(Boolean).map(T => boardFile(T, withImages)) };
}
function saveDraft() {
  try { localStorage.setItem('promptbook:draft', JSON.stringify(bundle(true))); }
  catch (e) { try { const b = bundle(false); if (b.config.defaultBoard) delete b.config.defaultBoard.imageData; localStorage.setItem('promptbook:draft', JSON.stringify(b)); } catch (e2) { /* storage full or blocked */ } }
}
function loadDraft() { try { const d = JSON.parse(localStorage.getItem('promptbook:draft') || 'null'); return d && d.format === 'promptbook' ? d : null; } catch (e) { return null; } }
function setStatus() {
  const s = S.store, d = s.dirty, el = $('#status');
  const pending = d.script || d.ink || d.cfg || d.boards.size > 0 || d.tpls.size > 0;
  el.classList.toggle('err', !!s.err); el.title = s.err ? String(s.err.message || s.err) : '';
  if (s.err) el.textContent = t('stErr');
  else if (s.mode === 'folder') el.textContent = s.saving ? t('stSaving') : pending ? t('stPending') : s.lastSave ? t('stSaved', s.lastSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : s.name;
  else el.textContent = s.mode === 'memory' ? t('stMem') : '';
}
function showBanner(text, actions) {
  const bn = $('#banner'); bn.textContent = ''; bn.hidden = false;
  bn.appendChild(h('span', null, text));
  for (const [label, fn] of actions) { const b = h('button', 'btn sm', label); b.type = 'button'; b.onclick = fn; bn.appendChild(b); }
  if (S.loaded) { sizeWrap(); renderVisible(); }
}
function showMemBanner() {
  const s = S.store;
  if (s.conflict) return;
  if (s.mode === 'memory') {
    const acts = [[t('mExport'), exportBundle]];
    if (window.showDirectoryPicker) acts.unshift([t('mSaveTo'), saveToFolder]);
    showBanner(t('memBanner'), acts);
  } else if (!$('#banner').hidden) { $('#banner').hidden = true; if (S.loaded) { sizeWrap(); renderVisible(); } }
}
function showConflict() {
  showBanner(t('extChanged'), [
    [t('loadTheirs'), async () => {
      const tx = await readText('script.md'); S.store.conflict = false; S.store.dirty.script = false; showMemBanner();
      if (tx != null) { commitText(tx); if (serialize() === parseScriptText(tx)) S.store.dirty.script = false; setStatus(); }
    }],
    [t('keepMine'), () => { S.store.dirty.script = true; saveNow(true); }]
  ]);
}
async function checkExternal() {
  const s = S.store;
  if (document.hidden || s.mode !== 'folder' || !S.loaded || s.saving || s.conflict || S.editing) return;
  try {
    if (!(await changedOutside())) return;
    if (s.dirty.script) { s.conflict = true; showConflict(); return; }
    const tx = await readText('script.md'); if (tx == null) return;
    const norm = parseScriptText(tx);
    if (norm === serialize()) return;
    commitText(tx);
    if (serialize() === norm) s.dirty.script = false;   // nothing to write back
    setStatus(); toast(t('reloaded'));
  } catch (e) { console.warn(e); }
}
function parseScriptText(tx) {
  const out = [];
  for (const b of parseScript(tx)) { for (let k = 0; k < b.gap; k++) out.push(''); out.push(b.raw); }
  return out.join('\n') + '\n';
}
document.addEventListener('visibilitychange', checkExternal);
window.addEventListener('focus', checkExternal);
window.addEventListener('beforeunload', e => {
  const s = S.store, d = s.dirty;
  if (s.mode === 'folder' && (s.err || d.script || d.ink || d.cfg || d.boards.size || d.tpls.size)) { e.preventDefault(); e.returnValue = ''; }
});

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('promptbook', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function idbGet(k) {
  try { const db = await idb(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); }
  catch (e) { return null; }
}
async function idbSet(k, v) {
  try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  catch (e) { /* not available */ }
}

function loadShow(cfg, text, inkF) {
  S.loaded = false; closePop();
  S.mode = 'script'; document.body.classList.remove('tplmode'); $('#tpl').textContent = '';
  S.cfg = normCfg(cfg);
  for (const n of S.templates.keys()) if (!S.cfg.templates.includes(n)) S.cfg.templates.push(n);
  S.cfg.templates = S.cfg.templates.filter(n => S.templates.has(n));
  applyPaper();
  S.blocks = []; S.byId = new Map(); S.groups = []; S.nextId = 1; S.hist = []; S.redo = []; S.meas = new Map();
  S.sel = null; S.findAt = null; S.cueFilter = null;
  for (const E of S.els) E.sp.remove();
  S.els = [];
  reparse(text || ''); attachInk(inkF);
  S.loaded = true; $('#start').hidden = true;
  relayout(true); desk.scrollTop = 0; renderVisible();
  updUndo(); setStatus(); showMemBanner();
}
async function grant(handle) {
  if (!handle.queryPermission) return true;
  let p = await handle.queryPermission({ mode: 'readwrite' });
  if (p !== 'granted') p = await handle.requestPermission({ mode: 'readwrite' });
  return p === 'granted';
}
async function openFolder(handle) {
  try {
    if (!handle) handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'promptbook' });
    if (!(await grant(handle))) throw new Error('permission denied');
  } catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return false; }
  clearTimeout(saveT); resetStore();
  const s = S.store; s.mode = 'folder'; s.dir = handle; s.name = handle.name;
  try {
    const cfg = await readJSON('config.json'), text = await readText('script.md'), ink = await readJSON('script.ink.json');
    S.boards = new Map(); S.templates = new Map(); S.urls = new Map();
    for (const n of boardNames(text || '')) {
      const j = await readJSON(slug(n) + '.json', 'boards');
      if (j && Array.isArray(j.strokes)) { j.imageData = null; S.boards.set(n, mkBoard(n, j)); }
    }
    for (const n of (cfg && Array.isArray(cfg.templates) ? cfg.templates : [])) {
      if (typeof n !== 'string' || !n) continue;
      const j = await readJSON(slug(n) + '.json', 'templates');
      if (j && Array.isArray(j.strokes)) { j.imageData = null; S.templates.set(n, mkBoard(n, j, true)); }
    }
    const imgs = new Set();
    S.boards.forEach(B => { if (B.image) imgs.add('boards/' + B.image); });
    S.templates.forEach(T => { if (T.image) imgs.add('templates/' + T.image); });
    if (cfg && cfg.defaultBoard && cfg.defaultBoard.image) imgs.add('boards/' + cfg.defaultBoard.image);
    for (const key of imgs) { const k = key.indexOf('/'), blob = await readFile(key.slice(k + 1), key.slice(0, k)); if (blob) S.urls.set(key, URL.createObjectURL(blob)); }
    loadShow(cfg, text || '', ink);
    idbSet('dir', handle);
    if (text == null) openTextDialog(true);
  } catch (e) { console.error(e); toast(t('errOpen', (e && e.message) || '')); resetStore(); showStart(); return false; }
  return true;
}
function startMemory(text, cfg, inkF, boards, templates) {
  clearTimeout(saveT); resetStore(); S.store.mode = 'memory';
  S.boards = new Map(); S.templates = new Map(); S.urls = new Map();
  for (const B of (boards || [])) if (B && B.name) S.boards.set(B.name, mkBoard(B.name, B));
  for (const T of (templates || [])) if (T && T.name) S.templates.set(T.name, mkBoard(T.name, T, true));
  loadShow(cfg, text, inkF);
}
function loadBundle(b) { startMemory(b.script || '', b.config, b.ink, b.boards, b.templates); }
async function dataURLBlob(u) { return (await fetch(u)).blob(); }
async function saveToFolder() {
  let handle;
  try { handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'promptbook' }); if (!(await grant(handle))) return; }
  catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return; }
  const s = S.store, prev = s.dir; s.dir = handle;
  let exists = null;
  try { exists = await readFile('script.md'); } catch (e) { /* treated as absent */ }
  if (exists && !(await confirmDlg(t('overwrite'), t('replace')))) { s.dir = prev; return; }
  s.mode = 'folder'; s.name = handle.name; s.stamp = {}; s.err = null;
  try {
    for (const B of Array.from(S.boards.values()).concat(Array.from(S.templates.values()))) if (B.imageData && B.image) {
      const blob = await dataURLBlob(B.imageData); await writeBlob(B.tpl ? 'templates' : 'boards', B.image, blob);
      S.urls.set(imgKey(B), URL.createObjectURL(blob)); B.imageData = null;
    }
    const db = S.cfg.defaultBoard;
    if (db && db.imageData && db.image) { if (!S.urls.has('boards/' + db.image)) { const blob = await dataURLBlob(db.imageData); await writeBlob('boards', db.image, blob); S.urls.set('boards/' + db.image, URL.createObjectURL(blob)); } delete db.imageData; }
  } catch (e) { saveError(e); }
  s.dirty.script = s.dirty.ink = s.dirty.cfg = true; S.boards.forEach(B => s.dirty.boards.add(B.name)); S.templates.forEach(T => s.dirty.tpls.add(T.name));
  await saveNow(true);
  idbSet('dir', handle);
  try { localStorage.removeItem('promptbook:draft'); } catch (e) { /* ignore */ }
  showMemBanner(); updPanels(); refreshFacing();
}
async function exportBundle() {
  const b = bundle(true);
  if (S.store.mode === 'folder') {
    for (const o of b.boards) if (o.image && !o.imageData) { try { const f = await readFile(o.image, 'boards'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    for (const o of b.templates) if (o.image && !o.imageData) { try { const f = await readFile(o.image, 'templates'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    const db = b.config.defaultBoard;
    if (db && db.image && !db.imageData) { try { const f = await readFile(db.image, 'boards'); if (f) db.imageData = await blobToDataURL(f); } catch (e) { /* skip */ } }
  }
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const stamp = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  download(slug(S.cfg.title || S.store.name || 'show') + '-' + stamp + '.promptbook.json', new Blob([JSON.stringify(b)], { type: 'application/json' }));
  toast(t('exported'));
}
function importBundle() {
  const fp = $('#filePick'); fp.accept = '.json,application/json'; fp.value = '';
  fp.onchange = async () => {
    const f = fp.files[0]; if (!f) return;
    try { const b = JSON.parse(await f.text()); if (!b || b.format !== 'promptbook') throw new Error('format'); loadBundle(b); }
    catch (e) { toast(t('errFile')); }
  };
  fp.click();
}

/* =====================================================================
   DIALOGS
   ===================================================================== */
function openDlg(title, build, narrow) {
  const d = $('#dlg'); d.textContent = ''; d.hidden = false;
  const box = h('div', 'dbox' + (narrow ? ' narrow' : '')), body = h('div', 'body'), foot = h('footer');
  box.append(h('header', null, title), body, foot); d.appendChild(box);
  const close = () => { d.hidden = true; d.textContent = ''; };
  build(body, foot, close);
  return close;
}
function dlgBtn(foot, label, cls, fn) { const b = h('button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = fn; foot.appendChild(b); return b; }
function confirmDlg(msg, okLabel) {
  return new Promise(res => openDlg('Promptbook', (body, foot, close) => {
    body.appendChild(h('p', null, msg));
    dlgBtn(foot, t('cancel'), '', () => { close(); res(false); });
    dlgBtn(foot, okLabel, 'pri', () => { close(); res(true); });
  }, true));
}
function openTextDialog(first) {
  openDlg(first ? t('pasteTitle') : t('textTitle'), (body, foot, close) => {
    body.appendChild(h('pre', 'fmt', t('fmtHelp')));
    const ta = h('textarea', 'big'); ta.spellcheck = false; ta.value = S.blocks.length ? serialize() : '';
    body.appendChild(ta);
    dlgBtn(foot, t('cancel'), '', close);
    dlgBtn(foot, t('save'), 'pri', () => { const v = ta.value; close(); commitText(v); desk.focus(); });
    setTimeout(() => ta.focus(), 0);
  });
}
function openSettings() {
  openDlg(t('setTitle'), (body, foot, close) => {
    body.classList.add('form');
    const ti = h('input'); ti.type = 'text'; ti.value = S.cfg.title;
    const ps = h('select'); for (const k of Object.keys(PAPERS)) { const o = h('option', null, k); o.value = k; ps.appendChild(o); } ps.value = S.cfg.paper;
    const ls = h('select'); for (const [k, n] of [['en', 'English'], ['it', 'Italiano']]) { const o = h('option', null, n); o.value = k; ls.appendChild(o); } ls.value = LANG;
    const fs2 = h('select'); for (const v of [0.25, 0.4, 0.55, 0.7]) { const o = h('option', null, Math.round(v * 100) + '%'); o.value = v; fs2.appendChild(o); }
    fs2.value = [0.25, 0.4, 0.55, 0.7].reduce((a, v) => Math.abs(v - S.cfg.templateFade) < Math.abs(a - S.cfg.templateFade) ? v : a, 0.4);
    const tb = h('button', 'btn sm', t('tplManage') + ' (' + S.templates.size + ')'); tb.type = 'button'; tb.onclick = () => { close(); enterTemplates(); };
    body.append(h('label', null, t('showTitle')), ti, h('label', null, t('paperL')), ps, h('label', null, t('langL')), ls,
      h('label', null, t('templates')), tb, h('label', null, t('tplFade')), fs2, h('label', null, t('deptsL')));
    const list = h('div'); body.appendChild(list);
    const addRow = d => {
      const r = h('div', 'drow'), c = h('input'), n = h('input'), col = h('input'), rl = h('label', 'chk'), rc = h('input'), x = h('button', 'btn sm', '\u2715');
      c.type = 'text'; n.type = 'text'; col.type = 'color'; rc.type = 'checkbox'; x.type = 'button';
      c.value = d.code; n.value = d.name; col.value = /^#[0-9a-f]{6}$/i.test(d.colour) ? d.colour : '#888888'; rc.checked = !!d.runs;
      rl.append(rc, t('runsShort'));
      x.onclick = () => r.remove(); r.append(c, n, col, rl, x); list.appendChild(r);
    };
    S.cfg.departments.forEach(addRow);
    const ab = h('button', 'btn sm', t('addDept')); ab.type = 'button'; ab.onclick = () => addRow({ code: '', name: '', colour: '#2a9d8f', runs: false }); body.appendChild(ab);
    body.appendChild(h('p', 'hint', t('deptHint') + ' ' + t('runsHint')));
    dlgBtn(foot, t('cancel'), '', close);
    dlgBtn(foot, t('save'), 'pri', () => {
      const deps = $$('.drow', list).map(r => { const i = $$('input', r); return { code: i[0].value, name: i[1].value, colour: i[2].value, runs: i[3].checked }; });
      const paperChanged = ps.value !== S.cfg.paper;
      S.cfg = normCfg(Object.assign({}, S.cfg, { title: ti.value.trim(), paper: ps.value, departments: deps, templateFade: +fs2.value }));
      if (ls.value !== LANG) { LANG = ls.value; savePrefs(); applyLang(); }
      close();
      if (paperChanged) S.meas = new Map();
      applyPaper();
      markDirty('cfg'); relayout(true);
      if (S.mode === 'templates') renderTemplates();
    });
  }, true);
}

/* =====================================================================
   TOOLBAR, KEYS, START
   ===================================================================== */
function applyLang() {
  document.documentElement.lang = LANG;
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $$('[data-tt]').forEach(el => { el.title = t(el.dataset.tt); });
  $$('[data-tp]').forEach(el => { el.placeholder = t(el.dataset.tp); });
}
function applyPaper() {
  const pp = paper(), st = document.documentElement.style;
  st.setProperty('--pw', pp.w + 'px'); st.setProperty('--ph', pp.h + 'px'); st.setProperty('--text-w', (pp.w - FIXED_W) + 'px');
  st.setProperty('--tfade', S.cfg.templateFade || 0.4);
  $('#pageRule').textContent = '@page{size:' + pp.css + ';margin:0}@page cues{size:' + pp.css + ';margin:12mm}@media print{#cuePrint{page:cues;padding:0!important}}';
}
function savePrefs() { try { localStorage.setItem('promptbook:view', JSON.stringify({ facing: S.view.facing, cues: S.view.cues, ink: S.view.ink, night: S.view.night, finger: S.tool.finger, lang: LANG })); } catch (e) { /* ignore */ } }
function applyView() {
  const c = document.body.classList, v = S.view;
  c.toggle('facing', v.facing); c.toggle('nocues', !v.cues); c.toggle('noink', !v.ink); c.toggle('night', v.night);
  $('#bFacing').classList.toggle('on', v.facing); $('#bCues').classList.toggle('on', v.cues); $('#bInk').classList.toggle('on', v.ink);
  $('#bNight').classList.toggle('on', v.night); $('#zFit').classList.toggle('on', v.fit);
  $('#bFinger').classList.toggle('on', S.tool.finger); $('#bErase').classList.toggle('on', S.tool.mode === 'erase');
  $$('#pens .sw').forEach(b => b.classList.toggle('on', S.tool.mode === 'pen' && b.dataset.c === S.tool.colour));
}
function updUndo() { $('#bUndo').disabled = !S.hist.length; $('#bRedo').disabled = !S.redo.length; }
function setZoom(f) {
  const a = desk.scrollHeight ? desk.scrollTop / desk.scrollHeight : 0;
  if (f === 0) S.view.fit = true; else { S.view.fit = false; S.view.zoom = clamp(S.view.zoom * f, 0.3, 3); }
  sizeWrap(); desk.scrollTop = a * desk.scrollHeight; renderVisible(); applyView();
}
function buildMenu() {
  const m = $('#menu'); m.textContent = '';
  const add = (label, fn, off) => { const b = h('button', null, label); b.type = 'button'; b.disabled = !!off; b.onclick = () => { m.hidden = true; fn(); }; m.appendChild(b); };
  const fs = !!window.showDirectoryPicker;
  add(t('mText'), () => openTextDialog(false), !S.loaded);
  add(t('mSettings'), openSettings, !S.loaded);
  add(t('mTemplates'), () => { if (S.mode === 'templates') exitTemplates(); else enterTemplates(); }, !S.loaded);
  add(t('mExport'), exportBundle, !S.loaded);
  add(t('mImport'), importBundle);
  if (S.store.mode === 'memory') add(t('mSaveTo'), saveToFolder, !fs);
  add(t('mOpen'), () => openFolder(), !fs);
  add(t('mClose'), async () => { await saveNow(); S.loaded = false; showStart(); }, !S.loaded);
}
function bindUI() {
  const pens = $('#pens');
  for (const c of INKS) {
    const b = h('button', 'sw'); b.type = 'button'; b.dataset.c = c; b.style.setProperty('--c', c === BLACK ? 'var(--tx)' : c);
    b.onclick = () => { S.tool.colour = c; S.tool.mode = 'pen'; applyView(); };
    pens.appendChild(b);
  }
  $('#bMenu').onclick = () => { const m = $('#menu'); if (m.hidden) { buildMenu(); m.hidden = false; } else m.hidden = true; };
  $('#bErase').onclick = () => { S.tool.mode = S.tool.mode === 'erase' ? 'pen' : 'erase'; applyView(); };
  $('#bFinger').onclick = () => { S.tool.finger = !S.tool.finger; savePrefs(); applyView(); };
  $('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
  const tog = (id, key, after) => { $(id).onclick = () => { S.view[key] = !S.view[key]; savePrefs(); applyView(); if (after) after(); }; };
  tog('#bFacing', 'facing', () => { sizeWrap(); renderVisible(); });
  tog('#bCues', 'cues'); tog('#bInk', 'ink'); tog('#bNight', 'night');
  $('#zOut').onclick = () => setZoom(1 / 1.15); $('#zIn').onclick = () => setZoom(1.15); $('#zFit').onclick = () => setZoom(0);
  $('#outline').onchange = e => { const b = S.byId.get(+e.target.value); e.target.value = ''; if (b) jumpTo(b); };
  $('#search').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); findNext(e.target.value.trim(), e.shiftKey ? -1 : 1); } });
  $('#search').addEventListener('input', () => { S.findAt = null; });
  $('#bReview').onclick = () => toggleDrawer('review');
  $('#bList').onclick = () => toggleDrawer('cues');
  $('#bPrint').onclick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    openPop(r.left - 200, r.bottom - 10, p => {
      for (const k of ['book', 'script', 'cues']) {
        const b = h('button', 'btn', t(k === 'book' ? 'prBook' : k === 'script' ? 'prScript' : 'prCues')); b.type = 'button';
        b.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:6px';
        b.onclick = () => { closePop(); doPrint(k); };
        p.appendChild(b);
      }
    });
  };
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (POP) { closePop(); e.preventDefault(); } $('#menu').hidden = true; return; }
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'f' && S.loaded && $('#dlg').hidden) { e.preventDefault(); $('#search').focus(); $('#search').select(); return; }
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (!S.loaded || !$('#dlg').hidden) return;
  if (POP && POP.key && POP.key(e)) { e.preventDefault(); return; }
  if (mod && !e.altKey) {
    if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === 'y') { e.preventDefault(); redo(); }
  }
});
document.addEventListener('paste', e => {
  if (!S.loaded || S.editing || S.mode === 'templates' || !$('#dlg').hidden) return;
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return;
  const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find(i => i.kind === 'file' && i.type.startsWith('image/'));
  if (!it) return;
  e.preventDefault();
  const f = it.getAsFile(), init = { image: null, imageData: null, h: 750, base: null };
  const selB = S.sel && S.byId.get(S.sel.id);
  const B = selB ? addBoardAfter(selB, init) : addBoardOnPage(currentPage(), init);
  setBoardImage(B, f); toast(t('pastedImg'));
});

const SAMPLE = [
  '# ATTO PRIMO', '', '## Scena 1 — Il molo', '',
  '(Buio. Si sente il mare. {SND 1 | mare, loop basso} Una lanterna si accende lentamente sul fondo.) {LX 1 | lanterna, 8 secondi}', '',
  'ANNA: Chi è là? (si volta di scatto) Rispondi!',
  'MARCO: Sono io. Non gridare, ti prego: svegli tutto il porto.',
  'ANNA: Tu. Dopo tre anni ti presenti così, di notte, senza una parola.',
  'MARCO (a bassa voce): Le parole le ho perse tutte in mare. Me ne è rimasta una sola, e non è per stanotte.', '',
  '(MARCO avanza nella luce. Ha un sacco di tela sulle spalle e le scarpe in mano.) {LX 2 | speciale centro}', '',
  'ANNA: E adesso che cosa vuoi?',
  'MARCO: Una barca. E qualcuno che non faccia domande.',
  'ANNA: Allora hai sbagliato molo.',
  '& MARCO: Allora ho sbagliato vita.', '',
  'IL GUARDIANO: (da fuori scena) Chi c’è laggiù? Il molo è chiuso dalle dieci!', '',
  '(ANNA spegne la lanterna.)', '{LX 3 | buio}', '{SND 2 | passi sul legno, da sinistra}', '',
  '## Scena 2 — La rimessa', '',
  '(Luce fredda dall’alto. ANNA e MARCO sono seduti su due casse, schiena contro schiena.)', '',
  'ANNA: Mio padre diceva che una barca si giudica da ferma. In acqua sono brave tutte: il vento le porta, la corrente le perdona. È quando le tiri in secco che vedi dove hanno ceduto, dove qualcuno ha messo una toppa e ha sperato che nessuno guardasse. Tu sei arrivato qui in secco, Marco. E io sto guardando.',
  'MARCO: E che cosa vedi?',
  'ANNA: Uno scafo che tiene ancora. E un timone che non ha mai saputo dove andare.',
  'MARCO: (ride piano) Il timone lo so usare. È la rotta che mi hanno sempre scritto gli altri.', '',
  '(Da fuori, una sirena di nave. Lunga.)', ''
].join('\n');

async function showStart() {
  const el = $('#start'); el.textContent = ''; el.hidden = false;
  const card = h('div', 'card');
  card.append(h('h1', null, 'Promptbook'), h('div', 'sub', t('appSub') + ' · ' + VERSION));
  const fs = !!window.showDirectoryPicker;
  const add = (label, fn, pri) => { const b = h('button', 'btn' + (pri ? ' pri' : ''), label); b.type = 'button'; b.onclick = fn; card.appendChild(b); return b; };
  el.appendChild(card);
  const last = fs ? await idbGet('dir') : null;
  if (last && last.name) add(t('reopen', last.name), () => openFolder(last), true);
  add(t('openFolder'), () => openFolder(), !(last && last.name)).disabled = !fs;
  const dr = loadDraft();
  if (dr) add(t('contDraft', new Date(dr.when).toLocaleString()), () => loadBundle(dr));
  add(t('trySample'), () => startMemory(SAMPLE, { title: 'Il molo' }));
  add(t('pasteNew'), () => { startMemory('', {}); openTextDialog(true); });
  add(t('importBk'), importBundle);
  card.appendChild(h('p', fs ? '' : 'warn', fs ? t('startHint') : t('noFs')));
  const lg = h('p'); const lb = h('button', 'btn sm', LANG === 'it' ? 'English' : 'Italiano'); lb.type = 'button';
  lb.style.cssText = 'display:inline-block;width:auto;min-height:30px';
  lb.onclick = () => { LANG = LANG === 'it' ? 'en' : 'it'; savePrefs(); applyLang(); showStart(); };
  lg.appendChild(lb); card.appendChild(lg);
}
async function init() {
  let pv = {};
  try { pv = JSON.parse(localStorage.getItem('promptbook:view') || '{}') || {}; } catch (e) { /* ignore */ }
  for (const k of ['facing', 'cues', 'ink', 'night']) if (typeof pv[k] === 'boolean') S.view[k] = pv[k];
  S.tool.finger = pv.finger === true;
  LANG = pv.lang === 'it' || pv.lang === 'en' ? pv.lang : (/^it/i.test(navigator.language || '') ? 'it' : 'en');
  S.cfg = defaultConfig();
  bindUI(); applyLang(); applyPaper(); applyView(); updUndo();
  try { await Promise.all(['400 15px PB', 'italic 400 15px PB', '700 15px PB', '700 13px PB', '700 20px PB'].map(f => document.fonts.load(f))); } catch (e) { /* falls back to system font */ }
  showStart();
}
window.PB = { S, VERSION, parseScript, analyze, stripTokens, serialize, commitText, openFolder, startMemory, loadBundle, saveNow, bundle, inkFile, collectCues, reviewData, relayout, renderAll, jumpTo, enterTemplates, exitTemplates, t };
init();
