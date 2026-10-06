/* =====================================================================
   VIEW
   ===================================================================== */
const desk = $('#desk'), wrap = $('#zoomwrap'), spreads = $('#spreads');

function relayout(force) {
  measure(); paginate(); syncPages(force); updPanels();
}
function syncPages(force) {
  const n = S.pages.length;
  while (S.els.length < n) {
    const sp = h('div', 'spread'), a = h('div', 'page script'), f = h('div', 'page facing');
    sp.append(a, f); spreads.appendChild(sp);
    S.els.push({ sp, a, f, sig: null, fsig: null, done: false, fdone: false, frags: [] });
  }
  while (S.els.length > n) S.els.pop().sp.remove();
  S.pages.forEach((P, i) => {
    const E = S.els[i];
    if (force || E.sig !== P.sig) { E.sig = P.sig; E.done = false; E.a.textContent = ''; E.frags = []; }
    if (force || E.fsig !== P.fsig) { E.fsig = P.fsig; E.fdone = false; E.f.textContent = ''; }
  });
  sizeWrap(); renderVisible();
}
function sizeWrap() {
  const pp = paper(), nw = S.view.facing ? pp.w * 2 + SPREAD_GAP : pp.w;
  if (S.view.fit) S.view.zoom = clamp((desk.clientWidth - 28) / nw, 0.3, 1.6);
  const z = S.view.zoom, nh = S.pages.length * (pp.h + GAP);
  wrap.style.width = Math.ceil(nw * z) + 'px'; wrap.style.height = Math.ceil(nh * z) + 'px';
  spreads.style.width = nw + 'px'; spreads.style.transform = 'scale(' + z + ')';
}
function renderVisible() {
  const n = S.pages.length; if (!n || S.mode === 'templates') return;   // script pages cannot be measured while hidden
  const z = S.view.zoom, unit = (paper().h + GAP) * z, top = desk.scrollTop - wrap.offsetTop;
  const i0 = clamp(Math.floor(top / unit) - 1, 0, n - 1), i1 = clamp(Math.floor((top + desk.clientHeight) / unit) + 1, 0, n - 1);
  for (let i = i0; i <= i1; i++) renderPage(i);
}
function renderPage(i) {
  const E = S.els[i];
  if (!E.done) renderScriptPage(i);
  if (!E.fdone) renderFacing(i);
}
function renderAll() { exitTemplates(); for (let i = 0; i < S.pages.length; i++) renderPage(i); }
let scrollRaf = 0;
desk.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; renderVisible(); }); }, { passive: true });
window.addEventListener('resize', () => { if (S.loaded) { sizeWrap(); renderVisible(); if (S.mode === 'templates') renderTemplates(); } });

function renderScriptPage(i) {
  const P = S.pages[i], E = S.els[i], el = E.a;
  el.textContent = ''; el.dataset.pi = i;
  el.appendChild(h('div', 'phead', [S.cfg.title, P.head].filter(Boolean).join('  —  ')));
  const body = h('div', 'pbody');
  for (const it of P.items) body.appendChild(buildRow(it.g, it.whole ? null : it));
  el.append(body, sv('svg', { class: 'links' }), h('div', 'tags'), sv('svg', { class: 'ink' }), h('div', 'pfoot', String(P.no)));
  E.done = true;
  layoutTags(i); drawInk(i);
}
function pageScale(el) { const w = el.getBoundingClientRect().width; return w ? w / paper().w : 1; }

function layoutTags(i) {
  const E = S.els[i], el = E.a, pr = el.getBoundingClientRect(), z = pageScale(el);
  const tagsEl = $('.tags', el), links = $('.links', el);
  tagsEl.textContent = ''; links.textContent = '';
  const txL = GEO.padL + GEO.nameW + GEO.gap1, txR = txL + (paper().w - FIXED_W), tagX = txR + GEO.gap2;
  const list = [];
  for (const tx of $$('.tx', el)) {
    const b = S.byId.get(+tx.dataset.b); if (!b || !b.cues.length) continue;
    const spans = new Map(); for (const sp of $$('.w', tx)) spans.set(+sp.dataset.i, sp);
    const first = tx.dataset.off === undefined || (tx.dataset.fl || '').includes('f');
    for (const c of b.cues) {
      let x, yc, yb = null;
      const sp = c.wi >= 0 ? spans.get(c.wi) : null;
      if (sp) {
        const rs = sp.getClientRects(); if (!rs.length) continue;
        const r = c.before ? rs[0] : rs[rs.length - 1];
        const k = Math.min(2, b.tokens[c.wi].cues.indexOf(c)) * 1.5;   // which ring of the box this cue is
        x = ((c.before ? r.left : r.right) - pr.left) / z + (c.before ? -1.5 - k : 1.5 + k);
        yc = ((r.top + r.bottom) / 2 - pr.top) / z; yb = (r.bottom - pr.top) / z + 0.75 + k;
      } else if (c.wi < 0 && first) {
        const r = tx.getBoundingClientRect(); x = (r.left - pr.left) / z; yc = (r.top - pr.top) / z + LH / 2;
      } else continue;
      list.push({ b, c, x, yc, yb, mark: false });
    }
  }
  for (const row of $$('.row.mark', el)) {
    const b = S.byId.get(+row.dataset.b); if (!b) continue;
    const r = row.getBoundingClientRect(), yc = ((r.top + r.bottom) / 2 - pr.top) / z;
    for (const c of b.cues) list.push({ b, c, x: txR, yc, mark: true });
  }
  list.sort((a, b) => a.yc - b.yc || a.x - b.x);
  const els = list.map(o => {
    const d = o.c.board ? null : deptOf(o.c.dept);
    const tg = h('button', 'tag' + (o.c.board ? ' btag' : d ? '' : ' unk') + (o.c.end ? ' etag' : '')); tg.type = 'button';
    tg.style.setProperty('--c', cueColour(o.c));
    tg.dataset.b = o.b.id; tg.dataset.s = o.c.s;
    tg.appendChild(h('b', null, o.c.board ? (o.c.label || t('board')) : o.c.dept + (o.c.label ? ' ' + o.c.label : '')));
    if (!o.c.board && o.c.desc) tg.appendChild(h('span', null, ' ' + o.c.desc));
    tg.style.left = tagX + 'px';
    tagsEl.appendChild(tg);
    return tg;
  });
  let bottom = GEO.top - 14;
  const tagY = new Map();
  list.forEach((o, k) => {
    const th = els[k].offsetHeight || 20;
    const top = Math.max(o.yc - th / 2, bottom + 2);
    els[k].style.top = r1(top) + 'px'; bottom = top + th;
    const ty = top + Math.min(th / 2, 10), col = cueColour(o.c);
    tagY.set(o.c, ty);
    const yl = o.yb == null ? o.yc + LH / 2 - 3 : o.yb;   // leaves from the bottom corner of the word's box
    const d = o.mark ? 'M' + r1(txR) + ' ' + r1(o.yc) + 'L' + tagX + ' ' + r1(ty)
      : 'M' + r1(o.x) + ' ' + r1(yl) + 'H' + r1(txR + 3) + 'L' + tagX + ' ' + r1(ty);
    const p = sv('path', { d }); p.style.stroke = col;
    links.appendChild(p);
  });
  /* running rails: a line down the outer margin from a cue's tag to the tag of its end */
  const edge = tagX + GEO.margW;
  for (const s of (S.pages[i].rails || [])) {
    const a = tagY.get(s), z2 = tagY.get(s.endRef), x = edge + 5 + s.lane * 5;
    const y1 = a == null ? GEO.top - 8 : a, y2 = z2 == null ? paper().h - GEO.bot + 8 : z2;
    const d = (a == null ? 'M' + x + ' ' + r1(y1) : 'M' + edge + ' ' + r1(y1) + 'H' + x) + 'V' + r1(y2) + (z2 == null ? '' : 'H' + edge);
    const p = sv('path', { d, class: 'rail' }); p.style.stroke = cueColour(s);
    links.appendChild(p);
  }
}

/* ---------- ink drawing ---------- */
function pathD(pts, fx) {
  const n = pts.length; if (!n) return '';
  const q = fx ? pts.map(fx) : pts;
  let d = 'M' + r1(q[0][0]) + ' ' + r1(q[0][1]);
  if (n === 1) return d + 'l0.1 0';
  for (let i = 1; i < n - 1; i++) {
    const mx = (q[i][0] + q[i + 1][0]) / 2, my = (q[i][1] + q[i + 1][1]) / 2;
    d += 'Q' + r1(q[i][0]) + ' ' + r1(q[i][1]) + ' ' + r1(mx) + ' ' + r1(my);
  }
  return d + 'L' + r1(q[n - 1][0]) + ' ' + r1(q[n - 1][1]);
}
function setStroke(p, colour) { if (colour === BLACK) p.setAttribute('class', 'kblack'); else p.setAttribute('stroke', colour); }
function inFrag(st, fr) {
  if (fr.first && fr.last) return true;
  const y = st.points[0][1] * FS;
  if (y < fr.off) return fr.first;
  if (y >= fr.off + fr.h) return fr.last;
  return true;
}
function drawInk(i) {
  const E = S.els[i]; if (!E || !E.done || S.mode === 'templates') return;
  const el = E.a, svg = $('.ink', el), pr = el.getBoundingClientRect(), z = pageScale(el);
  svg.textContent = ''; $$('.flag', el).forEach(x => x.remove());
  E.frags = [];
  for (const tx of $$('.tx', el)) {
    const id = +tx.dataset.b, b = S.byId.get(id); if (!b) continue;
    const r = tx.getBoundingClientRect(), fl = tx.dataset.fl;
    const fr = { id, b, ox: (r.left - pr.left) / z, oy: (r.top - pr.top) / z, w: r.width / z, h: r.height / z, off: +(tx.dataset.off || 0),
      first: fl === undefined || fl.includes('f'), last: fl === undefined || fl.includes('l') };
    E.frags.push(fr);
    const e = S.ink.get(id); if (!e) continue;
    for (const st of e.strokes) {
      if (!inFrag(st, fr)) continue;
      const p = sv('path', { d: pathD(st.points, q => [fr.ox + q[0] * FS, fr.oy - fr.off + q[1] * FS]), 'stroke-width': r2(st.width * FS) });
      setStroke(p, st.colour); svg.appendChild(p);
    }
    if (fr.first && inkFlag(b)) {
      const f = h('button', 'flag pbtn', '!'); f.type = 'button'; f.dataset.b = id; f.title = t('checkInk');
      f.style.top = r1(fr.oy) + 'px'; el.appendChild(f);
    }
  }
}
function inkChanged() {
  markDirty('ink');
  S.els.forEach((E, i) => { if (E.done) drawInk(i); });
  updReview();
}
function pickFrag(pi, pt) {
  const frs = S.els[pi].frags; let best = null, bd = 1e9;
  for (const fr of frs) {
    const dy = pt[1] < fr.oy ? fr.oy - pt[1] : pt[1] > fr.oy + fr.h ? pt[1] - fr.oy - fr.h : 0;
    const dx = pt[0] < fr.ox ? fr.ox - pt[0] : pt[0] > fr.ox + fr.w ? pt[0] - fr.ox - fr.w : 0;
    const d = dy * 4 + dx;
    if (d < bd) { bd = d; best = fr; }
  }
  return best;
}
function addStroke(b, st) {
  const id = b.id;
  inkEntry(b).strokes.push(st);
  pushHist({
    undo: () => { const e = S.ink.get(id); if (e) { rm(e.strokes, st); if (!e.strokes.length) S.ink.delete(id); } inkChanged(); },
    redo: () => { const nb = S.byId.get(id); if (nb) inkEntry(nb).strokes.push(st); inkChanged(); }
  });
  markDirty('ink'); updReview();
}
function distSeg(px, py, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], wx = px - a[0], wy = py - a[1];
  const L = vx * vx + vy * vy, u = L ? clamp((wx * vx + wy * vy) / L, 0, 1) : 0;
  const dx = a[0] + u * vx - px, dy = a[1] + u * vy - py;
  return dx * dx + dy * dy;
}
function near(pts, x, y, r) {
  const rr = r * r;
  if (pts.length === 1) { const dx = pts[0][0] - x, dy = pts[0][1] - y; return dx * dx + dy * dy <= rr; }
  for (let i = 1; i < pts.length; i++) if (distSeg(x, y, pts[i - 1], pts[i]) <= rr) return true;
  return false;
}

/* ---------- facing page and boards ---------- */
function mkBoard(name, j, tpl) {
  j = j || {};
  return { tpl: !!tpl, name, w: BOARD_W, h: +j.h || 750, image: j.image || null, imageData: j.imageData || null,
    strokes: Array.isArray(j.strokes) ? j.strokes : [], base: typeof j.base === 'string' && j.base ? j.base : null };
}
function ensureBoard(name) {
  let B = S.boards.get(name);
  if (!B) { B = mkBoard(name); S.boards.set(name, B); }
  return B;
}
const imgKey = (B, file) => (B.tpl ? 'templates/' : 'boards/') + (file || B.image);
function boardURL(B) { return B.imageData || (B.image && S.urls.get(imgKey(B))) || null; }
/* the templates a board is drawn on top of, root first; stops at a loop */
function chainOf(B) {
  const out = [], seen = new Set([B]);
  let T = B.base ? S.templates.get(B.base) : null;
  while (T && !seen.has(T)) { out.unshift(T); seen.add(T); T = T.base ? S.templates.get(T.base) : null; }
  return out;
}
function effH(B) { const ch = chainOf(B); return ch.length ? ch[0].h : B.h; }   // a based board takes the shape of its root
function bsig(B) { return B ? [B.name, B.image || '', effH(B), chainOf(B).map(T => T.name + ':' + (T.image || '')).join('>')].join('~') : ''; }
function facingSig(P) { return P.no + '|' + (S.templates.size ? 't' : '') + '|' + P.boards.map(n => n + '=' + bsig(S.boards.get(n))).join(','); }
function drawStrokes(B, g) {
  g.textContent = '';
  for (const st of B.strokes) { const p = sv('path', { d: pathD(st.points), 'stroke-width': st.width }); setStroke(p, st.colour); g.appendChild(p); }
}
/* chain greyed and locked underneath, then the board's own image and ink */
function fillBoard(svg, B) {
  const H = effH(B), ch = chainOf(B);
  svg.textContent = ''; svg.setAttribute('viewBox', '0 0 ' + BOARD_W + ' ' + H);
  const img = X => {
    const url = boardURL(X); if (!url) return null;
    const im = sv('image', { x: 0, y: 0, width: BOARD_W, height: H, preserveAspectRatio: 'xMidYMid meet' }); im.setAttribute('href', url); return im;
  };
  if (ch.length) {
    const g = sv('g', { class: 'bbase' });
    for (const T of ch) { const im = img(T); if (im) g.appendChild(im); const sg = sv('g', { class: 'bstatic' }); drawStrokes(T, sg); g.appendChild(sg); }
    svg.appendChild(g);
  }
  const im = img(B); if (im) svg.appendChild(im);
  const g = sv('g', { class: 'bstrokes' }); svg.appendChild(g); drawStrokes(B, g);
}
function boardFig(B, w, acts) {
  const fig = h('figure', 'board'); fig.dataset.name = B.name; if (B.tpl) fig.dataset.tpl = '1'; fig.style.width = w + 'px';
  const cap = h('div', 'bcap'); cap.appendChild(h('b', null, B.name));
  for (const [act, label] of acts) { const bt = h('button', 'pbtn noprint', label); bt.type = 'button'; bt.dataset.act = act; cap.appendChild(bt); }
  fig.appendChild(cap);
  const svg = sv('svg', { width: w, height: Math.round(w * effH(B) / BOARD_W) }); fillBoard(svg, B); fig.appendChild(svg);
  return fig;
}
function figBoard(fig) { return fig ? (fig.dataset.tpl ? S.templates.get(fig.dataset.name) : S.boards.get(fig.dataset.name)) || null : null; }
/* redraw every figure that shows B, itself or through its chain */
function refreshBoard(B) {
  for (const fig of $$('.board')) { const X = figBoard(fig); if (X && (X === B || chainOf(X).includes(B))) fillBoard($('svg', fig), X); }
}
function dirtyB(B) { markDirty(B.tpl ? 'tpl' : 'board', B.name); }
function boardChanged(B) { refreshBoard(B); dirtyB(B); }
function shapeChanged() { refreshFacing(); if (S.mode === 'templates') renderTemplates(); }
function renderFacing(i) {
  const P = S.pages[i], E = S.els[i], el = E.f, pp = paper();
  el.textContent = ''; el.dataset.pi = i;
  el.appendChild(h('div', 'phead', t('boards') + ' · ' + P.no));
  const body = h('div', 'fbody'); el.appendChild(body);
  const bs = P.boards.map(ensureBoard);
  if (!bs.length) body.appendChild(h('div', 'fempty noprint', t('facingEmpty')));
  else {
    const availW = pp.w - 60, availH = pp.h - GEO.top - GEO.bot, capH = 26, gap = 12;
    const sum = bs.reduce((a, B) => a + availW * effH(B) / BOARD_W, 0);
    const f = Math.min(1, (availH - bs.length * (capH + gap) - 44) / sum);
    for (const B of bs) {
      const acts = S.templates.size ? [['bbase', t('bBase')]] : [];
      acts.push(['bimage', t('bImage')], ['btotpl', t('bToTpl')], ['bclear', t('bClear')], ['bremove', t('bRemove')]);
      body.appendChild(boardFig(B, Math.floor(availW * f), acts));
    }
  }
  const add = h('button', 'addboard pbtn noprint', t('addBoard')); add.type = 'button'; add.dataset.act = 'addboard';
  body.appendChild(add);
  E.fdone = true;
}
function refreshFacing() {
  S.pages.forEach((P, i) => {
    P.fsig = facingSig(P);
    const E = S.els[i]; if (E && E.fsig !== P.fsig) { E.fsig = P.fsig; E.fdone = false; E.f.textContent = ''; }
  });
  renderVisible();
}
function uniqueBoardName() {
  const names = new Set(S.boards.keys());
  for (const b of S.blocks) for (const c of b.cues) if (c.board) names.add(c.label);
  let n = names.size + 1, nm;
  do { nm = t('board') + ' ' + n++; } while (names.has(nm));
  return nm;
}
function newBoard(mkText, init) {
  const name = uniqueBoardName(), dt = S.templates.get(S.cfg.defaultTemplate), def = dt ? null : S.cfg.defaultBoard;
  const B = Object.assign(mkBoard(name, def ? { h: def.h, image: def.image, imageData: def.imageData } : { base: dt ? dt.name : null }), init || {});
  if (B.base) touchRecent(B.base);
  S.boards.set(name, B); markDirty('board', name);
  commitText(mkText(name));
  const b = S.blocks.find(x => x.cues.some(c => c.board && c.label === name));
  if (b) jumpTo(b, true);
  return B;
}
function lastOfGroup(b) { const bs = gBlocks(b.g); return bs[bs.length - 1]; }
function addBoardAfter(b, init) { return newBoard(name => textInsertAfter(S.blocks.indexOf(lastOfGroup(b)), '{BOARD ' + name + '}'), init); }
function addBoardOnPage(pi, init) {
  const P = S.pages[pi], selB = S.sel && S.byId.get(S.sel.id);
  if (selB && P.items.some(it => gBlocks(it.g).includes(selB))) return addBoardAfter(selB, init);
  const it = P.items.find(q => (q.whole || q.first) && !(q.g.kind === 'single' && q.g.b.type === 'h'));
  if (it) { const first = gBlocks(it.g)[0]; return newBoard(name => textInsertBefore(S.blocks.indexOf(first), '{BOARD ' + name + '}'), init); }
  const lastIt = P.items[P.items.length - 1];
  if (lastIt) return addBoardAfter(gBlocks(lastIt.g)[0], init);
  return newBoard(name => textInsertAfter(-1, '{BOARD ' + name + '}'), init);
}
function currentPage() {
  const z = S.view.zoom, unit = (paper().h + GAP) * z;
  return clamp(Math.floor((desk.scrollTop - wrap.offsetTop + desk.clientHeight * 0.3) / unit), 0, Math.max(0, S.pages.length - 1));
}
async function prepImage(file) {
  const bmp = await createImageBitmap(file);
  let w = bmp.width, hh = bmp.height;
  const okType = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (okType && file.size <= 1500000 && Math.max(w, hh) <= 2600) {
    return { blob: file, w, h: hh, ext: file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg' };
  }
  const k = Math.min(1, 2000 / Math.max(w, hh)); w = Math.round(w * k); hh = Math.round(hh * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
  const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, hh); cx.drawImage(bmp, 0, 0, w, hh);
  const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.85));
  return { blob, w, h: hh, ext: 'jpg' };
}
function blobToDataURL(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); }); }
function slug(s) { return String(s).normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'board'; }
async function setBoardImage(B, file) {
  let im;
  try { im = await prepImage(file); } catch (e) { toast(t('errFile')); return; }
  B.h = clamp(Math.round(BOARD_W * im.h / im.w), 250, 1700);
  const fname = slug(B.name) + '-' + Date.now().toString(36) + '.' + im.ext;
  B.image = fname;
  if (S.store.mode === 'folder') {
    try { await writeBlob(B.tpl ? 'templates' : 'boards', fname, im.blob); } catch (e) { saveError(e); }
    S.urls.set(imgKey(B), URL.createObjectURL(im.blob)); B.imageData = null;
  } else B.imageData = await blobToDataURL(im.blob);
  dirtyB(B); shapeChanged();
}
function pickImage(cb) {
  const fp = $('#filePick'); fp.accept = 'image/*'; fp.value = '';
  fp.onchange = () => { const f = fp.files[0]; if (f) cb(f); };
  fp.click();
}
function boardAction(btn, x, y) {
  const act = btn.dataset.act, page = btn.closest('.page');
  if (act === 'addboard') { const pi = +page.dataset.pi; addBoardFlow(init => addBoardOnPage(pi, init), x, y); return; }
  const B = figBoard(btn.closest('.board')); if (!B) return;
  if (act === 'bimage' || act === 'timage') pickImage(f => setBoardImage(B, f));
  else if (act === 'bbase' || act === 'tbase') openBasePop(B, x, y);
  else if (act === 'btotpl') copyToTemplates(B);
  else if (act === 'bclear' || act === 'tclear') {
    if (!B.strokes.length) return;
    const old = B.strokes; B.strokes = [];
    pushHist({ undo: () => { B.strokes = old; boardChanged(B); }, redo: () => { B.strokes = []; boardChanged(B); } });
    boardChanged(B);
  } else if (act === 'bremove') {
    const b = S.blocks.find(q => q.cues.some(c => c.board && c.label === B.name));
    const c = b && b.cues.find(q => q.board && q.label === B.name);
    if (c) removeCue(b.id, c.s);
  } else if (act === 'tname') openTplName(B, x, y);
  else if (act === 'tdefault') { S.cfg.defaultTemplate = S.cfg.defaultTemplate === B.name ? null : B.name; markDirty('cfg'); renderTemplates(); }
  else if (act === 'tchild') newTemplate(B.name);
  else if (act === 'tdelete') deleteTemplate(B);
}

/* ---------- templates: boards kept in the configuration, never in the script ---------- */
function touchRecent(name) {
  const r = S.cfg.recentTemplates; rm(r, name); r.unshift(name); if (r.length > 12) r.length = 12;
  markDirty('cfg');
}
/* two templates may not share a file name, so names are compared the way they are saved */
function tplTaken(nm, except) { const k = slug(nm); for (const T of S.templates.values()) if (T !== except && slug(T.name) === k) return true; return false; }
function uniqueTplName(want) {
  let nm = want, n = 2;
  if (!want) { n = S.templates.size + 1; do { nm = t('template') + ' ' + n++; } while (tplTaken(nm)); return nm; }
  while (tplTaken(nm)) nm = want + ' ' + n++;
  return nm;
}
function dependents(T) {
  const out = [];
  S.templates.forEach(X => { if (X.base === T.name) out.push(X); });
  S.boards.forEach(X => { if (X.base === T.name) out.push(X); });
  return out;
}
function addTemplate(T, at) {
  S.templates.set(T.name, T);
  if (!S.cfg.templates.includes(T.name)) S.cfg.templates.splice(at == null ? S.cfg.templates.length : at, 0, T.name);
  markDirty('tpl', T.name); markDirty('cfg');
}
function newTemplate(base) {
  const T = mkBoard(uniqueTplName(''), { base }, true);
  addTemplate(T); refreshFacing(); renderTemplates();
  const fig = $$('#tpl .board').find(f => f.dataset.name === T.name);
  if (fig) fig.scrollIntoView({ block: 'center' });
  return T;
}
async function copyToTemplates(B) {
  const T = mkBoard(uniqueTplName(B.name), { h: B.h, image: B.image, imageData: B.imageData, base: B.base, strokes: JSON.parse(JSON.stringify(B.strokes)) }, true);
  if (B.image && S.store.mode === 'folder') {
    try { const f = await readFile(B.image, 'boards'); if (f) { await writeBlob('templates', B.image, f); S.urls.set(imgKey(T), URL.createObjectURL(f)); } }
    catch (e) { saveError(e); }
  }
  addTemplate(T); refreshFacing(); toast(t('tplMade', T.name));
  return T;
}
function deleteTemplate(T) {
  const used = dependents(T);
  if (used.length) { toast(t('tplUsed', used.map(q => q.name).join(', '))); return; }
  const at = S.cfg.templates.indexOf(T.name), wasDef = S.cfg.defaultTemplate === T.name;
  const drop = () => {
    S.templates.delete(T.name); rm(S.cfg.templates, T.name); rm(S.cfg.recentTemplates, T.name);
    if (S.cfg.defaultTemplate === T.name) S.cfg.defaultTemplate = null;
    markDirty('cfg'); shapeChanged();
  };
  pushHist({ undo: () => { addTemplate(T, at); if (wasDef) S.cfg.defaultTemplate = T.name; shapeChanged(); }, redo: drop });
  drop();
}
function renameTemplate(T, nm) {
  const old = T.name;
  if (!nm || nm === old || tplTaken(nm, T)) return;
  const used = dependents(T);
  S.templates.delete(old); T.name = nm; S.templates.set(nm, T);
  const swap = a => { const k = a.indexOf(old); if (k >= 0) a[k] = nm; };
  swap(S.cfg.templates); swap(S.cfg.recentTemplates);
  if (S.cfg.defaultTemplate === old) S.cfg.defaultTemplate = nm;
  for (const X of used) { X.base = nm; dirtyB(X); }
  markDirty('tpl', nm); markDirty('cfg'); shapeChanged();
}
function setBase(B, name) {
  const old = B.base || null; name = name || null;
  if (old === name) return;
  const ap = v => { B.base = v; dirtyB(B); shapeChanged(); };
  pushHist({ undo: () => ap(old), redo: () => ap(name) });
  ap(name); if (name) touchRecent(name);
}
/* templates B may be based on: never itself, never one that is already built on B */
function baseChoices(B) {
  const all = S.cfg.templates.map(n => S.templates.get(n)).filter(Boolean);
  const ok = B.tpl ? all.filter(T => T !== B && !chainOf(T).includes(B)) : all;
  const rank = n => { const k = S.cfg.recentTemplates.indexOf(n); return k < 0 ? 99 : k; };
  return ok.slice().sort((a, b) => rank(a.name) - rank(b.name));
}
function openBasePop(B, x, y) {
  openPop(x, y, p => {
    p.appendChild(h('p', 'pt', t('pickBase')));
    const col = h('div', 'pcol');
    const add = (label, name) => {
      const bt = h('button', 'btn' + ((B.base || null) === name ? ' on' : ''), label); bt.type = 'button';
      bt.onclick = () => { closePop(); setBase(B, name); }; col.appendChild(bt);
    };
    for (const T of baseChoices(B)) add(T.name, T.name);
    add(t('tplNone'), null);
    p.appendChild(col);
  });
}
function openTplName(T, x, y) {
  openPop(x, y, (p, pop) => {
    p.appendChild(h('p', 'pt', t('tplName')));
    const ni = h('input', 'pin'); ni.type = 'text'; ni.value = T.name; ni.style.marginTop = '0'; p.appendChild(ni);
    const row = h('div', 'prow'), done = h('button', 'btn sm pri', t('done')); done.type = 'button'; done.onclick = closePop;
    row.append(h('span', 'grow'), done); p.appendChild(row);
    pop.onclose = () => renameTemplate(T, cleanField(ni.value));
    ni.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
    setTimeout(() => { ni.focus(); ni.select(); }, 0);
  });
}
/* adding a board: one tap when there are no templates or a default one, otherwise pick what to draw on */
function addBoardFlow(place, x, y) {
  const list = baseChoices({});
  if (!list.length || S.templates.get(S.cfg.defaultTemplate)) { place(); return; }
  openPop(x, y, p => {
    p.appendChild(h('p', 'pt', t('pickBase')));
    const col = h('div', 'pcol');
    const add = (label, init) => { const bt = h('button', 'btn', label); bt.type = 'button'; bt.onclick = () => { closePop(); place(init); }; col.appendChild(bt); };
    for (const T of list) add(T.name, { base: T.name, image: null, imageData: null });
    add(t('blank'), { base: null, image: null, imageData: null, h: 750 });
    p.appendChild(col);
  });
}
function enterTemplates() {
  if (S.mode === 'templates' || !S.loaded) return;
  closePop(); S.scriptTop = desk.scrollTop; S.mode = 'templates';
  document.body.classList.add('tplmode'); renderTemplates(); desk.scrollTop = 0;
}
function exitTemplates() {
  if (S.mode !== 'templates') return;
  closePop(); S.mode = 'script'; document.body.classList.remove('tplmode'); $('#tpl').textContent = '';
  for (const E of S.els) { E.done = false; E.a.textContent = ''; E.frags = []; E.fdone = false; E.f.textContent = ''; }
  sizeWrap(); desk.scrollTop = S.scriptTop || 0; refreshFacing();
}
function renderTemplates() {
  const host = $('#tpl'), top = desk.scrollTop; host.textContent = '';
  const bar = h('div', 'tplbar');
  const nb = h('button', 'btn pri', t('tplNew')); nb.type = 'button'; nb.onclick = () => newTemplate(null);
  const bk = h('button', 'btn', t('tplBack')); bk.type = 'button'; bk.onclick = exitTemplates;
  bar.append(h('h2', null, t('templates')), nb, bk); host.appendChild(bar);
  host.appendChild(h('p', 'tplhint', t('tplHint')));
  const list = S.cfg.templates.map(n => S.templates.get(n)).filter(Boolean);
  if (!list.length) host.appendChild(h('p', 'tplhint', t('tplEmpty')));
  const w = clamp(desk.clientWidth - 90, 360, 940);
  for (const T of list) {
    const sheet = h('div', 'page tsheet');
    sheet.appendChild(boardFig(T, w, [['tname', t('bRename')], ['tbase', t('tplBase', T.base || t('tplNone'))], ['timage', t('bImage')],
      ['tdefault', (S.cfg.defaultTemplate === T.name ? '\u2605 ' : '\u2606 ') + t('tplDefault')], ['tchild', t('tplChild')], ['tclear', t('bClear')], ['tdelete', t('del')]]));
    host.appendChild(sheet);
  }
  desk.scrollTop = top;
}

/* ---------- navigation ---------- */
function pageIndexOf(b) {
  for (let i = 0; i < S.pages.length; i++) for (const it of S.pages[i].items) if (gBlocks(it.g).includes(b)) return [i, it];
  return [0, null];
}
function rowEl(i, b) {
  const a = S.els[i].a, tx = a.querySelector('.tx[data-b="' + b.id + '"]');
  return tx ? tx.closest('.simcell') || tx.closest('.row') : a.querySelector('.row[data-b="' + b.id + '"]');
}
function jumpTo(b, quiet) {
  exitTemplates();
  const [i, it] = pageIndexOf(b), z = S.view.zoom;
  const y = (i * (paper().h + GAP) + GEO.top + (it ? it.y : 0)) * z + wrap.offsetTop;
  if (!quiet || y < desk.scrollTop || y > desk.scrollTop + desk.clientHeight - 80) desk.scrollTop = Math.max(0, y - 110);
  renderVisible();
  const row = rowEl(i, b);
  if (row) { row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
}
function findNext(q, dir) {
  if (!q || !S.blocks.length) return;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const n = norm(q), bl = S.blocks, start = S.findAt == null ? (dir > 0 ? -1 : 0) : S.findAt;
  for (let k = 1; k <= bl.length; k++) {
    const i = (((start + dir * k) % bl.length) + bl.length) % bl.length;
    if (bl[i].type !== 'mark' && norm(bl[i].plain).includes(n)) { S.findAt = i; jumpTo(bl[i]); return; }
  }
  toast(t('notFound'));
}

/* =====================================================================
   INPUT: pen draws, finger and mouse tap and scroll
   ===================================================================== */
let P = null, penUntil = 0, penSeen = 0, mom = 0;
const hit = e => (e.target && e.target.isConnected) ? e.target : document.elementFromPoint(e.clientX, e.clientY);
function stopMomentum() { if (mom) { cancelAnimationFrame(mom); mom = 0; } }

document.addEventListener('pointerdown', e => {
  if (!e.target.closest || !e.target.closest('#pop')) closePop();
  if (!e.target.closest || !e.target.closest('#menu,#bMenu')) $('#menu').hidden = true;
}, true);

desk.addEventListener('pointerdown', e => {
  stopMomentum();
  const tg = hit(e); if (!tg || !tg.closest) return;
  const page = tg.closest('.page'), ui = tg.closest('.pbtn,.tag');
  const isPen = e.pointerType === 'pen';
  const draws = page && !ui && !S.editing && (isPen || (S.tool.finger && (e.pointerType === 'touch' || e.button === 0)));
  if (draws) {
    e.preventDefault();
    if (P && P.lp) clearTimeout(P.lp);
    P = null;
    const erase = S.tool.mode === 'erase' || (isPen && (e.button === 5 || e.button === 2 || (e.buttons & 32) || (e.buttons & 2)));
    beginInk(e, page, erase);
    return;
  }
  /* Palm handling. While the pen is down, or just lifted, touches are ignored. While the pen
     hovers near the screen a touch may still tap quickly to pin a cue, but it cannot scroll,
     long-press, or be a large contact. */
  let nearPen = false;
  if (e.pointerType === 'touch') {
    const now = Date.now();
    if (now < penUntil || (P && P.pen)) return;
    nearPen = now - penSeen < 350;
    if (nearPen && Math.max(e.width || 0, e.height || 0) > 40) return;
  }
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (P && P.lp) clearTimeout(P.lp);
  P = { k: 'tap', id: e.pointerId, type: e.pointerType, nearPen, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: e.timeStamp, tm: e.timeStamp, vx: 0, vy: 0, moved: false };
  if (e.pointerType === 'touch' && !nearPen) {
    const me = P;
    P.lp = setTimeout(() => { if (P === me && !me.moved) { P = null; longPress(me); } }, 560);
  }
});
window.addEventListener('pointermove', e => {
  if (e.pointerType === 'pen') {
    penSeen = Date.now();
    if (P && P.k === 'tap' && P.type === 'touch' && e.pointerId !== P.id) { clearTimeout(P.lp); P.nearPen = true; }
  }
  if (!P || e.pointerId !== P.id) return;
  if (P.k === 'tap') {
    if (!P.moved && Math.hypot(e.clientX - P.x0, e.clientY - P.y0) > 8) { P.moved = true; clearTimeout(P.lp); }
    if (P.moved && P.type === 'touch' && !P.nearPen) {
      const dt = Math.max(1, e.timeStamp - P.tm), dx = e.clientX - P.x, dy = e.clientY - P.y;
      desk.scrollLeft -= dx; desk.scrollTop -= dy;
      P.vx = 0.6 * P.vx + 0.4 * dx / dt; P.vy = 0.6 * P.vy + 0.4 * dy / dt;
    }
    P.x = e.clientX; P.y = e.clientY; P.tm = e.timeStamp;
  } else if (P.k === 'ink') {
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (evs.length ? evs : [e])) {
      const pt = P.map(ev), l = P.pts[P.pts.length - 1];
      if (Math.hypot(pt[0] - l[0], pt[1] - l[1]) >= P.minStep) P.pts.push(pt);
    }
    P.path.setAttribute('d', pathD(P.pts));
  } else if (P.k === 'erase') eraseAt(e);
});
function endPtr(e) {
  if (!P || e.pointerId !== P.id) return;
  const p = P; P = null;
  if (p.lp) clearTimeout(p.lp);
  if (p.pen) penUntil = Date.now() + 450;
  if (p.k === 'tap') {
    if (e.type === 'pointercancel') return;
    if (!p.moved) {
      if (p.nearPen && e.timeStamp - p.t0 > 350) return;   // a resting hand, not a tap
      handleTap(document.elementFromPoint(e.clientX, e.clientY), e.clientX, e.clientY); return;
    }
    if (p.type === 'touch' && !p.nearPen && e.timeStamp - p.tm < 80 && Math.hypot(p.vx, p.vy) > 0.25) {
      let vx = p.vx, vy = p.vy, last = performance.now();
      const step = now => {
        const dt = Math.min(40, now - last); last = now;
        desk.scrollLeft -= vx * dt; desk.scrollTop -= vy * dt;
        const f = Math.pow(0.996, dt); vx *= f; vy *= f;
        mom = Math.hypot(vx, vy) > 0.03 ? requestAnimationFrame(step) : 0;
      };
      mom = requestAnimationFrame(step);
    }
    return;
  }
  if (p.k === 'ink') {
    if (e.type === 'pointercancel' && p.pts.length < 3) { p.path.remove(); return; }
    if (p.board) {
      const B = p.board, st = { colour: S.tool.colour, width: p.sw, points: p.pts.map(q => [r1(q[0]), r1(q[1])]) };
      B.strokes.push(st);
      pushHist({ undo: () => { rm(B.strokes, st); boardChanged(B); }, redo: () => { B.strokes.push(st); boardChanged(B); } });
      boardChanged(B);
    } else {
      const fr = pickFrag(p.pi, p.pts[0]);
      if (!fr) { p.path.remove(); return; }
      addStroke(fr.b, { colour: S.tool.colour, width: S.tool.width, points: p.pts.map(q => [r2((q[0] - fr.ox) / FS), r2((q[1] - fr.oy + fr.off) / FS)]) });
      drawInk(p.pi);
    }
    return;
  }
  if (p.k === 'erase' && p.removed.length) {
    const removed = p.removed, B = p.board, meta = new Map();
    if (!B) for (const r of removed) { const en = S.ink.get(r.id); if (en) { meta.set(r.id, { snap: en.snap, lines: en.lines }); if (!en.strokes.length) S.ink.delete(r.id); } }
    pushHist({
      undo: () => {
        for (let k = removed.length - 1; k >= 0; k--) {
          const r = removed[k];
          if (B) B.strokes.splice(Math.min(r.k, B.strokes.length), 0, r.st);
          else {
            let en = S.ink.get(r.id);
            if (!en) { if (!S.byId.has(r.id)) continue; const m = meta.get(r.id) || {}; en = { snap: m.snap, lines: m.lines, strokes: [] }; S.ink.set(r.id, en); }
            en.strokes.splice(Math.min(r.k, en.strokes.length), 0, r.st);
          }
        }
        if (B) boardChanged(B); else inkChanged();
      },
      redo: () => {
        for (const r of removed) {
          if (B) rm(B.strokes, r.st);
          else { const en = S.ink.get(r.id); if (en) { rm(en.strokes, r.st); if (!en.strokes.length) S.ink.delete(r.id); } }
        }
        if (B) boardChanged(B); else inkChanged();
      }
    });
    if (!B) { drawInk(p.pi); updReview(); }
  }
}
window.addEventListener('pointerup', endPtr);
window.addEventListener('pointercancel', endPtr);
desk.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.page')) e.preventDefault(); });
desk.addEventListener('dragstart', e => e.preventDefault());

function beginInk(e, page, erase) {
  const pr = page.getBoundingClientRect(), z = pageScale(page);
  const tg = hit(e), fig = tg.closest('.board');
  const base = { id: e.pointerId, pen: e.pointerType === 'pen', removed: [] };
  if (fig) {
    const B = figBoard(fig), svg = $('svg', fig); if (!B || !svg) return;
    const r = svg.getBoundingClientRect(), s = r.width / BOARD_W;
    P = Object.assign(base, { k: erase ? 'erase' : 'ink', board: B, layer: $('.bstrokes', svg), map: ev => [(ev.clientX - r.left) / s, (ev.clientY - r.top) / s], rad: 10 / s, sw: 3.4, minStep: 1 / s });
  } else if (page.classList.contains('script')) {
    P = Object.assign(base, { k: erase ? 'erase' : 'ink', pi: +page.dataset.pi, layer: $('.ink', page), map: ev => [(ev.clientX - pr.left) / z, (ev.clientY - pr.top) / z], rad: 9, sw: r2(S.tool.width * FS), minStep: 0.8 });
  } else return;
  try { desk.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
  if (P.k === 'ink') {
    P.pts = [P.map(e)];
    P.path = sv('path', { 'stroke-width': P.sw }); setStroke(P.path, S.tool.colour);
    P.layer.appendChild(P.path); P.path.setAttribute('d', pathD(P.pts));
  } else eraseAt(e);
}
function eraseAt(e) {
  const [x, y] = P.map(e); let hitAny = false;
  if (P.board) {
    const B = P.board;
    for (let k = B.strokes.length - 1; k >= 0; k--) if (near(B.strokes[k].points, x, y, P.rad)) { P.removed.push({ st: B.strokes[k], k }); B.strokes.splice(k, 1); hitAny = true; }
    if (hitAny) boardChanged(B);
    return;
  }
  for (const fr of S.els[P.pi].frags) {
    const en = S.ink.get(fr.id); if (!en) continue;
    const lx = (x - fr.ox) / FS, ly = (y - fr.oy + fr.off) / FS;
    for (let k = en.strokes.length - 1; k >= 0; k--) {
      const st = en.strokes[k];
      if (inFrag(st, fr) && near(st.points, lx, ly, P.rad / FS)) { P.removed.push({ id: fr.id, st, k }); en.strokes.splice(k, 1); hitAny = true; }
    }
  }
  if (hitAny) { drawInk(P.pi); markDirty('ink'); }
}
function blockAt(tg) {
  if (!tg || !tg.closest) return null;
  const w = tg.closest('.w');
  if (w) return { b: S.byId.get(+w.closest('.tx').dataset.b), wi: +w.dataset.i };
  const cell = tg.closest('.simcell') || tg.closest('.row'); if (!cell) return null;
  const q = cell.querySelector('.tx');
  const b = S.byId.get(q ? +q.dataset.b : +cell.dataset.b);
  return b ? { b, wi: -1 } : null;
}
function longPress(p) {
  const at = blockAt(document.elementFromPoint(p.x, p.y));
  if (at && at.b && !S.editing) editGroup(at.b.g);
}
function handleTap(tg, x, y) {
  if (!tg || !tg.closest || S.editing || !tg.closest('.page')) return;
  const act = tg.closest('[data-act]'); if (act) { boardAction(act, x, y); return; }
  const tag = tg.closest('.tag');
  if (tag) {
    const b = S.byId.get(+tag.dataset.b), c = b && b.cues.find(q => q.s === +tag.dataset.s);
    if (c) { if (c.board) openBoardPop(b, c, x, y); else openCueEdit(b, c, x, y); }
    return;
  }
  const flag = tg.closest('.flag'); if (flag) { const b = S.byId.get(+flag.dataset.b); if (b) openFlagPop(b, x, y); return; }
  if (tg.closest('.page.facing')) return;
  const at = blockAt(tg); if (!at || !at.b) return;
  const now = Date.now();
  if (S.lastTap && S.lastTap.id === at.b.id && now - S.lastTap.t < 420) { S.lastTap = null; editGroup(at.b.g); return; }
  S.lastTap = { id: at.b.id, t: now };
  openPin(at.b, at.wi, x, y);
}

/* =====================================================================
   POPOVERS: pin a cue, edit a cue, board, ink flag
   ===================================================================== */
let POP = null;
function closePop() {
  if (!POP) return;
  const p = POP; POP = null;
  $('#pop').hidden = true;
  if (p.onclose) p.onclose();
}
function openPop(x, y, build) {
  closePop();
  const el = $('#pop'); el.textContent = ''; el.hidden = false;
  POP = { onclose: null, key: null };
  build(el, POP);
  const w = el.offsetWidth, hh = el.offsetHeight;
  let left = clamp(x + 14, 8, window.innerWidth - w - 8), top = y + 18;
  if (top + hh > window.innerHeight - 8) top = y - hh - 18;
  if (top < 8) top = clamp(y + 18, 8, Math.max(8, window.innerHeight - hh - 8));
  el.style.left = left + 'px'; el.style.top = top + 'px';
}
function markSel() {
  $$('.w.sel').forEach(x => x.classList.remove('sel'));
  if (!S.sel || S.sel.wi < 0) return;
  const sp = spreads.querySelector('.tx[data-b="' + S.sel.id + '"] .w[data-i="' + S.sel.wi + '"]');
  if (sp) sp.classList.add('sel');
}
function insertWordCue(b, wi, tok) {
  const w = b.tokens[wi]; let pos = w.e;
  for (const c of w.cues) if (!c.before) pos = Math.max(pos, c.e);
  const id = b.id;
  commitText(textWith(S.blocks.indexOf(b), 1, b.raw.slice(0, pos) + ' ' + tok + b.raw.slice(pos)));
  const nb = S.byId.get(id), c = nb && nb.cues.find(q => q.s === pos + 1);
  return c ? { b: nb, c } : null;
}
function insertOwnCue(b, tok) {
  const j = S.blocks.indexOf(lastOfGroup(b));
  commitText(textInsertAfter(j, tok));
  const nb = S.blocks[j + 1];
  return nb && nb.type === 'mark' ? { b: nb, c: nb.cues[0] } : null;
}
function removeCue(bid, cs) {
  const b = S.byId.get(bid), c = b && b.cues.find(q => q.s === cs); if (!c) return;
  const edits = [{ b, s: c.s, e: c.e, text: null }];
  if (!c.end && c.endRef) edits.push({ b: c.endRef.b, s: c.endRef.s, e: c.endRef.e, text: null });   // a cue takes its end with it
  commitText(textEdits(edits));
}
/* Cues that an end placed after word wi of block b (or on its own line after b) could close, most
   recent first. A cue is offered only if the end token would really pair with it: the latest open cue
   of its department, or an earlier one whose number no later open cue of that department repeats. */
function openCuesAt(b, wi, own) {
  const stop = own || wi < 0 ? lastOfGroup(b) : b, open = [];
  for (const q of S.blocks) {
    for (const c of q.cues) {
      if (c.board || c.end || c.endRef) continue;
      if (q === b && !own && wi >= 0 && c.wi > wi) continue;
      open.push(c);
    }
    if (q === stop) break;
  }
  const seen = new Map(), out = [];
  for (let i = open.length - 1; i >= 0; i--) {
    const c = open[i]; let labels = seen.get(c.dept);
    if (!labels) { seen.set(c.dept, labels = new Set([c.label])); out.push(c); continue; }
    if (c.label && !labels.has(c.label)) { labels.add(c.label); out.push(c); }
  }
  const runs = c => { const d = deptOf(c.dept); return d && d.runs ? 0 : 1; };
  return out.sort((x, z) => runs(x) - runs(z) || z.ord - x.ord).slice(0, 4);
}
function lastLabelBefore(b, c) {
  let last = '';
  for (const x of S.blocks) {
    for (const q of x.cues) { if (x === b && q === c) return last; if (q.dept === c.dept && q.label && !q.end) last = q.label; }
    if (x === b) break;
  }
  return last;
}
function deptButtons(cls, current, onPick) {
  const ds = h('div', 'depts' + (cls ? ' ' + cls : '')), btns = [];
  for (const d of S.cfg.departments) {
    const bt = h('button', 'dbtn' + (d.code === current ? ' on' : '')); bt.type = 'button';
    bt.style.setProperty('--c', d.colour); bt.append(d.code);
    if (!cls) bt.appendChild(h('small', null, d.name));
    bt.onclick = () => { btns.forEach(x => x.classList.toggle('on', x === bt)); onPick(d.code); };
    btns.push(bt); ds.appendChild(bt);
  }
  return ds;
}
function openPin(b, wi, x, y) {
  S.sel = { id: b.id, wi }; markSel();
  const own0 = wi < 0;
  openPop(x, y, (p, pop) => {
    let own = own0;
    const title = h('p', 'pt'); p.appendChild(title);
    const setTitle = () => { title.textContent = own ? t('cueOwn') : t('cueAfter', b.tokens[wi].text); };
    setTitle();
    const place = tok => {
      closePop(); S.lastTap = null;   // the next tap on this line is a new pin, not a double tap
      const r = own ? insertOwnCue(b, tok) : insertWordCue(b, wi, tok);
      if (r) openCueEdit(r.b, r.c, x, y);
    };
    const pin = code => place(fmtToken(code, '', ''));
    p.appendChild(deptButtons('', null, pin));
    const ends = h('div', 'ends'); p.appendChild(ends);
    const fillEnds = () => {
      ends.textContent = '';
      const list = openCuesAt(b, wi, own); ends.hidden = !list.length;
      if (!list.length) return;
      ends.appendChild(h('span', 'elab', t('endRow')));
      for (const c of list) {
        const bt = h('button', 'dbtn ebtn', c.dept + (c.label ? ' ' + c.label : '')); bt.type = 'button';
        bt.style.setProperty('--c', cueColour(c)); if (c.desc) bt.title = c.desc;
        bt.onclick = () => place(fmtToken(c.dept, c.label, '', true));
        ends.appendChild(bt);
      }
    };
    fillEnds();
    const row = h('div', 'prow');
    if (!own0) {
      const lb = h('label', 'chk'), cb = h('input'); cb.type = 'checkbox';
      cb.onchange = () => { own = cb.checked; setTitle(); fillEnds(); };
      lb.append(cb, t('ownLine')); row.appendChild(lb);
    } else row.appendChild(h('span', 'grow'));
    const bb = h('button', 'btn sm', t('boardHere')); bb.type = 'button'; bb.onclick = () => { closePop(); addBoardFlow(init => addBoardAfter(b, init), x, y); };
    const eb = h('button', 'btn sm', t('editText')); eb.type = 'button'; eb.onclick = () => { closePop(); editGroup(b.g); };
    row.append(bb, eb); p.appendChild(row);
    pop.key = ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.key.length !== 1) return false;
      const d = S.cfg.departments.find(q => q.code[0] === ev.key.toUpperCase());
      if (d) { pin(d.code); return true; }
      return false;
    };
  });
}
function openCueEdit(b, c, x, y) {
  const bid = b.id, cs = c.s; let dept = c.dept;
  openPop(x, y, (p, pop) => {
    const li = h('input', 'pin'), di = h('input', 'pin');
    li.type = 'text'; di.type = 'text'; li.value = c.label; di.value = c.desc;
    const last = c.end ? '' : lastLabelBefore(b, c);
    li.placeholder = t('label') + (last ? ' (' + t('lastLabel', last) + ')' : ''); di.placeholder = t('desc');
    if (c.end) p.appendChild(h('p', 'pt', c.startRef ? t('endTitle', c.startRef.dept + (c.startRef.label ? ' ' + c.startRef.label : '') + (c.startRef.desc ? ' — ' + c.startRef.desc : '')) : t('endLoose')));
    const apply = () => {
      const nb = S.byId.get(bid), nc = nb && nb.cues.find(q => q.s === cs); if (!nc) return;
      const nl = cleanField(li.value), nd = cleanField(di.value);
      if (nl === nc.label && nd === nc.desc && dept === nc.dept) return;
      const edits = [{ b: nb, s: nc.s, e: nc.e, text: fmtToken(dept, nl, nd, nc.end) }];
      const en = nc.end ? null : nc.endRef;   // a renamed cue keeps its end: the end follows in the same step
      if (en && (dept !== nc.dept || nl !== nc.label)) edits.push({ b: en.b, s: en.s, e: en.e, text: fmtToken(dept, en.label ? nl : '', en.desc, true) });
      commitText(textEdits(edits));
    };
    p.appendChild(deptButtons('small', dept, code => { dept = code; apply(); }));
    p.append(li, di);
    const row = h('div', 'prow');
    const del = h('button', 'btn sm danger', t('del')); del.type = 'button';
    del.onclick = () => { pop.onclose = null; closePop(); removeCue(bid, cs); };
    const done = h('button', 'btn sm pri', t('done')); done.type = 'button'; done.onclick = closePop;
    row.append(del, h('span', 'grow'), done); p.appendChild(row);
    pop.onclose = apply;
    for (const inp of [li, di]) inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
    pop.key = ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.key.length !== 1) return false;
      if (document.activeElement === li || document.activeElement === di) return false;
      li.focus(); return false;   // let the key land in the label field
    };
  });
}
function openBoardPop(b, c, x, y) {
  const bid = b.id, cs = c.s, oldName = c.label;
  openPop(x, y, (p, pop) => {
    p.appendChild(h('p', 'pt', t('bName')));
    const ni = h('input', 'pin'); ni.type = 'text'; ni.value = oldName; ni.style.marginTop = '0'; p.appendChild(ni);
    const apply = () => {
      const nm = cleanField(ni.value);
      if (!nm || nm === oldName || S.boards.has(nm)) return;
      const nb = S.byId.get(bid), nc = nb && nb.cues.find(q => q.s === cs); if (!nc) return;
      const B = S.boards.get(oldName);
      if (B) { S.boards.delete(oldName); B.name = nm; S.boards.set(nm, B); markDirty('board', nm); }
      commitText(textWith(S.blocks.indexOf(nb), 1, nb.raw.slice(0, nc.s) + '{BOARD ' + nm + '}' + nb.raw.slice(nc.e)));
    };
    const row = h('div', 'prow');
    const del = h('button', 'btn sm danger', t('bRemove')); del.type = 'button'; del.onclick = () => { pop.onclose = null; closePop(); removeCue(bid, cs); };
    const done = h('button', 'btn sm pri', t('done')); done.type = 'button'; done.onclick = closePop;
    row.append(del, h('span', 'grow'), done); p.appendChild(row);
    pop.onclose = apply;
    ni.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
  });
}
function openFlagPop(b, x, y) {
  const id = b.id;
  openPop(x, y, p => {
    p.appendChild(h('p', 'pt', t('checkInk')));
    const row = h('div', 'prow'); row.style.marginTop = '0';
    const keep = h('button', 'btn sm pri', t('inkKeep')); keep.type = 'button';
    keep.onclick = () => { closePop(); const nb = S.byId.get(id), e = nb && S.ink.get(id); if (e) { e.snap = nb.plain; e.lines = lineCount(nb); inkChanged(); } };
    const clr = h('button', 'btn sm danger', t('inkClear')); clr.type = 'button';
    clr.onclick = () => {
      closePop(); const e = S.ink.get(id); if (!e) return;
      S.ink.delete(id);
      pushHist({ undo: () => { if (S.byId.has(id)) S.ink.set(id, e); inkChanged(); }, redo: () => { S.ink.delete(id); inkChanged(); } });
      inkChanged();
    };
    row.append(keep, clr); p.appendChild(row);
  });
}

/* ---------- in-place text editor ---------- */
function editGroup(g) {
  closePop();
  const bs = gBlocks(g), i0 = S.blocks.indexOf(bs[0]);
  jumpTo(bs[0], true);
  const [pi] = pageIndexOf(bs[0]), row = rowEl(pi, bs[0]);
  const rr = (row ? (row.closest('.row') || row) : S.els[pi].a).getBoundingClientRect();
  const ed = $('#editor'); ed.textContent = ''; ed.hidden = false; S.editing = true;
  const ta = h('textarea'); ta.value = bs.map(b => b.raw).join('\n'); ta.spellcheck = false;
  const hint = h('div', 'hint', t('editHint'));
  const row2 = h('div', 'prow');
  const cancel = h('button', 'btn sm', t('cancel')); cancel.type = 'button';
  const save = h('button', 'btn sm pri', t('save')); save.type = 'button';
  row2.append(hint, h('span', 'grow'), cancel, save);
  ed.append(ta, row2);
  const w = clamp(rr.width * 0.8, 420, window.innerWidth - 16);
  ed.style.width = w + 'px';
  ed.style.left = clamp(rr.left, 8, window.innerWidth - w - 8) + 'px';
  const fit = () => { ta.style.height = 'auto'; ta.style.height = clamp(ta.scrollHeight + 4, 70, window.innerHeight * 0.6) + 'px'; };
  fit();
  ed.style.top = clamp(rr.top - 9, 8, Math.max(8, window.innerHeight - ed.offsetHeight - 8)) + 'px';
  const close = () => { ed.hidden = true; ed.textContent = ''; S.editing = false; };
  cancel.onclick = close;
  save.onclick = () => { const v = ta.value; close(); commitText(textWith(i0, bs.length, v)); };
  ta.addEventListener('input', fit);
  ta.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); save.onclick(); }
  });
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}

/* =====================================================================
   PANELS: cue list, review, outline
   ===================================================================== */
function wordsOf(b) { return b.tokens.filter(q => q.k === 'w').map(q => q.text); }
/* One row per cue. A cue's end is carried on its row; an end that closes nothing gets a row of its own. */
function collectCues() {
  const out = [], bl = S.blocks, idx = new Map(bl.map((b, i) => [b, i]));
  const neigh = (i, dir) => { for (let k = i + dir; k >= 0 && k < bl.length; k += dir) if (bl[k].type !== 'mark') return bl[k]; return null; };
  const where = c => {
    const b = c.b, i = idx.get(b); let ctx, who = b.name;
    if (c.wi >= 0) {
      const ws = b.tokens, before = [], after = [];
      for (let k = c.before ? c.wi - 1 : c.wi; k >= 0 && before.length < 6; k--) if (ws[k].k === 'w') before.unshift(ws[k].text);
      for (let k = c.before ? c.wi : c.wi + 1; k < ws.length && after.length < 3; k++) if (ws[k].k === 'w') after.push(ws[k].text);
      ctx = before.join(' ') + ' ▸ ' + after.join(' ');
    } else {
      const pv = neigh(i, -1), nx = neigh(i, 1);
      ctx = (pv ? '…' + wordsOf(pv).slice(-5).join(' ') + ' ' : '') + '▸' + (nx ? ' ' + (nx.name ? nx.name + ': ' : '') + wordsOf(nx).slice(0, 3).join(' ') + '…' : '');
      who = '';
    }
    return { ctx: ctx.trim(), who, page: c.page || b.page || '' };
  };
  for (const b of bl) for (const c of b.cues) {
    if (c.board || (c.end && c.startRef)) continue;
    const o = Object.assign({ b, c, act: b.act, scene: b.scene, loose: !!c.end, end: null }, where(c));
    if (c.endRef) o.end = Object.assign({ c: c.endRef }, where(c.endRef));
    out.push(o);
  }
  const seen = new Map();
  for (const o of out) if (o.c.label && !o.loose) { const k = o.c.dept + '\u0001' + o.c.label; seen.set(k, (seen.get(k) || 0) + 1); }
  for (const o of out) o.dup = !o.loose && !!o.c.label && seen.get(o.c.dept + '\u0001' + o.c.label) > 1;
  return out;
}
function reviewData() {
  const paras = [], amps = [], flagged = [], unk = [], chars = new Map(), ends = [], running = [];
  for (const b of S.blocks) {
    for (const c of b.cues) {
      if (c.board) continue;
      if (c.end) { if (!c.startRef) ends.push({ b, c }); }
      else if (!c.endRef) { const d = deptOf(c.dept); if (d && d.runs) running.push({ b, c }); }
    }
    if (b.type === 'para') paras.push(b);
    if (b.type === 'speech') {
      chars.set(b.name, (chars.get(b.name) || 0) + 1);
      if (b.simul && b.g.kind === 'single') amps.push(b);
    }
    if (inkFlag(b)) flagged.push(b);
    for (const c of b.cues) if (!c.board && !deptOf(c.dept)) unk.push({ b, c });
  }
  return { paras, amps, flagged, unk, chars, ends, running, orphans: S.orphans, count: paras.length + amps.length + flagged.length + unk.length + ends.length + S.orphans.length };
}
function updReview() {
  const rv = reviewData(), bt = $('#bReview');
  bt.hidden = false; bt.textContent = '';
  bt.append(t('review') + ' ');
  if (rv.count) bt.appendChild(h('b', null, String(rv.count)));
  if (S.drawer === 'review') renderDrawer();
}
function updOutline() {
  const sel = $('#outline'); sel.textContent = '';
  const o0 = h('option', null, t('jumpTo')); o0.value = ''; sel.appendChild(o0);
  for (const b of S.blocks) if (b.type === 'h') {
    const o = h('option', null, (b.level === 2 ? '   ' : '') + b.title + (b.page ? '  · ' + b.page : '')); o.value = b.id; sel.appendChild(o);
  }
}
function updPanels() {
  updOutline(); updReview();
  if (S.drawer === 'cues') renderDrawer();
  $('#showName').textContent = S.cfg.title || S.store.name || t('untitled');
  document.title = (S.cfg.title || S.store.name || 'Promptbook') + ' — Promptbook';
}
function toggleDrawer(kind) {
  S.drawer = S.drawer === kind ? null : kind;
  $('#drawer').hidden = !S.drawer;
  $('#bList').classList.toggle('on', S.drawer === 'cues');
  $('#bReview').classList.toggle('on', S.drawer === 'review');
  if (S.drawer) renderDrawer();
  sizeWrap(); renderVisible();
}
function cueTable(list, clickable) {
  const tb = h('table', 'cl'), hr = h('tr');
  for (const k of ['thDept', 'thNo', 'thDesc', 'thWhere', 'thLine', 'thPage']) hr.appendChild(h('th', null, t(k)));
  tb.appendChild(hr);
  for (const o of list) {
    const tr = h('tr', clickable ? 'cr' : ''), d = h('td', 'dp', o.c.dept);
    d.style.setProperty('--c', cueColour(o.c)); tr.appendChild(d);
    const n = h('td', o.dup || o.loose ? 'dupe' : '', (o.loose ? '\u25A0 ' : '') + o.c.label); if (o.dup) n.title = t('dup'); if (o.loose) n.title = t('endLoose'); tr.appendChild(n);
    const dc = h('td', null, o.c.desc);
    if (o.end) dc.appendChild(h('div', 'endl', '\u25A0 ' + t('endsAt', o.end.page) + (o.end.c.desc ? ' — ' + o.end.c.desc : '') + ' · ' + (o.end.who ? o.end.who + ': ' : '') + o.end.ctx));
    tr.appendChild(dc);
    tr.appendChild(h('td', 'ctx', [o.act, o.scene].filter(Boolean).join(' · ')));
    tr.appendChild(h('td', 'ctx', (o.who ? o.who + ': ' : '') + o.ctx));
    tr.appendChild(h('td', null, String(o.page)));
    if (clickable) tr.onclick = () => jumpTo(o.b);
    tb.appendChild(tr);
  }
  return tb;
}
function filteredCues() { const all = collectCues(); return S.cueFilter ? all.filter(o => o.c.dept === S.cueFilter) : all; }
function renderDrawer() {
  const dr = $('#drawer'); dr.textContent = '';
  const head = h('div', 'dhead'), body = h('div', 'dbody');
  const x = h('button', 'btn sm', '✕'); x.type = 'button'; x.title = t('close'); x.onclick = () => toggleDrawer(S.drawer);
  if (S.drawer === 'cues') {
    const all = collectCues();
    head.appendChild(h('h2', null, t('cueList') + ' (' + all.length + ')'));
    const csv = h('button', 'btn sm', t('csv')); csv.type = 'button'; csv.onclick = exportCSV;
    const pr = h('button', 'btn sm', t('print')); pr.type = 'button'; pr.onclick = () => doPrint('cues');
    head.append(csv, pr, x);
    const chips = h('div', 'chips');
    const codes = [null].concat(S.cfg.departments.map(d => d.code));
    for (const o of all) if (!codes.includes(o.c.dept)) codes.push(o.c.dept);
    for (const code of codes) {
      const ch = h('button', 'chip' + (S.cueFilter === code ? ' on' : ''), code || t('all')); ch.type = 'button';
      if (code) ch.style.setProperty('--c', cueColour({ dept: code }));
      ch.onclick = () => { S.cueFilter = code; renderDrawer(); };
      chips.appendChild(ch);
    }
    body.appendChild(chips);
    const list = S.cueFilter ? all.filter(o => o.c.dept === S.cueFilter) : all;
    body.appendChild(list.length ? cueTable(list, true) : h('p', 'hint', t('noCues')));
  } else {
    const rv = reviewData(); body.classList.add('rv');
    head.appendChild(h('h2', null, t('review'))); head.appendChild(x);
    if (!rv.count) body.appendChild(h('p', 'hint', t('rvNone')));
    const sec = (title, hint, items, label, onClick) => {
      if (!items.length) return;
      body.appendChild(h('h3', null, title + ' (' + items.length + ')'));
      if (hint) body.appendChild(h('p', 'hint', hint));
      for (const it of items) { const bt = h('button', 'it', label(it)); bt.type = 'button'; bt.onclick = () => onClick(it); body.appendChild(bt); }
    };
    const snip = s => s.length > 90 ? s.slice(0, 90) + '…' : s;
    sec(t('rvPara'), t('rvParaHint'), rv.paras, b => (b.page ? 'p. ' + b.page + ' — ' : '') + snip(b.plain), b => jumpTo(b));
    sec(t('rvAmp'), '', rv.amps, b => snip(b.plain), b => jumpTo(b));
    sec(t('rvInk'), '', rv.flagged, b => (b.page ? 'p. ' + b.page + ' — ' : '') + snip(b.plain), b => jumpTo(b));
    sec(t('rvUnk'), '', rv.unk, o => o.c.dept + ' ' + o.c.label + ' — ' + snip(o.b.plain || o.c.desc), o => jumpTo(o.b));
    sec(t('rvEnd'), '', rv.ends, o => '\u25A0 ' + o.c.dept + ' ' + o.c.label + (o.c.page ? ' — p. ' + o.c.page : ''), o => jumpTo(o.b));
    sec(t('rvOrph'), '', rv.orphans, o => '✕  ' + snip(o.text), o => {
      const k = rm(S.orphans, o); if (k < 0) return;
      pushHist({ undo: () => { S.orphans.splice(k, 0, o); inkChanged(); }, redo: () => { rm(S.orphans, o); inkChanged(); } });
      inkChanged();
    });
    sec(t('rvOpen'), t('rvOpenHint'), rv.running, o => o.c.dept + ' ' + o.c.label + (o.c.desc ? ' — ' + snip(o.c.desc) : '') + (o.c.page ? ' · p. ' + o.c.page : ''), o => jumpTo(o.b));
    if (rv.chars.size) {
      body.appendChild(h('h3', null, t('rvChars') + ' (' + rv.chars.size + ')'));
      body.appendChild(h('p', 'hint', t('rvCharsHint')));
      const cw = h('div', 'chars');
      for (const [nm, n] of Array.from(rv.chars).sort((a, b) => b[1] - a[1])) { const sp = h('span', n === 1 ? 'one' : '', nm + ' '); sp.appendChild(h('b', null, '×' + n)); cw.appendChild(sp); }
      body.appendChild(cw);
    }
  }
  dr.append(head, body);
}
function exportCSV() {
  const sep = (1.1).toLocaleString().includes(',') ? ';' : ',';
  const q = v => { v = String(v == null ? '' : v); return /["\n\r;,]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [[t('thDept'), t('thNo'), t('thDesc'), 'Act', 'Scene', t('thWho'), t('thLine'), t('thPage'), t('thEndPage'), t('thEndLine'), t('thEndDesc')]];
  for (const o of filteredCues()) rows.push([o.c.dept, (o.loose ? '/' : '') + o.c.label, o.c.desc, o.act, o.scene, o.who, o.ctx, o.page,
    o.end ? o.end.page : '', o.end ? (o.end.who ? o.end.who + ': ' : '') + o.end.ctx : '', o.end ? o.end.c.desc : '']);
  download('cues' + (S.cueFilter ? '-' + S.cueFilter : '') + '.csv', new Blob(['﻿' + rows.map(r => r.map(q).join(sep)).join('\r\n') + '\r\n'], { type: 'text/csv' }));
}
function download(name, blob) {
  const a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function doPrint(kind) {
  exitTemplates();
  document.body.classList.remove('pr-book', 'pr-script', 'pr-cues');
  document.body.classList.add('pr-' + kind);
  if (kind === 'cues') {
    const cp = $('#cuePrint'); cp.textContent = '';
    cp.appendChild(h('h1', null, (S.cfg.title ? S.cfg.title + ' — ' : '') + t('cueList') + (S.cueFilter ? ' · ' + S.cueFilter : '')));
    cp.appendChild(cueTable(filteredCues(), false));
  } else renderAll();
  window.print();
}
window.addEventListener('beforeprint', () => {
  const c = document.body.classList;
  if (!c.contains('pr-book') && !c.contains('pr-script') && !c.contains('pr-cues')) c.add('pr-book');
  if (!c.contains('pr-cues')) renderAll();
});
window.addEventListener('afterprint', () => document.body.classList.remove('pr-book', 'pr-script', 'pr-cues'));

let toastT = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }
