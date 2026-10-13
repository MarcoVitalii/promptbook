// Damaged files: what the zip reader and the history reader do with a show file that a failing disk, a copy cut short or another program left behind.
// Every archive here is first written by the tool (PB.buildZip, PB.histSave), then bytes are flipped or cut. Private browser files stand in for the file dialogs.
const { ok, open, serve } = require('./_util');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const OUT = process.env.OUT || os.tmpdir();
const LINES = Array.from({ length: 12 }, (x, k) => (k % 2 ? 'MARCO' : 'ANNA') + ': Battuta numero ' + (k + 1) + ' della prova di stasera.');
const SCRIPT = '# ATTO\n\n' + LINES.join('\n') + '\n{BOARD Pianta}\n';
(async () => {
  const { srv, url } = await serve();
  const { page, errs, done } = await open({ url });
  const ev = (fn, a) => page.evaluate(fn, a);
  const allSaved = () => page.waitForFunction(() => { const s = PB.S.store, d = s.dirty; return !s.saving && !d.script && !d.ink && !d.cfg && !d.boards.size && !d.tpls.size; });
  const toastNow = () => ev(() => { const el = document.querySelector('#toast'); return el.hidden ? '' : el.textContent; });
  const toastUp = () => page.waitForFunction(() => !document.querySelector('#toast').hidden);
  const hush = () => ev(() => { document.querySelector('#toast').hidden = true; });
  const banner = () => ev(() => { const b = document.querySelector('#banner'); return b.hidden ? '' : b.textContent; });
  const menu = async label => { await page.locator('#bMenu').click(); await page.locator('#menu button', { hasText: label }).click(); };

  // helpers that live in the page: T.dir finds the fields of an archive, T.read and T.open say what the tool makes of it
  await ev(() => {
    const T = window.T = {}, enc = new TextEncoder(), dec = new TextDecoder();
    const pipe = async (u, s) => new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(s)).arrayBuffer());
    T.u8 = async blob => new Uint8Array(await blob.arrayBuffer());
    T.zip = async parts => T.u8(await PB.buildZip(new Map(parts.map(([k, v]) => [k, new Blob([v])]))));
    T.dir = u => {
      const v = new DataView(u.buffer, u.byteOffset, u.byteLength), end = u.length - 22, n = v.getUint16(end + 10, true), cd = v.getUint32(end + 16, true), out = { end, cd, n, list: [] };
      for (let i = 0, p = cd; i < n; i++) {
        const nl = v.getUint16(p + 28, true), lo = v.getUint32(p + 42, true), e = { name: dec.decode(u.subarray(p + 46, p + 46 + nl)), p, lo, nl, method: v.getUint16(p + 10, true), crc: v.getUint32(p + 16, true), csz: v.getUint32(p + 20, true), usz: v.getUint32(p + 24, true), data: lo + 30 + nl };
        out.list.push(e); out[e.name] = e; p += 46 + nl;
      }
      return out;
    };
    T.set16 = (u, at, x) => { new DataView(u.buffer).setUint16(at, x, true); return u; };
    T.set32 = (u, at, x) => { new DataView(u.buffer).setUint32(at, x, true); return u; };
    T.within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r('HANG'), ms || 8000))]);   // never a wait without end
    T.read = u => T.within(PB.readZip(new Blob([u])).then(async m => { const o = {}; for (const [k, b] of m) o[k] = await b.text(); return { files: o }; }, e => ({ err: e.message })));
    T.put = async (name, u) => { const fh = await (await navigator.storage.getDirectory()).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(u); await w.close(); return fh; };
    T.open = async (name, u) => { const fh = await T.put(name, u); window.showOpenFilePicker = async () => [fh]; return T.within(PB.openZipFile()); };
    T.bytes = async name => T.u8(await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile());
    T.same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    T.inZip = async name => { const m = await PB.readZip(new Blob([await T.bytes(name)])), o = {}; for (const [k, b] of m) o[k] = await b.text(); return o; };
    T.said = p => T.within(p.then(() => 'done', e => e.message));
    // the history, read by hand: an object is a zlib stream kept under the SHA-1 of what it holds
    const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    T.objPath = sha => '.git/objects/' + sha.slice(0, 2) + '/' + sha.slice(2);
    T.raw = async (m, sha) => pipe(await T.u8(m.get(T.objPath(sha))), new DecompressionStream('deflate'));
    T.body = async (m, sha) => { const r = await T.raw(m, sha); return r.subarray(r.indexOf(0) + 1); };
    T.pack = raw => pipe(raw, new CompressionStream('deflate'));
    T.putObj = async (m, type, body) => {   // a well-formed object under its own name, whatever its body holds
      const head = enc.encode(type + ' ' + body.length + '\0'), raw = new Uint8Array(head.length + body.length); raw.set(head); raw.set(body, head.length);
      const sha = hex(new Uint8Array(await crypto.subtle.digest('SHA-1', raw)));
      m.set(T.objPath(sha), new Blob([await T.pack(raw)])); return sha;
    };
    T.commit = async (m, sha) => { const tx = dec.decode(await T.body(m, sha)); return { sha, text: tx, tree: /^tree (\w{40})/m.exec(tx)[1], parent: (/^parent (\w{40})/m.exec(tx) || [])[1] || null }; };
    T.tree = async (m, sha) => {
      const b = await T.body(m, sha), out = {};
      for (let i = 0; i < b.length;) { const sp = b.indexOf(32, i), z = b.indexOf(0, sp); out[dec.decode(b.subarray(sp + 1, z))] = hex(b.subarray(z + 1, z + 21)); i = z + 21; }
      return out;
    };
    T.point = (m, ref, tx) => m.set('.git/' + ref, new Blob([tx]));
    // T.good is a show file with a history. This opens a copy of it after "harm" has changed its parts; c[0] is the last revision of the branch, c[2] the first.
    T.harmed = async (name, harm, branch) => {
      const m = new Map(T.goodParts || (T.goodParts = await PB.readZip(new Blob([T.good])))), c = [];
      for (let s = (await m.get('.git/refs/heads/' + (branch || 'main')).text()).trim(); s;) { const k = await T.commit(m, s); c.push(k); s = k.parent; }
      T.note = (harm && await harm(m, c)) || null;
      return T.open(name, await T.u8(await PB.buildZip(m)));
    };
    T.log = async () => { const st = await PB.histState(); return { branch: st.branch, msgs: st.log.map(c => c.msg), shas: st.log.map(c => c.sha), cut: st.log.cut ? st.log.cut.message : '' }; };
    // the same tree with its bytes changed, in a well-formed object, under a commit that takes the place of the last one
    const withTree = how => async (m, c) => { const b = await T.body(m, c[0].tree), tree = await T.putObj(m, 'tree', how(b, b.indexOf(0))), sha = await T.putObj(m, 'commit', enc.encode(c[0].text.replace(c[0].tree, tree))); T.point(m, 'refs/heads/main', sha + '\n'); return [tree, sha]; };
    T.harm = {
      noUnpack: async (m, c) => { const sha = (await T.tree(m, c[2].tree))['script.md']; m.set(T.objPath(sha), new Blob([new Uint8Array([120, 156, 1, 2, 3, 4, 5, 6, 7, 8, 9])])); return [sha, c[2].sha, c[0].sha]; },
      wrongLength: async (m, c) => { const raw = await T.raw(m, c[1].sha), k = raw.indexOf(0), head = enc.encode('commit ' + (raw.length - k + 4) + '\0'), out = new Uint8Array(head.length + raw.length - k - 1); out.set(head); out.set(raw.subarray(k + 1), head.length); m.set(T.objPath(c[1].sha), new Blob([await T.pack(out)])); return [c[1].sha]; },
      noTree: async (m, c) => { m.delete(T.objPath(c[0].tree)); return [c[0].tree, c[0].sha]; },
      refNowhere: m => T.point(m, 'refs/heads/main', 'ab'.repeat(20) + '\n'),
      refOther: m => T.point(m, 'refs/heads/main', '\u0000\u0001 not a name\n'),
      refEmpty: m => T.point(m, 'refs/heads/main', ''),
      refGone: m => { m.delete('.git/refs/heads/main'); },
      headOther: m => T.point(m, 'HEAD', 'ref: ../../script.md\n'),
      headGone: m => { m.delete('.git/HEAD'); },
      treeCutName: withTree((b, z) => b.slice(0, z - 3)),
      treeCutSha: withTree(b => b.slice(0, b.length - 7)),
      treeOneByte: withTree(() => new Uint8Array([49])),
      treeNoName: withTree((b, z) => b.slice(0, z + 27)),
      swapped: async (m, c) => { const a = (await T.tree(m, c[2].tree))['script.md'], b = (await T.tree(m, c[0].tree))['script.md']; m.set(T.objPath(a), m.get(T.objPath(b))); return [a, c[2].sha]; },
      commitAsTree: async (m, c) => { const sha = await T.putObj(m, 'commit', enc.encode(c[0].text.replace(c[0].tree, c[1].sha))); T.point(m, 'refs/heads/main', sha + '\n'); return [c[1].sha, sha]; },
      commitNoTree: async m => { const sha = await T.putObj(m, 'commit', enc.encode('author nobody\n\nVuoto\n')); T.point(m, 'refs/heads/main', sha + '\n'); return [sha]; },
      variantNoScript: async (m, c) => { const sha = (await T.tree(m, c[0].tree))['script.md']; m.delete(T.objPath(sha)); return [sha]; }
    };
    // one archive of section 4: the base with a field or a byte changed
    T.dmg = {
      crc: (u, d) => { T.set32(u, d['config.json'].p + 16, d['config.json'].crc ^ 1); u[d['boards/p.png'].data + 40] ^= 4; },
      pack: (u, d) => { u[d['script.md'].data] = 7; },   // a block type deflate does not have
      size: (u, d) => { T.set32(u, d['script.md'].p + 24, d['script.md'].usz + 1); }
    };
  });

  /* ================= the zip reader ================= */
  const png = [137, 80, 78, 71, 13, 10, 26, 10].concat(Array.from({ length: 300 }, (x, k) => (k * 37 + 11) & 255));
  const parts = { 'script.md': SCRIPT, 'config.json': '{"title":"Intero"}', 'script.ink.json': '{"version":1,"blocks":[]}', 'boards/pianta.json': JSON.stringify({ name: 'Pianta', image: 'p.png', w: 1000, h: 500, strokes: [{ colour: '#000', width: 2, points: [[1, 1], [50, 50]] }] }) };
  await ev(async ([ps, png]) => { T.parts = ps; T.png = new Uint8Array(png); T.base = await T.zip(Object.entries(ps).concat([['boards/p.png', T.png]])); }, [parts, png]);
  const d0 = await ev(() => { const d = T.dir(T.base); return { n: d.n, script: d['script.md'].method, cfg: d['config.json'].method, size: T.base.length }; });
  ok(d0.n === 5 && d0.script === 8 && d0.cfg === 0, 'the archive under test has a packed entry (the script) and stored ones (the settings, the image): ' + JSON.stringify(d0));

  // 1. an archive that cannot be followed is refused, in words from the string table
  const refused = await ev(async () => {
    const d = T.dir(T.base), E = d['script.md'], C = d['config.json'], L = d.list[d.n - 1], out = [];
    const cut = k => u => u.slice(0, k), join = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
    const cases = [
      ['an empty file', () => new Uint8Array(0), 'zipNot'],
      ['a file of three bytes', () => new Uint8Array([80, 75, 3]), 'zipNot'],
      ['a text that is not a zip', () => new TextEncoder().encode('not a zip at all, only a text as long as the end record of one'), 'zipNot'],
      ['an archive cut in the middle of its first entry', cut(E.data + 20), 'zipBad'],
      ['an archive cut in the middle of its last entry', cut(L.data + 3), 'zipBad'],
      ['an archive cut in its directory', cut(d.cd + 30), 'zipBad'],
      ['an archive cut inside its end record', cut(d.end + 13), 'zipBad'],
      ['an archive that lost its last byte', cut(d.end + 21), 'zipBad'],
      ['an archive that lost twenty bytes from the middle of an entry', u => join(u.slice(0, E.data + 5), u.slice(E.data + 25)), 'zipBad'],
      ['a directory offset far outside the file', u => T.set32(u, d.end + 16, 0x7fffff00), 'zipBad'],
      ['a directory offset that points into an entry', u => T.set32(u, d.end + 16, E.data), 'zipBad'],
      ['a directory size larger than the file', u => T.set32(u, d.end + 12, 0x7fffffff), 'zipBad'],
      ['a directory size of zero', u => T.set32(u, d.end + 12, 0), 'zipBad'],
      ['one entry more announced than the directory holds', u => T.set16(u, d.end + 10, d.n + 1), 'zipBad'],
      ['one entry fewer announced than the directory holds', u => T.set16(u, d.end + 10, d.n - 1), 'zipBad'],
      ['sixty thousand entries announced', u => T.set16(u, d.end + 10, 60000), 'zipBad'],
      ['a directory entry that lost its signature', u => { u[C.p] = 0; return u; }, 'zipBad'],
      ['a name length in the directory that runs past it', u => T.set16(u, E.p + 28, 60000), 'zipBad'],
      ['an extra-field length in the directory that runs past it', u => T.set16(u, L.p + 30, 500), 'zipBad'],
      ['an entry size that points outside the file', u => T.set32(u, E.p + 20, 0x7ffffff0), 'zipBad'],
      ['an entry offset outside the file', u => T.set32(u, E.p + 42, 0x7ffffff0), 'zipBad'],
      ['an entry offset that points at another entry', u => T.set32(u, E.p + 42, C.lo), 'zipBad'],
      ['a local header with another name than the directory', u => { u[E.lo + 30] ^= 1; return u; }, 'zipBad'],
      ['a local header with another compression than the directory', u => T.set16(u, E.lo + 8, 0), 'zipBad'],
      ['a local header that lost its signature', u => { u[E.lo + 1] = 0; return u; }, 'zipBad'],
      ['a local header whose extra field runs into the directory', u => T.set16(u, L.lo + 28, 0xffff), 'zipBad'],
      ['a name in the directory changed into the name of a folder', u => { u[C.p + 46 + C.nl - 1] = 47; return u; }, 'zipBad'],
      ['an entry protected by a password', u => T.set16(u, E.p + 8, 0x0801), 'zipCrypt'],
      ['an entry packed in a way the tool does not read', u => { T.set16(u, E.p + 10, 9); return T.set16(u, E.lo + 8, 9); }, 'zipMethod'],
      ['a directory offset that says zip64', u => T.set32(u, d.end + 16, 0xFFFFFFFF), 'zip64'],
      ['an entry size that says zip64', u => T.set32(u, E.p + 20, 0xFFFFFFFF), 'zip64']
    ];
    for (const [label, harm, key] of cases) {
      const u = harm(T.base.slice()), t0 = performance.now(), r = await T.read(u);
      out.push([label, r.err === PB.t(key), r === 'HANG' ? 'no answer' : r.err || 'opened: ' + Object.keys(r.files).join(','), Math.round(performance.now() - t0)]);
    }
    return out;
  });
  for (const [label, good, said, ms] of refused) ok(good && ms < 3000, label + ' is refused: "' + said + '"');
  const strs = await ev(() => ['zipNot', 'zipBad', 'zip64', 'zipMethod', 'zipCrypt'].map(k => PB.t(k)));
  ok(new Set(strs).size === 5 && strs.every(x => x && !/^zip[A-Z]/.test(x)), 'each refusal has its own sentence: ' + strs.join(' | '));

  // an archive with nothing in it is not damaged: it is a show with nothing in it yet, as it always was
  const none = await ev(async () => [await T.read(await T.zip([])), await T.read(await T.zip([['__MACOSX/._x', 'x'], ['show/.DS_Store', 'x']]))].map(r => r.files ? Object.keys(r.files).length : r.err || r));
  ok(none[0] === 0 && none[1] === 0, 'an archive with no entry, and one with nothing but desktop clutter, read as a show with no part: ' + none.join(', '));

  // 2. cut at any length, the archive is refused
  const cuts = await ev(async () => {
    const small = await T.zip([['script.md', T.parts['script.md']], ['config.json', T.parts['config.json']]]), said = {}, wrong = [];
    for (let k = 0; k < small.length; k++) { const r = await T.read(small.slice(0, k)); if (r === 'HANG' || !r.err || ![PB.t('zipNot'), PB.t('zipBad')].includes(r.err)) wrong.push(k + ': ' + JSON.stringify(r).slice(0, 80)); else said[r.err] = (said[r.err] || 0) + 1; }
    return { n: small.length, said, wrong };
  });
  ok(cuts.wrong.length === 0 && cuts.said['damaged zip file'] === cuts.n - 4, 'cut short at each of its ' + cuts.n + ' lengths, an archive is refused as damaged (as "not a zip" under four bytes): ' + JSON.stringify(cuts.said) + ' ' + cuts.wrong.slice(0, 3).join(' ; '));

  // 3. one byte changed anywhere: refused, or harmless, or the entry it sits in is set aside and named. Never another text taken for the script.
  const flips = await ev(async () => {
    const texts = [['script.md', T.parts['script.md']], ['config.json', T.parts['config.json']]], small = await T.zip(texts), wrong = [], count = { refused: 0, harmless: 0, aside: 0 };
    const words = ['zipNot', 'zipBad', 'zip64', 'zipMethod', 'zipCrypt'].map(k => PB.t(k));
    const inData = k => T.dir(small).list.some(e => k >= e.data && k < e.data + e.csz);
    for (const mask of [0xff, 1]) for (let k = 0; k < small.length; k++) {
      if (mask === 1 && inData(k)) continue;   // the bytes of an entry are covered by its CRC whatever the change; one bit matters in the fields around them
      const u = small.slice(); u[k] ^= mask;
      const r = await T.within(PB.readZip(new Blob([u])).then(async m => { const bad = PB.zipAside(m), o = {}; for (const [n, b] of m) o[n] = await b.text(); return { files: o, bad }; }, e => ({ err: e.message })));
      if (r === 'HANG') { wrong.push(k + ' hangs'); continue; }
      if (r.err) { if (words.includes(r.err)) count.refused++; else wrong.push(k + ' says ' + r.err); continue; }
      // every part is either what was written, or out of the show, under damaged/, and named
      const fine = texts.every(([n, tx]) => r.bad.includes(n) ? !(n in r.files) && Object.keys(r.files).some(f => f.startsWith('damaged/' + n)) : r.files[n] === tx);
      if (!fine || Object.keys(r.files).length !== 2) wrong.push(k + ' (xor ' + mask + ') gives ' + Object.keys(r.files).join(',') + ' and names only: ' + r.bad.join(','));
      else count[r.bad.length ? 'aside' : 'harmless']++;
    }
    return { n: small.length, count, wrong };
  });
  ok(flips.wrong.length === 0 && flips.count.refused > 0 && flips.count.aside > 0 && flips.count.harmless > 0, 'with any one byte of a ' + flips.n + '-byte archive changed (every bit of it and, outside the entries, one bit), the file is refused, or reads as written, or reads with the changed part set aside and named: ' + JSON.stringify(flips.count) + ' ' + flips.wrong.slice(0, 4).join(' ; '));

  // 4. an entry whose bytes do not match its checksum: the show opens without it, says so, and writes nothing until the user has chosen
  const dmg = (name, key) => ev(([n, k]) => { const u = T.base.slice(); T.dmg[k](u, T.dir(u)); T.sent = u; return T.open(n, u); }, [name, key]);
  ok(await dmg('crc.zip', 'crc') === true && await ev(() => PB.S.loaded && PB.serialize() === T.parts['script.md'] && PB.S.cfg.title === '' && PB.S.boards.get('Pianta').strokes.length === 1 && !PB.S.urls.get('boards/p.png')), 'a show file with a wrong checksum on its settings and a changed byte in an image opens: the script and the board are there, the title and the image are not');
  let said = await banner();
  ok(/cannot be read: config\.json, boards\/p\.png\./.test(said) && /nothing is saved until you choose/.test(said), 'the banner of a part that cannot be read names both: ' + said);
  await ev(() => { PB.commitText(PB.serialize() + '\nANNA: Non ancora.\n'); });
  await page.waitForTimeout(1200); await ev(() => PB.saveNow());
  ok(await ev(async () => PB.S.store.dirty.script && T.same(await T.bytes('crc.zip'), T.sent)), 'a change is not written to the show file while the question is open');
  await hush(); await menu('History'); await toastUp();
  ok(await toastNow() === 'Choose first what to do with the parts that cannot be read.' && await ev(() => document.querySelector('#dlg').hidden), 'and History waits for the answer too');
  await page.locator('#banner .btn', { hasText: 'Go on without' }).click();
  await allSaved(); await page.waitForTimeout(100);
  ok(await ev(async () => { const m = await PB.readZip(new Blob([await T.bytes('crc.zip')])); return await m.get('damaged/config.json').text() === T.parts['config.json'] && T.same(await T.u8(m.get('damaged/boards/p.png')), T.png.map((x, i) => i === 40 ? x ^ 4 : x)) && !m.has('boards/p.png') && JSON.parse(await m.get('config.json').text()).paper === 'A4' && (await m.get('script.md').text()).includes('Non ancora'); }), '"Go on without" keeps both under damaged/, byte for byte as they were read, and saves the show as it is on screen');
  ok(await ev(() => PB.openZipFile()) === true && await banner() === '' && await ev(() => PB.S.store.bad.length === 0), 'the show file then opens with no question');

  // the script itself, packed: what cannot be unpacked is kept as it is, under a name that says so
  ok(await dmg('pack.zip', 'pack') === true && await ev(() => PB.S.loaded && PB.serialize().trim() === '' && PB.S.cfg.title === 'Intero' && document.querySelector('#dlg').hidden), 'a show file whose script cannot be unpacked opens with its settings and with no text, and no box asks for a script to be pasted');
  said = await banner();
  ok(/cannot be read: script\.md\./.test(said), 'the banner says that the script cannot be read: ' + said);
  ok(await ev(() => { const d = T.dir(T.sent)['script.md'], f = PB.S.store.files; return !f.has('script.md') && f.has('damaged/script.md.deflate') && T.u8(f.get('damaged/script.md.deflate')).then(b => T.same(b, T.sent.slice(d.data, d.data + d.csz))); }), 'the packed bytes wait under damaged/script.md.deflate');
  await page.locator('#banner .btn', { hasText: 'Close the show' }).click();
  await page.waitForSelector('#start .card'); await page.waitForTimeout(900);
  ok(await ev(async () => PB.S.store.mode === 'none' && T.same(await T.bytes('pack.zip'), T.sent)), '"Close the show" leaves that show file exactly as it was');
  ok(await dmg('size.zip', 'size') === true && /cannot be read: script\.md\./.test(await banner()) && await ev(() => PB.S.store.files.get('damaged/script.md').text().then(x => x === T.parts['script.md'])), 'a script whose recorded size is wrong is set aside too, its text whole under damaged/script.md');
  await page.locator('#banner .btn', { hasText: 'Close the show' }).click(); await page.waitForSelector('#start .card');

  // 5. a refusal through the tool: said in a message, and the open show stays open
  await ev(() => PB.startMemory('ANNA: Resto qui.\n', {}));
  ok(await ev(() => T.open('short.zip', T.base.slice(0, T.base.length - 30))) === false && await toastNow() === 'Could not open the show: damaged zip file' && await ev(() => PB.S.loaded && PB.serialize().includes('Resto qui')), 'an archive cut short is refused with "damaged zip file", and the open show stays open');
  ok(errs.length === 1 && /damaged zip file/.test(errs[0]), 'that refusal is the only error logged so far');
  errs.length = 0;

  // 6. archives another program wrote still open: a top-level folder with a folder entry and a comment; sizes and CRC written after the data (data descriptors)
  const py = path.join(OUT, 'damaged-foreign.py');
  fs.writeFileSync(py, [
    'import io, sys, zipfile',
    'class Stream(io.RawIOBase):',
    '    def __init__(s, f): s.f = f',
    '    def writable(s): return True',
    '    def write(s, b): s.f.write(b); return len(b)',
    'text = sys.argv[3] * 3',
    'if sys.argv[1] == "stream":',
    '    z = zipfile.ZipFile(Stream(open(sys.argv[2], "wb")), "w", zipfile.ZIP_DEFLATED)',
    'else:',
    '    z = zipfile.ZipFile(sys.argv[2], "w", zipfile.ZIP_DEFLATED); z.comment = b"made elsewhere"; z.writestr("myshow/", "")',
    'z.writestr("myshow/script.md", text)',
    'z.writestr(zipfile.ZipInfo("myshow/config.json"), \'{"title":"Altrove"}\')',
    'z.close()'
  ].join('\n'));
  for (const kind of ['folder', 'stream']) {
    const f = path.join(OUT, 'damaged-' + kind + '.zip'); let buf = null;
    try { execFileSync('python3', [py, kind, f, 'ANNA: Scritto da un altro programma.\n'], { stdio: ['ignore', 'pipe', 'pipe'] }); buf = fs.readFileSync(f); } catch (e) { console.log('FAIL python could not write the ' + kind + ' archive: ' + String(e.stderr || e.message).slice(0, 200)); }
    if (!buf) continue;
    if (kind === 'stream') ok((buf.readUInt16LE(6) & 8) === 8 && buf.readUInt32LE(14) === 0 && buf.readUInt32LE(18) === 0, 'the archive python wrote to a stream has no CRC and no sizes in its local headers');
    ok(await ev(a => T.open('foreign.zip', new Uint8Array(a)), Array.from(buf)) === true && await ev(() => PB.serialize().split('ANNA: Scritto da un altro programma.').length === 4 && PB.S.cfg.title === 'Altrove' && PB.S.store.bad.length === 0) && await banner() === '', kind === 'stream' ? 'and it opens whole, with no question: its directory has them' : 'an archive python wrote, with a top-level folder, a folder entry and a comment, opens whole');
  }
  ok(errs.length === 0, 'none of this is logged as an error: ' + errs.join(' | ').slice(0, 300));

  /* ================= the history reader ================= */
  // 7. a show file with three revisions on main and one on a variant, written by the tool
  await ev(tx => PB.startMemory(tx, { title: 'Storia' }), SCRIPT.replace('{BOARD Pianta}\n', ''));
  await ev(async () => { const root = await navigator.storage.getDirectory(); window.showSaveFilePicker = async () => root.getFileHandle('good.zip', { create: true }); });
  await menu('Save as show file');
  await page.waitForFunction(() => PB.S.store.mode === 'zip' && !PB.S.store.saving && PB.S.store.lastSave);
  await ev(async () => {
    await PB.histSave('Prova 1', false);
    PB.commitText(PB.serialize() + 'ANNA: Seconda prova.\n'); await PB.histSave('Prova 2', false);
    PB.commitText(PB.serialize() + 'MARCO: Terza prova.\n'); await PB.histSave('Prova 3', false);
    await PB.histVariant('Tour'); PB.commitText(PB.serialize() + 'ANNA: Solo in giro.\n'); await PB.histSave('Tour 1', false);
    await PB.histSwitch('main');
    T.good = await T.bytes('good.zip'); T.text = PB.serialize();
  });
  const TEXT3 = await ev(() => T.text);
  ok(TEXT3.includes('Terza prova') && !TEXT3.includes('Solo in giro'), 'the show under test is on main, at its third revision');
  // what every damaged history must leave alone: the show opens whole and with no question, and a change to the script is saved
  const opensWhole = async (label, name, harm, branch) => {
    const res = await ev(([n, h, b]) => T.harmed(n, T.harm[h], b).then(r => r, e => 'threw ' + e.message), [name, harm, branch || '']);
    ok(res === true && await ev(() => PB.S.loaded && PB.serialize() === T.text && PB.S.store.bad.length === 0) && await banner() === '', label + ': the show opens whole, with no question');
  };
  const savesScript = async (label, name, line) => {
    await ev(l => { PB.commitText(PB.serialize() + l + '\n'); return PB.saveNow(); }, line); await allSaved();
    ok(await ev(([n, l]) => T.inZip(n).then(z => z['script.md'].includes(l) && !PB.S.store.err), [name, line]), label + ': a change to the script is saved to the show file');
  };
  const historyBox = async () => { await hush(); await menu('History'); await page.waitForFunction(() => !document.querySelector('#dlg').hidden || !document.querySelector('#toast').hidden); return ev(() => ({ open: !document.querySelector('#dlg').hidden, text: document.querySelector('#dlg').textContent, revs: document.querySelectorAll('#dlg .rev').length, toast: document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent })); };
  const closeBox = () => page.locator('#dlg footer .btn', { hasText: 'Close' }).click();
  const hiBad = sha => ev(s => PB.t('hiBad', s.slice(0, 7)), sha);
  const DAMAGED = /Part of this history is damaged and cannot be read \(([^)]+)\)\. The show itself is not touched\./;

  // the history as written opens whole
  await opensWhole('with the history as the tool wrote it', 'h0.zip', '');
  let box = await historyBox();
  ok(box.open && box.revs === 3 && !/cannot/.test(box.text) && box.toast === '', 'History lists its three revisions and has nothing to report');
  await closeBox();

  // 8. an object whose bytes do not unpack: the script of the first revision
  await opensWhole('with an object that does not unpack', 'h1.zip', 'noUnpack');
  let [lost, first, last] = await ev(() => T.note);
  box = await historyBox();
  ok(box.open && box.revs === 3, 'History still lists the three revisions: their names can be read');
  await hush(); await page.locator('#dlg .rev .btn', { hasText: 'Restore' }).last().click(); await toastUp();
  said = await toastNow();
  ok(said === 'History: Part of this history is damaged and cannot be read (' + lost.slice(0, 7) + '). The show itself is not touched.', 'restoring the revision that lost its script says in words what cannot be read: ' + said);
  let log = await ev(() => T.log());
  ok(await ev(() => PB.serialize() === T.text) && log.msgs.join('|') === 'Prova 3|Prova 2|Prova 1', 'and changes nothing: the script is as it was, and no "Before going to" revision was made');
  await hush(); await ev(sha => { PB.openDiff(sha); }, first); await toastUp();
  ok(DAMAGED.test(await toastNow()), '"Changes" against that revision says the same: ' + await toastNow());
  await closeBox();
  await savesScript('with an object that does not unpack', 'h1.zip', 'ANNA: Si va avanti.');
  box = await historyBox();
  await page.locator('#hiName').fill('Dopo il danno'); await page.locator('#dlg .btn', { hasText: 'Save revision' }).click();
  await page.waitForFunction(() => /Dopo il danno/.test(document.querySelector('#toast').textContent) && !document.querySelector('#toast').hidden);
  log = await ev(() => T.log());
  ok(log.msgs[0] === 'Dopo il danno' && log.msgs.length === 4 && !log.cut, 'a new revision can be saved on top');
  ok(await ev(sha => T.said(PB.histRestore(sha)), last) === 'done' && await ev(() => PB.serialize() === T.text), 'and a revision that is whole can be restored');
  ok(await ev(sha => T.said(PB.histRestore(sha)), log.shas[0]) === 'done' && await ev(() => PB.serialize().includes('Si va avanti')), 'so can the new one');

  // 9. an object whose header gives a wrong length: the commit of the second revision
  await opensWhole('with a commit whose length is wrong', 'h2.zip', 'wrongLength');
  [lost] = await ev(() => T.note);
  box = await historyBox();
  ok(box.open && box.revs === 1 && box.text.includes('Earlier revisions cannot be shown. Part of this history is damaged and cannot be read (' + lost.slice(0, 7) + ').') && !/No revision yet/.test(box.text), 'History lists the revision it can reach and says that the earlier ones cannot be shown');
  await closeBox();
  await savesScript('with a commit whose length is wrong', 'h2.zip', 'ANNA: Si va avanti.');
  ok(await ev(() => T.said(PB.histSave('Dopo il danno', false))) === 'done' && await ev(() => T.log().then(l => l.msgs.join('|') === 'Dopo il danno|Prova 3' && !!l.cut)), 'a new revision is saved, and is listed above the one that could be read');

  // 10. a missing object: the tree of the last revision is gone
  await opensWhole('with a missing tree', 'h3.zip', 'noTree');
  [lost, last] = await ev(() => T.note);
  ok(await ev(sha => T.said(PB.histRestore(sha)), last) === await hiBad(lost) && await ev(() => T.log().then(l => l.msgs.length === 3)), 'restoring a revision whose tree is missing is refused as damaged, not as "packed by git", and adds no revision');
  ok(await ev(() => T.said(PB.histSave('Uguale', false))) === 'done' && await ev(sha => T.said(PB.histRestore(sha)), last) === 'done', 'saving a revision of the same show writes the missing object again: the revision can then be restored');
  const dir = path.join(OUT, 'damaged-repo'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + '.zip', Buffer.from(await ev(async () => Array.from(await T.bytes('h3.zip')))));
  let fsck = '';
  try { execFileSync('python3', ['-c', 'import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', dir + '.zip', dir]); fsck = execFileSync('git', ['fsck', '--strict'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { fsck = 'ERR ' + (e.stderr || e.message); }
  ok(!/ERR|missing|error/.test(fsck), 'git fsck then accepts the history' + (fsck.trim() ? ': ' + fsck.trim().slice(0, 200) : ''));
  await savesScript('with a missing tree', 'h3.zip', 'ANNA: Si va avanti.');

  // 11. HEAD or the branch does not name a commit that is there. "cut": the new revision still has the lost one as its parent.
  const heads = [
    ['a branch that names a commit that is not there', 'refNowhere', 'abababa', true],
    ['a branch file that holds something else', 'refOther', 'not a name', false],
    ['an empty branch file', 'refEmpty', 'HEAD', false],
    ['a branch file that is gone', 'refGone', 'refs/heads/main', false],
    ['a HEAD that holds something else', 'headOther', 'ref: ../../script.md', false],
    ['a HEAD that is gone', 'headGone', 'HEAD', false]
  ];
  for (let i = 0; i < heads.length; i++) {
    const [label, harm, named, cut] = heads[i], name = 'h4' + i + '.zip';
    await opensWhole('with ' + label, name, harm);
    box = await historyBox();
    const m = DAMAGED.exec(box.text);
    ok(box.open && box.revs === 0 && /Earlier revisions cannot be shown\./.test(box.text) && !!m && m[1] === named && !/No revision yet/.test(box.text), 'with ' + label + ', History says that the revisions cannot be shown, and does not say there are none' + (m ? ' (' + m[1] + ')' : ': ' + (box.text || box.toast).slice(0, 160)));
    await page.locator('#hiName').fill('Da capo'); await hush(); await page.locator('#dlg .btn', { hasText: 'Save revision' }).click(); await toastUp();
    log = await ev(() => T.log());
    ok(/Da capo/.test(await toastNow()) && log.msgs[0] === 'Da capo' && log.msgs.length === 1 && cut === !!log.cut, 'and a revision can be saved: the history goes on from there' + (cut ? ', still saying that what is before cannot be shown' : ''));
    await savesScript('with ' + label, name, 'ANNA: Si va avanti.');
    ok(await ev(sha => T.said(PB.histRestore(sha)), log.shas[0]) === 'done' && await ev(() => PB.serialize() === T.text), 'and that revision can be restored');
    if (/HEAD/.test(label)) ok(await ev(n => T.inZip(n).then(z => !Object.keys(z).some(k => k.includes('..')) && /^[0-9a-f]{40}\n$/.test(z['.git/HEAD'])), name), 'HEAD then names the new revision, and nothing was written outside the history');
  }

  // 12. a tree with an entry cut short, in an object that is otherwise well formed: no loop, no partial show
  const trees = [['cut inside the name of a file', 'treeCutName'], ['cut inside the name of an object', 'treeCutSha'], ['that is one byte of text', 'treeOneByte'], ['whose second entry has no name', 'treeNoName']];
  for (let i = 0; i < trees.length; i++) {
    const [label, harm] = trees[i], name = 'h5' + i + '.zip';
    await opensWhole('with a tree ' + label, name, harm);
    [lost, last] = await ev(() => T.note);
    const r = await ev(sha => T.said(PB.histRestore(sha)), last);
    ok(r === await hiBad(lost) && await ev(() => PB.serialize() === T.text && PB.S.loaded) && await ev(() => T.log().then(l => l.msgs.length === 3)), 'restoring a revision with a tree ' + label + ' ends at once, in words, and changes nothing: ' + r);
    if (i > 0) continue;
    box = await historyBox();
    ok(box.open && box.revs === 3, 'History lists the revisions all the same');
    await closeBox();
    await savesScript('with a tree cut short', name, 'ANNA: Si va avanti.');
    ok(await ev(() => T.said(PB.histSave('Dopo il danno', false))) === 'done' && await ev(() => T.log().then(l => T.said(PB.histRestore(l.shas[0])))) === 'done', 'a new revision is saved and can be restored');
  }

  // 13. objects that are whole but are not what their place promises
  await opensWhole('with one script kept under the name of another', 'h6.zip', 'swapped');
  [lost, first] = await ev(() => T.note);
  ok(await ev(sha => T.said(PB.histRestore(sha)), first) === await hiBad(lost) && await ev(() => PB.serialize() === T.text), 'restoring a revision whose script was replaced by another object is refused: the name of an object is checked against what it holds');
  await opensWhole('with a commit where a tree should be', 'h7.zip', 'commitAsTree');
  [lost, last] = await ev(() => T.note);
  ok(await ev(sha => T.said(PB.histRestore(sha)), last) === await hiBad(lost) && await ev(() => PB.serialize() === T.text), 'a revision that names another commit as its tree is refused in words');
  await opensWhole('with a commit that names no tree', 'h8.zip', 'commitNoTree');
  box = await historyBox();
  ok(box.open && box.revs === 0 && DAMAGED.test(box.text), 'a commit that names no tree is reported as damaged, not listed');
  await closeBox();

  // 14. a variant whose last revision cannot be read: changing to it changes nothing, the show stays on its variant
  await opensWhole('with a variant that lost its script', 'h9.zip', 'variantNoScript', 'Tour');
  [lost] = await ev(() => T.note);
  ok(await ev(() => T.said(PB.histSwitch('Tour'))) === await hiBad(lost) && await ev(() => T.log().then(l => l.branch === 'main' && l.msgs.length === 3)) && await ev(() => PB.serialize() === T.text), 'changing to a variant whose script is missing is refused in words, and the show stays on main with its text');
  await savesScript('with a variant that lost its script', 'h9.zip', 'ANNA: Si va avanti.');
  ok(await ev(() => T.inZip('h9.zip').then(z => z['.git/HEAD'] === 'ref: refs/heads/main\n')), 'and the show file still says main');

  // 15. the archive itself damaged inside the history: one changed byte in an object and one in a branch, as a failing disk leaves them
  ok(await ev(async () => { const u = T.good.slice(), d = T.dir(u), e = d.list.find(x => x.name.startsWith('.git/objects/')), f = d['.git/refs/heads/main']; u[e.data + 5] ^= 16; u[f.data + 3] ^= 1; T.note = [e.name, f.name]; return T.open('h10.zip', u); }) === true && await ev(() => PB.S.loaded && PB.serialize() === T.text), 'a show file with a changed byte in an object and in a branch of its history opens, script and all');
  said = await banner();
  ok(/cannot be read: \.git\. /.test(said), 'the banner names the history once, by its folder: ' + said);
  await page.locator('#banner .btn', { hasText: 'Go on without' }).click(); await allSaved(); await page.waitForTimeout(100);
  ok(await ev(() => T.inZip('h10.zip').then(z => T.note.every(n => ('damaged/' + n) in z && !(n in z)))), '"Go on without" moves the two damaged entries to damaged/.git/');
  box = await historyBox();
  ok(box.open && box.revs === 0 && DAMAGED.test(box.text) && !/No revision yet/.test(box.text), 'History then says that the revisions cannot be shown: ' + (DAMAGED.exec(box.text) || [])[0]);
  await closeBox();
  await savesScript('after that', 'h10.zip', 'ANNA: Si va avanti.');

  ok(errs.length === 0, 'no damaged history made the page throw or log an error: ' + errs.join(' | ').slice(0, 400));
  await done(); srv.close();
})();
