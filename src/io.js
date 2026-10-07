/* =====================================================================
   STORE: show file (.zip) or older show folder (Chrome, Edge), or in-browser fallback
   A show file holds the same files a show folder does: script.md, script.ink.json,
   config.json, boards/, templates/. In zip mode they live in s.files (path -> Blob)
   and the whole archive is rewritten on each save.
   ===================================================================== */
const onDisk = () => S.store.mode === 'folder' || S.store.mode === 'zip';
function resetStore() {
  const s = S.store;
  s.mode = 'none'; s.dir = null; s.handle = null; s.files = null; s.name = ''; s.stamp = {}; s.conflict = false; s.lastSave = null; s.err = null; s.saving = false; s.again = false;
  s.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() };
}
async function dirFor(sub) { return sub ? S.store.dir.getDirectoryHandle(sub, { create: true }) : S.store.dir; }
async function readFile(name, sub) {
  if (S.store.mode === 'zip') return S.store.files.get(sub ? sub + '/' + name : name) || null;
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
  if (S.store.mode === 'zip') { S.store.files.set(sub ? sub + '/' + name : name, blob instanceof Blob ? blob : new Blob([blob])); return null; }
  const d = await dirFor(sub), fh = await d.getFileHandle(name, { create: true });
  const w = await fh.createWritable(); await w.write(blob); await w.close();
  return fh;
}
async function writeText(name, text) {
  const fh = await writeBlob(null, name, text);
  if (!fh) return;
  S.store.stamp[name] = (await fh.getFile()).lastModified;
}
function cfgFile() {
  const c = JSON.parse(JSON.stringify(S.cfg));
  if (onDisk() && c.defaultBoard) delete c.defaultBoard.imageData;
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
/* ---------- zip: just enough of the format to read and write a show file ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = -1; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
async function pipeBytes(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
const zipCache = new WeakMap();   // Blob -> its compressed entry, so unchanged files are not recompressed on every save
async function zipEntry(blob, name) {
  let e = zipCache.get(blob);
  if (!e) {
    const raw = new Uint8Array(await blob.arrayBuffer());
    let data = raw, method = 0;
    if (/\.(json|md|txt)$/i.test(name) && raw.length > 64) { const z = await pipeBytes(raw, new CompressionStream('deflate-raw')); if (z.length < raw.length) { data = z; method = 8; } }
    e = { crc: crc32(raw), size: raw.length, method, data };
    zipCache.set(blob, e);
  }
  return e;
}
async function buildZip(files) {
  const enc = new TextEncoder(), d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const parts = [], central = []; let off = 0;
  for (const [name, blob] of files) {
    const e = await zipEntry(blob, name), nb = enc.encode(name);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, e.method, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, e.crc, true);
    lh.setUint32(18, e.data.length, true); lh.setUint32(22, e.size, true); lh.setUint16(26, nb.length, true);
    parts.push(lh.buffer, nb, e.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, e.method, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, e.crc, true);
    ch.setUint32(20, e.data.length, true); ch.setUint32(24, e.size, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
    central.push(ch.buffer, nb);
    off += 30 + nb.length + e.data.length;
  }
  const csize = central.reduce((a, b) => a + b.byteLength, 0), n = files.size;
  if (n > 65534 || off + csize > 0xFFFFFFF0) throw new Error('show too large for a zip file');
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, n, true); eo.setUint16(10, n, true); eo.setUint32(12, csize, true); eo.setUint32(16, off, true);
  return new Blob([...parts, ...central, eo.buffer], { type: 'application/zip' });
}
async function readZip(file) {
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65557)).arrayBuffer());
  let e = tail.byteLength - 22;
  while (e >= 0 && tail.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('not a zip file');
  const n = tail.getUint16(e + 10, true), cdSize = tail.getUint32(e + 12, true), cdOff = tail.getUint32(e + 16, true);
  if (cdOff === 0xFFFFFFFF || n === 0xFFFF) throw new Error('zip64 is not supported');
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer()), dec = new TextDecoder(), out = new Map();
  let p = 0;
  for (let i = 0; i < n; i++) {
    if (cd.getUint32(p, true) !== 0x02014b50) throw new Error('damaged zip file');
    const flags = cd.getUint16(p + 8, true), method = cd.getUint16(p + 10, true), csz = cd.getUint32(p + 20, true), usz = cd.getUint32(p + 24, true);
    const nl = cd.getUint16(p + 28, true), xl = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true), lo = cd.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, p + 46, nl)); p += 46 + nl + xl + cl;
    if (name.endsWith('/') || (flags & 1)) continue;
    const lh = new DataView(await file.slice(lo, lo + 30).arrayBuffer());
    const start = lo + 30 + lh.getUint16(26, true) + lh.getUint16(28, true), body = file.slice(start, start + csz);
    if (method === 0) out.set(name, body);
    else if (method === 8) { const z = await pipeBytes(new Uint8Array(await body.arrayBuffer()), new DecompressionStream('deflate-raw')); if (z.length !== usz) throw new Error('damaged zip file'); out.set(name, new Blob([z])); }
    else throw new Error('unsupported zip compression');
  }
  // a folder zipped by the operating system has everything inside one top-level folder; drop it, and drop its clutter
  for (const k of Array.from(out.keys())) if (/^__MACOSX\//.test(k) || /(^|\/)\.DS_Store$/.test(k)) out.delete(k);
  if (!out.has('script.md') && !out.has('config.json')) {
    const tops = new Set(Array.from(out.keys()).map(k => k.split('/')[0]));
    if (tops.size === 1) { const pre = Array.from(tops)[0] + '/'; for (const [k, v] of Array.from(out)) { out.delete(k); out.set(k.slice(pre.length), v); } }
  }
  return out;
}
function pruneImages(files) {
  const refs = Array.from(files).filter(([k]) => /\.json$/.test(k)).map(([, b]) => b);
  return Promise.all(refs.map(b => b.text())).then(texts => {
    const all = texts.join('\n');
    for (const k of Array.from(files.keys())) if (/^(boards|templates)\/[^/]+$/.test(k) && !/\.json$/.test(k) && !all.includes(k.slice(k.indexOf('/') + 1))) files.delete(k);
  });
}
async function flushZip() {
  const s = S.store;
  await pruneImages(s.files);
  const blob = await buildZip(s.files);
  const w = await s.handle.createWritable(); await w.write(blob); await w.close();
  s.stamp.zip = (await s.handle.getFile()).lastModified;
}
async function zipChanged() {
  const s = S.store;
  if (s.stamp.zip === undefined) return false;   // not written yet
  try { return (await s.handle.getFile()).lastModified !== s.stamp.zip; } catch (e) { return false; }
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
    if (onDisk()) {
      const any = d.script || d.ink || d.cfg || d.boards.size > 0 || d.tpls.size > 0;
      if (s.mode === 'zip' && any && force !== true) {
        if (!s.conflict && await zipChanged()) { s.conflict = true; showConflict(); }
        if (s.conflict) { s.saving = false; setStatus(); return; }
      }
      if (d.script) {
        if (s.mode === 'folder' && force !== true && !s.conflict && await changedOutside()) { s.conflict = true; showConflict(); }
        if (s.mode === 'zip' || !s.conflict || force === true) {
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
      if (s.mode === 'zip' && any) { try { await flushZip(); } catch (e) { d.script = true; throw e; } s.conflict = false; showMemBanner(); }
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
  else if (onDisk()) el.textContent = s.saving ? t('stSaving') : pending ? t('stPending') : s.lastSave ? t('stSaved', s.lastSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : s.name;
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
    if (window.showSaveFilePicker) acts.unshift([t('mSaveTo'), saveToZip]);
    showBanner(t('memBanner'), acts);
  } else if (!$('#banner').hidden) { $('#banner').hidden = true; if (S.loaded) { sizeWrap(); renderVisible(); } }
}
function showConflict() {
  showBanner(t('extChanged'), [
    [t('loadTheirs'), async () => {
      if (S.store.mode === 'zip') { S.store.conflict = false; S.store.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }; await reloadZip(); return; }
      const tx = await readText('script.md'); S.store.conflict = false; S.store.dirty.script = false; showMemBanner();
      if (tx != null) { commitText(tx); if (serialize() === parseScriptText(tx)) S.store.dirty.script = false; setStatus(); }
    }],
    [t('keepMine'), () => { S.store.dirty.script = true; saveNow(true); }]
  ]);
}
async function checkExternal() {
  const s = S.store;
  if (document.hidden || !onDisk() || !S.loaded || s.saving || s.conflict || S.editing) return;
  if (s.mode === 'zip') {
    try {
      if (!(await zipChanged())) return;
      const d = s.dirty;
      if (d.script || d.ink || d.cfg || d.boards.size || d.tpls.size) { s.conflict = true; showConflict(); return; }
      await reloadZip(); toast(t('reloaded'));
    } catch (e) { console.warn(e); }
    return;
  }
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
  if (onDisk() && (s.err || d.script || d.ink || d.cfg || d.boards.size || d.tpls.size)) { e.preventDefault(); e.returnValue = ''; }
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
  return loadStore(handle);
}
async function openZipFile(handle) {
  try {
    if (!handle) [handle] = await window.showOpenFilePicker({ id: 'promptbook', types: ZIP_TYPES });
    if (!(await grant(handle))) throw new Error('permission denied');
  } catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return false; }
  let files, file;
  try { file = await handle.getFile(); files = await readZip(file); } catch (e) { console.error(e); toast(t('errOpen', (e && e.message) || '')); return false; }
  clearTimeout(saveT); resetStore();
  const s = S.store; s.mode = 'zip'; s.handle = handle; s.files = files; s.name = showName(handle); s.stamp.zip = file.lastModified;
  return loadStore(handle);
}
async function reloadZip() { return openZipFile(S.store.handle); }
async function openAny(handle) { return handle && handle.kind === 'file' ? openZipFile(handle) : openFolder(handle); }
const ZIP_TYPES = [{ description: 'Promptbook', accept: { 'application/zip': ['.zip'] } }];
const showName = handle => handle.name.replace(/(\.promptbook)?\.zip$/i, '');
async function loadStore(handle) {
  const s = S.store;
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
async function folderFiles(dir, out) {
  // only what a show uses: the picked save file, or anything else lying in the folder, must not end up inside the zip
  for await (const [nm, h] of dir.entries()) {
    if (h.kind === 'file' && /^(script\.md|script\.ink\.json|config\.json)$/.test(nm)) out.set(nm, await h.getFile());
    else if (h.kind === 'directory' && (nm === 'boards' || nm === 'templates'))
      for await (const [fn, fh] of h.entries()) if (fh.kind === 'file' && !/\.zip$/i.test(fn)) out.set(nm + '/' + fn, await fh.getFile());
  }
  return out;
}
async function saveToZip() {
  let handle;
  try { handle = await window.showSaveFilePicker({ id: 'promptbook', suggestedName: slug(titleOf() || S.store.name || 'show') + '.promptbook.zip', types: ZIP_TYPES }); if (!(await grant(handle))) return; }
  catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return; }
  const s = S.store;
  let files = new Map();
  try {
    if (s.mode === 'folder') files = await folderFiles(s.dir, new Map());   // keeps the images already in the folder
    else if (s.mode === 'zip') files = new Map(s.files);
  } catch (e) { saveError(e); return; }
  s.mode = 'zip'; s.dir = null; s.handle = handle; s.files = files; s.name = showName(handle); s.stamp = {}; s.err = null; s.conflict = false;
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
  if (onDisk()) {
    for (const o of b.boards) if (o.image && !o.imageData) { try { const f = await readFile(o.image, 'boards'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    for (const o of b.templates) if (o.image && !o.imageData) { try { const f = await readFile(o.image, 'templates'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    const db = b.config.defaultBoard;
    if (db && db.image && !db.imageData) { try { const f = await readFile(db.image, 'boards'); if (f) db.imageData = await blobToDataURL(f); } catch (e) { /* skip */ } }
  }
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const stamp = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  download(slug(titleOf() || S.store.name || 'show') + '-' + stamp + '.promptbook.json', new Blob([JSON.stringify(b)], { type: 'application/json' }));
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
    const ti = h('input'); ti.type = 'text'; ti.value = titleOf();
    const inScript = !!(S.meta && S.meta.title);
    if (inScript) { ti.disabled = true; ti.title = t('titleInScript'); }
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
      S.cfg = normCfg(Object.assign({}, S.cfg, { title: inScript ? S.cfg.title : ti.value.trim(), paper: ps.value, departments: deps, templateFade: +fs2.value }));
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
  const fs = !!window.showOpenFilePicker, fd = !!window.showDirectoryPicker;
  add(t('mText'), () => openTextDialog(false), !S.loaded);
  add(t('mSettings'), openSettings, !S.loaded);
  add(t('mTemplates'), () => { if (S.mode === 'templates') exitTemplates(); else enterTemplates(); }, !S.loaded);
  add(t('mExport'), exportBundle, !S.loaded);
  add(t('mImport'), importBundle);
  add(t('mSaveTo'), saveToZip, !window.showSaveFilePicker || !S.loaded);
  add(t('mOpen'), () => openZipFile(), !fs);
  add(t('mOpenFolder'), () => openFolder(), !fd);
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
  const fs = !!window.showOpenFilePicker, fd = !!window.showDirectoryPicker;
  const add = (label, fn, pri) => { const b = h('button', 'btn' + (pri ? ' pri' : ''), label); b.type = 'button'; b.onclick = fn; card.appendChild(b); return b; };
  el.appendChild(card);
  const last = fs ? await idbGet('dir') : null;
  if (last && last.name) add(t('reopen', showName(last)), () => openAny(last), true);
  add(t('openFile'), () => openZipFile(), !(last && last.name)).disabled = !fs;
  add(t('openFolder'), () => openFolder()).disabled = !fd;
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
window.PB = { S, VERSION, parseScript, analyze, stripTokens, serialize, commitText, openFolder, openZipFile, saveToZip, readZip, buildZip, startMemory, loadBundle, saveNow, bundle, inkFile, collectCues, reviewData, parseMeta, castCheck, fullName, relayout, renderAll, jumpTo, enterTemplates, exitTemplates, t };
init();
