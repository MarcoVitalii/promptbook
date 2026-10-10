/* =====================================================================
   Promptbook Cast: the script for the actors
   Joined after core.js, which gives the strings, the helpers and the parser. Three layers:
   text   : the script as sent, never changed here
   notes  : what the stage manager or the director sent with it, replaced by every new file
   own    : the actor's part, read marks and notes, kept on this device and laid over whatever text arrives
   Notes of both kinds sit in the margin beside their block, so the text is as long with them as without.
   ===================================================================== */
const C = { pack: null, blocks: [], els: [], meta: null, names: new Map(), notes: [], key: '',
  st: { chars: [], hide: false, own: [], read: [], when: '', seen: [], changed: [] },
  sel: -1, open: new Set(), all: false, older: false, news: false, noStore: false, view: { size: 17, night: false } };
const LS = 'promptbook-cast:';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(LS + k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const saveState = () => { if (C.pack && !lsSet(C.key, C.st)) C.noStore = true; };
const saveView = () => lsSet('view', { size: C.view.size, night: C.view.night, lang: LANG });
/* the actor's layer is found by the id the prompt book gave the show; a file without one, by its title */
const keyOf = p => 'show:' + (p && typeof p.show === 'string' && p.show ? p.show : hash(normName((p && p.title) || '')));
/* what an own note holds on to, and what tells a line from the one of the file before: the speaker and the words */
const blockKey = b => (b.name || '') + '\u0001' + b.plain;
const isMine = b => b.type === 'speech' && C.st.chars.includes(b.name);
/* a note with nobody named is for everyone; until a part is ticked, every note is shown */
const forMe = n => !n.to.length || !C.st.chars.length || n.to.some(w => C.st.chars.includes(w));
const shown = n => C.all || forMe(n);
const isRead = n => C.st.read.includes(n.id);
const unread = () => C.notes.filter(n => forMe(n) && !isRead(n)).length;
const ownAt = i => C.st.own.filter(n => n.idx === i);
const snip = s => s && s.length > 60 ? s.slice(0, 60) + '…' : s || '';
const day = s => new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
let toastT = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }

/* ---------- show ---------- */
function usePack(p) {
  if (!p || p.format !== 'promptbook-cast' || typeof p.script !== 'string') throw new Error(t('acBad'));
  if (p.version > 1) throw new Error(t('acNewer'));
  C.pack = p; C.blocks = parseScript(p.script).map(analyze);
  C.meta = C.blocks.length && C.blocks[0].type === 'meta' ? C.blocks[0].meta : null;
  C.names = new Map();
  for (const b of C.blocks) if (b.type === 'speech') { b.name = fullName(b.head.name, C.meta); C.names.set(b.name, (C.names.get(b.name) || 0) + 1); }
  const last = Math.max(0, C.blocks.length - 1);
  C.notes = (Array.isArray(p.notes) ? p.notes : []).filter(n => n && typeof n.text === 'string').map(n => ({
    id: String(n.id), from: String(n.from || ''), colour: /^#[0-9a-f]{6}$/i.test(n.colour) ? n.colour : '',
    to: Array.isArray(n.to) ? n.to.map(normName) : [], text: n.text, block: clamp(n.block | 0, 0, last) }));
  C.key = keyOf(p);
  const st = lsGet(C.key) || {}, arr = v => Array.isArray(v) ? v : [];
  C.st = { chars: arr(st.chars).filter(n => C.names.has(n)), hide: !!st.hide, read: arr(st.read).map(String),
    own: arr(st.own).filter(n => n && typeof n.text === 'string' && typeof n.key === 'string'),
    when: typeof st.when === 'string' ? st.when : '', seen: arr(st.seen), changed: arr(st.changed) };
  C.sel = -1; C.open = new Set();
  takeOver();
}
/* A new file meets what the actor has. Own notes follow their lines (anchorOwn); the lines that are not
   those of the file before are marked until the next one. An older file is shown, and nothing kept changes. */
function takeOver() {
  const st = C.st, when = String(C.pack.when || '');
  C.older = !!st.when && when < st.when; C.news = false;
  anchorOwn(!C.older);
  if (C.older || when === st.when) return;
  const keys = C.blocks.filter(b => b.type !== 'meta' && b.plain).map(b => hash(blockKey(b)));
  if (st.when) { const was = new Set(st.seen); st.changed = keys.filter(k => !was.has(k)); C.news = true; } else st.changed = [];
  st.seen = keys; st.when = when;
  saveState();
}
/* Own notes follow their line into a new text: the same line nearest to where it was, else the most
   similar line of the same speaker, flagged for a look; else the note is kept aside with the words it was on. */
function anchorOwn(keep) {
  const where = new Map();
  C.blocks.forEach((b, i) => { const k = blockKey(b), q = where.get(k); if (q) q.push(i); else where.set(k, [i]); });
  for (const n of C.st.own) {
    const q = where.get(n.key);
    if (q) { n.idx = q.reduce((a, i) => Math.abs(i - n.idx) < Math.abs(a - n.idx) ? i : a, q[0]); continue; }
    const [name, plain] = n.key.split('\u0001'); let best = -1, bs = 0;
    C.blocks.forEach((b, i) => { if ((b.name || '') !== name || !b.plain) return; const sc = similarity(b.plain, plain || ''); if (sc > bs) { bs = sc; best = i; } });
    if (best >= 0 && bs >= 0.5) { n.idx = best; if (keep) { n.key = blockKey(C.blocks[best]); n.moved = true; } } else n.idx = -1;
  }
}
function addOwn(i, text) {
  C.st.own.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, key: blockKey(C.blocks[i]), idx: i, when: new Date().toISOString() });
}

/* ---------- text ---------- */
function lineEl(b) {
  const ln = h('span', 'ln');
  b.tokens.forEach(q => {
    if (q.k === 'sp') ln.append(' ');
    else if (q.k === 'br') ln.appendChild(h('br'));
    else if (q.k === 'x') ln.appendChild(h('span', 'it', q.text));
    else if (q.k === 'w') { if (q.it) ln.appendChild(h('span', 'it', q.text)); else ln.append(q.text); }
  });
  return ln;
}
function metaEl(b) {
  const el = h('div', 'meta');
  for (const l of b.meta.lines) el.appendChild(h('div', l.big ? 'big' : '', l.text));
  if (b.meta.chars.length) {
    const cw = h('div', 'chars');
    for (const c of b.meta.chars) { const r = h('div', null, c.name); if (c.desc) r.appendChild(h('i', null, ' — ' + c.desc)); cw.appendChild(r); }
    el.appendChild(cw);
  }
  return el;
}
function noteEl(n) {
  const el = h('div', 'note in' + (isRead(n) ? ' read' : '')), tx = h('div', 'nt');
  if (n.colour) el.style.setProperty('--c', n.colour);
  tx.appendChild(h('span', 'nh', n.from + (n.to.length ? ' · ' + t('acTo', n.to.join(', ')) : '')));
  tx.append(n.text); el.appendChild(tx);
  return el;
}
/* The margin of a block: on a wide screen its notes as cards, on a phone one round button with their
   number. It is laid over the page (layoutSide), so it never adds to the height of the text. */
function sideEl(i) {
  const got = C.notes.filter(n => n.block === i && shown(n)), own = ownAt(i), n = got.length + own.length;
  if (!n && C.sel !== i) return null;
  const sd = h('div', 'side'), fresh = got.find(q => !isRead(q)), dot = h('button', 'dot' + (fresh ? ' new' : '') + (n ? '' : ' plus'), n ? String(n) : '+');
  dot.type = 'button'; dot.title = t('acLine'); dot.style.setProperty('--c', (fresh || got[0] || {}).colour || 'var(--mine)');
  sd.appendChild(dot);
  for (const q of got) sd.appendChild(noteEl(q));
  for (const q of own) sd.appendChild(h('div', 'note own' + (q.moved ? ' moved' : ''), q.text));
  if (C.sel === i) sd.appendChild(h('button', 'add', t('acAdd'))).type = 'button';
  return sd;
}
function blockEl(i) {
  const b = C.blocks[i];
  if (b.type === 'meta') return metaEl(b);
  if (b.type === 'note' || b.type === 'mark') return null;
  const el = h('div', 'b ' + (b.type === 'h' ? 'h' + b.level : b.type) + (isMine(b) ? ' mine' : '') + (C.open.has(i) ? ' open' : '') + (C.sel === i ? ' sel' : '')
    + (C.st.changed.length && b.plain && C.st.changed.includes(hash(blockKey(b))) ? ' chg' : ''));
  el.dataset.i = i;
  if (b.type === 'speech') { const nm = h('div', 'nm', b.name); if (b.simul) nm.appendChild(h('small', null, t('together'))); el.appendChild(nm); }
  const tx = h('div', 'tx'); tx.appendChild(lineEl(b)); el.appendChild(tx);
  const sd = sideEl(i); if (sd) el.appendChild(sd);
  return el;
}
/* margins one under the other: a block's notes start beside it, or under the notes of the block before */
function layoutSide() {
  let bottom = -1e9;
  for (const el of C.els) {
    const sd = el && el.lastElementChild; if (!sd || !sd.classList.contains('side')) continue;
    const top = el.offsetTop, d = Math.max(0, bottom + 6 - top);
    sd.style.top = d + 'px'; bottom = top + d + sd.offsetHeight;
  }
}
function refresh() {
  for (const i of new Set(arguments)) {
    const old = C.els[i]; if (i < 0 || !old) continue;
    const el = blockEl(i); old.replaceWith(el); C.els[i] = el;
  }
  layoutSide();
}
function render() {
  const tx = $('#text'); tx.textContent = ''; C.els = [];
  tx.classList.toggle('hide', !!(C.pack && C.st.hide));
  if (!C.pack) {
    const card = h('div', 'card'); card.append(h('h1', null, 'Promptbook'), h('div', 'hint', t('acApp') + ' · ' + VERSION), h('p', 'hint', t('acStart')));
    const ob = h('button', 'btn pri', t('acOpen')); ob.type = 'button'; ob.onclick = pickFile;
    const lb = h('button', 'btn', t('acLang')); lb.type = 'button'; lb.onclick = switchLang;
    card.append(ob, lb); tx.appendChild(card);
  } else C.blocks.forEach((b, i) => { const el = blockEl(i); C.els[i] = el; if (el) tx.appendChild(el); });
  updBar(); layoutSide();
}
function updBar() {
  const on = !!C.pack, title = on ? C.pack.title || t('untitled') : 'Promptbook';
  document.title = title; $('#ttl').textContent = title; document.documentElement.lang = LANG;
  document.body.classList.toggle('night', C.view.night);
  document.documentElement.style.setProperty('--fs', C.view.size + 'px');
  const ol = $('#outline'); ol.textContent = ''; ol.hidden = !on;
  const o0 = h('option', null, t('jumpTo')); o0.value = ''; ol.appendChild(o0);
  C.blocks.forEach((b, i) => { if (b.type !== 'h') return; const o = h('option', null, (b.level > 1 ? ' ' : '') + b.title); o.value = i; ol.appendChild(o); });
  for (const id of ['#bPart', '#bHide', '#bNotes']) $(id).hidden = !on;
  $('#bPart').textContent = t('acPart') + (C.st.chars.length ? ': ' + C.st.chars[0] + (C.st.chars.length > 1 ? ' +' + (C.st.chars.length - 1) : '') : '');
  const hb = $('#bHide'); hb.textContent = t('acHide'); hb.title = t('acHideTip'); hb.classList.toggle('on', on && C.st.hide);
  const nb = $('#bNotes'), n = on ? unread() : 0; nb.textContent = t('acNotes');
  if (n) nb.appendChild(h('b', null, String(n)));
  $('#bMore').title = t('menu');
}
function jump(i) { const el = C.els[i]; if (el) el.scrollIntoView({ block: 'start' }); }
function select(i) { const was = C.sel; C.sel = i; refresh(was, i); }
function setHide(v) {
  if (v && !C.st.chars.length) { toast(t('acPickFirst')); openPart(); return; }
  C.st.hide = !!v; C.open = new Set(); saveState(); render();
}

/* ---------- sheets ---------- */
function closeSheet() { const s = $('#sheet'); s.hidden = true; s.textContent = ''; }
function openSheet(title, build) {
  const s = $('#sheet'); s.textContent = ''; s.hidden = false;
  const box = h('div', 'box'), hd = h('header'), body = h('div', 'body'), x = h('button', 'btn', '✕');
  x.type = 'button'; x.title = t('close'); x.onclick = closeSheet;
  hd.append(h('span', 'grow', title), x); box.append(hd, body); s.appendChild(box);
  s.onclick = e => { if (e.target === s) closeSheet(); };
  build(body);
}
function sheetBtn(parent, label, cls, fn) { const bt = h('button', 'btn' + (cls ? ' ' + cls : ''), label); bt.type = 'button'; bt.onclick = fn; parent.appendChild(bt); return bt; }
/* one box per speaker name as the script writes it, so a chorus or "ANNA e MARCO" is ticked like a character */
function openPart() {
  openSheet(t('acPart'), body => {
    body.appendChild(h('p', 'hint', C.names.size ? t('acPartHint') : t('acNoSpeak')));
    for (const [name, n] of C.names) {
      const lb = h('label', 'pick'), cb = h('input'); cb.type = 'checkbox'; cb.checked = C.st.chars.includes(name);
      cb.onchange = () => {
        const set = new Set(C.st.chars); if (cb.checked) set.add(name); else set.delete(name);
        C.st.chars = Array.from(C.names.keys()).filter(k => set.has(k));
        if (!C.st.chars.length) C.st.hide = false;
        saveState(); render();
      };
      lb.append(cb, h('span', null, name), h('small', null, '×' + n)); body.appendChild(lb);
    }
  });
}
/* everything on one line: what was sent (tick = read), my notes, a new one, and my notes that lost their line */
function openLine(i) {
  const b = C.blocks[i]; if (!b) return;
  openSheet(snip(b.plain), body => {
    const done = () => { saveState(); refresh(i); updBar(); fill(); };
    const editor = (n, focus) => {
      const ed = h('div', 'ed'), ta = h('textarea'), row = h('div', 'acts');
      ta.placeholder = t('acNotePh'); ta.value = n ? n.text : '';
      if (n && n.moved) ed.appendChild(h('p', 'hint warn', t('acMoved')));
      sheetBtn(row, t('save'), 'pri', () => {
        const text = ta.value.trim();
        if (n) { if (text) { n.text = text; delete n.moved; } else rm(C.st.own, n); } else if (text) addOwn(i, text); else return;
        done(); if (C.noStore) toast(t('acNoStore'));
      });
      if (n) sheetBtn(row, t('del'), '', () => { rm(C.st.own, n); done(); });
      ed.append(ta, row); body.appendChild(ed);
      if (focus) setTimeout(() => ta.focus({ preventScroll: true }), 0);
    };
    const fill = () => {
      body.textContent = '';
      for (const n of C.notes.filter(q => q.block === i && shown(q))) {
        const el = noteEl(n), ok = h('button', null, '✓'); ok.type = 'button'; ok.title = t('acRead');
        ok.onclick = () => { if (rm(C.st.read, n.id) < 0) C.st.read.push(n.id); done(); };
        el.appendChild(ok); body.appendChild(el);
      }
      const own = ownAt(i);
      body.appendChild(h('h3', null, t('acMine')));
      for (const n of own) editor(n, false);
      editor(null, !own.length);
      const lost = C.st.own.filter(n => n.idx < 0);
      if (lost.length) body.appendChild(h('h3', null, t('acLost') + ' (' + lost.length + ')'));
      for (const n of lost) {
        const el = h('div', 'item'), row = h('div', 'acts'); el.style.setProperty('--c', 'var(--mine)');
        sheetBtn(row, t('acAttach'), '', () => { n.idx = i; n.key = blockKey(b); delete n.moved; done(); });
        sheetBtn(row, t('del'), '', () => { rm(C.st.own, n); done(); });
        el.append(h('small', null, snip(n.key.split('\u0001')[1])), n.text, row); body.appendChild(el);
      }
    };
    fill();
  });
}
function openNotes() {
  openSheet(t('acNotes'), body => {
    const fill = () => {
      body.textContent = '';
      const chips = h('div', 'chips');
      for (const [all, label] of [[false, t('acForMe')], [true, t('all')]]) {
        const ch = h('button', 'chip' + (C.all === all ? ' on' : ''), label); ch.type = 'button';
        ch.onclick = () => { C.all = all; render(); fill(); };
        chips.appendChild(ch);
      }
      body.appendChild(chips);
      const line = i => C.blocks[i] ? snip(C.blocks[i].plain) : '';
      const item = (cls, colour, head, text, i) => {
        const bt = h('button', 'item' + cls); bt.type = 'button'; if (colour) bt.style.setProperty('--c', colour);
        bt.append(h('small', null, head), text); bt.onclick = () => { closeSheet(); jump(i); };
        body.appendChild(bt);
      };
      const got = C.notes.filter(shown).sort((a, b) => a.block - b.block), mine = C.st.own.filter(n => n.idx >= 0).sort((a, b) => a.idx - b.idx), lost = C.st.own.filter(n => n.idx < 0);
      if (!got.length && !mine.length && !lost.length) body.appendChild(h('p', 'hint', t('acNoNotes')));
      if (got.length) body.appendChild(h('h3', null, t('acGot') + ' (' + got.length + ')'));
      for (const n of got) item(isRead(n) ? ' read' : '', n.colour, n.from + (n.to.length ? ' · ' + t('acTo', n.to.join(', ')) : '') + ' · ' + line(n.block), n.text, n.block);
      if (mine.length) body.appendChild(h('h3', null, t('acMine') + ' (' + mine.length + ')'));
      for (const n of mine) item('', 'var(--mine)', line(n.idx), n.text, n.idx);
      if (lost.length) { body.appendChild(h('h3', null, t('acLost') + ' (' + lost.length + ')')); body.appendChild(h('p', 'hint', t('acLostHint'))); }
      for (const n of lost) {
        const el = h('div', 'item'), row = h('div', 'acts'); el.style.setProperty('--c', 'var(--mine)');
        sheetBtn(row, t('del'), '', () => { rm(C.st.own, n); saveState(); fill(); });
        el.append(h('small', null, snip(n.key.split('\u0001')[1])), n.text, row); body.appendChild(el);
      }
    };
    fill();
  });
}
/* shown when a newer file of a show already on this device is opened: what the actor should look at */
function openNews() {
  openSheet(t('acNews'), body => {
    body.appendChild(h('p', 'hint', t('acNewsFile', day(C.pack.when))));
    const mineChg = [], n = unread(), moved = C.st.own.filter(q => q.moved && q.idx >= 0), lost = C.st.own.filter(q => q.idx < 0).length;
    const chg = new Set(C.st.changed); let all = 0;
    C.blocks.forEach((b, i) => { if (!b.plain || !chg.has(hash(blockKey(b)))) return; all++; if (isMine(b)) mineChg.push(i); });
    const jumpBtn = (label, i) => sheetBtn(body, label, 'wide', () => { closeSheet(); jump(i); });
    if (n) sheetBtn(body, t('acNewsNotes', n), 'wide pri', openNotes);
    if (all) body.appendChild(h('h3', null, t('acNewsLines', all, mineChg.length)));
    for (const i of mineChg.slice(0, 40)) jumpBtn(snip(C.blocks[i].plain), i);
    if (moved.length) body.appendChild(h('h3', null, t('acNewsMoved', moved.length)));
    for (const q of moved) jumpBtn(q.text, q.idx);
    if (lost) sheetBtn(body, t('acNewsLost', lost), 'wide', openNotes);
    if (!n && !all && !moved.length && !lost) body.appendChild(h('p', null, t('acNewsNone')));
  });
}
function openMore() {
  openSheet(C.pack ? C.pack.title || t('untitled') : 'Promptbook', body => {
    const row = () => { const r = h('div', 'mrow'); body.appendChild(r); return r; };
    if (C.noStore) body.appendChild(h('p', 'hint warn', t('acNoStore')));
    sheetBtn(row(), t('acOpen'), '', () => { closeSheet(); pickFile(); });
    const sz = row(); sz.appendChild(h('span', 'grow', t('acSize')));
    const size = d => { C.view.size = clamp(C.view.size + d, 13, 26); saveView(); updBar(); layoutSide(); };
    sheetBtn(sz, 'A−', 'sq', () => size(-1)); sheetBtn(sz, 'A+', 'sq', () => size(1));
    sheetBtn(row(), t('night'), '', () => { C.view.night = !C.view.night; saveView(); updBar(); });
    if (C.pack) { const r = row(); sheetBtn(r, t('acExport'), '', exportNotes); sheetBtn(r, t('acImport'), '', () => { closeSheet(); pickFile(); }); }
    if (C.pack) sheetBtn(row(), t('acNews'), '', openNews);
    sheetBtn(row(), t('acLang'), '', () => { closeSheet(); switchLang(); });
    if (C.pack) body.appendChild(h('p', 'hint', t('acSent', day(C.pack.when)) + ' · ' + t('acApp') + ' ' + VERSION));
  });
}
function switchLang() { LANG = LANG === 'it' ? 'en' : 'it'; saveView(); render(); }

/* ---------- files ---------- */
function download(name, blob) {
  const a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function exportNotes() {
  const o = { format: 'promptbook-cast-notes', version: 1, show: C.pack.show || '', title: C.pack.title, when: new Date().toISOString(), chars: C.st.chars, read: C.st.read, own: C.st.own };
  download((C.pack.title || 'show').replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() + '.my-notes.json', new Blob([JSON.stringify(o)], { type: 'application/json' }));
  closeSheet();
}
/* A .cast.json file, a cast .html file with the show inside, or the notes exported from another device.
   A file older than the one this device already took over is opened only after a yes; sure skips the question. */
function readCastFile(text, sure) {
  let s = String(text).trim();
  if (s[0] !== '{') {
    const a = s.indexOf('id="pack">'), z = a < 0 ? -1 : s.indexOf('<' + '/script', a);
    if (z < 0) throw new Error(t('acBad'));
    s = s.slice(a + 10, z).trim();
  }
  let o; try { o = JSON.parse(s); } catch (e) { throw new Error(t('acBad')); }
  if (o && o.format === 'promptbook-cast-notes' && C.pack) {
    const have = new Set(C.st.own.map(n => n.id)), add = (Array.isArray(o.own) ? o.own : []).filter(n => n && typeof n.text === 'string' && typeof n.key === 'string' && !have.has(n.id));
    C.st.own.push(...add);
    for (const n of Array.isArray(o.chars) ? o.chars : []) if (C.names.has(n) && !C.st.chars.includes(n)) C.st.chars.push(n);
    for (const id of Array.isArray(o.read) ? o.read : []) if (!C.st.read.includes(String(id))) C.st.read.push(String(id));
    anchorOwn(true); saveState(); render(); toast(t('acImported', add.length));
    return;
  }
  const had = o && o.format === 'promptbook-cast' ? lsGet(keyOf(o)) : null;
  if (!sure && had && typeof had.when === 'string' && String(o.when || '') < had.when && !confirm(t('acOlderAsk', day(had.when)))) return;
  usePack(o); lsSet('pack', o); render(); $('#text').scrollTop = 0;
  if (C.news) openNews(); else toast(C.older ? t('acOlder', day(C.st.when)) : t('acLoaded', day(o.when)));
}
function pickFile() {
  const fp = $('#filePick'); fp.accept = '.json,.html,.htm,application/json,text/html'; fp.value = '';
  fp.onchange = async () => { const f = fp.files[0]; if (!f) return; try { readCastFile(await f.text()); } catch (e) { toast(e.message); } };
  fp.click();
}

/* ---------- start ---------- */
function bindCast() {
  $('#bPart').onclick = openPart;
  $('#bHide').onclick = () => setHide(!C.st.hide);
  $('#bNotes').onclick = openNotes;
  $('#bMore').onclick = openMore;
  $('#outline').onchange = e => { const v = e.target.value; e.target.value = ''; if (v !== '') jump(+v); };
  window.addEventListener('resize', layoutSide);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (C.sel >= 0) select(-1); } });
  $('#text').addEventListener('click', e => {
    const tg = e.target, el = tg.closest('.b');
    if (!el) { if (C.sel >= 0) select(-1); return; }
    const i = +el.dataset.i;
    if (tg.closest('.side')) { openLine(i); return; }
    /* practising: a tap on a covered line shows it, a tap on a shown one covers it again */
    if (C.st.hide && el.classList.contains('mine') && tg.closest('.ln')) { if (!C.open.delete(i)) C.open.add(i); el.classList.toggle('open', C.open.has(i)); return; }
    select(i === C.sel ? -1 : i);
  });
}
function initCast() {
  const pv = lsGet('view') || {};
  if (pv.size) C.view.size = clamp(+pv.size || 17, 13, 26);
  C.view.night = pv.night === true;
  C.noStore = !lsSet('probe', 1) || lsGet('probe') !== 1;
  let p = null; const raw = $('#pack').textContent.trim();
  if (raw[0] === '{') { try { p = JSON.parse(raw); } catch (e) { p = null; } }
  if (!p) p = lsGet('pack');
  LANG = pv.lang === 'it' || pv.lang === 'en' ? pv.lang : p && (p.lang === 'it' || p.lang === 'en') ? p.lang : /^it/i.test(navigator.language || '') ? 'it' : 'en';
  bindCast();
  if (p) { try { usePack(p); } catch (e) { C.pack = null; toast(e.message); } }
  render();
  if (C.pack && C.news) openNews(); else if (C.pack && C.older) toast(t('acOlder', day(C.st.when)));
}
window.PBC = { C, usePack, render, readCastFile, forMe, unread, openLine, openNews, layoutSide };
initCast();
