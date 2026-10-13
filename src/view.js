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
    E.sp.classList.toggle('chg', P.chg);
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
  el.textContent = ''; el.dataset.pi = i; el.classList.toggle('frontpg', P.front);
  el.appendChild(h('div', 'phead', [titleOf(), P.head].filter(Boolean).join('  —  ')));
  const body = h('div', 'pbody');
  for (const it of P.items) body.appendChild(buildRow(it.g, it.whole ? null : it));
  el.append(body, sv('svg', { class: 'links' }), h('div', 'tags'), sv('svg', { class: 'ink' }), h('div', 'pfoot' + (P.chg ? ' chg' : ''), P.label + (P.chg ? '  ∗ ' + t('lkMark', S.cfg.lock.name) : '')));
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
    const tg = h('button', 'tag' + (o.c.board ? ' btag' : d ? '' : ' unk') + (o.c.end || o.c.links.length ? ' etag' : '')); tg.type = 'button';
    tg.style.setProperty('--c', cueColour(o.c)); tg.style.setProperty('--ct', inkOn(cueColour(o.c)));
    tg.dataset.b = o.b.id; tg.dataset.s = o.c.s;
    tg.appendChild(h('b', null, o.c.board ? (o.c.label || t('board')) : cueName(o.c)));
    const tip = [o.c.links.length ? t('endsCue', o.c.links.map(cueName).join(', ')) : '', o.c.notes ? t('hasNotes') + ': ' + o.c.notes : ''].filter(Boolean).join(' · ');
    if (o.c.notes) tg.appendChild(h('span', 'nd', ' \u2022'));
    if (tip) tg.title = tip;   // a linking cue is drawn like a plain end: outlined, stop square, rail
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
  return { tpl: !!tpl, name, w: BOARD_W, h: +j.h || 750, image: j.image || null, imageData: dataImg(j.imageData),
    strokes: Array.isArray(j.strokes) ? j.strokes : [], base: typeof j.base === 'string' && j.base ? j.base : null };
}
function ensureBoard(name) {
  let B = S.boards.get(name);
  if (!B) { B = mkBoard(name); S.boards.set(name, B); }
  return B;
}
const imgKey = (B, file) => (B.tpl ? 'templates/' : 'boards/') + (file || B.image);
function boardURL(B) { return B.imageData || (B.image && S.urls.get(imgKey(B))) || null; }
/* The object URLs of the images in the show file. S.urls holds them under the path of the file, one for a Blob however many paths
   show it. setURL is the only place that makes one, sweepURLs the only place that revokes one. */
const blobURL = new Map();   // Blob -> its object URL
function setURL(key, blob) { let u = blobURL.get(blob); if (!u) blobURL.set(blob, u = URL.createObjectURL(blob)); S.urls.set(key, u); }
/* Run when a show has taken the place of another (loadShow) and after a save. A path leaves S.urls when its file has left the
   show file (an image replaced on its board is dropped by the save) and no board names it; a URL is revoked when no path
   holds it and no figure drawn on the page still shows it. */
function sweepURLs() {
  const f = S.store.files, named = new Set(Array.from(S.boards.values()).concat(Array.from(S.templates.values()), S.cfg.defaultBoard || []).map(B => imgKey(B)));
  for (const k of S.urls.keys()) if (!(f && f.has(k)) && !named.has(k)) S.urls.delete(k);
  const keep = new Set(S.urls.values()); for (const im of $$('.board image')) keep.add(im.getAttribute('href'));
  for (const [b, u] of blobURL) if (!keep.has(u)) { URL.revokeObjectURL(u); blobURL.delete(b); }
}
/* the templates a board is drawn on top of, root first; stops at a loop */
function chainOf(B) {
  const out = [], seen = new Set([B]);
  let T = B.base ? S.templates.get(B.base) : null;
  while (T && !seen.has(T)) { out.unshift(T); seen.add(T); T = T.base ? S.templates.get(T.base) : null; }
  return out;
}
function effH(B) { const ch = chainOf(B); return ch.length ? ch[0].h : B.h; }   // a based board takes the shape of its root
function bsig(B) { return B ? [B.name, B.image || '', effH(B), chainOf(B).map(T => T.name + ':' + (T.image || '')).join('>')].join('~') : ''; }
function facingSig(P) { return P.label + '|' + (S.templates.size ? 't' : '') + '|' + P.boards.map(n => n + '=' + bsig(S.boards.get(n))).join(','); }
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
  const st = S.cfg.boardGrid;   // display only: over the images, under the ink, never in B.strokes
  if (st) {
    let d = '', D = '';
    for (let x = st; x < BOARD_W; x += st) { if (x % (st * 4)) d += 'M' + x + ' 0V' + H; else D += 'M' + x + ' 0V' + H; }
    for (let y = st; y < H; y += st) { if (y % (st * 4)) d += 'M0 ' + y + 'H' + BOARD_W; else D += 'M0 ' + y + 'H' + BOARD_W; }
    svg.append(sv('path', { class: 'bgrid', d }), sv('path', { class: 'bgrid maj', d: D }));
  }
  const g = sv('g', { class: 'bstrokes' }); svg.appendChild(g); drawStrokes(B, g);
}
function boardFig(B, w, acts) {
  const fig = h('figure', 'board'); fig.dataset.name = B.name; if (B.tpl) fig.dataset.tpl = '1'; fig.style.width = w + 'px';
  const cap = h('div', 'bcap');
  const add = (act, label, title) => { const bt = h('button', 'pbtn', label); bt.type = 'button'; bt.dataset.act = act; if (title) bt.title = title; cap.appendChild(bt); };
  if (B.tpl || w >= FIG_WIDE) for (const [act, label] of acts) add(act, label);
  else add('bmore', '\u22ef', t('bMore'));   // a narrow figure: one button that opens the list
  fig.appendChild(cap);
  const svg = sv('svg', { width: w, height: Math.round(w * effH(B) / BOARD_W) }); fillBoard(svg, B); fig.appendChild(svg);
  // the name is a button so that the pen does not draw on it and a tap renames
  const nm = h('button', 'bname pbtn', B.name); nm.type = 'button'; nm.dataset.act = 'bname'; nm.title = B.name; fig.appendChild(nm);
  return fig;
}
/* the buttons of a figure: [action, label] */
function boardActs(B) {
  if (B.tpl) return [['tname', t('bRename')], ['tbase', t('tplBase', B.base || t('tplNone'))], ['timage', t('bImage')],
    ['tdefault', (S.cfg.defaultTemplate === B.name ? '\u2605 ' : '\u2606 ') + t('tplDefault')], ['tchild', t('tplChild')], ['tclear', t('bClear')], ['tdelete', t('del')]];
  const acts = S.templates.size ? [['bbase', t('bBase')]] : [];
  acts.push(['bimage', t('bImage')], ['btotpl', t('bToTpl')], ['bclear', t('bClear')], ['bremove', t('del')]);
  return acts;
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
  if (P.front) { E.fdone = true; return; }   // nothing faces the front page
  el.appendChild(h('div', 'phead', t('boards') + ' · ' + P.label));
  const body = h('div', 'fbody'); el.appendChild(body);
  const bs = P.boards.map(ensureBoard);
  if (!bs.length) body.appendChild(h('div', 'fempty noprint', t('facingEmpty')));
  else {
    const availW = pp.w - 60, availH = pp.h - GEO.top - GEO.bot - 44;   // 44: the "+ Board" button and its gap
    const L = facingLayout(bs.map(B => effH(B) / BOARD_W), availW, availH);
    const grid = h('div', 'fgrid'); grid.style.setProperty('--cols', L.cols);
    for (const B of bs) grid.appendChild(boardFig(B, L.w, boardActs(B)));
    body.appendChild(grid);
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
/* a board takes another name and its drawing goes with it; a board already kept under that name takes the first one, so none is lost */
function moveBoard(from, to) {
  const A = S.boards.get(from), Z = S.boards.get(to);
  S.boards.delete(from); S.boards.delete(to);
  if (A) { A.name = to; S.boards.set(to, A); markDirty('board', to); }
  if (Z) { Z.name = from; S.boards.set(from, Z); markDirty('board', from); }
}
function boardNameTaken(nm) { return S.boards.has(nm) || S.blocks.some(b => b.cues.some(c => c.board && c.label === nm)); }
/* name: the one typed when the board was added; the next free "Board n" when it is empty or already taken */
function newBoard(mkText, init, name) {
  if (!name || boardNameTaken(name)) name = uniqueBoardName();
  const dt = S.templates.get(S.cfg.defaultTemplate), def = dt ? null : S.cfg.defaultBoard;
  const B = Object.assign(mkBoard(name, def ? { h: def.h, image: def.image, imageData: def.imageData } : { base: dt ? dt.name : null }), init || {});
  if (B.base) touchRecent(B.base);
  S.boards.set(name, B); markDirty('board', name);
  commitText(mkText(name));
  const b = S.blocks.find(x => x.cues.some(c => c.board && c.label === name));
  if (b) jumpTo(b, true);
  return B;
}
function lastOfGroup(b) { const bs = gBlocks(b.g); return bs[bs.length - 1]; }
function addBoardAfter(b, init, name) { return newBoard(name => textInsertAfter(S.blocks.indexOf(lastOfGroup(b)), '{BOARD ' + name + '}'), init, name); }
function pageFull(pi) { const P = S.pages[pi]; if (!P || P.boards.length < MAX_BOARDS) return false; toast(t('boardsFull', MAX_BOARDS)); return true; }
function addBoardOnPage(pi, init, name) {
  const P = S.pages[pi], selB = S.sel && S.byId.get(S.sel.id);
  if (selB && P.items.some(it => gBlocks(it.g).includes(selB))) return addBoardAfter(selB, init, name);
  const it = P.items.find(q => (q.whole || q.first) && !(q.g.kind === 'single' && q.g.b.type === 'h'));
  if (it) { const first = gBlocks(it.g)[0]; return newBoard(name => textInsertBefore(S.blocks.indexOf(first), '{BOARD ' + name + '}'), init, name); }
  const lastIt = P.items[P.items.length - 1];
  if (lastIt) return addBoardAfter(gBlocks(lastIt.g)[0], init, name);
  return newBoard(name => textInsertAfter(-1, '{BOARD ' + name + '}'), init, name);
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
  if (onDisk()) {
    try { await writeBlob(B.tpl ? 'templates' : 'boards', fname, im.blob); } catch (e) { saveError(e); }
    setURL(imgKey(B), im.blob); B.imageData = null;
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
  if (act === 'addboard') { const pi = +page.dataset.pi; if (pageFull(pi)) return; addBoardFlow((init, name) => addBoardOnPage(pi, init, name), x, y); return; }
  const B = figBoard(btn.closest('.board')); if (B) boardAct(act, B, x, y);
}
/* the token of a board in the script: its block and its cue */
function boardCue(B) {
  const b = S.blocks.find(q => q.cues.some(c => c.board && c.label === B.name));
  return b ? { b, c: b.cues.find(q => q.board && q.label === B.name) } : null;
}
function boardAct(act, B, x, y) {
  if (act === 'bimage' || act === 'timage') pickImage(f => setBoardImage(B, f));
  else if (act === 'bbase' || act === 'tbase') openBasePop(B, x, y);
  else if (act === 'btotpl') copyToTemplates(B);
  else if (act === 'bclear' || act === 'tclear') {
    if (!B.strokes.length) return;
    const old = B.strokes; B.strokes = [];
    pushHist({ undo: () => { B.strokes = old; boardChanged(B); }, redo: () => { B.strokes = []; boardChanged(B); } });
    boardChanged(B);
  } else if (act === 'bremove') {
    const at = boardCue(B); if (at) removeCue(at.b.id, at.c.s);
  } else if (act === 'bname') {
    if (B.tpl) openTplName(B, x, y);
    else { const at = boardCue(B); if (at) openBoardPop(at.b, at.c, x, y); }
  } else if (act === 'bmore') {
    openPop(x, y, p => {
      p.appendChild(h('p', 'pt', B.name));
      const col = h('div', 'pcol');
      for (const [a, label] of boardActs(B)) { const bt = h('button', 'btn', label); bt.type = 'button'; bt.onclick = () => { closePop(); boardAct(a, B, x, y); }; col.appendChild(bt); }
      p.appendChild(col);
    });
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
  if (B.image && onDisk()) {
    try { const f = await readFile(B.image, 'boards'); if (f) { await writeBlob('templates', B.image, f); setURL(imgKey(T), f); } }
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
/* the last step of adding a board: its name, with the next free one written and selected so that typing replaces it.
   Enter, the button or a tap elsewhere adds the board; Escape or Cancel adds nothing. */
function askBoardName(place, init, x, y) {
  openPop(x, y, (p, pop) => {
    p.appendChild(h('p', 'pt', t('bName')));
    const ni = h('input', 'pin'); ni.type = 'text'; ni.value = uniqueBoardName(); ni.style.marginTop = '0'; p.appendChild(ni);
    const row = h('div', 'prow');
    const no = h('button', 'btn sm', t('cancel')); no.type = 'button'; no.onclick = () => { pop.onclose = null; closePop(); };
    const add = h('button', 'btn sm pri', t('bCreate')); add.type = 'button'; add.onclick = closePop;
    row.append(no, h('span', 'grow'), add); p.appendChild(row);
    pop.onclose = () => place(init, cleanField(ni.value));
    pop.esc = () => { pop.onclose = null; };
    ni.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
    setTimeout(() => { ni.focus(); ni.select(); }, 0);
  });
}
/* adding a board: pick what to draw on when there are templates and no default one, then name it */
function addBoardFlow(place, x, y) {
  const list = baseChoices({});
  if (!list.length || S.templates.get(S.cfg.defaultTemplate)) { askBoardName(place, undefined, x, y); return; }
  openPop(x, y, p => {
    p.appendChild(h('p', 'pt', t('pickBase')));
    const col = h('div', 'pcol');
    const add = (label, init) => { const bt = h('button', 'btn', label); bt.type = 'button'; bt.onclick = () => { closePop(); askBoardName(place, init, x, y); }; col.appendChild(bt); };
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
    sheet.appendChild(boardFig(T, w, boardActs(T)));
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
function pageStep(d) {
  if (S.mode === 'templates' || !S.pages.length) return;
  const i = clamp(currentPage() + d, 0, S.pages.length - 1);
  desk.scrollTop = Math.max(0, i * (paper().h + GAP) * S.view.zoom + wrap.offsetTop - 8);
  renderVisible();
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

/* ---------- show: the running line, the page in steps, the rail of calls, the map ---------- */
const showLine = h('div'), showBand = h('div');   // the block being spoken is lit; a small mark on its left edge is the line
showLine.id = 'showLine'; showBand.id = 'showBand';
showLine.hidden = showBand.hidden = true; spreads.append(showBand, showLine);
const SHOW_LO = 1 / 3, SHOW_HI = 2 / 3, SHOW_MORE = 3;   // where the line is put in the window, how far down it goes before the page jumps, how many calls are listed after the warnings
let showTimer = 0, showWake = null, showSig = '', showLeaveT = 0, showFrag = null, showMap = null, showTagged = new Set();
const showSpan = () => paper().h + GAP;
const showTm = s => { s = Math.ceil(s - 1e-3); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };   // a countdown: 0:01 until the cue
const showDur = ms => { const m = Math.round(ms / 60000); return m < 60 ? m + '′' : Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0'); };
const showSecs = ms => ms < 60000 ? r1(ms / 1000) + ' s' : showTm(ms / 1000);
/* where a place is on paper: [page index, y from the top of that page, the piece of the block it is in] */
function showY(pos) {
  const e = showAt(pos, 'at'); if (!e) return null;
  if (!showFrag || showFrag.src !== S.pages) {
    const m = new Map();
    S.pages.forEach((P, pi) => { for (const it of P.items) { let a = m.get(it.g); if (!a) m.set(it.g, a = []); a.push({ pi, it }); } });
    showFrag = { src: S.pages, m };
  }
  const fr = showFrag.m.get(e.g); if (!fr) return null;
  let y = clamp((pos - e.at) / e.w, 0, 1) * fr.reduce((n, f) => n + f.it.h, 0);
  for (const f of fr) { if (y <= f.it.h || f === fr[fr.length - 1]) return [f.pi, GEO.top + f.it.y + Math.min(y, f.it.h), f.it]; y -= f.it.h; }
  return null;
}
const showTop = at => (at[0] * showSpan() + at[1]) * S.view.zoom + wrap.offsetTop;
/* the place of the block being read on screen, a third of the way down the window */
function showPlaceAtView() {
  const pi = currentPage(), P = S.pages[pi];
  if (!P || desk.scrollTop < 40) return 0;
  const y = (desk.scrollTop - wrap.offsetTop + desk.clientHeight * 0.33) / S.view.zoom - pi * showSpan() - GEO.top;
  const it = P.items.find(q => q.y + q.h > y) || P.items[P.items.length - 1];
  return it ? showTl().at.get(it.g) || 0 : 0;
}
/* The page does not scroll with the line: it stands still while the line goes down the window,
   and jumps a third of the window once the line is two thirds down. y is the line in the scrolled content. */
function showFollow(y) {
  const sh = S.show, hgt = desk.clientHeight, sy = y - desk.scrollTop;
  if (sh.place || sy > SHOW_HI * hgt || sy < 0.1 * hgt) {
    desk.scrollTop = Math.max(0, Math.round(y - SHOW_LO * hgt));
    sh.place = false;
  }
  sh.top = desk.scrollTop;
}
function showTick() {
  const sh = S.show; if (!sh.on) return;
  const pos = showNow();
  if (sh.playing && pos >= showTl().total) showPlay(false);
  const at = showY(pos);
  showLine.hidden = showBand.hidden = !at;
  if (at) {
    const w = paper().w + 'px', bt = at[0] * showSpan() + GEO.top + at[2].y - 4;
    showLine.style.top = r1(at[0] * showSpan() + at[1]) + 'px';
    showBand.style.top = r1(bt) + 'px'; showBand.style.height = r1(at[2].h) + 'px'; showBand.style.width = w;
    if (sh.follow && Math.abs(desk.scrollTop - sh.top) > 2) sh.follow = false;   // the page was moved by hand: let go of the line
    if (sh.follow) showFollow(showTop(at));
  }
  renderShowSide(pos);
}
function showBack() { const sh = S.show; if (!sh.on) return; sh.follow = sh.place = true; sh.top = desk.scrollTop; showTick(); renderVisible(); }
/* shows a place of the script without moving the line: f is how far into the show, 0 to 1 */
function showLook(f) {
  const sh = S.show, at = sh.on && showY(showP(clamp(f, 0, 1) * showTl().ms)); if (!at) return;
  sh.follow = false; desk.scrollTop = Math.max(0, showTop(at) - desk.clientHeight / 3);
  renderVisible(); showTick();
}
/* shows the place of a call without moving the line; n is its turn in the panel */
function showPeek(n) {
  const sh = S.show, g = sh.on && sh.cards && sh.cards[n]; if (!g) return;
  sh.follow = false; jumpTo(g.cues[0].b); showTick();
}
function showToggle() {
  const sh = S.show; showPlay(!sh.playing);
  if (sh.playing && !sh.anchor) sh.anchor = { pos: sh.base, played: sh.played };   // the line is started where the show starts: the first mark
  showTick();
}
function showStep(d) { showHere(showStepPlace(d)); showBack(); }
/* a double tap on a word puts the line there; a single tap does nothing */
function showTap(tg) {
  const at = tg.closest('.page.script') && blockAt(tg); if (!at || !at.b) return;
  const now = Date.now(), l = S.lastTap;
  S.lastTap = { id: at.b.id, t: now };
  if (!l || l.id !== at.b.id || now - l.t > 420) return;
  S.lastTap = null; showHere(showPlace(at.b, at.wi, false)); showBack();
}
/* cues that come within 2 s of each other are one call */
function showCards(c) {
  const out = [];
  for (const k of ['go', 'standby', 'warning', 'later']) for (const o of (k === 'later' ? c.later.slice(0, 12) : c[k])) {
    const l = out[out.length - 1];
    if (l && l.k === k && Math.abs(o.s - l.s) <= 2) l.cues.push(o); else out.push({ k, s: o.s, cues: [o] });
  }
  let more = SHOW_MORE;
  return out.filter(g => g.k !== 'later' || more-- > 0);
}
/* the tag of each cue being called is marked on the page */
function showTags(c) {
  const live = new Set();
  for (const k of ['go', 'standby', 'warning']) for (const o of c[k]) {
    const tg = spreads.querySelector('.tag[data-b="' + o.b.id + '"][data-s="' + o.c.s + '"]');
    if (tg) { tg.dataset.st = k; live.add(tg); }
  }
  for (const tg of showTagged) if (!live.has(tg)) delete tg.dataset.st;
  showTagged = live;
}
/* the map of the show: a stretch per scene as long as its time, a tick per cue; built again when a time changes */
function renderShowMap() {
  const tl = showTl(), box = $('#shProg');
  if (showMap === tl) return;
  showMap = tl; box.textContent = '';
  const track = h('div', 'track');
  for (const q of tl.segs) {
    const s = h('div', 'seg' + (q.act ? ' act' : ''));
    s.style.flexGrow = Math.max(1, Math.round(q.te - q.t));
    s.title = [q.key || titleOf(), showDur(q.te - q.t)].join(' · ');
    track.appendChild(s);
  }
  box.appendChild(track);
  for (const q of S.show.cues) {
    const k = h('i', 'tick'); k.style.setProperty('--p', r1(tl.ms ? showT(q.at) / tl.ms * 100 : 0)); k.style.background = cueColour(q.c);
    box.appendChild(k);
  }
  box.append(h('div', 'done'), h('div', 'head'));
}
function renderShowSide(pos) {
  const sh = S.show, c = showCalls(), m = showMeasured(), ck = showClock(), cards = sh.cards = showCards(c);
  renderShowMap(); showTags(c);
  $('#shProg').style.setProperty('--p', r1(ck.total ? ck.at / ck.total * 100 : 0));
  const end = new Date(Date.now() + ck.left), hm = String(end.getHours()).padStart(2, '0') + ':' + String(end.getMinutes()).padStart(2, '0');
  const e = sh.learn ? showAt(pos, 'at') : null, st = sh.learn ? showStats() : null;
  const sig = [sh.playing, sh.follow, sh.tempo, sh.learn, m, sh.leave, LANG, showDur(ck.at), showDur(ck.total), showDur(ck.left), hm,
    e && e.key + e.d, sh.last && sh.last.ms, st && Math.round(st.share * 100) + '/' + st.wpm + '/' + S.cfg.show.wpm,
    ...cards.map(g => g.k + showTm(g.s) + g.cues.map(o => o.name))].join('|');
  if (sig === showSig) return;
  showSig = sig;
  $('#shPlay').textContent = sh.playing ? '‖' : '▶'; $('#shPlay').classList.toggle('on', sh.playing);
  $('#shWpm').textContent = t('shTempo', Math.round(sh.tempo * 100));
  $('#shLearn').classList.toggle('on', sh.learn);
  const use = $('#shUse'); use.textContent = t('shUse', Math.round(m * 100));
  use.hidden = sh.learn || !m || Math.abs(m - sh.tempo) < 0.03;   // while timing, what is measured goes to the blocks
  $('#shBack').hidden = sh.follow;
  $('#shLeave').textContent = t(sh.leave ? 'shLeave2' : 'shLeave');
  const clock = $('#shClock'); clock.textContent = '';
  clock.append(h('b', null, showDur(ck.at)), h('span', null, '/ ' + showDur(ck.total)), h('i', null, t('shLeft', showDur(ck.left)) + ' · ' + t('shEnds', hm)));
  $('#shLearnBox').hidden = !sh.learn;
  if (sh.learn) {
    $('#shBlk').textContent = e ? t(e.own ? 'shBlockT' : 'shBlockE', showSecs(e.d)) : '';
    $('#shLast').textContent = sh.last ? t('shTimed', showSecs(sh.last.ms), showSecs(sh.last.was)) : '';
    $('#shUndo').hidden = !sh.last; $('#shLast').parentNode.hidden = !sh.last;
    $('#shShare').textContent = t('shShare', Math.round(st.share * 100));
    const rest = $('#shRest'); rest.textContent = t('shRest', st.wpm); rest.hidden = !st.wpm || Math.abs(st.wpm - S.cfg.show.wpm) < 3;
  }
  const box = $('#shCalls'); box.textContent = '';
  for (const g of cards) {
    const card = h('div', 'call ' + g.k); card.dataset.n = box.children.length; card.title = t('shPeekTip');
    card.style.setProperty('--f', g.k === 'standby' ? r1(clamp(g.s / S.cfg.show.standby, 0, 1) * 100) / 100 : 0);
    card.append(h('b', 'st', t({ go: 'shGo', standby: 'shStandby', warning: 'shWarning', later: 'shNext' }[g.k])), h('i', 'cd', g.k === 'go' ? '' : showTm(g.s)));
    for (const o of g.cues) {
      const row = h('div', 'cue'), chip = h('span', 'chip', o.name);
      chip.style.setProperty('--c', cueColour(o.c)); chip.style.setProperty('--ct', inkOn(cueColour(o.c)));
      row.appendChild(chip);
      if (o.c.desc) row.appendChild(h('span', 'ds', o.c.desc));
      card.appendChild(row);
    }
    box.appendChild(card);
  }
  if (!box.firstChild) box.appendChild(h('div', 'call none', t('shNoCue')));
}
function showOn() {
  const sh = S.show; if (sh.on || !S.loaded) return;
  if (S.editing) { toast(t('shBusy')); return; }
  exitTemplates(); closePop(); cancelDrag(); $('#menu').hidden = true;
  if (S.drawer === 'review') toggleDrawer('review');
  Object.assign(sh, { on: true, playing: false, played: 0, anchor: null, cal: { want: 0, ms: 0 }, tempo: 1, learn: false, last: null, tl: null, leave: false });
  sh.cues = showCues(); sh.base = showPlaceAtView(); sh.t0 = Date.now();
  sh.keep = { facing: S.view.facing, fit: S.view.fit, zoom: S.view.zoom };   // focus: the script alone, as large as the window allows
  S.view.facing = false; S.view.fit = true;
  document.body.classList.add('show'); $('#showside').hidden = false; $('#shProg').hidden = false;
  applyView(); sizeWrap(); showMap = null; showSig = ''; showBack();
  showTimer = setInterval(showTick, 100);
  showAwake(); toast(t('shHint'));
}
function showOff() {
  const sh = S.show; if (!sh.on) return;
  showPlay(false);
  const pos = showNow(); sh.on = false;
  clearInterval(showTimer); clearTimeout(showLeaveT);
  if (showWake) { showWake.release().catch(() => {}); showWake = null; }
  document.body.classList.remove('show'); $('#showside').hidden = true; $('#shProg').hidden = true;
  showLine.hidden = showBand.hidden = true;
  for (const tg of showTagged) delete tg.dataset.st;
  showTagged = new Set();
  if (sh.keep) { Object.assign(S.view, sh.keep); sh.keep = null; }
  applyView(); sizeWrap();
  const at = showY(pos); if (at) desk.scrollTop = Math.max(0, showTop(at) - desk.clientHeight / 3);   // the page stays on what was being read
  renderVisible();
}
/* leaving takes two presses, so that a stray touch does not end show mode */
function showLeave() {
  const sh = S.show;
  if (sh.leave) { showOff(); return; }
  sh.leave = true; showTick();
  showLeaveT = setTimeout(() => { sh.leave = false; if (sh.on) showTick(); }, 3000);
}
function showAwake() {
  if (!S.show.on || showWake || !navigator.wakeLock || document.visibilityState !== 'visible') return;
  navigator.wakeLock.request('screen').then(w => {
    if (!S.show.on) { w.release().catch(() => {}); return; }
    showWake = w; w.addEventListener('release', () => { if (showWake === w) showWake = null; });
  }).catch(() => { /* not allowed here: the screen follows the system setting */ });
}
document.addEventListener('visibilitychange', showAwake);

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
  if (P && P.k === 'drag') { if (e.pointerId !== P.id) return; cancelDrag(); }   // a second contact never disturbs a cue being dragged
  stopMomentum();
  const tg = hit(e); if (!tg || !tg.closest) return;
  const page = tg.closest('.page'), ui = tg.closest('.pbtn,.tag');
  const isPen = e.pointerType === 'pen';
  const draws = page && !ui && !S.editing && !S.show.on && (isPen || (S.tool.finger && (e.pointerType === 'touch' || e.button === 0)));
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
  const tag = !S.editing && !S.show.on && tg.closest('.tag,.grip');
  if (tag) {   // a cue tag can be dragged to another word, a grip or a board tag moves its block; a finger must hold it first, so that a swipe still scrolls
    P.tag = tag;
    if (P.lp) { clearTimeout(P.lp); P.lp = 0; }
    if (e.pointerType === 'touch' && !nearPen) { const me = P; P.lp = setTimeout(() => { if (P === me && !me.moved && !me.nearPen) { me.held = true; tag.classList.add('lift'); } }, DRAG_HOLD); }
  }
});
window.addEventListener('pointermove', e => {
  if (e.pointerType === 'pen') {
    penSeen = Date.now();
    if (P && P.k === 'tap' && P.type === 'touch' && e.pointerId !== P.id) { clearTimeout(P.lp); P.nearPen = true; }
  }
  if (!P || e.pointerId !== P.id) return;
  if (P.k === 'tap') {
    if (!P.moved && Math.hypot(e.clientX - P.x0, e.clientY - P.y0) > 8) {
      P.moved = true; clearTimeout(P.lp);
      if (P.tag && !P.nearPen && (P.type !== 'touch' || P.held) && beginDrag(e)) return;
      if (P.tag) { P.tag.classList.remove('lift'); P.tag = null; }   // a finger that moved before the hold scrolls
    }
    if (P.moved && (P.type === 'touch' || (P.type === 'pen' && S.show.on)) && !P.nearPen) {   // in show mode the pen draws nothing, so it scrolls
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
  else if (P.k === 'drag') moveDrag(e);
});
function endPtr(e) {
  if (!P || e.pointerId !== P.id) return;
  const p = P; P = null;
  if (p.lp) clearTimeout(p.lp);
  if (p.pen) penUntil = Date.now() + 450;
  if (p.tag) p.tag.classList.remove('lift');
  if (p.k === 'drag') { endDrag(p, e.type !== 'pointercancel'); return; }
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

/* ---------- drag a cue tag to another word, or a block by its grip to another place ---------- */
const DRAG_HOLD = 300, DRAG_EDGE = 48, DRAG_REACH = 70;
function beginDrag(e) {
  if (P.tag.matches('.grip,.btag')) return beginBlockDrag(e);   // a board is moved as the line that holds it
  const tag = P.tag, b = S.byId.get(+tag.dataset.b), c = b && b.cues.find(q => q.s === +tag.dataset.s);
  if (!c || c.board || !tag.isConnected) return false;
  closePop();
  const g = tag.cloneNode(true), z = S.view.zoom;
  g.className = tag.className + ' ghost'; g.classList.remove('lift'); g.removeAttribute('title'); g.tabIndex = -1;
  g.style.cssText = 'left:0;top:0;transform-origin:0 0;transform:scale(' + z + ')'; g.style.setProperty('--c', cueColour(c));
  document.body.appendChild(g);
  tag.classList.remove('lift'); tag.classList.add('moving');
  Object.assign(P, { k: 'drag', cue: c, ghost: g, drop: null, raf: 0, pen: P.type === 'pen' });
  try { desk.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
  moveDrag(e);
  return true;
}
function beginBlockDrag(e) {
  const tag = P.tag, b = S.byId.get(+tag.dataset.b), board = tag.classList.contains('btag');
  if (!b || !tag.isConnected || (board && b.type !== 'mark')) return false;
  const row = board ? tag.closest('.page').querySelector('.row[data-b="' + b.id + '"]') : tag.closest('.row');
  if (!row) return false;
  closePop();
  const words = b.tokens.filter(q => q.k === 'w').map(q => q.text);
  const g = h('div', 'bghost ghost', (b.name ? b.name + ': ' : '') + (words.length ? words.slice(0, 8).join(' ') + (words.length > 8 ? ' \u2026' : '') : b.raw));
  document.body.appendChild(g);
  tag.classList.remove('lift'); row.classList.add('moving'); if (board) tag.classList.add('moving');
  Object.assign(P, { k: 'drag', bid: b.id, row, ghost: g, drop: null, raf: 0, pen: P.type === 'pen' });
  try { desk.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
  moveDrag(e);
  return true;
}
/* [i0, n, j] for textMoveBlocks: the group of block bid put before or after group g; null when it is there already */
function blockSpan(bid, g, after) {
  const mb = S.byId.get(bid), tb = gBlocks(g); if (!mb || !S.blocks.includes(tb[0])) return null;
  const ms = gBlocks(mb.g), i0 = S.blocks.indexOf(ms[0]), j = after ? S.blocks.indexOf(tb[tb.length - 1]) + 1 : S.blocks.indexOf(tb[0]);
  return j >= i0 && j <= i0 + ms.length ? null : [i0, ms.length, j];
}
/* where a block dropped at (x, y) would go: the nearest edge between two blocks of that script page. Never above the
   frontmatter, never inside a block that runs over two pages, and none where the block already is. */
function blockDrop(x, y) {
  const best = edgeAt(x, y);
  return best && blockSpan(P.bid, best.g, best.after) ? best : null;
}
function edgeAt(x, y) {
  const el = document.elementFromPoint(x, y), pg = el && el.closest && el.closest('.page.script'); if (!pg) return null;
  let best = null, bd = Infinity;
  for (const row of $$('.pbody > .row', pg)) {
    if (row.classList.contains('front')) continue;
    const q = row.querySelector('.tx'), b = S.byId.get(q ? +q.dataset.b : +row.dataset.b); if (!b) continue;
    const fl = q && q.dataset.off !== undefined ? (q.dataset.fl || '') : 'fl', r = row.getBoundingClientRect();
    for (const after of [false, true]) {
      if (!fl.includes(after ? 'l' : 'f')) continue;
      const ey = after ? r.bottom : r.top, d = Math.abs(y - ey);
      if (d < bd) { bd = d; best = { g: b.g, after, pg, y: ey, at: el }; }
    }
  }
  return best;
}
/* the block a line put at that edge would stand before, as an index in S.blocks */
function edgeIndex(d) {
  const tb = gBlocks(d.g);
  return d.after ? S.blocks.indexOf(tb[tb.length - 1]) + 1 : S.blocks.indexOf(tb[0]);
}
/* where a cue dropped at (x, y) would get a line of its own: in the space between two blocks (and 4 px into the text
   on either side), or on a line that holds only cues. Undefined anywhere else, where a word may be the target; null
   where the cue already is. */
function cueLineDrop(x, y) {
  const d = edgeAt(x, y); if (!d || d.at.closest('.tag') || !S.blocks.includes(gBlocks(d.g)[0])) return undefined;
  const z = pageScale(d.pg);
  if (!d.at.closest('.row.mark') && Math.abs(y - d.y + 4 * z) > 8 * z) return undefined;
  return textCueOwn(P.cue, edgeIndex(d)) === null ? null : d;
}
/* show the place a release would use: a line between two blocks, or a word in the colour of the cue */
function setDrop(d) {
  const o = P.drop;
  if (o && d && (d.pg ? o.g === d.g && o.after === d.after && o.pg === d.pg : o.el === d.el)) return;
  if (o) clearDrop(o);
  if (d && d.pg) {
    const pr = d.pg.getBoundingClientRect();
    d.el = h('div', 'dropline noprint'); d.el.style.top = r1((d.y - pr.top) / pageScale(d.pg)) + 'px';
    if (P.cue) d.el.style.background = cueColour(P.cue);
    d.pg.appendChild(d.el);
  } else if (d) { d.el.classList.add('drop'); d.el.style.setProperty('--dc', cueColour(P.cue)); }
  P.drop = d;
}
function moveDrag(e) {
  P.x = e.clientX; P.y = e.clientY;
  placeDrag();
  if (!P.raf && dragSpeed()) P.raf = requestAnimationFrame(dragScroll);
}
function placeDrag() {
  P.ghost.style.left = (P.x + 14) + 'px'; P.ghost.style.top = (P.y - 36) + 'px';
  if (P.row) { setDrop(blockDrop(P.x, P.y)); return; }
  const d = cueLineDrop(P.x, P.y);
  setDrop(d === undefined ? dropTarget(P.x, P.y) : d);
}
function clearDrop(d) { if (d.pg) d.el.remove(); else { d.el.classList.remove('drop'); d.el.style.removeProperty('--dc'); } }
/* px to scroll per frame while a cue is held near the top or bottom edge of the work area, faster nearer the edge */
function dragSpeed() {
  const r = desk.getBoundingClientRect(), a = P.y - r.top, z = r.bottom - P.y;
  const f = d => 14 * clamp((DRAG_EDGE - d) / DRAG_EDGE, 0.15, 1);
  return a < DRAG_EDGE ? -f(a) : z < DRAG_EDGE ? f(z) : 0;
}
function dragScroll() {
  if (!P || P.k !== 'drag') return;
  P.raf = 0;
  const v = dragSpeed(); if (!v) return;
  const st = desk.scrollTop; desk.scrollTop = st + v;
  if (desk.scrollTop !== st) { renderVisible(); placeDrag(); }
  P.raf = requestAnimationFrame(dragScroll);
}
/* the word a cue dropped at (x, y) would follow: the word under the pointer, else the nearest word of the nearest
   line of text on that script page; none on the tag being dragged, far from any text or off the script pages */
function dropTarget(x, y) {
  const el = document.elementFromPoint(x, y); if (!el || !el.closest || el.closest('.tag.moving')) return null;
  const pg = el.closest('.page.script'); if (!pg) return null;
  const dist = (r, px, py) => Math.hypot(Math.max(r.left - px, 0, px - r.right), Math.max(r.top - py, 0, py - r.bottom));
  let w = el.closest('.w'), tx = w && w.closest('.tx');
  if (!tx) {
    w = null; let best = Infinity, bx = Infinity;
    for (const q of $$('.tx', pg)) {
      if (!S.byId.has(+q.dataset.b) || !q.querySelector('.w')) continue;
      const r = q.getBoundingClientRect(), dy = Math.max(r.top - y, 0, y - r.bottom), dx = Math.max(r.left - x, 0, x - r.right);
      if (dy < best || (dy === best && dx < bx)) { best = dy; bx = dx; tx = q; }
    }
    if (!tx) return null;
    best = Infinity;
    for (const q of $$('.w', tx)) for (const r of q.getClientRects()) { const d = dist(r, x, y); if (d < best) { best = d; w = q; } }
    if (!w || best > DRAG_REACH * S.view.zoom) return null;
  }
  const b = S.byId.get(+tx.dataset.b), wi = +w.dataset.i;
  return b && b.tokens[wi] && b.tokens[wi].k === 'w' ? { b, wi, el: w } : null;
}
function endDrag(p, commit) {
  if (p.raf) cancelAnimationFrame(p.raf);
  p.ghost.remove(); p.tag.classList.remove('moving', 'lift');
  if (p.row) p.row.classList.remove('moving');
  if (p.drop) clearDrop(p.drop);
  S.lastTap = null;   // the next tap is not the second half of a double tap
  if (!commit || !p.drop) return;
  if (p.row) {
    const sp = blockSpan(p.bid, p.drop.g, p.drop.after), nt = sp && textMoveBlocks(sp[0], sp[1], sp[2]), n = S.pairs.length;
    if (nt && commitText(nt)) { if (S.pairs.length < n) toast(t('blockUnpaired')); const nb = S.byId.get(p.bid); if (nb) jumpTo(nb, true); }
    return;
  }
  /* looked up again: the script may have been parsed anew while the tag was in the air */
  const b = S.byId.get(+p.tag.dataset.b), c = b && b.cues.find(q => q.s === +p.tag.dataset.s);
  const tb = p.drop.pg ? null : S.byId.get(p.drop.b.id), ok = c && !c.board;
  const nt = !ok ? null : p.drop.pg ? (S.blocks.includes(gBlocks(p.drop.g)[0]) ? textCueOwn(c, edgeIndex(p.drop)) : null) : tb === p.drop.b ? textMoveCue(c, tb, p.drop.wi) : null;
  if (nt) { const n = S.pairs.length; if (commitText(nt) && S.pairs.length < n) toast(t('moveUnpaired')); }
}
function cancelDrag() { if (P && P.k === 'drag') { const p = P; P = null; endDrag(p, false); } }

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
  if (at && at.b && !S.editing && !S.show.on) editGroup(at.b.g);
}
function handleTap(tg, x, y) {
  if (!tg || !tg.closest || S.editing || !tg.closest('.page')) return;
  if (S.show.on) { showTap(tg); return; }   // show mode is read only: a tap pins and opens nothing
  const act = tg.closest('[data-act]'); if (act) { boardAction(act, x, y); return; }
  if (tg.closest('.grip')) return;   // a grip is only for dragging
  const tag = tg.closest('.tag');
  if (tag) {
    const b = S.byId.get(+tag.dataset.b), c = b && b.cues.find(q => q.s === +tag.dataset.s);
    if (c) { if (c.board) openBoardPop(b, c, x, y); else openCueEdit(b, c, x, y); }
    return;
  }
  const cmk = tg.closest('.cmk'); if (cmk) { const b = S.byId.get(+cmk.dataset.b); if (b) openNotePop(b, x, y); return; }
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
  const el = $('#pop'), a = document.activeElement;
  el.hidden = true;
  if (a && el.contains(a)) a.blur();   // a field of a closed box kept the focus for a moment, and the keys with it: Ctrl+Z right after Enter did nothing
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
  const en = c.end ? null : c.endRef;   // a cue takes its end token with it; a cue that links to it only loses the link
  if (en && en.end) edits.push({ b: en.b, s: en.s, e: en.e, text: null });
  else if (en) edits.push({ b: en.b, s: en.s, e: en.e, text: fmtToken(en.dept, en.label, en.desc, false, en.links.filter(l => l.ref !== c), en.notes) });
  commitText(textEdits(edits));
}
/* Cues that an end placed after word wi of block b (or on its own line after b) could close, most
   recent first. A cue is offered only if the end token would really pair with it: the latest open cue
   of its department, or an earlier one whose number no later open cue of that department repeats. */
function openCuesAt(b, wi, own) {
  const stop = own || wi < 0 ? lastOfGroup(b) : b, open = [];
  for (const q of S.blocks) {
    for (const c of q.cues) {
      if (c.board || c.end || c.endRef || isReview(c.dept)) continue;
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
  return out.sort((x, z) => z.ord - x.ord).slice(0, 4);
}
function lastLabelBefore(b, c, dept) {
  let last = ''; dept = dept || c.dept;
  for (const x of S.blocks) {
    for (const q of x.cues) { if (x === b && q === c) return last; if (q.dept === dept && q.label && !q.end) last = q.label; }
    if (x === b) break;
  }
  return last;
}
/* the number a new cue gets when its field is left blank: the last one of its department before it, plus one */
function nextLabel(b, c, dept) {
  if (isReview(dept)) return '';
  const last = lastLabelBefore(b, c, dept);
  if (!last) return '1';
  let m = /^(.*?)(\d+)$/.exec(last); if (m) return m[1] + (+m[2] + 1);
  m = /^(\d+)/.exec(last); return m ? String(+m[1] + 1) : '';
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
    const place = (tok, fresh) => {
      closePop(); S.lastTap = null;   // the next tap on this line is a new pin, not a double tap
      const r = own ? insertOwnCue(b, tok) : insertWordCue(b, wi, tok);
      if (r) openCueEdit(r.b, r.c, x, y, fresh && S.hist[S.hist.length - 1]);
    };
    const pin = code => place(fmtToken(code, '', ''), true);
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
    const bb = h('button', 'btn sm', t('boardHere')); bb.type = 'button'; bb.onclick = () => { closePop(); if (pageFull(pageIndexOf(lastOfGroup(b))[0])) return; addBoardFlow((init, name) => addBoardAfter(b, init, name), x, y); };
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
/* fresh: the cue was pinned just now (the undo step that placed it), so a number left blank becomes
   the next one of its department, and the whole pin stays one undo */
function openCueEdit(b, c, x, y, fresh) {
  const bid = b.id, cs = c.s; let dept = c.dept;
  openPop(x, y, (p, pop) => {
    const li = h('input', 'pin'), di = h('input', 'pin'), ni = h('textarea', 'pin');
    li.type = 'text'; di.type = 'text'; li.value = c.label; di.value = c.desc; ni.value = c.notes; ni.rows = 3; ni.style.padding = '6px 8px';
    const setPh = () => {
      const nb = S.byId.get(bid), nc = nb && nb.cues.find(q => q.s === cs), last = nc && !c.end ? lastLabelBefore(nb, nc, dept) : '', nx = nc && fresh ? nextLabel(nb, nc, dept) : '';
      li.placeholder = t('label') + (nx ? ' (' + t('nextLabel', nx) + ')' : last ? ' (' + t('lastLabel', last) + ')' : '');
    };
    /* a note for the cast: the label is who it is for, picked from the speakers of the script */
    const who = h('div', 'who');
    const fillWho = () => {
      const cast = isCast(dept); who.hidden = !cast; who.textContent = '';
      di.placeholder = cast ? t('caNote') : t('desc'); ni.placeholder = cast ? t('hasNotes') : t('notes');
      if (!cast) return;
      /* left blank, the note is for whoever speaks the block; "Everyone" and the names say otherwise */
      const nb = S.byId.get(bid), all = t('caEveryone').toUpperCase();
      li.placeholder = t('caFor', (nb && castSpeaker(nb)) || t('caEveryone'));
      const names = S.meta && S.meta.chars.length ? S.meta.chars.map(q => q.name) : Array.from(new Set(S.blocks.filter(q => q.type === 'speech' && !NAME_SEP.test(q.name)).map(q => q.name)));
      const cur = () => li.value.split(/\s*[,;]\s*/).map(normName).filter(Boolean), btns = [];
      for (const nm of [all].concat(names)) {
        const bt = h('button', 'chip', nm === all ? t('caEveryone') : nm); bt.type = 'button';
        bt.onclick = () => {
          let l = cur();
          if (nm === all) l = l.includes(all) ? [] : [all]; else { rm(l, all); if (rm(l, nm) < 0) l.push(nm); }
          li.value = l.join(', '); lit(); di.focus({ preventScroll: true });
        };
        btns.push([bt, nm]); who.appendChild(bt);
      }
      const lit = () => { const l = cur(); for (const [bt, nm] of btns) bt.classList.toggle('on', l.includes(nm)); };
      lit();
    };
    setPh(); fillWho();
    if (c.end) p.appendChild(h('p', 'pt', c.startRef ? t('endTitle', cueName(c.startRef) + (c.startRef.desc ? ' — ' + c.startRef.desc : '')) : t('endLoose')));
    else if (c.links.length) p.appendChild(h('p', 'pt', t('linkTitle', c.links.map(cueName).join(', '))));
    const apply = () => {
      const nb = S.byId.get(bid), nc = nb && nb.cues.find(q => q.s === cs); if (!nc) return;
      let nl = cleanField(li.value); const nd = cleanField(di.value), nn = cleanField(ni.value);
      if (fresh && !S.hist.includes(fresh)) fresh = null;   // the pin itself was undone
      if (fresh && !nl && !nc.end) nl = nextLabel(nb, nc, dept);
      if (nl === nc.label && nd === nc.desc && nn === nc.notes && dept === nc.dept) return;
      const edits = [{ b: nb, s: nc.s, e: nc.e, text: fmtToken(dept, nl, nd, nc.end, nc.links, nn) }];
      const en = nc.end ? null : nc.endRef;   // a renamed cue keeps its end: the end follows in the same step
      if (en && (dept !== nc.dept || nl !== nc.label)) {
        if (en.end) edits.push({ b: en.b, s: en.s, e: en.e, text: fmtToken(dept, en.label ? nl : '', en.desc, true, [], en.notes) });
        else edits.push({ b: en.b, s: en.s, e: en.e, text: fmtToken(en.dept, en.label, en.desc, false,
          en.links.map(l => l.ref === nc ? { dept, label: l.label ? nl : '' } : l), en.notes) });
      }
      if (commitText(textEdits(edits)) && fresh && S.hist[S.hist.length - 2] === fresh) {
        const b2 = S.hist.pop(), a2 = S.hist.pop();
        S.hist.push(fresh = { undo: () => { b2.undo(); a2.undo(); }, redo: () => { a2.redo(); b2.redo(); } });
      }
    };
    /* an end token becomes a cue that ends the same cue, and back */
    const convert = text => {
      pop.onclose = null; closePop();
      const nb = S.byId.get(bid), nc = nb && nb.cues.find(q => q.s === cs); if (!nc) return;
      commitText(textEdits([{ b: nb, s: nc.s, e: nc.e, text: text(nc) }]));
      const b2 = S.byId.get(bid), c2 = b2 && b2.cues.find(q => q.s === cs); if (c2) openCueEdit(b2, c2, x, y);
    };
    p.appendChild(deptButtons('small', dept, code => { dept = code; apply(); setPh(); fillWho(); }));
    p.append(li, who, di, ni);
    const row = h('div', 'prow');
    const del = h('button', 'btn sm danger', t('del')); del.type = 'button'; del.title = t('del') + '  (Del)';
    del.onclick = () => { pop.onclose = null; closePop(); removeCue(bid, cs); };
    const done = h('button', 'btn sm pri', t('done')); done.type = 'button'; done.onclick = closePop;
    row.append(del, h('span', 'grow'), done);
    if (c.end && c.startRef) {
      const mk = h('button', 'btn sm', t('makeCue')); mk.type = 'button';
      mk.onclick = () => convert(nc => fmtToken(c.startRef.dept, '', cleanField(di.value), false, [{ dept: c.startRef.dept, label: nc.label }], cleanField(ni.value)));
      const r2 = h('div', 'prow'); r2.append(mk); p.appendChild(r2);
    } else if (c.links.length) {
      const pl = h('button', 'btn sm', t('plainEnd')); pl.type = 'button';
      pl.onclick = () => convert(() => fmtToken(c.links[0].dept, c.links[0].label, cleanField(di.value), true, [], cleanField(ni.value)));
      const r2 = h('div', 'prow'); r2.append(pl); p.appendChild(r2);
    }
    p.appendChild(row);
    pop.onclose = apply;
    for (const inp of [li, di, ni]) inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
    pop.key = ev => {
      if (ev.key === 'Enter') { closePop(); return true; }   // nothing typed: Enter accepts the cue as it is
      if (ev.key === 'Delete') { del.click(); return true; }   // the cursor is in no field: Delete is for the cue, not for a letter
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.key.length !== 1) return false;
      if (document.activeElement === li || document.activeElement === di || document.activeElement === ni) return false;
      li.focus(); return false;   // let the key land in the label field
    };
    /* a cue just pinned: the number fills itself, so the cursor waits in the margin text; Tab goes on to the description */
    if (fresh) di.focus({ preventScroll: true });
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
      moveBoard(oldName, nm);
      if (!commitText(textWith(S.blocks.indexOf(nb), 1, nb.raw.slice(0, nc.s) + '{BOARD ' + nm + '}' + nb.raw.slice(nc.e)))) { moveBoard(nm, oldName); return; }
      /* one undo step for the token and the drawing: the step commitText just made also carries the board back and forth */
      const op = S.hist[S.hist.length - 1], un = op.undo, re = op.redo;
      op.undo = () => { moveBoard(nm, oldName); un(); }; op.redo = () => { moveBoard(oldName, nm); re(); };
    };
    const row = h('div', 'prow');
    const del = h('button', 'btn sm danger', t('del')); del.type = 'button'; del.title = t('del') + '  (Del)'; del.onclick = () => { pop.onclose = null; closePop(); removeCue(bid, cs); };
    pop.key = ev => { if (ev.key === 'Delete') { del.click(); return true; } return false; };
    const done = h('button', 'btn sm pri', t('done')); done.type = 'button'; done.onclick = closePop;
    row.append(del, h('span', 'grow'), done); p.appendChild(row);
    pop.onclose = apply;
    ni.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closePop(); } });
  });
}
function openNotePop(b, x, y) {
  const id = b.id;
  openPop(x, y, p => {
    p.appendChild(h('p', 'pt', t('noteTitle')));
    p.appendChild(h('pre', 'ntx', b.inner));
    const row = h('div', 'prow');
    const ed = h('button', 'btn sm', t('editText')); ed.type = 'button';
    ed.onclick = () => { closePop(); const nb = S.byId.get(id); if (nb) editGroup(nb.g); };
    const back = h('button', 'btn sm pri', t('noteBack')); back.type = 'button';
    back.onclick = () => { closePop(); const nb = S.byId.get(id); if (nb && nb.type === 'note') commitText(textWith(S.blocks.indexOf(nb), 1, nb.inner)); };
    row.append(ed, h('span', 'grow'), back); p.appendChild(row);
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
  const isNote = bs.length === 1 && bs[0].type === 'note';   // set the text aside without losing it, or bring it back
  const cm = h('button', 'btn sm', t(isNote ? 'noteBack' : 'noteOut')); cm.type = 'button';
  row2.append(hint, h('span', 'grow'), cm, cancel, save);
  ed.append(ta, row2);
  const w = clamp(rr.width * 0.8, 420, window.innerWidth - 16);
  ed.style.width = w + 'px';
  ed.style.left = clamp(rr.left, 8, window.innerWidth - w - 8) + 'px';
  const fit = () => { ta.style.height = 'auto'; ta.style.height = clamp(ta.scrollHeight + 4, 70, window.innerHeight * 0.6) + 'px'; };
  fit();
  ed.style.top = clamp(rr.top - 9, 8, Math.max(8, window.innerHeight - ed.offsetHeight - 8)) + 'px';
  const close = () => { ed.hidden = true; ed.textContent = ''; S.editing = false; };
  cancel.onclick = close;
  cm.onclick = () => { const v = ta.value; close(); commitText(textWith(i0, bs.length, isNote ? uncomment(v) : commentOut(v))); };
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
/* One row per cue. A cue's end is carried on its row; an end that closes nothing gets a row of its own.
   review: the notes of the review departments instead of the cues. */
function collectCues(review) {
  const out = [], bl = S.blocks, idx = new Map(bl.map((b, i) => [b, i]));
  const neigh = (i, dir) => { for (let k = i + dir; k >= 0 && k < bl.length; k += dir) if (!noInk(bl[k])) return bl[k]; return null; };
  const where = c => {
    const b = c.b, i = idx.get(b); let ctx, who = b.name, line = null;
    if (c.wi >= 0) {   // the cue word with two words on each side
      const ws = b.tokens, pre = [], post = []; let k;
      for (k = c.wi - 1; k >= 0 && pre.length < 2; k--) if (ws[k].k === 'w') pre.unshift(ws[k].text);
      if (ws.slice(0, k + 1).some(q => q.k === 'w')) pre.unshift('…');
      for (k = c.wi + 1; k < ws.length && post.length < 2; k++) if (ws[k].k === 'w') post.push(ws[k].text);
      if (ws.slice(k).some(q => q.k === 'w')) post.push('…');
      line = { pre: pre.join(' '), word: ws[c.wi].text, post: post.join(' ') };
      ctx = [line.pre, '[' + line.word + ']', line.post].filter(Boolean).join(' ');
    } else {
      const pv = neigh(i, -1), nx = neigh(i, 1);
      ctx = (pv ? '…' + wordsOf(pv).slice(-5).join(' ') + ' ' : '') + '▸' + (nx ? ' ' + (nx.name ? nx.name + ': ' : '') + wordsOf(nx).slice(0, 3).join(' ') + '…' : '');
      who = '';
    }
    return { ctx: ctx.trim(), line, who, page: pl(c.page || b.page) };
  };
  for (const b of bl) for (const c of b.cues) {
    if (c.board || (c.end && c.startRef) || isReview(c.dept) !== !!review) continue;
    const o = Object.assign({ b, c, act: b.act, scene: b.scene, loose: !!c.end, end: null, endedBy: null }, where(c));
    if (c.endRef) { o.end = Object.assign({ c: c.endRef }, where(c.endRef)); if (!c.endRef.end) o.endedBy = c.endRef; }
    out.push(o);
  }
  const seen = new Map();
  for (const o of out) if (o.c.label && !o.loose) { const k = o.c.dept + '\u0001' + o.c.label; seen.set(k, (seen.get(k) || 0) + 1); }
  for (const o of out) o.dup = !o.loose && !!o.c.label && seen.get(o.c.dept + '\u0001' + o.c.label) > 1;
  const odd = review ? new Set() : cuesOutOfOrder(out.map(o => o.c));
  for (const o of out) o.outOrder = odd.has(o.c);
  return out;
}
function reviewData() {
  const paras = [], amps = [], flagged = [], unk = [], chars = new Map(), ends = [], notes = [], todos = collectCues(true);
  const cast = S.meta && S.meta.set.size ? S.meta.set : null, noChar = new Map(), spoke = new Set();
  for (const b of S.blocks) {
    for (const c of b.cues) {
      if (c.board) continue;
      if (c.end ? !c.startRef : c.unresolved.length) ends.push({ b, c });
    }
    if (b.type === 'para') paras.push(b);
    if (b.type === 'note') notes.push(b);
    if (b.type === 'speech') {
      chars.set(b.name, (chars.get(b.name) || 0) + 1);
      if (cast) {
        const ck = castCheck(b.name, cast);
        for (const n of ck.used) spoke.add(n);
        for (const n of ck.unknown) { const o = noChar.get(n); if (o) o.n++; else noChar.set(n, { name: n, n: 1, b }); }
      }
      if (b.simul && b.g.kind === 'single') amps.push(b);
    }
    if (inkFlag(b)) flagged.push(b);
    for (const c of b.cues) if (!c.board && !deptOf(c.dept)) unk.push({ b, c });
  }
  const silent = cast ? S.meta.chars.filter(c => !spoke.has(c.name)).map(c => c.name) : [];
  return { paras, amps, flagged, unk, chars, ends, notes, todos, noChar: Array.from(noChar.values()), silent, orphans: S.orphans,
    count: todos.length + paras.length + amps.length + flagged.length + unk.length + ends.length + noChar.size + S.orphans.length };
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
    const o = h('option', null, (b.level === 2 ? '   ' : '') + b.title + (b.page ? '  · ' + pl(b.page) : '')); o.value = b.id; sel.appendChild(o);
  }
}
function updPanels() {
  updOutline(); updReview();
  if (S.drawer === 'cues') renderDrawer();
  $('#showName').textContent = titleOf() || S.store.name || t('untitled');
  document.title = (titleOf() || S.store.name || 'Promptbook') + ' — Promptbook';
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
  const endNotes = o => o.end && !o.endedBy ? o.end.c.notes : '';
  const long = list.some(o => o.c.notes || endNotes(o));   // the description column appears only when something fills it
  for (const k of ['thDept', 'thNo', 'thDesc', 'thNotes', 'thWhere', 'thLine', 'thPage']) if (long || k !== 'thNotes') hr.appendChild(h('th', null, t(k)));
  tb.appendChild(hr);
  for (const o of list) {
    const tr = h('tr', clickable ? 'cr' : ''), d = h('td', 'dp', o.c.dept);
    d.style.setProperty('--c', cueColour(o.c)); tr.appendChild(d);
    const n = h('td', o.dup || o.loose || o.outOrder ? 'dupe' + (o.outOrder ? ' outord' : '') : '', (o.loose ? '\u25A0 ' : '') + o.c.label); if (o.dup || o.outOrder) n.title = [o.dup && t('dup'), o.outOrder && t('outOrder')].filter(Boolean).join('\n'); if (o.loose) n.title = t('endLoose'); tr.appendChild(n);
    const dc = h('td', null, o.c.desc);
    if (o.c.links.length) dc.appendChild(h('div', 'endl', '\u25A0 ' + t('endsCue', o.c.links.map(cueName).join(', '))));
    if (o.end) dc.appendChild(h('div', 'endl', '\u25A0 ' + t('endsAt', o.end.page) + (o.endedBy ? ' ' + t('endedBy', cueName(o.endedBy)) : '') + (o.end.c.desc && !o.endedBy ? ' — ' + o.end.c.desc : '') + ' · ' + (o.end.who ? o.end.who + ': ' : '') + o.end.ctx));
    tr.appendChild(dc);
    if (long) {
      const nc = h('td');
      if (o.c.notes) nc.appendChild(h('div', 'notes', o.c.notes));
      if (endNotes(o)) nc.appendChild(h('div', 'notes', '\u25A0 ' + endNotes(o)));
      tr.appendChild(nc);
    }
    tr.appendChild(h('td', 'ctx', [o.act, o.scene].filter(Boolean).join(' · ')));
    const lc = h('td', 'ctx', o.who ? o.who + ': ' : '');
    if (o.line) {   // the cue word boxed as on the page
      const cw = h('b', 'cw', o.line.word); cw.style.setProperty('--c', cueColour(o.c));
      lc.append(o.line.pre ? o.line.pre + ' ' : '', cw, o.line.post ? ' ' + o.line.post : '');
    } else lc.append(o.ctx);
    tr.appendChild(lc);
    tr.appendChild(h('td', null, String(o.page)));
    if (clickable) tr.onclick = () => jumpTo(o.b);
    tb.appendChild(tr);
  }
  return tb;
}
function filteredCues() { const all = collectCues(); return S.cueFilter ? all.filter(o => o.c.dept === S.cueFilter) : all; }
function renderDrawer() {
  const dr = $('#drawer'); dr.textContent = ''; let wide = false;
  const head = h('div', 'dhead'), body = h('div', 'dbody');
  const x = h('button', 'btn sm', '✕'); x.type = 'button'; x.title = t('close'); x.onclick = () => toggleDrawer(S.drawer);
  if (S.drawer === 'cues') {
    const all = collectCues();
    head.appendChild(h('h2', null, t('cueList') + ' (' + all.length + ')'));
    const csv = h('button', 'btn sm', t('csv')); csv.type = 'button'; csv.onclick = exportCSV;
    const pr = h('button', 'btn sm', t('print')); pr.type = 'button'; pr.onclick = () => doPrint('cues');
    const csvD = h('button', 'btn sm', t('csvDept')); csvD.type = 'button'; csvD.onclick = exportCSVByDept;
    const prD = h('button', 'btn sm', t('printDept')); prD.type = 'button'; prD.onclick = () => doPrint('cues', true);
    head.append(csv, csvD, pr, prD, x);
    const chips = h('div', 'chips');
    const codes = [null].concat(S.cfg.departments.filter(d => !d.review).map(d => d.code));
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
    wide = !!body.querySelector('.notes');
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
    /* notes left during the rehearsal, then those for the actors; the tick removes the note from the script */
    for (const [title, list] of [[t('rvTodo'), rv.todos.filter(o => !isCast(o.c.dept))], [t('rvCast'), rv.todos.filter(o => isCast(o.c.dept))]]) {
      if (!list.length) continue;
      body.appendChild(h('h3', null, title + ' (' + list.length + ')'));
      for (const o of list) {
        const r = h('div', 'todo'), bt = h('button', 'it', (o.page ? 'p. ' + o.page + ' — ' : '') + snip([o.c.label, o.c.desc, o.c.notes].filter(Boolean).join(' — ') || o.c.dept) + '  · ' + (o.who ? o.who + ': ' : '') + o.ctx);
        bt.type = 'button'; bt.style.setProperty('--c', cueColour(o.c)); bt.onclick = () => jumpTo(o.b);
        const ok = h('button', 'btn sm', '\u2713'); ok.type = 'button'; ok.title = t('done'); ok.onclick = () => removeCue(o.b.id, o.c.s);
        r.append(bt, ok); body.appendChild(r);
      }
    }
    sec(t('rvPara'), t('rvParaHint'), rv.paras, b => (b.page ? 'p. ' + pl(b.page) + ' — ' : '') + snip(b.plain), b => jumpTo(b));
    sec(t('rvAmp'), '', rv.amps, b => snip(b.plain), b => jumpTo(b));
    sec(t('rvNoChar'), t('rvNoCharHint'), rv.noChar, o => o.name + '  ×' + o.n + (o.b.page ? ' — p. ' + pl(o.b.page) : ''), o => jumpTo(o.b));
    sec(t('rvInk'), '', rv.flagged, b => (b.page ? 'p. ' + pl(b.page) + ' — ' : '') + snip(b.plain), b => jumpTo(b));
    sec(t('rvUnk'), '', rv.unk, o => o.c.dept + ' ' + o.c.label + ' — ' + snip(o.b.plain || o.c.desc), o => jumpTo(o.b));
    sec(t('rvEnd'), '', rv.ends, o => '\u25A0 ' + (o.c.end ? cueName(o.c) : t('linkLoose', o.c.unresolved.map(cueName).join(', ') + ' ← ' + cueName(o.c))) + (o.c.page ? ' — p. ' + pl(o.c.page) : ''), o => jumpTo(o.b));
    sec(t('rvOrph'), '', rv.orphans, o => '✕  ' + snip(o.text), o => {
      const k = rm(S.orphans, o); if (k < 0) return;
      pushHist({ undo: () => { S.orphans.splice(k, 0, o); inkChanged(); }, redo: () => { rm(S.orphans, o); inkChanged(); } });
      inkChanged();
    });
    sec(t('rvNote'), t('rvNoteHint'), rv.notes, b => (b.page ? 'p. ' + pl(b.page) + ' — ' : '') + snip(b.inner.replace(/\s*\n\s*/g, ' / ')), b => jumpTo(b));
    if (rv.chars.size) {
      body.appendChild(h('h3', null, t('rvChars') + ' (' + rv.chars.size + ')'));
      body.appendChild(h('p', 'hint', t('rvCharsHint')));
      const cw = h('div', 'chars');
      for (const [nm, n] of Array.from(rv.chars).sort((a, b) => b[1] - a[1])) { const sp = h('span', n === 1 ? 'one' : '', nm + ' '); sp.appendChild(h('b', null, '×' + n)); cw.appendChild(sp); }
      body.appendChild(cw);
    }
    if (rv.silent.length) {
      body.appendChild(h('h3', null, t('rvSilent') + ' (' + rv.silent.length + ')'));
      const cw = h('div', 'chars'); for (const nm of rv.silent) cw.appendChild(h('span', null, nm));
      body.appendChild(cw);
    }
  }
  dr.append(head, body);
  if (dr.classList.contains('wide') !== wide) { dr.classList.toggle('wide', wide); sizeWrap(); renderVisible(); }
}
function csvText(list) {
  const sep = (1.1).toLocaleString().includes(',') ? ';' : ',';
  const q = v => { v = String(v == null ? '' : v); return /["\n\r;,]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [[t('thDept'), t('thNo'), t('thDesc'), t('thAct'), t('thScene'), t('thWho'), t('thLine'), t('thPage'), t('thEndPage'), t('thEndLine'), t('thEndDesc'), t('thEndedBy'), t('thEnds'), t('thNotes')]];
  for (const o of list) rows.push([o.c.dept, (o.loose ? '/' : '') + o.c.label, o.c.desc, o.act, o.scene, o.who, o.ctx, o.page,
    o.end ? o.end.page : '', o.end ? (o.end.who ? o.end.who + ': ' : '') + o.end.ctx : '', o.end ? o.end.c.desc + (o.endedBy || !o.end.c.notes ? '' : (o.end.c.desc ? ' — ' : '') + o.end.c.notes) : '',
    o.endedBy ? cueName(o.endedBy) : '', o.c.links.map(cueName).join('; '), o.c.notes]);
  return '\uFEFF' + rows.map(r => r.map(q).join(sep)).join('\r\n') + '\r\n';
}
function exportCSV() {
  download('cues' + (S.cueFilter ? '-' + S.cueFilter : '') + '.csv', new Blob([csvText(filteredCues())], { type: 'text/csv' }));
}
/* the cue list split by department, in the order of Settings; departments with no cues are left out */
function cuesByDept() {
  const all = collectCues(), codes = S.cfg.departments.filter(d => !d.review).map(d => d.code);
  for (const o of all) if (!codes.includes(o.c.dept)) codes.push(o.c.dept);
  return codes.map(code => [code, all.filter(o => o.c.dept === code)]).filter(g => g[1].length);
}
async function exportCSVByDept() {
  const groups = cuesByDept(); if (!groups.length) { toast(t('noCues')); return; }
  const files = new Map();
  for (const [code, list] of groups) files.set('cues-' + code.replace(/[^\p{L}\p{N}_-]/gu, '_') + '.csv', new Blob([csvText(list)], { type: 'text/csv' }));
  download('cues.zip', await buildZip(files));
}
function download(name, blob) {
  const a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function doPrint(kind, byDept, changed) {
  exitTemplates();
  document.body.classList.remove('pr-book', 'pr-script', 'pr-cues', 'pr-changed');
  if (changed) document.body.classList.add('pr-changed');   // only the pages that differ from the locked ones
  document.body.classList.add('pr-' + kind);
  if (kind === 'cues') {
    const cp = $('#cuePrint'); cp.textContent = '';
    const head = code => (titleOf() ? titleOf() + ' — ' : '') + t('cueList') + (code ? ' · ' + code : '');
    if (byDept) for (const [code, list] of cuesByDept()) {   // one sheet per department
      const sec = h('section', 'dsec'); sec.append(h('h1', null, head(code)), cueTable(list, false)); cp.appendChild(sec);
    } else cp.append(h('h1', null, head(S.cueFilter)), cueTable(filteredCues(), false));
  } else renderAll();
  window.print();
}
window.addEventListener('beforeprint', () => {
  const c = document.body.classList;
  if (!c.contains('pr-book') && !c.contains('pr-script') && !c.contains('pr-cues')) c.add('pr-book');
  if (!c.contains('pr-cues')) renderAll();
});
window.addEventListener('afterprint', () => document.body.classList.remove('pr-book', 'pr-script', 'pr-cues', 'pr-changed'));

let toastT = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }
