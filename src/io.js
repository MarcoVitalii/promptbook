/* =====================================================================
   STORE: show file (.zip; Chrome, Edge), or in-browser fallback
   A show file holds script.md, script.ink.json, config.json, boards/, templates/.
   They live in s.files (path -> Blob) and the whole archive is rewritten on each save.
   ===================================================================== */
const onDisk = () => S.store.mode === 'zip';
function resetStore() {
  const s = S.store;
  s.mode = 'none'; s.handle = null; s.files = null; s.name = ''; s.stamp = {}; s.conflict = false; s.lastSave = null; s.err = null; s.saving = false; s.again = false; s.bad = [];
  s.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() };
  s.bfiles = new Map();   // every drawing in boards/: file name -> the board name written in it, null when it has none
  s.gone = [];            // templates the settings name that had no file when the show was opened (STO-31)
  s.draft = 0;            // what the last draft in the browser lacks: 0 nothing, 1 the images of the boards, 2 it was not written (STO-30)
}
const readFile = (name, sub) => S.store.files.get(sub ? sub + '/' + name : name) || null;
async function readText(name, sub) { const f = readFile(name, sub); return f ? f.text() : null; }
/* Missing is null. There but unreadable (not JSON, not an object, or without the list "need") is null too, but the part is
   moved, bytes untouched, to damaged/ in the show file and named in s.bad: nothing is saved until the user has chosen (showDamaged). */
async function readJSON(name, sub, need) {
  const s = S.store, key = sub ? sub + '/' + name : name, f = s.files.get(key); if (!f) return null;
  let j = null;
  try { j = JSON.parse(await f.text()); } catch (e) { /* handled below */ }
  if (j && typeof j === 'object' && !Array.isArray(j) && (!need || Array.isArray(j[need]))) return j;
  console.warn('Unreadable JSON: ' + key);
  let to = 'damaged/' + key; for (let k = 2; s.files.has(to); k++) to = 'damaged/' + k + '/' + key;
  s.files.set(to, f); s.files.delete(key); s.bad.push(key);
  return null;
}
function writeBlob(sub, name, blob) { S.store.files.set(sub ? sub + '/' + name : name, blob instanceof Blob ? blob : new Blob([blob])); }
function cfgFile() {
  const c = JSON.parse(JSON.stringify(S.cfg));
  if (onDisk() && c.defaultBoard) delete c.defaultBoard.imageData;
  c.templates = c.templates.concat(tplGone());
  return c;
}
/* Templates the settings name whose file is not in the show. The names stay in the saved list, after the others, so that a file put
   back by hand is a template again; a name is let go when a template takes it or its file name, or the user drops it (STO-31). */
function tplGone() { const s = S.store; return s.gone.filter(n => !tplTaken(n) && !s.files.has('templates/' + slug(n) + '.json')); }
/* the configuration says which release saves it and which is needed to read it; true when that is news (STO-15) */
function relStamp() { const o = relOf(S.cfg), m = S.cfg.release = relMark(S.cfg); return o.made !== m.made || o.needs !== m.needs; }
function relWarn() {
  const n = relNewer(S.cfg); if (!n) return;
  openDlg(t('relTitle'), (body, foot, close) => { body.appendChild(h('p', null, t('relWarn', n, VERSION))); dlgBtn(foot, t('close'), 'pri', close); }, true);
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
/* The file of a board's drawing. It is named after the board (slug), and the exact name is written inside. Several names can
   give one slug ("Sala A" and "sala-a"; every name with no Latin letter or digit), so a board is found by the name in the file,
   and a file that holds another name is never taken: the board gets the next numbered one (sala-a-2.json).
   Without "make", null when the board has no file yet. */
function boardFileOf(name, make) {
  const m = S.store.bfiles, base = slug(name); let f = base + '.json', n = 2;
  if (m.get(f) === name) return f;
  for (const [k, v] of m) if (v === name) return k;
  if (!make) return null;
  while (m.has(f)) f = base + '-' + n++ + '.json';
  m.set(f, name); return f;
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
  if (n > 65534 || off + csize > 0xFFFFFFF0) throw new Error(t('zipBig'));
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, n, true); eo.setUint16(10, n, true); eo.setUint32(12, csize, true); eo.setUint32(16, off, true);
  return new Blob([...parts, ...central, eo.buffer], { type: 'application/zip' });
}
/* An archive that cannot be followed (cut short, a size or an offset outside the file, a local header that is not the entry the directory
   names) is refused. An entry that can be found but whose bytes do not unpack, or do not match the size and CRC recorded for them, is
   read all the same and marked in zipBroken: zipAside moves it out of the show when the file is opened (STO-23, STO-24). */
const zipBroken = new WeakMap();   // Blob of such an entry -> what to add to its name: '', or '.deflate' when the bytes kept are still packed
async function readZip(file) {
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65557)).arrayBuffer()), bad = () => new Error(t('zipBad'));
  let e = tail.byteLength - 22;
  while (e >= 0 && tail.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error(t(tail.byteLength > 3 && new DataView(await file.slice(0, 4).arrayBuffer()).getUint32(0, true) === 0x04034b50 ? 'zipBad' : 'zipNot'));   // a zip without its end: cut short
  const n = tail.getUint16(e + 10, true), cdSize = tail.getUint32(e + 12, true), cdOff = tail.getUint32(e + 16, true);
  if (cdOff === 0xFFFFFFFF || cdSize === 0xFFFFFFFF || n === 0xFFFF) throw new Error(t('zip64'));
  if (cdOff + cdSize > file.size - tail.byteLength + e || n * 46 > cdSize) throw bad();
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer()), dec = new TextDecoder(), out = new Map();
  let p = 0;
  for (let i = 0; i < n; i++) {
    if (p + 46 > cdSize || cd.getUint32(p, true) !== 0x02014b50) throw bad();
    const flags = cd.getUint16(p + 8, true), method = cd.getUint16(p + 10, true), crc = cd.getUint32(p + 16, true), csz = cd.getUint32(p + 20, true), usz = cd.getUint32(p + 24, true);
    const nl = cd.getUint16(p + 28, true), xl = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true), lo = cd.getUint32(p + 42, true);
    if (p + 46 + nl + xl + cl > cdSize) throw bad();
    const nb = new Uint8Array(cd.buffer, p + 46, nl), name = dec.decode(nb); p += 46 + nl + xl + cl;
    if (flags & 1) throw new Error(t('zipCrypt'));
    if (method !== 0 && method !== 8) throw new Error(t('zipMethod'));
    if (csz === 0xFFFFFFFF || usz === 0xFFFFFFFF || lo === 0xFFFFFFFF) throw new Error(t('zip64'));
    if (lo + 30 + nl > cdOff) throw bad();
    const lh = new DataView(await file.slice(lo, lo + 30 + nl).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50 || lh.getUint16(8, true) !== method || lh.getUint16(26, true) !== nl || nb.some((x, k) => x !== lh.getUint8(30 + k))) throw bad();
    const start = lo + 30 + nl + lh.getUint16(28, true);
    if (start + csz > cdOff) throw bad();
    if (name.endsWith('/')) continue;   // a folder; only after its header was found, so that a name damaged into one is not skipped
    // copied into memory: a slice of the file can no longer be read once the file is rewritten
    let data = new Uint8Array(await file.slice(start, start + csz).arrayBuffer()), broke = null;
    if (method === 8) { try { data = await pipeBytes(data, new DecompressionStream('deflate-raw')); } catch (er) { broke = '.deflate'; } }
    if (broke === null && (data.length !== usz || crc32(data) !== crc)) broke = '';
    const blob = new Blob([data]); out.set(name, blob);
    if (broke !== null) { console.warn('Damaged zip entry: ' + name); zipBroken.set(blob, broke); }
  }
  if (p !== cdSize) throw bad();   // the directory holds more than the entries counted: a count that is wrong would drop the last ones without a word
  // a folder zipped by the operating system has everything inside one top-level folder; drop it, and drop its clutter
  for (const k of Array.from(out.keys())) if (/^__MACOSX\//.test(k) || /(^|\/)\.DS_Store$/.test(k)) out.delete(k);
  if (!out.has('script.md') && !out.has('config.json')) {
    const tops = new Set(Array.from(out.keys()).map(k => k.split('/')[0]));
    if (tops.size === 1) { const pre = Array.from(tops)[0] + '/'; for (const [k, v] of Array.from(out)) { out.delete(k); out.set(k.slice(pre.length), v); } }
  }
  return out;
}
/* The entries readZip marked go to damaged/, as a part that cannot be read does (readJSON), so that none is taken for the script, the ink,
   the settings, an image or the history. Returns their names for the banner; those of the history are named once, by their folder. */
function zipAside(files) {
  const bad = [];
  for (const [k, f] of Array.from(files)) if (zipBroken.has(f)) {
    const end = k + zipBroken.get(f), name = k.startsWith(GIT) ? GIT.slice(0, -1) : k;
    let to = 'damaged/' + end; for (let n = 2; files.has(to); n++) to = 'damaged/' + n + '/' + end;
    files.set(to, f); files.delete(k); zipBroken.delete(f);
    if (!bad.includes(name)) bad.push(name);
  }
  return bad;
}
/* An image leaves the show file when nothing names it. Reading the drawings takes a moment, and an image can be put on a board meanwhile, or
   just before, with its drawing not yet written: so only the images that were there before the wait are judged, and one that a board or a
   template of the open show names is kept whatever the files say. */
function pruneImages(files) {
  const refs = Array.from(files).filter(([k]) => /\.json$/.test(k)).map(([, b]) => b);
  const had = Array.from(files.keys()).filter(k => /^(boards|templates)\/[^/]+$/.test(k) && !/\.json$/.test(k));
  return Promise.all(refs.map(b => b.text())).then(texts => {
    const all = texts.join('\n'), live = new Set(Array.from(S.boards.values()).concat(Array.from(S.templates.values())).map(B => imgKey(B)));
    for (const k of had) if (!live.has(k) && !all.includes(k.slice(k.indexOf('/') + 1))) files.delete(k);
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
let saveT = 0;
function markDirty(what, name) {
  if (!S.loaded) return;
  const d = S.store.dirty;
  if (what === 'board') d.boards.add(name); else if (what === 'tpl') d.tpls.add(name); else d[what] = true;
  setStatus();
  clearTimeout(saveT); saveT = setTimeout(saveNow, 700);
}
/* a failed save says why once: the same reason is not shown again until a save has gone through */
const errText = e => String((e && e.message) || e);
function saveError(e) { const s = S.store; if (!s.err || errText(s.err) !== errText(e)) toast(t('errSave', errText(e))); s.err = e; console.error(e); setStatus(); }
async function saveNow(force) {
  const s = S.store, d = s.dirty;
  if (s.saving) { s.again = true; return; }
  clearTimeout(saveT);
  if (s.mode === 'none') return;
  s.saving = true; setStatus();
  try {
    if (onDisk()) {
      const any = d.script || d.ink || d.cfg || d.boards.size > 0 || d.tpls.size > 0;
      if (any && force !== true) {
        if (s.bad.length) { s.saving = false; setStatus(); return; }   // an unreadable part: nothing is written until the user has chosen
        if (!s.conflict && await zipChanged()) { s.conflict = true; showConflict(); }
        if (s.conflict) { s.saving = false; setStatus(); return; }
      }
      if (any && relStamp()) d.cfg = true;   // the first save by this release marks the show
      if (d.script) { d.script = false; writeBlob(null, 'script.md', serialize()); }
      if (d.ink) { d.ink = false; writeBlob(null, 'script.ink.json', JSON.stringify(inkFile())); }
      if (d.cfg) { d.cfg = false; writeBlob(null, 'config.json', JSON.stringify(cfgFile(), null, 2)); }
      for (const n of d.boards) { const B = S.boards.get(n); if (B) writeBlob('boards', boardFileOf(B.name, true), JSON.stringify(boardFile(B))); }
      d.boards.clear();
      for (const n of d.tpls) { const T = S.templates.get(n); if (T) writeBlob('templates', slug(T.name) + '.json', JSON.stringify(boardFile(T))); }
      d.tpls.clear();
      if (any) { try { await flushZip(); } catch (e) { d.script = true; throw e; } s.conflict = false; showMemBanner(); sweepURLs(); }
      s.lastSave = new Date(); s.err = null;
    } else {
      d.script = d.ink = d.cfg = false; d.boards.clear(); d.tpls.clear();
      saveDraft(); s.err = null;
    }
  } catch (e) { saveError(e); }
  s.saving = false; setStatus();
  if (s.again) { s.again = false; saveNow(); }
}
function bundle(withImages) {
  if (!onDisk()) relStamp();   // in the browser the backup is the show; a show file is marked when it is saved
  return { format: 'promptbook', version: 1, when: new Date().toISOString(), config: Object.assign(JSON.parse(JSON.stringify(S.cfg)), { release: relMark(S.cfg) }), script: serialize(), ink: inkFile(),
    boards: Array.from(S.boards.values()).map(B => boardFile(B, withImages)),
    templates: S.cfg.templates.map(n => S.templates.get(n)).filter(Boolean).map(T => boardFile(T, withImages)) };
}
/* The draft is the whole show in one value of localStorage, which has a quota. Over it the draft is written without the images
   of the boards; when that fails too nothing is written, and the save has failed (STO-3). Either is said when it starts, in a message
   and in the banner, not at every save (STO-30). */
function saveDraft() {
  const s = S.store, was = s.draft;
  try { localStorage.setItem('promptbook:draft', JSON.stringify(bundle(true))); s.draft = 0; }
  catch (e) { try { const b = bundle(false); if (b.config.defaultBoard) delete b.config.defaultBoard.imageData; localStorage.setItem('promptbook:draft', JSON.stringify(b)); s.draft = 1; } catch (e2) { s.draft = 2; } }
  if (s.draft !== was) { showMemBanner(); if (s.draft === 1) toast(t('draftNoImg')); }
  if (s.draft === 2) throw new Error(t('draftNone'));
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
  if (s.bad.length) { showDamaged(); return; }
  if (s.mode === 'memory') {
    const acts = [[t('mExport'), exportBundle]];
    if (window.showSaveFilePicker) acts.unshift([t('mSaveTo'), saveToZip]);
    showBanner(s.draft === 1 ? t('draftNoImg') : s.draft ? t('errSave', t('draftNone')) : t('memBanner'), acts);
  } else if (!$('#banner').hidden) { $('#banner').hidden = true; if (S.loaded) { sizeWrap(); renderVisible(); } }
}
function showDamaged() {
  const s = S.store;
  showBanner(t('damaged', s.bad.join(', ')), [
    [t('damagedGo'), () => { const ink = s.bad.includes('script.ink.json'); s.bad = []; showMemBanner(); markDirty('cfg'); if (ink) markDirty('ink'); toast(t('damagedKept')); return saveNow(); }],
    [t('damagedClose'), () => { clearTimeout(saveT); resetStore(); $('#banner').hidden = true; S.loaded = false; showStart(); }]
  ]);
}
function showConflict() {
  showBanner(t('extChanged'), [
    [t('loadTheirs'), async () => {
      S.store.conflict = false; S.store.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }; await reloadZip();
    }],
    [t('keepMine'), () => { S.store.dirty.script = true; saveNow(true); }]
  ]);
}
async function checkExternal() {
  const s = S.store;
  if (document.hidden || !onDisk() || !S.loaded || s.saving || s.conflict || S.editing) return;
  try {
    if (!(await zipChanged())) return;
    const d = s.dirty;
    if (d.script || d.ink || d.cfg || d.boards.size || d.tpls.size) { s.conflict = true; showConflict(); return; }
    await reloadZip(); toast(t('reloaded'));
  } catch (e) { console.warn(e); }
}
document.addEventListener('visibilitychange', checkExternal);
window.addEventListener('focus', checkExternal);
window.addEventListener('beforeunload', e => {
  const s = S.store, d = s.dirty;
  if (s.err || (onDisk() && (d.script || d.ink || d.cfg || d.boards.size || d.tpls.size))) { e.preventDefault(); e.returnValue = ''; }   // s.err without a show file: the draft could not be written
});

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('promptbook', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
/* a connection lives for one read or one write: close() waits for the transaction, and a closed connection holds up no other tab */
async function idbGet(k) {
  let db;
  try { db = await idb(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); }
  catch (e) { return null; }
  finally { if (db) db.close(); }
}
async function idbSet(k, v) {
  let db;
  try { db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  catch (e) { /* not available */ }
  finally { if (db) db.close(); }
}

function loadShow(cfg, text, inkF) {
  S.loaded = false; closePop();
  S.mode = 'script'; document.body.classList.remove('tplmode'); $('#tpl').textContent = '';
  S.cfg = normCfg(cfg);
  for (const n of S.templates.keys()) if (!S.cfg.templates.includes(n)) S.cfg.templates.push(n);
  S.cfg.templates = S.cfg.templates.filter(n => S.templates.has(n));
  applyPaper();
  showOff();
  S.blocks = []; S.byId = new Map(); S.groups = []; S.nextId = 1; S.hist = []; S.redo = []; S.meas = new Map();
  S.sel = null; S.findAt = null; S.cueFilter = null;
  for (const E of S.els) E.sp.remove();
  S.els = []; sweepURLs();   // the pages that showed the images of the show before are gone
  reparse(text || ''); attachInk(inkF);
  S.loaded = true; $('#start').hidden = true;
  relayout(true); desk.scrollTop = 0; renderVisible();
  updUndo(); setStatus(); showMemBanner(); relWarn();
}
async function grant(handle) {
  if (!handle.queryPermission) return true;
  let p = await handle.queryPermission({ mode: 'readwrite' });
  if (p !== 'granted') p = await handle.requestPermission({ mode: 'readwrite' });
  return p === 'granted';
}
async function openZipFile(handle) {
  try {
    if (!handle) [handle] = await window.showOpenFilePicker({ id: 'promptbook', types: ZIP_TYPES });
    if (!(await grant(handle))) throw new Error(t('errPerm'));
  } catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return false; }
  let files, file;
  try { file = await handle.getFile(); files = await readZip(file); } catch (e) { console.error(e); toast(t('errOpen', (e && e.message) || '')); return false; }
  clearTimeout(saveT); resetStore();
  const s = S.store; s.mode = 'zip'; s.handle = handle; s.files = files; s.name = showName(handle); s.stamp.zip = file.lastModified;
  return loadStore(handle);
}
async function reloadZip() { return openZipFile(S.store.handle); }
const ZIP_TYPES = [{ description: 'Promptbook', accept: { 'application/zip': ['.zip'] } }];
const showName = handle => handle.name.replace(/(\.promptbook)?\.zip$/i, '');
async function loadStore(handle) {
  const s = S.store;
  try {
    s.bad = zipAside(s.files);
    const cfg = await readJSON('config.json'), text = await readText('script.md'), ink = await readJSON('script.ink.json');
    S.boards = new Map(); S.templates = new Map(); S.urls = new Map();
    const bj = new Map(), bn = Array.from(boardNames(text || '')), from = new Map(), held = new Set();
    for (const k of Array.from(s.files.keys()).sort()) if (/^boards\/[^/]+\.json$/.test(k)) { const j = await readJSON(k, '', 'strokes'); if (j) bj.set(k.slice(7), j); }
    s.bfiles = new Map(Array.from(bj, ([f, j]) => [f, j && typeof j.name === 'string' ? j.name : null]));
    for (const n of bn) { const f = boardFileOf(n); if (f) { from.set(n, f); held.add(f); } }
    /* No file holds this name: the name was retyped by hand in script.md, or the file was made by hand. The board takes the file
       its slug names, as every release did, unless a board of the script holds it; the name in the file follows at the next save.
       One file, one board: in a show of an older release where two names shared a file, the name saved last has the drawing. */
    for (const n of bn) {
      const f = slug(n) + '.json', j = bj.get(f);
      if (from.has(n) || held.has(f) || !j || !Array.isArray(j.strokes)) continue;
      from.set(n, f); held.add(f); s.bfiles.set(f, n); j.name = n; writeBlob('boards', f, JSON.stringify(j));
    }
    for (const n of bn) {
      const j = bj.get(from.get(n));
      if (j && Array.isArray(j.strokes)) { j.imageData = null; S.boards.set(n, mkBoard(n, j)); }
    }
    s.gone = [];
    for (const n of (cfg && Array.isArray(cfg.templates) ? cfg.templates : [])) {
      if (typeof n !== 'string' || !n) continue;
      const j = await readJSON(slug(n) + '.json', 'templates', 'strokes');
      if (j && Array.isArray(j.strokes)) { j.imageData = null; S.templates.set(n, mkBoard(n, j, true)); }
      else if (!s.gone.includes(n) && !s.bad.includes('templates/' + slug(n) + '.json')) s.gone.push(n);   // no file, as against unreadable: the name is kept (STO-31)
    }
    if (tplGone().length) toast(t('tplGone', tplGone().join(', ')));
    const imgs = new Set();
    S.boards.forEach(B => { if (B.image) imgs.add('boards/' + B.image); });
    S.templates.forEach(T => { if (T.image) imgs.add('templates/' + T.image); });
    if (cfg && cfg.defaultBoard && cfg.defaultBoard.image) imgs.add('boards/' + cfg.defaultBoard.image);
    for (const key of imgs) { const blob = s.files.get(key); if (blob) setURL(key, blob); }
    loadShow(cfg, text || '', ink);
    idbSet('dir', handle);
    if (text == null && !relNewer(S.cfg) && !s.bad.includes('script.md')) openTextDialog(true);   // the box would take the place of the warning; a script set aside is not a show without a script
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
async function saveToZip() {
  let handle;
  try { handle = await window.showSaveFilePicker({ id: 'promptbook', suggestedName: slug(titleOf() || S.store.name || 'show') + '.promptbook.zip', types: ZIP_TYPES }); if (!(await grant(handle))) return; }
  catch (e) { if (!e || e.name !== 'AbortError') toast(t('errOpen', (e && e.message) || '')); return; }
  const s = S.store;
  const files = new Map(s.mode === 'zip' ? s.files : []);   // keeps the images already in the show file, and the history
  s.mode = 'zip'; s.handle = handle; s.files = files; s.name = showName(handle); s.stamp = {}; s.err = null; s.conflict = false; s.bad = [];   // a new file is a choice: it gets the show as it is, and damaged/
  try {
    for (const B of Array.from(S.boards.values()).concat(Array.from(S.templates.values()))) if (B.imageData && B.image) {
      const blob = await dataURLBlob(B.imageData); writeBlob(B.tpl ? 'templates' : 'boards', B.image, blob);
      setURL(imgKey(B), blob); B.imageData = null;
    }
    const db = S.cfg.defaultBoard;
    if (db && db.imageData && db.image) { if (!S.urls.has('boards/' + db.image)) { const blob = await dataURLBlob(db.imageData); writeBlob('boards', db.image, blob); setURL('boards/' + db.image, blob); } delete db.imageData; }
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
    for (const o of b.boards) if (o.image && !o.imageData) { try { const f = readFile(o.image, 'boards'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    for (const o of b.templates) if (o.image && !o.imageData) { try { const f = readFile(o.image, 'templates'); if (f) o.imageData = await blobToDataURL(f); } catch (e) { /* skip image */ } }
    const db = b.config.defaultBoard;
    if (db && db.image && !db.imageData) { try { const f = readFile(db.image, 'boards'); if (f) db.imageData = await blobToDataURL(f); } catch (e) { /* skip */ } }
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
   The show keeps its history in git's own format, in a .git folder beside script.md, inside the show
   file. A revision is a commit with a tag; a variant is a branch. Only loose
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
async function gRead(path) {
  const b = S.store.files.get(GIT + path);
  return b ? new Uint8Array(await b.arrayBuffer()) : null;
}
function gWrite(path, data) { S.store.files.set(GIT + path, new Blob([data])); }
/* refs under a prefix such as refs/tags/: name -> sha */
async function gRefs(prefix) {
  const s = S.store, out = new Map(), pk = await gRead('packed-refs');
  if (pk) for (const l of DEC.decode(pk).split('\n')) { const m = /^([0-9a-f]{40}) (.+)$/.exec(l); if (m && m[2].startsWith(prefix)) out.set(m[2].slice(prefix.length), m[1]); }
  const names = Array.from(s.files.keys()).filter(k => k.startsWith(GIT + prefix)).map(k => k.slice(GIT.length + prefix.length));
  for (const n of names) { const b = await gRead(prefix + n); if (b) out.set(n, DEC.decode(b).trim()); }
  return out;
}
async function gRef(name) { const k = name.lastIndexOf('/') + 1, v = (await gRefs(name.slice(0, k))).get(name.slice(k)); return v === undefined ? null : v; }
/* null: no history yet. sha is null on a branch with no commit yet. When HEAD or its branch holds anything but the name of a commit, sha is that
   text, and reading it fails in gGet, in words; so does a history that has refs and has lost HEAD, or has objects and has lost its branch. */
async function gHead() {
  const keys = Array.from(S.store.files.keys()), b = await gRead('HEAD'); if (!b && !keys.some(k => k.startsWith(GIT + 'refs/'))) return null;
  const tx = b ? DEC.decode(b).trim() : '', m = /^ref: (refs\/\S+)$/.exec(tx.includes('..') ? '' : tx), sha = m ? await gRef(m[1]) : tx;
  return { ref: m ? m[1] : null, sha: sha === null && keys.some(k => k.startsWith(GIT + 'objects/')) ? m[1] : sha };
}
async function gPut(type, body) {
  const raw = cat([ENC.encode(type + ' ' + body.length + '\0'), body]);
  const sha = hex(new Uint8Array(await crypto.subtle.digest('SHA-1', raw))), path = 'objects/' + sha.slice(0, 2) + '/' + sha.slice(2);
  if (!(await gGet(sha).catch(() => null))) await gWrite(path, await pipeBytes(raw, new CompressionStream('deflate')));   // missing, or there and unreadable: written again
  return sha;
}
/* An object is taken only when it is whole: it unpacks, says its kind and its length, is of the kind asked for, and its SHA-1 is the name it is kept under.
   Anything else is an error in words (hiBad), never a guess: so no tree or commit can lead back to itself, and what is read is what git would read. */
const SHA = /^[0-9a-f]{40}$/;
async function gGet(sha, kind) {
  const bad = () => new Error(t('hiBad', String(sha).replace(/[^\x21-\x7e]+/g, ' ').trim().slice(0, SHA.test(sha) ? 7 : 40) || 'HEAD'));
  if (!SHA.test(sha)) throw bad();
  const z = await gRead('objects/' + sha.slice(0, 2) + '/' + sha.slice(2));
  if (!z) throw Array.from(S.store.files.keys()).some(k => k.startsWith(GIT + 'objects/pack/')) ? new Error(t('hiPacked')) : bad();
  const raw = await pipeBytes(z, new DecompressionStream('deflate')).catch(() => new Uint8Array(0)), k = raw.indexOf(0);
  const m = k < 0 || k > 32 ? null : /^(blob|tree|commit|tag) (\d+)$/.exec(DEC.decode(raw.subarray(0, k)));
  if (!m || +m[2] !== raw.length - k - 1 || (kind && m[1] !== kind) || hex(new Uint8Array(await crypto.subtle.digest('SHA-1', raw))) !== sha) throw bad();
  return { type: m[1], body: raw.subarray(k + 1) };
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
  const b = (await gGet(tree, 'tree')).body; let i = 0;
  while (i < b.length) {
    const sp = b.indexOf(32, i), z = b.indexOf(0, sp), mode = DEC.decode(b.subarray(i, sp)), name = pre + DEC.decode(b.subarray(sp + 1, z)), sha = hex(b.subarray(z + 1, z + 21));
    if (sp < 0 || z < 0 || z + 21 > b.length) throw new Error(t('hiBad', tree.slice(0, 7)));   // an entry cut short
    i = z + 21;
    if (mode === '40000') await gFiles(sha, name + '/', out); else out.set(name, sha);
  }
  return out;
}
async function gCommitOf(sha) {
  const o = await gGet(sha), tx = DEC.decode(o.body), k = tx.indexOf('\n\n'), head = k < 0 ? tx : tx.slice(0, k);
  const want = { tag: /^object [0-9a-f]{40}$/m, commit: /^tree [0-9a-f]{40}$/m }[o.type];
  if (!want || !want.test(head)) throw new Error(t('hiBad', sha.slice(0, 7)));
  if (o.type === 'tag') return gCommitOf(/^object ([0-9a-f]{40})/m.exec(head)[1]);   // a tag made with "git tag -a"
  const m = /^committer .* (\d+) [+-]\d{4}$/m.exec(head);
  return { sha, tree: /^tree ([0-9a-f]{40})/m.exec(head)[1], parent: (/^parent ([0-9a-f]{40})/m.exec(head) || [])[1] || null, when: m ? new Date(+m[1] * 1000) : null, msg: k < 0 ? '' : tx.slice(k + 2).trim() };
}
async function gLog(sha, max) {
  const out = [];
  try { while (sha !== null && out.length < (max || 300)) { const c = await gCommitOf(sha); out.push(c); sha = c.parent; } }
  catch (e) { console.warn(e); out.cut = e; }   // the history is read as far as it can be: what is before stays listed, "cut" says why it stops
  return out;
}
async function gText(commit, path) {
  const sha = (await gFiles(commit.tree, '', new Map())).get(path);
  return sha ? DEC.decode((await gGet(sha, 'blob')).body) : '';
}
async function settled() {
  const s = S.store;
  if (s.bad.length) throw new Error(t('damagedFirst'));
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
  await pruneImages(s.files);
  return new Map(Array.from(s.files).filter(([k]) => SHOW_FILE.test(k)));
}
/* Commit the show as it is. Without "always", nothing is written when it equals the last commit. */
async function gSave(msg, always) {
  await settled();
  const head = (await gHead()) || { ref: 'refs/heads/main', sha: null };
  const tree = await gTree(await workFiles());
  if (!always && head.sha && (await gCommitOf(head.sha).catch(() => ({}))).tree === tree) return head.sha;   // a last commit that cannot be read is not equal to anything
  const d = new Date(), off = -d.getTimezoneOffset(), p2 = n => String(n).padStart(2, '0');
  const who = 'Promptbook <promptbook@localhost> ' + Math.floor(d / 1000) + ' ' + (off < 0 ? '-' : '+') + p2(Math.floor(Math.abs(off) / 60)) + p2(Math.abs(off) % 60);
  const sha = await gPut('commit', ENC.encode('tree ' + tree + '\n' + (SHA.test(head.sha) ? 'parent ' + head.sha + '\n' : '') + 'author ' + who + '\ncommitter ' + who + '\n\n' + msg + '\n'));
  if (!(await gRead('HEAD'))) { await gWrite('HEAD', 'ref: refs/heads/main\n'); await gWrite('config', '[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false\n'); }
  await gWrite(head.ref || 'HEAD', sha + '\n');
  return sha;
}
/* Replace the show on disk with the files of a tree, then open it again. The whole tree is read first: when a part of it cannot be read
   nothing has changed yet, and "before" (the commit of the show as it is, the move to another branch) has not run. */
async function gCheckout(tree, before) {
  const s = S.store, blobs = new Map();
  for (const [path, sha] of await gFiles(tree, '', new Map())) {
    if (!SHOW_FILE.test(path)) continue;
    const b = new Blob([(await gGet(sha, 'blob')).body]); blobSha.set(b, sha); blobs.set(path, b);
  }
  if (before) await before();
  s.files = new Map(Array.from(s.files).filter(([k]) => k.startsWith(GIT) || k.startsWith('damaged/')).concat(Array.from(blobs)));
  await flushZip();
  clearTimeout(saveT);
  s.dirty = { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }; s.conflict = false;
  return loadStore(s.handle);
}
/* a revision: a commit named by the stage manager, with a tag; "lock" also fixes the page numbers there */
async function histSave(name, lock) {
  const tags = await gRefs('refs/tags/'); let tag = refName(name), n = 1;
  while (tags.has(tag)) tag = refName(name) + '-' + (++n);
  if (lock) { S.cfg.lock = makeLock(name, tag); markDirty('cfg'); relayout(true); }
  const sha = await gSave(name, true);
  await gWrite('refs/tags/' + tag, sha + '\n');
  await flushZip();
  return sha;
}
/* a variant: a branch that starts from the show as it is now */
async function histVariant(name) {
  const ref = 'refs/heads/' + refName(name);
  if (await gRef(ref)) throw new Error(t('hiTaken'));
  const sha = await gSave(t('hiBefore', name), false);
  await gWrite(ref, sha + '\n'); await gWrite('HEAD', 'ref: ' + ref + '\n');
  await flushZip();
}
async function histSwitch(branch) {
  const ref = 'refs/heads/' + branch, sha = await gRef(ref);
  if (!sha) return false;
  return gCheckout((await gCommitOf(sha)).tree, async () => { await gSave(t('hiBefore', refLabel(branch)), false); await gWrite('HEAD', 'ref: ' + ref + '\n'); });
}
async function histRestore(sha) {
  const c = await gCommitOf(sha);
  return gCheckout(c.tree, () => gSave(t('hiBefore', c.msg), false));
}
async function histState() {
  const head = await gHead(), log = head ? await gLog(head.sha) : [];
  return { branch: head && head.ref ? head.ref.replace('refs/heads/', '') : 'main', log, heads: await gRefs('refs/heads/'), tags: await gRefs('refs/tags/') };
}
const revName = c => c.msg.split('\n')[0] + (c.when ? '  ·  ' + c.when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
function unlockPages() { S.cfg.lock = null; markDirty('cfg'); relayout(true); }
async function openHistory() {
  if (!onDisk()) { toast(t('hiNeedFile')); return; }
  if (S.store.bad.length) { toast(t('damagedFirst')); return; }
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
    if (!st.log.length && !st.log.cut) rs.appendChild(h('p', 'hint', t('hiNone')));
    for (const c of st.log) {
      const r = h('div', 'rev'), nm = h('div', 'rn');
      nm.append(h('b', null, c.msg.split('\n')[0]), h('span', null, c.when ? c.when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''));
      r.append(nm, btn(t('hiChanges'), () => { close(); openDiff(c.sha); }), btn(t('hiRestore'), run(async () => { close(); await histRestore(c.sha); toast(t('hiRestored', c.msg.split('\n')[0])); })));
      rs.appendChild(r);
    }
    if (st.log.cut) rs.appendChild(h('p', 'hint', t('hiCut', st.log.cut.message)));
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
  if (!st.log.length) { toast(st.log.cut ? t('hiErr', st.log.cut.message) : t('hiNone')); return; }
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
    const sn = k => { const i = h('input'); i.type = 'number'; i.value = S.cfg.show[k]; return i; };
    const sw = sn('wpm'), ss = sn('standby'), sg = sn('warning');
    let times = S.cfg.show.times;
    const fg = h('button', 'btn sm', t('shForget', Object.keys(times).length)); fg.type = 'button'; fg.onclick = () => { times = {}; fg.disabled = true; };
    const tb = h('button', 'btn sm', t('tplManage') + ' (' + S.templates.size + ')'); tb.type = 'button'; tb.onclick = () => { close(); enterTemplates(); };
    body.append(h('label', null, t('showTitle')), ti, h('label', null, t('paperL')), ps, h('label', null, t('langL')), ls,
      h('label', null, t('templates')), tb, h('label', null, t('tplFade')), fs2, h('label', null, t('gridL')), gs,
      h('label', null, t('paceL')), sw, ...(Object.keys(times).length ? [h('label'), fg] : []), h('label', null, t('standbyL')), ss, h('label', null, t('warningL')), sg, h('label', null, t('deptsL')));
    const list = h('div'); body.appendChild(list);
    const addRow = d => {
      const r = h('div', 'drow'), c = h('input'), n = h('input'), col = h('input'), x = h('button', 'btn sm', '\u2715'), rv = h('label', 'chk'), cb = h('input'), cl = h('label', 'chk'), cc = h('input');
      c.type = 'text'; n.type = 'text'; col.type = 'color'; x.type = 'button';
      c.value = d.code; n.value = d.name; col.value = /^#[0-9a-f]{6}$/i.test(d.colour) ? d.colour : '#888888';
      cb.type = 'checkbox'; cb.checked = !!d.review; rv.append(cb, t('deptReview')); rv.title = t('deptReviewTip');
      cc.type = 'checkbox'; cc.checked = !!d.cast; cl.append(cc, t('deptCast')); cl.title = t('deptCastTip');
      x.onclick = () => r.remove(); r.append(c, n, col, rv, cl, x); r.dept = d; list.appendChild(r);
    };
    S.cfg.departments.forEach(addRow);
    const ab = h('button', 'btn sm', t('addDept')); ab.type = 'button'; ab.onclick = () => addRow({ code: '', name: '', colour: '#2a9d8f' }); body.appendChild(ab);
    body.appendChild(h('p', 'hint', t('deptHint')));
    dlgBtn(foot, t('cancel'), '', close);
    dlgBtn(foot, t('save'), 'pri', () => {
      const deps = $$('.drow', list).map(r => { const i = $$('input', r); return Object.assign({}, r.dept, { code: i[0].value, name: i[1].value, colour: i[2].value, review: i[3].checked, cast: i[4].checked }); });   // with the fields this release does not know
      const paperChanged = ps.value !== S.cfg.paper;
      S.cfg = normCfg(Object.assign({}, S.cfg, { title: inScript ? S.cfg.title : ti.value.trim(), paper: ps.value, departments: deps, templateFade: +fs2.value, boardGrid: +gs.value, show: Object.assign({}, S.cfg.show, { wpm: sw.value, standby: ss.value, warning: sg.value, times }) }));
      if (ls.value !== LANG) { LANG = ls.value; savePrefs(); applyLang(); }
      close();
      if (paperChanged) S.meas = new Map();
      applyPaper();
      markDirty('cfg'); relayout(true);
      if (S.mode === 'templates') renderTemplates();
    });
  }, true);
}

/* ---------- cast: the reader for the actors, with the show inside ---------- */
const CAST_APP = "/*CAST*/";   // src/cast.html as built; build.py writes it here
function castHTML(pack) { return CAST_APP.replace('/*PACK*/', () => JSON.stringify(pack).replace(/</g, '\\u003c')); }
function openCast() {
  openDlg(t('caTitle'), (body, foot, close) => {
    const fill = () => {
      body.textContent = ''; foot.textContent = '';
      body.appendChild(h('p', 'hint', t('caHint')));
      if (!S.cfg.departments.some(d => d.cast)) {
        body.appendChild(h('p', 'hint', t('caNoDept')));
        const ab = h('button', 'btn sm', t('caAddDept')); ab.type = 'button';
        ab.onclick = () => {
          let code = 'NOTE'; for (let n = 2; deptOf(code); n++) code = 'NOTE' + n;
          S.cfg.departments.push({ code, name: t('caDeptName'), colour: '#0f8b8d', review: true, cast: true });
          markDirty('cfg'); relayout(true); fill();
        };
        body.appendChild(ab);
      } else {
        const notes = castPack().notes, by = new Map();
        for (const n of notes) for (const w of n.to.length ? n.to : [t('caEveryone')]) by.set(w, (by.get(w) || 0) + 1);
        body.appendChild(h('p', null, notes.length ? t('caCount', notes.length) : t('caNone')));
        if (notes.length) body.appendChild(h('p', null, Array.from(by, q => q[0] + ' ×' + q[1]).join('  ·  ')));
      }
      const name = slug(titleOf() || S.store.name || 'show');
      const save = (label, cls, file, make) => { const bt = h('button', 'btn' + cls, label); bt.type = 'button'; bt.style.cssText = 'display:block;width:100%;margin:0 0 8px'; bt.onclick = () => {
        if (!S.cfg.castId) { S.cfg.castId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); markDirty('cfg'); }   // from the first file on, the actors' notes are kept under this
        download(name + file, make(castPack())); close();
      };
      body.appendChild(bt); };
      save(t('caSaveHtml'), ' pri', '-cast.html', p => new Blob([castHTML(p)], { type: 'text/html' }));
      save(t('caSaveJson'), '', '.cast.json', p => new Blob([JSON.stringify(p)], { type: 'application/json' }));
      body.appendChild(h('p', 'hint', t('caJsonHint')));
      dlgBtn(foot, t('close'), '', close);
    };
    fill();
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
function savePrefs() { try { localStorage.setItem('promptbook:view', JSON.stringify({ facing: (S.show.keep || S.view).facing, cues: S.view.cues, ink: S.view.ink, night: S.view.night, finger: S.tool.finger, lang: LANG })); } catch (e) { /* ignore */ } }
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
  const fw = S.show.on && S.show.follow;
  sizeWrap(); desk.scrollTop = a * desk.scrollHeight; renderVisible(); applyView();
  if (fw) showBack();
}
function buildMenu() {
  const m = $('#menu'); m.textContent = '';
  const add = (label, fn, off) => { const b = h('button', null, label); b.type = 'button'; b.disabled = !!off; b.onclick = () => { m.hidden = true; fn(); }; m.appendChild(b); };
  const fs = !!window.showOpenFilePicker;
  add(t('mText'), () => openTextDialog(false), !S.loaded);
  add(t('mSettings'), openSettings, !S.loaded);
  add(t('mTemplates'), () => { if (S.mode === 'templates') exitTemplates(); else enterTemplates(); }, !S.loaded);
  add(t('mHistory'), openHistory, !S.loaded);
  add(t('mCast'), openCast, !S.loaded);
  add(t('mExport'), exportBundle, !S.loaded);
  add(t('mImport'), importBundle);
  add(t('keys'), openKeys);
  add(t('mSaveTo'), saveToZip, !window.showSaveFilePicker || !S.loaded);
  add(t('mOpen'), () => openZipFile(), !fs);
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
  $('#bShow').onclick = showOn; $('#shPlay').onclick = showToggle; $('#shBack').onclick = showBack; $('#shLeave').onclick = showLeave;
  const pace = d => () => { showTempo(S.show.tempo + d); showTick(); };   // of the night: the line against the times
  $('#shSlow').onclick = pace(-0.05); $('#shFast').onclick = pace(0.05);
  $('#shUse').onclick = () => { showTempo(showMeasured()); S.show.cal = { want: 0, ms: 0 }; showTick(); };
  $('#shLearn').onclick = () => { S.show.learn = !S.show.learn; S.show.last = null; showTick(); };
  $('#shDn').onclick = () => { showNudge(-5); showTick(); }; $('#shUp').onclick = () => { showNudge(5); showTick(); };
  $('#shUndo').onclick = () => { showUnlearn(); showTick(); };
  $('#shRest').onclick = () => { showRest(showStats().wpm); showTick(); };
  $('#shCalls').addEventListener('pointerdown', e => { const c = e.target.closest('.call[data-n]'); if (c) showPeek(+c.dataset.n); });   // the cards are built again every second: a click could lose its target
  $('#shNight').onclick = () => $('#bNight').click();
  $('#shProg').onclick = e => { const r = $('#shProg').getBoundingClientRect(); showLook((e.clientY - r.top) / r.height); };
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
  ['+ \u2212', 'kZoom'], ['0', 'kFit'], ['PgDn PgUp', 'kPage'], ['Home End', 'kEnds'], ['Del', 'kDel'], ['Esc', 'kEsc'], ['S', 'kShow'], ['?', 'keys']
];
/* the keys of show mode: ? lists only the ones of the mode the book is in */
const KEYS_SHOW = [
  ['Space', 'kShPlay'], ['Enter', 'kShBack'], ['\u2193 \u2191', 'kShStep'], ['[ ]', 'kShPace'],
  ['C', 'cuesTip'], ['I', 'inkTip'], ['N', 'night'], ['L', 'cueList'],
  ['+ \u2212', 'kZoom'], ['0', 'kFit'], ['PgDn PgUp', 'kPage'], ['Home End', 'kEnds'], ['S', 'kShLeave'], ['?', 'keys']
];
let keysClose = null;
function openKeys() {
  keysClose = openDlg(t('keys'), (body, foot, close) => {
    const tb = h('table', 'keys');
    for (const [ks, s] of (S.show.on ? KEYS_SHOW : KEYS)) {
      const r = h('tr'), d = h('td');
      for (const x of ks.split(' ')) d.appendChild(h('kbd', null, x));
      r.append(d, h('td', null, t(s))); tb.appendChild(r);
    }
    body.append(tb, h('p', 'hint', t(S.show.on ? 'kShHint' : 'kHint')));
    dlgBtn(foot, t('close'), 'pri', () => { keysClose = null; close(); });
  }, true);
}
const focusFind = () => { $('#search').focus(); $('#search').select(); };
const press = id => () => $(id).click();
const KEYMAP = {
  b: press('#bFacing'), c: press('#bCues'), i: press('#bInk'), n: press('#bNight'), e: press('#bErase'), f: press('#bFinger'),
  l: press('#bList'), r: press('#bReview'), s: press('#bShow'), '+': () => setZoom(1.15), '=': () => setZoom(1.15), '-': () => setZoom(1 / 1.15), '0': () => setZoom(0),
  '/': focusFind, '?': openKeys, pagedown: () => pageStep(1), pageup: () => pageStep(-1),
  home: () => { desk.scrollTop = 0; }, end: () => { desk.scrollTop = desk.scrollHeight; }
};
/* show mode has keys of its own, and of the others only those that change nothing in the show */
const SHOWKEYS = {
  ' ': () => showToggle(), enter: () => showBack(), arrowdown: () => showStep(1), arrowup: () => showStep(-1),
  '[': () => $('#shSlow').click(), ']': () => $('#shFast').click(), s: () => showLeave()
};
for (const k of ['c', 'i', 'n', 'l', '+', '=', '-', '0', '?', 'pagedown', 'pageup', 'home', 'end']) SHOWKEYS[k] = KEYMAP[k];
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
  if (S.show.on) {
    const fn = !mod && !e.altKey && !e.isComposing && SHOWKEYS[k];
    if (fn) { e.preventDefault(); if (a && a.blur && a !== document.body) a.blur(); fn(); }   // Space must not press the button that has the focus
    return;
  }
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
  if (!S.loaded || S.editing || S.show.on || S.mode === 'templates' || !$('#dlg').hidden) return;
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
  const fs = !!window.showOpenFilePicker;
  const add = (label, fn, pri) => { const b = h('button', 'btn' + (pri ? ' pri' : ''), label); b.type = 'button'; b.onclick = fn; card.appendChild(b); return b; };
  el.appendChild(card);
  const last = fs ? await idbGet('dir') : null;
  const again = last && last.kind === 'file';   // a show folder remembered by an older release is not offered
  if (again) add(t('reopen', showName(last)), () => openZipFile(last), true);
  add(t('openFile'), () => openZipFile(), !again).disabled = !fs;
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
window.PB = { S, VERSION, parseScript, analyze, stripTokens, serialize, commitText, openZipFile, saveToZip, readZip, zipAside, buildZip, startMemory, loadBundle, saveNow, bundle, inkFile, collectCues, reviewData, parseMeta, castCheck, fullName, relayout, renderAll, jumpTo, enterTemplates, exitTemplates, t,
  showOn, showOff, showLeave, showNow, showSet, showPlay, showHere, showCalls, showTick, showBack, showMeasured, showSeg, showTl, showT, showP, showClock, showStats, showTempo,
  openHistory, openDiff, histSave, histVariant, histSwitch, histRestore, histState, unlockPages, parseBlocks, diffBlocks, diffFor, doPrint, textMoveBlocks, castPack, castHTML, openCast };
init();
