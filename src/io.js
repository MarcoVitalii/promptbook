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
    // copied into memory: a slice of the file can no longer be read once the file is rewritten
    if (method === 0) out.set(name, new Blob([await body.arrayBuffer()]));
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
async function gitFiles(dir, out) {
  const walk = async (d, pre) => { for await (const [nm, hd] of d.entries()) { if (hd.kind === 'file') out.set(pre + nm, await hd.getFile()); else await walk(hd, pre + nm + '/'); } };
  try { await walk(await dir.getDirectoryHandle('.git'), GIT); } catch (e) { /* no history */ }
}
async function saveToZip() {
  let handle;
  try { handle = await window.showSaveFilePicker({ id: 'promptbook', suggestedName: slug(titleOf() || S.store.name || 'show') + '.promptbook.zip', types: ZIP_TYPES }); if (!(await grant(handle))) return; }
  catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return; }
  const s = S.store;
  let files = new Map();
  try {
    if (s.mode === 'folder') { files = await folderFiles(s.dir, new Map()); await gitFiles(s.dir, files); }   // keeps the images already in the folder, and the history
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
   HISTORY: the show under git
   The show keeps its history in git's own format, in a .git folder beside script.md: inside the show
   file, or in the show folder. A revision is a commit with a tag; a variant is a branch. Only loose
   objects, refs and HEAD are written, which is all git needs to read it (log, diff, branch, push).
   There is no index: after unzipping a show, run "git reset" once. Packed objects are not read.
   ===================================================================== */
const GIT = '.git/', ENC = new TextEncoder(), DEC = new TextDecoder();
const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const unhex = s => Uint8Array.from(s.match(/../g), x => parseInt(x, 16));
function cat(parts) {
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0)); let o = 0;
  for (const x of parts) { out.set(x, o); o += x.length; }
  return out;
}
const refName = s => String(s).normalize('NFC').replace(/[^\p{L}\p{N}_ -]+/gu, '').trim().replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const refLabel = n => n.replace(/-/g, ' ');
const SHOW_FILE = /^(script\.md|script\.ink\.json|config\.json)$|^(boards|templates)\/[^/]+$/;
async function gDir(parts, create) { let d = S.store.dir; for (const p of parts) d = await d.getDirectoryHandle(p, { create }); return d; }
async function gRead(path) {
  const s = S.store;
  if (s.mode === 'zip') { const b = s.files.get(GIT + path); return b ? new Uint8Array(await b.arrayBuffer()) : null; }
  const parts = (GIT + path).split('/'), name = parts.pop();
  try { return new Uint8Array(await (await (await (await gDir(parts, false)).getFileHandle(name)).getFile()).arrayBuffer()); }
  catch (e) { if (e && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) return null; throw e; }
}
async function gWrite(path, data) {
  const s = S.store;
  if (typeof data === 'string') data = ENC.encode(data);
  if (s.mode === 'zip') { s.files.set(GIT + path, new Blob([data])); return; }
  const parts = (GIT + path).split('/'), name = parts.pop();
  const w = await (await (await gDir(parts, true)).getFileHandle(name, { create: true })).createWritable(); await w.write(data); await w.close();
}
/* refs under a prefix such as refs/tags/: name -> sha */
async function gRefs(prefix) {
  const s = S.store, out = new Map(), pk = await gRead('packed-refs');
  if (pk) for (const l of DEC.decode(pk).split('\n')) { const m = /^([0-9a-f]{40}) (.+)$/.exec(l); if (m && m[2].startsWith(prefix)) out.set(m[2].slice(prefix.length), m[1]); }
  let names = [];
  if (s.mode === 'zip') names = Array.from(s.files.keys()).filter(k => k.startsWith(GIT + prefix)).map(k => k.slice(GIT.length + prefix.length));
  else try { for await (const [nm, hd] of (await gDir((GIT + prefix).split('/').filter(Boolean), false)).entries()) if (hd.kind === 'file') names.push(nm); } catch (e) { /* none yet */ }
  for (const n of names) { const b = await gRead(prefix + n); if (b) out.set(n, DEC.decode(b).trim()); }
  return out;
}
async function gRef(name) { const k = name.lastIndexOf('/') + 1; return (await gRefs(name.slice(0, k))).get(name.slice(k)) || null; }
async function gHead() {
  const b = await gRead('HEAD'); if (!b) return null;
  const tx = DEC.decode(b).trim(), m = /^ref: (.+)$/.exec(tx);
  return m ? { ref: m[1], sha: await gRef(m[1]) } : { ref: null, sha: tx };
}
async function gPut(type, body) {
  const raw = cat([ENC.encode(type + ' ' + body.length + '\0'), body]);
  const sha = hex(new Uint8Array(await crypto.subtle.digest('SHA-1', raw))), path = 'objects/' + sha.slice(0, 2) + '/' + sha.slice(2);
  if (!(await gRead(path))) await gWrite(path, await pipeBytes(raw, new CompressionStream('deflate')));
  return sha;
}
async function gGet(sha) {
  const z = await gRead('objects/' + sha.slice(0, 2) + '/' + sha.slice(2));
  if (!z) throw new Error(t('hiPacked'));
  const raw = await pipeBytes(z, new DecompressionStream('deflate')), k = raw.indexOf(0);
  return { type: DEC.decode(raw.subarray(0, k)).split(' ')[0], body: raw.subarray(k + 1) };
}
const blobSha = new WeakMap();   // Blob -> sha of the object already written for it
async function gBlob(blob) {
  let s = blobSha.get(blob);
  if (!s) { s = await gPut('blob', new Uint8Array(await blob.arrayBuffer())); blobSha.set(blob, s); }
  return s;
}
/* files: path -> Blob. Writes the tree and what is under it, returns its sha. */
async function gTree(files) {
  const dirs = new Map(), here = [];
  for (const [path, blob] of files) {
    const k = path.indexOf('/');
    if (k < 0) here.push([path, '100644', await gBlob(blob)]);
    else { const d = path.slice(0, k); if (!dirs.has(d)) dirs.set(d, new Map()); dirs.get(d).set(path.slice(k + 1), blob); }
  }
  for (const [d, sub] of dirs) here.push([d + '/', '40000', await gTree(sub)]);   // git sorts a folder as if its name ended in a slash
  here.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return gPut('tree', cat(here.map(([n, mode, sha]) => cat([ENC.encode(mode + ' ' + n.replace(/\/$/, '') + '\0'), unhex(sha)]))));
}
/* every file under a tree: path -> sha of its blob */
async function gFiles(tree, pre, out) {
  const b = (await gGet(tree)).body; let i = 0;
  while (i < b.length) {
    const sp = b.indexOf(32, i), z = b.indexOf(0, sp), mode = DEC.decode(b.subarray(i, sp)), name = pre + DEC.decode(b.subarray(sp + 1, z)), sha = hex(b.subarray(z + 1, z + 21));
    i = z + 21;
    if (mode === '40000') await gFiles(sha, name + '/', out); else out.set(name, sha);
  }
  return out;
}
async function gCommitOf(sha) {
  const o = await gGet(sha), tx = DEC.decode(o.body), k = tx.indexOf('\n\n'), head = k < 0 ? tx : tx.slice(0, k);
  if (o.type === 'tag') return gCommitOf(/^object ([0-9a-f]{40})/m.exec(head)[1]);   // a tag made with "git tag -a"
  const m = /^committer .* (\d+) [+-]\d{4}$/m.exec(head);
  return { sha, tree: /^tree ([0-9a-f]{40})/m.exec(head)[1], parent: (/^parent ([0-9a-f]{40})/m.exec(head) || [])[1] || null, when: m ? new Date(+m[1] * 1000) : null, msg: k < 0 ? '' : tx.slice(k + 2).trim() };
}
async function gLog(sha, max) {
  const out = [];
  while (sha && out.length < (max || 300)) { const c = await gCommitOf(sha); out.push(c); sha = c.parent; }
  return out;
}
async function gText(commit, path) {
  const sha = (await gFiles(commit.tree, '', new Map())).get(path);
  return sha ? DEC.decode((await gGet(sha)).body) : '';
}
async function settled() {
  const s = S.store;
  for (let k = 0; k < 100; k++) {
    await saveNow();
    const d = s.dirty;
    if (!s.saving && !s.err && !(d.script || d.ink || d.cfg || d.boards.size || d.tpls.size)) return;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error(t('stErr'));
}
async function workFiles() {
  const s = S.store;
  if (s.mode !== 'zip') return folderFiles(s.dir, new Map());
  await pruneImages(s.files);
  return new Map(Array.from(s.files).filter(([k]) => SHOW_FILE.test(k)));
}
const gFlush = () => S.store.mode === 'zip' ? flushZip() : null;
/* Commit the show as it is. Without "always", nothing is written when it equals the last commit. */
async function gSave(msg, always) {
  await settled();
  const head = (await gHead()) || { ref: 'refs/heads/main', sha: null };
  const tree = await gTree(await workFiles());
  if (!always && head.sha && (await gCommitOf(head.sha)).tree === tree) return head.sha;
  const d = new Date(), off = -d.getTimezoneOffset(), p2 = n => String(n).padStart(2, '0');
  const who = 'Promptbook <promptbook@localhost> ' + Math.floor(d / 1000) + ' ' + (off < 0 ? '-' : '+') + p2(Math.floor(Math.abs(off) / 60)) + p2(Math.abs(off) % 60);
  const sha = await gPut('commit', ENC.encode('tree ' + tree + '\n' + (head.sha ? 'parent ' + head.sha + '\n' : '') + 'author ' + who + '\ncommitter ' + who + '\n\n' + msg + '\n'));
  if (!(await gRead('HEAD'))) { await gWrite('HEAD', 'ref: refs/heads/main\n'); await gWrite('config', '[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false\n'); }
  await gWrite(head.ref || 'HEAD', sha + '\n');
  return sha;
}
/* Replace the show on disk with the files of a tree, then open it again. */
async function gCheckout(tree) {
  const s = S.store, blobs = new Map();
  for (const [path, sha] of await gFiles(tree, '', new Map())) {
    if (!SHOW_FILE.test(path)) continue;
    const b = new Blob([(await gGet(sha)).body]); blobSha.set(b, sha); blobs.set(path, b);
  }
  if (s.mode === 'zip') {
    s.files = new Map(Array.from(s.files).filter(([k]) => k.startsWith(GIT)).concat(Array.from(blobs)));
    await flushZip();
  } else {
    for (const sub of ['boards', 'templates']) try {
      const d = await s.dir.getDirectoryHandle(sub), gone = [];
      for await (const [nm, hd] of d.entries()) if (hd.kind === 'file' && !blobs.has(sub + '/' + nm)) gone.push(nm);
      for (const nm of gone) await d.removeEntry(nm);
    } catch (e) { /* no such folder */ }
    if (!blobs.has('script.ink.json')) try { await s.dir.removeEntry('script.ink.json'); } catch (e) { /* none */ }
    for (const [path, b] of blobs) { const k = path.lastIndexOf('/'); await writeBlob(k < 0 ? null : path.slice(0, k), path.slice(k + 1), b); }
  }
  clearTimeout(saveT);
  s.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }; s.conflict = false;
  if (s.mode === 'folder') s.stamp = {};
  return loadStore(s.handle || s.dir);
}
/* a revision: a commit named by the stage manager, with a tag; "lock" also fixes the page numbers there */
async function histSave(name, lock) {
  const tags = await gRefs('refs/tags/'); let tag = refName(name), n = 1;
  while (tags.has(tag)) tag = refName(name) + '-' + (++n);
  if (lock) { S.cfg.lock = makeLock(name, tag); markDirty('cfg'); relayout(true); }
  const sha = await gSave(name, true);
  await gWrite('refs/tags/' + tag, sha + '\n');
  await gFlush();
  return sha;
}
/* a variant: a branch that starts from the show as it is now */
async function histVariant(name) {
  const ref = 'refs/heads/' + refName(name);
  if (await gRef(ref)) throw new Error(t('hiTaken'));
  const sha = await gSave(t('hiBefore', name), false);
  await gWrite(ref, sha + '\n'); await gWrite('HEAD', 'ref: ' + ref + '\n');
  await gFlush();
}
async function histSwitch(branch) {
  const ref = 'refs/heads/' + branch, sha = await gRef(ref);
  if (!sha) return false;
  await gSave(t('hiBefore', refLabel(branch)), false);
  await gWrite('HEAD', 'ref: ' + ref + '\n');
  return gCheckout((await gCommitOf(sha)).tree);
}
async function histRestore(sha) {
  const c = await gCommitOf(sha);
  await gSave(t('hiBefore', c.msg), false);
  return gCheckout(c.tree);
}
async function histState() {
  const head = await gHead(), log = head && head.sha ? await gLog(head.sha) : [];
  return { branch: head && head.ref ? head.ref.replace('refs/heads/', '') : 'main', log, heads: await gRefs('refs/heads/'), tags: await gRefs('refs/tags/') };
}
const revName = c => c.msg.split('\n')[0] + (c.when ? '  ·  ' + c.when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
function unlockPages() { S.cfg.lock = null; markDirty('cfg'); relayout(true); }
async function openHistory() {
  if (!onDisk()) { toast(t('hiNeedFile')); return; }
  const fail = e => { console.warn(e); toast(t('hiErr', (e && e.message) || e)); };
  let st;
  try { st = await histState(); } catch (e) { fail(e); return; }
  openDlg(t('hiTitle'), (body, foot, close) => {
    const run = fn => async () => { try { await fn(); } catch (e) { fail(e); } };
    const btn = (label, fn, cls) => { const b = h('button', 'btn sm' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = fn; return b; };
    const input = ph => { const i = h('input'); i.type = 'text'; i.placeholder = ph; return i; };
    /* variant */
    const vr = h('div', 'hrow'), vs = h('select'), vn = input(t('hiVarName'));
    for (const n of new Set([st.branch].concat(Array.from(st.heads.keys())))) { const o = h('option', null, refLabel(n)); o.value = n; vs.appendChild(o); }
    vs.value = st.branch; vs.id = 'hiVar';
    vs.onchange = run(async () => { const n = vs.value; close(); await histSwitch(n); toast(t('hiSwitched', refLabel(n))); });
    vr.append(h('span', null, t('hiVariant')), vs, vn, btn(t('hiNewVar'), run(async () => {
      const nm = vn.value.trim(); if (!nm) { vn.focus(); return; }
      await histVariant(nm); close(); toast(t('hiSwitched', nm));
    })));
    body.append(vr, h('p', 'hint', t('hiVarHint')));
    /* locked page numbers */
    const lk = S.cfg.lock, li = S.lockInfo, ls = h('div', 'hsec'), lr = h('div', 'hrow');
    ls.appendChild(h('p', 'hint', !lk ? t('lkOff') : t('lkOn', lk.name) + ' ' + (li.changed.length ? t('lkChanged', li.changed.join(', ')) : t('lkNone')) + (li.gone.length ? ' ' + t('lkGone', li.gone.join(', ')) : '')));
    if (lk) {
      const pb = btn(t('lkPrint'), () => { close(); doPrint('script', false, true); }); pb.disabled = !li.changed.length;
      lr.append(pb, btn(t('lkUnlock'), () => { unlockPages(); close(); openHistory(); }));
      ls.appendChild(lr);
    }
    body.appendChild(ls);
    /* revisions */
    const rs = h('div', 'hsec'), sr = h('div', 'hrow'), rn = input(t('hiRevName')), ck = h('label', 'chk'), cb = h('input');
    cb.type = 'checkbox'; ck.append(cb, t('hiLockToo')); rn.id = 'hiName';
    sr.append(rn, ck, btn(t('hiSave'), run(async () => {
      const nm = rn.value.trim(); if (!nm) { rn.focus(); return; }
      await histSave(nm, cb.checked); close(); toast(t('hiSaved', nm));
    }), 'pri'));
    rs.appendChild(sr);
    if (!st.log.length) rs.appendChild(h('p', 'hint', t('hiNone')));
    for (const c of st.log) {
      const r = h('div', 'rev'), nm = h('div', 'rn');
      nm.append(h('b', null, c.msg.split('\n')[0]), h('span', null, c.when ? c.when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''));
      r.append(nm, btn(t('hiChanges'), () => { close(); openDiff(c.sha); }), btn(t('hiRestore'), run(async () => { close(); await histRestore(c.sha); toast(t('hiRestored', c.msg.split('\n')[0])); })));
      rs.appendChild(r);
    }
    body.appendChild(rs);
    dlgBtn(foot, t('close'), '', close);
  });
}
/* the changes between two revisions, or between a revision and now, as a list an actor can read */
function diffList(D, who) {
  const el = h('div', 'df'), rows = diffFor(D, who); let last = null;
  if (!rows.length) { el.appendChild(h('p', 'hint', t('dfNone'))); return el; }
  const tx = b => who === '*' || b.type === 'note' ? b.raw : b.plain;
  for (const { e, cueLine } of rows) {
    const bl = e.b || e.a, where = [bl.act, bl.scene].filter(Boolean).join(' · ');
    if (where !== last) { el.appendChild(h('div', 'dh', where || '—')); last = where; }
    const d = h('div', 'de ' + (e.k === 'cue' ? 'chg' : e.k));
    if (e.k === 'add') d.appendChild(h('ins', null, tx(e.b)));
    else if (e.k === 'del') d.appendChild(h('del', null, tx(e.a)));
    else for (const [k, w] of diffWords(e.k === 'cue' ? e.a.raw : tx(e.a), e.k === 'cue' ? e.b.raw : tx(e.b))) d.append(k ? h(k < 0 ? 'del' : 'ins', null, w) : w, ' ');
    d.appendChild(h('span', 'dk', [t({ add: 'dfAdd', del: 'dfDel', chg: 'dfChg', cue: 'dfCue' }[e.k]), cueLine ? t('dfCueLine') : '', e.b && e.b.page ? 'p. ' + pl(e.b.page) : ''].filter(Boolean).join(' · ')));
    el.appendChild(d);
  }
  return el;
}
async function openDiff(from, to) {
  const fail = e => { console.warn(e); toast(t('hiErr', (e && e.message) || e)); };
  let st;
  try { st = await histState(); } catch (e) { fail(e); return; }
  if (!st.log.length) { toast(t('hiNone')); return; }
  openDlg(t('dfTitle'), (body, foot, close) => {
    const bar = h('div', 'hrow'), fs = h('select'), ts = h('select'), ws = h('select'), cnt = h('p', 'hint');
    const opt = (sel, v, label) => { const o = h('option', null, label); o.value = v; sel.appendChild(o); };
    opt(ts, '', t('hiNow'));
    for (const c of st.log) { opt(fs, c.sha, revName(c)); opt(ts, c.sha, revName(c)); }
    fs.value = st.log.some(c => c.sha === from) ? from : st.log[0].sha; ts.value = st.log.some(c => c.sha === to) ? to : '';
    fs.id = 'dfFrom'; ts.id = 'dfTo'; ws.id = 'dfWho';
    bar.append(h('span', null, t('dfFrom')), fs, h('span', null, t('dfTo')), ts, h('span', null, t('dfWho')), ws);
    let D = [], list = h('div', 'df'), gen = 0;
    const show = () => { const n = diffList(D, ws.value); list.replaceWith(n); list = n; cnt.textContent = t('dfCount', $$('.de', n).length); };
    const load = async () => {
      const g = ++gen, side = v => v ? gText(st.log.find(c => c.sha === v), 'script.md').then(parseBlocks) : S.blocks;
      try { const A = await side(fs.value), B = await side(ts.value); if (g !== gen) return; D = diffBlocks(A, B); } catch (e) { fail(e); return; }
      const keep = ws.value; ws.textContent = '';
      opt(ws, '', t('dfText')); opt(ws, '*', t('dfAll'));
      for (const n of diffNames(D)) { const k = diffFor(D, n).length; if (k) opt(ws, n, n + ' (' + k + ')'); }
      ws.value = Array.from(ws.options).some(o => o.value === keep) ? keep : '';
      show();
    };
    fs.onchange = ts.onchange = load; ws.onchange = show;
    body.append(bar, cnt, list);
    dlgBtn(foot, t('dfBack'), '', () => { close(); openHistory(); });
    dlgBtn(foot, t('print'), '', () => {
      const cp = $('#cuePrint'), sel = s => s.options[s.selectedIndex].textContent; cp.textContent = '';
      cp.append(h('h1', null, [titleOf(), t('dfTitle') + (ws.value && ws.value !== '*' ? ' ' + t('dfFor', ws.value) : '')].filter(Boolean).join(' — ')), h('p', null, sel(fs) + '  →  ' + sel(ts)), list.cloneNode(true));
      document.body.classList.remove('pr-book', 'pr-script', 'pr-changed'); document.body.classList.add('pr-cues');
      window.print();
    });
    dlgBtn(foot, t('close'), 'pri', close);
    load();
  });
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
    const gs = h('select'); for (const [v, k] of [[0, 'gridOff'], [25, 'gridFine'], [50, 'gridCoarse']]) { const o = h('option', null, t(k)); o.value = v; gs.appendChild(o); } gs.value = S.cfg.boardGrid;
    const tb = h('button', 'btn sm', t('tplManage') + ' (' + S.templates.size + ')'); tb.type = 'button'; tb.onclick = () => { close(); enterTemplates(); };
    body.append(h('label', null, t('showTitle')), ti, h('label', null, t('paperL')), ps, h('label', null, t('langL')), ls,
      h('label', null, t('templates')), tb, h('label', null, t('tplFade')), fs2, h('label', null, t('gridL')), gs, h('label', null, t('deptsL')));
    const list = h('div'); body.appendChild(list);
    const addRow = d => {
      const r = h('div', 'drow'), c = h('input'), n = h('input'), col = h('input'), x = h('button', 'btn sm', '\u2715'), rv = h('label', 'chk'), cb = h('input');
      c.type = 'text'; n.type = 'text'; col.type = 'color'; x.type = 'button';
      c.value = d.code; n.value = d.name; col.value = /^#[0-9a-f]{6}$/i.test(d.colour) ? d.colour : '#888888';
      cb.type = 'checkbox'; cb.checked = !!d.review; rv.append(cb, t('deptReview')); rv.title = t('deptReviewTip');
      x.onclick = () => r.remove(); r.append(c, n, col, rv, x); list.appendChild(r);
    };
    S.cfg.departments.forEach(addRow);
    const ab = h('button', 'btn sm', t('addDept')); ab.type = 'button'; ab.onclick = () => addRow({ code: '', name: '', colour: '#2a9d8f' }); body.appendChild(ab);
    body.appendChild(h('p', 'hint', t('deptHint')));
    dlgBtn(foot, t('cancel'), '', close);
    dlgBtn(foot, t('save'), 'pri', () => {
      const deps = $$('.drow', list).map(r => { const i = $$('input', r); return { code: i[0].value, name: i[1].value, colour: i[2].value, review: i[3].checked }; });
      const paperChanged = ps.value !== S.cfg.paper;
      S.cfg = normCfg(Object.assign({}, S.cfg, { title: inScript ? S.cfg.title : ti.value.trim(), paper: ps.value, departments: deps, templateFade: +fs2.value, boardGrid: +gs.value }));
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
  $$('[data-k]').forEach(el => { el.title = t(el.dataset.tt || el.dataset.t || 'review') + '  (' + el.dataset.k + ')'; });
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
  $('#bFinger').classList.toggle('on', S.tool.finger && S.tool.mode !== 'erase'); $('#bErase').classList.toggle('on', S.tool.mode === 'erase');
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
  add(t('mHistory'), openHistory, !S.loaded);
  add(t('mExport'), exportBundle, !S.loaded);
  add(t('mImport'), importBundle);
  add(t('keys'), openKeys);
  add(t('mSaveTo'), saveToZip, !window.showSaveFilePicker || !S.loaded);
  add(t('mOpen'), () => openZipFile(), !fs);
  add(t('mOpenFolder'), () => openFolder(), !fd);
  add(t('mClose'), async () => { await saveNow(); S.loaded = false; showStart(); }, !S.loaded);
}
function bindUI() {
  const pens = $('#pens');
  for (const c of INKS) {
    const b = h('button', 'sw'); b.type = 'button'; b.dataset.c = c; b.title = String(INKS.indexOf(c) + 1); b.style.setProperty('--c', c === BLACK ? 'var(--tx)' : c);
    b.onclick = () => { S.tool.colour = c; S.tool.mode = 'pen'; applyView(); };
    pens.appendChild(b);
  }
  $('#bMenu').onclick = () => { const m = $('#menu'); if (m.hidden) { buildMenu(); m.hidden = false; } else m.hidden = true; };
  $('#bErase').onclick = () => { S.tool.mode = S.tool.mode === 'erase' ? 'pen' : 'erase'; applyView(); };
  $('#bFinger').onclick = () => { if (S.tool.mode === 'erase') { S.tool.mode = 'pen'; S.tool.finger = true; } else S.tool.finger = !S.tool.finger; savePrefs(); applyView(); };
  $('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
  const tog = (id, key, after) => { $(id).onclick = () => { S.view[key] = !S.view[key]; savePrefs(); applyView(); if (after) after(); }; };
  tog('#bFacing', 'facing', () => { sizeWrap(); renderVisible(); });
  tog('#bCues', 'cues'); tog('#bInk', 'ink'); tog('#bNight', 'night');
  $('#zOut').onclick = () => setZoom(1 / 1.15); $('#zIn').onclick = () => setZoom(1.15); $('#zFit').onclick = () => setZoom(0);
  $('#outline').onchange = e => { const b = S.byId.get(+e.target.value); e.target.value = ''; if (b) jumpTo(b); };
  $('#search').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); findNext(e.target.value.trim(), e.shiftKey ? -1 : 1); } });
  $('#search').addEventListener('input', () => { S.findAt = null; });
  $('#bKeys').onclick = openKeys;
  $('#bReview').onclick = () => toggleDrawer('review');
  $('#bList').onclick = () => toggleDrawer('cues');
  $('#bPrint').onclick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    openPop(r.left - 200, r.bottom - 10, p => {
      for (const k of ['book', 'script']) {   // the cue list is printed from its own panel
        const b = h('button', 'btn', t(k === 'book' ? 'prBook' : 'prScript')); b.type = 'button';
        b.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:6px';
        b.onclick = () => { closePop(); doPrint(k); };
        p.appendChild(b);
      }
    });
  };
}
/* ---------- keys ---------- */
/* the shortcuts dialog: keys, then the string that says what they do */
const KEYS = [
  ['Ctrl+F /', 'kFind'], ['Ctrl+Z', 'undo'], ['Ctrl+Y', 'redo'], ['Ctrl+S', 'kSave'], ['Ctrl+P', 'print'],
  ['1 2 3 4', 'kPens'], ['E', 'eraser'], ['F', 'fingerTip'],
  ['B', 'boardsTip'], ['C', 'cuesTip'], ['I', 'inkTip'], ['N', 'night'], ['L', 'cueList'], ['R', 'review'],
  ['+ \u2212', 'kZoom'], ['0', 'kFit'], ['PgDn PgUp', 'kPage'], ['Home End', 'kEnds'], ['Del', 'kDel'], ['Esc', 'kEsc'], ['?', 'keys']
];
let keysClose = null;
function openKeys() {
  keysClose = openDlg(t('keys'), (body, foot, close) => {
    const tb = h('table', 'keys');
    for (const [ks, s] of KEYS) {
      const r = h('tr'), d = h('td');
      for (const x of ks.split(' ')) d.appendChild(h('kbd', null, x));
      r.append(d, h('td', null, t(s))); tb.appendChild(r);
    }
    body.append(tb, h('p', 'hint', t('kHint')));
    dlgBtn(foot, t('close'), 'pri', () => { keysClose = null; close(); });
  }, true);
}
const focusFind = () => { $('#search').focus(); $('#search').select(); };
const press = id => () => $(id).click();
const KEYMAP = {
  b: press('#bFacing'), c: press('#bCues'), i: press('#bInk'), n: press('#bNight'), e: press('#bErase'), f: press('#bFinger'),
  l: press('#bList'), r: press('#bReview'), '+': () => setZoom(1.15), '=': () => setZoom(1.15), '-': () => setZoom(1 / 1.15), '0': () => setZoom(0),
  '/': focusFind, '?': openKeys, pagedown: () => pageStep(1), pageup: () => pageStep(-1),
  home: () => { desk.scrollTop = 0; }, end: () => { desk.scrollTop = desk.scrollHeight; }
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (keysClose && !$('#dlg').hidden) { keysClose(); keysClose = null; return; }
    const q = $('#search');   // leaving Find empties it, so that it folds back to the magnifier
    if (document.activeElement === q) { e.preventDefault(); q.value = ''; S.findAt = null; q.blur(); return; }
    cancelDrag(); if (POP) { if (POP.esc) POP.esc(); closePop(); e.preventDefault(); } $('#menu').hidden = true; return;
  }
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && !e.altKey && !e.shiftKey && S.loaded && $('#dlg').hidden) {
    if (k === 'f') { e.preventDefault(); focusFind(); return; }
    if (k === 's') { e.preventDefault(); saveNow(); return; }
    /* the browser's own print would give only the pages drawn near the screen */
    if (k === 'p') { e.preventDefault(); $('#bPrint').click(); return; }
  }
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (!S.loaded || !$('#dlg').hidden) return;
  if (POP && POP.key && POP.key(e)) { e.preventDefault(); return; }
  if (mod && !e.altKey) {
    if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === 'y') { e.preventDefault(); redo(); }
    return;
  }
  if (mod || e.altKey || e.isComposing || POP || S.editing) return;
  const pen = /^[1-9]$/.test(k) && $$('#pens .sw')[+k - 1];
  const fn = pen ? () => pen.click() : KEYMAP[k];
  if (fn) { e.preventDefault(); $('#menu').hidden = true; fn(); }
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
  if (pageFull(selB ? pageIndexOf(lastOfGroup(selB))[0] : currentPage())) return;
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
window.PB = { S, VERSION, parseScript, analyze, stripTokens, serialize, commitText, openFolder, openZipFile, saveToZip, readZip, buildZip, startMemory, loadBundle, saveNow, bundle, inkFile, collectCues, reviewData, parseMeta, castCheck, fullName, relayout, renderAll, jumpTo, enterTemplates, exitTemplates, t,
  openHistory, openDiff, histSave, histVariant, histSwitch, histRestore, histState, unlockPages, parseBlocks, diffBlocks, diffFor, doPrint, textMoveBlocks };
init();
