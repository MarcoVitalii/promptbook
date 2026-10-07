'use strict';
/* =====================================================================
   Promptbook R0
   parse  : text -> blocks, cues, board tokens
   layout : blocks -> fixed-measure pages
   view   : rendering, pins, pen, editing, boards
   store  : folder (File System Access) | in-browser fallback
   ===================================================================== */

/* ---------- strings ---------- */
const STR = {
en: {
  appSub: 'Prompt book', openFile: 'Open show file…', openFolder: 'Open an older show folder…', reopen: 'Reopen “{0}”', trySample: 'Try the sample scene',
  pasteNew: 'Start from pasted text', contDraft: 'Continue the unsaved draft ({0})', importBk: 'Import a backup file…',
  startHint: 'A show is one .zip file: script, ink, settings, boards and images together. Copy that file to move the show. Create it with “Start from pasted text” or the sample, then “Save as show file…”.',
  noFs: 'This browser cannot save show files. Open the tool in Chrome or Edge for that. Here the show stays inside this browser until you export a backup.',
  menu: 'Menu', mOpen: 'Open show file…', mOpenFolder: 'Open older show folder…', mSaveTo: 'Save as show file…', mText: 'Edit whole script…', mExport: 'Export backup', mImport: 'Import backup…',
  mSettings: 'Settings…', mClose: 'Close show', jump: 'Jump to act or scene', jumpTo: 'Jump to…', find: 'Find…',
  eraser: 'Eraser', finger: 'Finger', fingerTip: 'Let finger and mouse draw (for machines without a pen)', undo: 'Undo', redo: 'Redo',
  boards: 'Boards', boardsTip: 'Show the facing page', cues: 'Cues', cuesTip: 'Show or hide cues', ink: 'Ink', inkTip: 'Show or hide ink',
  night: 'Night mode', fit: 'Fit', zoomIn: 'Zoom in', zoomOut: 'Zoom out', cueList: 'Cue list', print: 'Print', review: 'Review',
  prBook: 'Book: script and facing pages', prScript: 'Script pages only',
  stSaved: 'Saved {0}', stSaving: 'Saving…', stPending: 'Saving soon', stMem: 'Not on disk', stErr: 'Save failed',
  cueAfter: 'Cue after “{0}”', cueOwn: 'Cue on its own line, after this block', ownLine: 'On its own line',
  boardHere: 'Board here', editText: 'Edit text', label: 'Number or label', desc: 'Margin text', del: 'Delete', done: 'Done', lastLabel: 'last was {0}',
  save: 'Save', cancel: 'Cancel', close: 'Close',
  editHint: 'Ctrl+Enter saves, Esc cancels. One line per speech: NAME: text. Start a line with & for simultaneous speech.',
  textTitle: 'Script text', pasteTitle: 'Paste the script',
  fmtHelp: '---\ntitle: The Sea\nauthor: Name Surname\ncharacters:\n  - ANNA/A - the daughter\n  - MARCO\n---\n# ACT ONE\n## Scene 1\n(An action on its own line.)\nANNA: Dialogue. (inline direction) More dialogue.\n& MARCO: Spoken at the same time as the line above.',
  contd: '(cont.)', together: 'together', board: 'Board', addBoard: '+ Board', bImage: 'Image…', bDefault: 'Use as default',
  bClear: 'Clear ink', bRemove: 'Remove', bRename: 'Rename', bName: 'Board name', facingEmpty: 'No board on this page',
  checkInk: 'The text under this ink has changed', inkKeep: 'Ink is fine', inkClear: 'Clear ink on this block',
  rvNone: 'Nothing to review.', rvPara: 'Lines not recognised',
  rvParaHint: 'Shown without a name. Edit them to add NAME: or to join them to the speech above.',
  rvAmp: '“&” with no speech above', rvInk: 'Ink to check', rvOrph: 'Ink whose text was removed', rvUnk: 'Unknown departments', rvChars: 'Characters',
  rvCharsHint: 'A name that appears once may be a typo or a misread line.',
  rvNoChar: 'Not in the character list', rvNoCharHint: 'Speakers missing from “characters” at the top of the script. ALL, OTHERS, ALL BUT… are not checked.',
  rvSilent: 'Listed but never speaks', titleInScript: 'Set by “title” at the top of the script',
  all: 'All', thDept: 'Dept', thNo: 'No.', thDesc: 'Margin', thWhere: 'Act / scene', thLine: 'Cue line', thPage: 'P.', thWho: 'Character',
  csv: 'CSV', noCues: 'No cues yet. Tap a word in the script.', dup: 'This number is used more than once',
  setTitle: 'Settings', showTitle: 'Show title', paperL: 'Paper', langL: 'Language', deptsL: 'Departments', addDept: '+ Department',
  deptHint: 'Changing a code does not rewrite cues already in the script.',
  extChanged: 'This show was changed by another program.', loadTheirs: 'Load that version', keepMine: 'Keep mine',
  reloaded: 'Show reloaded, it was changed outside',
  memBanner: 'This show is only in this browser. Save it as a show file or export a backup.',
  errOpen: 'Could not open the show: {0}', errSave: 'Could not save: {0}', errFile: 'Could not read that file.',
  pastedImg: 'Image pasted as a new board', notFound: 'Not found', exported: 'Backup exported', defSet: 'Default board background set',
  afterWord: 'after', between: 'between lines', untitled: 'Untitled show',
  endRow: 'End:', endTitle: 'End of {0}', endLoose: 'End with nothing to close', linkTitle: 'Ends {0}', linkLoose: 'Nothing to end: {0}',
  makeCue: 'Make it a cue', plainEnd: 'Make it a plain end', notes: 'Description (cue list only)', hasNotes: 'Description',
  thEndPage: 'End p.', thEndLine: 'End line', thEndDesc: 'End note', endsAt: 'ends p. {0}', endedBy: 'ended by {0}', endsCue: 'ends {0}',
  thEndedBy: 'Ended by', thEnds: 'Ends', thNotes: 'Description', csvDept: 'By dept (.zip)', printDept: 'Print by dept',
  rvEnd: 'Ends with no cue to close',
  nextLabel: 'blank = {0}', rvTodo: 'To do', deptReview: 'To do', deptReviewTip: 'Review notes, not cues: listed under Review and left out of the cue list',
  rvNote: 'Commented out', rvNoteHint: 'Hidden on the page and in print. Tap to read or restore.', noteOut: 'Comment out', noteBack: 'Restore', noteTitle: 'Commented out',
  templates: 'Templates', mTemplates: 'Templates…', tplBack: 'Back to script', tplNew: '+ Template', tplChild: 'New based on this',
  tplBase: 'Base: {0}', tplNone: 'none', tplDefault: 'Default', tplEmpty: 'No templates yet.', template: 'Template',
  tplHint: 'A template is a background for boards: the stage, with its furniture and props drawn in. Templates are not part of the script and are never printed. A template can be based on another; what it is based on shows greyed out.',
  tplUsed: 'Still used by: {0}', tplMade: 'Template “{0}” created', bBase: 'Base…', bToTpl: 'To templates', blank: 'Blank',
  pickBase: 'Draw on top of', tplName: 'Template name', tplFade: 'Template strength', tplManage: 'Templates…'
},
it: {
  appSub: 'Copione di scena', openFile: 'Apri il file dello spettacolo…', openFolder: 'Apri una vecchia cartella…', reopen: 'Riapri «{0}»', trySample: 'Prova la scena di esempio',
  pasteNew: 'Inizia incollando il testo', contDraft: 'Riprendi la bozza non salvata ({0})', importBk: 'Importa un file di backup…',
  startHint: 'Uno spettacolo è un solo file .zip: copione, appunti a penna, impostazioni, schemi e immagini insieme. Per spostarlo basta copiare quel file. Crealo con «Inizia incollando il testo» o con l’esempio, poi «Salva come file spettacolo…».',
  noFs: 'Questo browser non può salvare i file dello spettacolo. Per farlo apri lo strumento in Chrome o Edge. Qui lo spettacolo resta dentro questo browser finché non esporti un backup.',
  menu: 'Menu', mOpen: 'Apri file spettacolo…', mOpenFolder: 'Apri vecchia cartella…', mSaveTo: 'Salva come file spettacolo…', mText: 'Modifica tutto il testo…', mExport: 'Esporta backup', mImport: 'Importa backup…',
  mSettings: 'Impostazioni…', mClose: 'Chiudi spettacolo', jump: 'Vai ad atto o scena', jumpTo: 'Vai a…', find: 'Cerca…',
  eraser: 'Gomma', finger: 'Dito', fingerTip: 'Fa disegnare dito e mouse (per computer senza penna)', undo: 'Annulla', redo: 'Ripeti',
  boards: 'Tavole', boardsTip: 'Mostra la pagina a fronte', cues: 'Cue', cuesTip: 'Mostra o nascondi i cue', ink: 'Tratti', inkTip: 'Mostra o nascondi l’inchiostro',
  night: 'Modalità notte', fit: 'Adatta', zoomIn: 'Ingrandisci', zoomOut: 'Riduci', cueList: 'Lista cue', print: 'Stampa', review: 'Rivedi',
  prBook: 'Copione e pagine a fronte', prScript: 'Solo pagine del copione',
  stSaved: 'Salvato {0}', stSaving: 'Salvataggio…', stPending: 'Da salvare', stMem: 'Non su disco', stErr: 'Salvataggio fallito',
  cueAfter: 'Cue dopo «{0}»', cueOwn: 'Cue su riga propria, dopo questo blocco', ownLine: 'Su riga propria',
  boardHere: 'Tavola qui', editText: 'Modifica testo', label: 'Numero o sigla', desc: 'Testo a margine', del: 'Elimina', done: 'Fatto', lastLabel: 'l’ultimo era {0}',
  save: 'Salva', cancel: 'Annulla', close: 'Chiudi',
  editHint: 'Ctrl+Invio salva, Esc annulla. Una riga per battuta: NOME: testo. Inizia la riga con & per le battute simultanee.',
  textTitle: 'Testo del copione', pasteTitle: 'Incolla il copione',
  fmtHelp: '---\ntitolo: Il mare\nautore: Nome Cognome\npersonaggi:\n  - ANNA/A - la figlia\n  - MARCO\n---\n# ATTO PRIMO\n## Scena 1\n(Un’azione su una riga a sé.)\nANNA: Battuta. (didascalia interna) Ancora battuta.\n& MARCO: Detta insieme alla riga sopra.',
  contd: '(segue)', together: 'insieme', board: 'Tavola', addBoard: '+ Tavola', bImage: 'Immagine…', bDefault: 'Usa come predefinita',
  bClear: 'Cancella inchiostro', bRemove: 'Rimuovi', bRename: 'Rinomina', bName: 'Nome della tavola', facingEmpty: 'Nessuna tavola in questa pagina',
  checkInk: 'Il testo sotto questo inchiostro è cambiato', inkKeep: 'L’inchiostro va bene', inkClear: 'Cancella l’inchiostro del blocco',
  rvNone: 'Niente da rivedere.', rvPara: 'Righe non riconosciute',
  rvParaHint: 'Mostrate senza nome. Modificale per aggiungere NOME: o per unirle alla battuta sopra.',
  rvAmp: '«&» senza battuta sopra', rvInk: 'Inchiostro da controllare', rvOrph: 'Inchiostro di testo rimosso', rvUnk: 'Reparti sconosciuti', rvChars: 'Personaggi',
  rvCharsHint: 'Un nome che compare una sola volta può essere un refuso o una riga letta male.',
  rvNoChar: 'Non nell’elenco dei personaggi', rvNoCharHint: 'Nomi che mancano da «personaggi» in testa al copione. TUTTI, GLI ALTRI, TUTTI TRANNE… non sono controllati.',
  rvSilent: 'In elenco ma senza battute', titleInScript: 'Impostato da «titolo» in testa al copione',
  all: 'Tutti', thDept: 'Rep.', thNo: 'N.', thDesc: 'Margine', thWhere: 'Atto / scena', thLine: 'Battuta', thPage: 'Pag.', thWho: 'Personaggio',
  csv: 'CSV', noCues: 'Ancora nessun cue. Tocca una parola del copione.', dup: 'Questo numero è usato più volte',
  setTitle: 'Impostazioni', showTitle: 'Titolo dello spettacolo', paperL: 'Carta', langL: 'Lingua', deptsL: 'Reparti', addDept: '+ Reparto',
  deptHint: 'Cambiare una sigla non riscrive i cue già nel copione.',
  extChanged: 'Questo spettacolo è stato modificato da un altro programma.', loadTheirs: 'Carica quella versione', keepMine: 'Tieni la mia',
  reloaded: 'Spettacolo ricaricato, era stato modificato altrove',
  memBanner: 'Questo spettacolo è solo in questo browser. Salvalo come file spettacolo o esporta un backup.',
  errOpen: 'Impossibile aprire lo spettacolo: {0}', errSave: 'Impossibile salvare: {0}', errFile: 'Impossibile leggere il file.',
  pastedImg: 'Immagine incollata come nuova tavola', notFound: 'Non trovato', exported: 'Backup esportato', defSet: 'Sfondo predefinito delle tavole impostato',
  afterWord: 'dopo', between: 'tra le righe', untitled: 'Spettacolo senza titolo',
  endRow: 'Fine:', endTitle: 'Fine di {0}', endLoose: 'Fine senza niente da chiudere', linkTitle: 'Chiude {0}', linkLoose: 'Niente da chiudere: {0}',
  makeCue: 'Rendila un cue', plainEnd: 'Rendila una fine semplice', notes: 'Descrizione (solo nella lista cue)', hasNotes: 'Descrizione',
  thEndPage: 'Pag. fine', thEndLine: 'Battuta di fine', thEndDesc: 'Nota di fine', endsAt: 'finisce a p. {0}', endedBy: 'chiuso da {0}', endsCue: 'chiude {0}',
  thEndedBy: 'Chiuso da', thEnds: 'Chiude', thNotes: 'Descrizione', csvDept: 'Per reparto (.zip)', printDept: 'Stampa per reparto',
  rvEnd: 'Fine senza cue da chiudere',
  nextLabel: 'vuoto = {0}', rvTodo: 'Da fare', deptReview: 'Da fare', deptReviewTip: 'Appunti da rivedere, non cue: elencati in Rivedi e lasciati fuori dalla lista cue',
  rvNote: 'Commentati', rvNoteHint: 'Nascosti nella pagina e in stampa. Tocca per leggere o ripristinare.', noteOut: 'Commenta', noteBack: 'Ripristina', noteTitle: 'Commentato',
  templates: 'Modelli', mTemplates: 'Modelli…', tplBack: 'Torna al copione', tplNew: '+ Modello', tplChild: 'Nuovo basato su questo',
  tplBase: 'Base: {0}', tplNone: 'nessuna', tplDefault: 'Predefinito', tplEmpty: 'Ancora nessun modello.', template: 'Modello',
  tplHint: 'Un modello è uno sfondo per le tavole: il palco, con mobili e oggetti disegnati. I modelli non fanno parte del copione e non vengono mai stampati. Un modello può basarsi su un altro; ciò su cui si basa appare in grigio.',
  tplUsed: 'Ancora usato da: {0}', tplMade: 'Modello «{0}» creato', bBase: 'Base…', bToTpl: 'Nei modelli', blank: 'Vuota',
  pickBase: 'Disegna sopra a', tplName: 'Nome del modello', tplFade: 'Intensità dei modelli', tplManage: 'Modelli…'
}};
let LANG = 'en';
function t(k) {
  let s = STR[LANG] && STR[LANG][k];
  if (s == null) s = STR.en[k];
  if (s == null) s = k;
  for (let i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]);
  return s;
}

/* ---------- helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function h(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs) { const e = document.createElementNS(SVGNS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;
function hash(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
function rm(arr, x) { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); return i; }

/* ---------- constants ---------- */
const FS = 15, LH = 22, GAP = 24, SPREAD_GAP = 20;
const PAPERS = { A4: { w: 793, h: 1122, css: 'A4' }, Letter: { w: 816, h: 1056, css: 'letter' } };
const GEO = { padL: 38, nameW: 118, gap1: 12, gap2: 14, margW: 166, padR: 46, top: 54, bot: 58 };
const FIXED_W = GEO.padL + GEO.nameW + GEO.gap1 + GEO.gap2 + GEO.margW + GEO.padR;
const BLACK = '#1b1a17';
const INKS = ['#c8102e', '#0b5fbd', '#1f7a3a', BLACK];
const BOARD_W = 1000;
const VERSION = 'r1.4';

function defaultConfig() {
  const it = LANG === 'it';
  return { title: '', paper: 'A4', departments: [
    { code: 'LX', name: it ? 'Luci' : 'Lights', colour: '#c98a00' },
    { code: 'SND', name: it ? 'Audio' : 'Sound', colour: '#1f6fd6' },
    { code: 'VID', name: 'Video', colour: '#7a3fd1' },
    { code: 'TODO', name: it ? 'Da fare' : 'To do', colour: '#d62828', review: true } ], defaultBoard: null,
    templates: [], defaultTemplate: null, recentTemplates: [], templateFade: 0.4 };
}
function normCfg(c) {
  const o = Object.assign(defaultConfig(), c || {});
  if (!Array.isArray(o.departments) || !o.departments.length) o.departments = defaultConfig().departments;
  o.departments = o.departments.map(x => {
    const code = String(x.code || '').toUpperCase().replace(/[^\p{L}\p{N}_-]/gu, '');
    return { code, name: String(x.name || ''), colour: String(x.colour || x.color || '#888888'), review: !!x.review };
  }).filter(x => x.code && x.code !== 'BOARD');
  if (!PAPERS[o.paper]) o.paper = 'A4';
  o.title = String(o.title || '');
  const names = v => Array.isArray(v) ? v.filter(n => typeof n === 'string' && n) : [];
  o.templates = Array.from(new Set(names(o.templates))); o.recentTemplates = names(o.recentTemplates);
  o.defaultTemplate = typeof o.defaultTemplate === 'string' && o.defaultTemplate ? o.defaultTemplate : null;
  o.templateFade = clamp(+o.templateFade || 0.4, 0.15, 0.8);
  return o;
}

/* ---------- state ---------- */
const S = {
  cfg: defaultConfig(),
  blocks: [], byId: new Map(), nextId: 1, groups: [],
  ink: new Map(),        // block id -> { snap, lines, strokes: [{colour,width,points}] }
  orphans: [],           // ink whose block disappeared: { text, snap, lines, strokes }
  boards: new Map(),     // name -> { name, w, h, image, imageData, strokes, base }
  templates: new Map(),  // name -> same shape with tpl: true; kept in the configuration, never in the script
  urls: new Map(),       // 'boards/<file>' or 'templates/<file>' -> object URL
  pairs: [], mode: 'script', meta: null,   // meta: the frontmatter of the script, when it has one
  pages: [], els: [], meas: new Map(),
  view: { zoom: 1, fit: true, facing: true, cues: true, ink: true, night: false },
  tool: { mode: 'pen', colour: INKS[0], width: 0.13, finger: false },
  hist: [], redo: [], sel: null, editing: false, drawer: null, cueFilter: null, findAt: null, loaded: false,
  store: { mode: 'none', dir: null, name: '', stamp: {}, dirty: { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }, conflict: false, lastSave: null, err: null }
};
const paper = () => PAPERS[S.cfg.paper] || PAPERS.A4;
const deptOf = code => S.cfg.departments.find(d => d.code === code) || null;
/* a review department holds notes for after the rehearsal: listed in Review, never in the cue list */
const isReview = code => { const d = deptOf(code); return !!(d && d.review); };
const titleOf = () => (S.meta && S.meta.title) || S.cfg.title;   // the script's own title wins over Settings

/* =====================================================================
   PARSE
   ===================================================================== */
const TOKEN_SRC = '\\{([^{}|\\s]+)(?:[ \\t]+([^{}|]*?))?[ \\t]*(?:\\|[ \\t]*([^{}]*?))?[ \\t]*\\}';
const CONNECT = new Set(['e', 'ed', 'and', '&', 'y', 'et']);
const HEAD1 = /^(ATTO|ACT|PARTE|PART|PROLOGO|EPILOGO|PROLOGUE|EPILOGUE|INTERVALLO|INTERVAL|FINE)(?![\p{L}\p{N}])/u;
const HEAD2 = /^(SCENA|SCENE|QUADRO)(?![\p{L}\p{N}])/u;
const HEADT = /^(Atto|Act|Parte|Scena|Scene|Quadro)\s+(\d+|[IVXLC]+)(?![\p{L}\p{N}])/u;

function stripTokens(s) {
  return s.replace(new RegExp(TOKEN_SRC, 'g'), '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
}
function cleanField(s) { return String(s || '').replace(/[{}|]/g, '/').replace(/\s+/g, ' ').trim(); }
/* {DEPT label / DEPT label | short text | notes}: links are the cues this cue ends, notes are for the cue list only */
function fmtToken(dept, label, desc, end, links, notes) {
  label = cleanField(label); desc = cleanField(desc); notes = cleanField(notes);
  const lk = (links || []).map(l => l.dept + (l.label ? ' ' + l.label : '')).join(' / ');
  const lab = lk ? (label ? label + ' / ' : '/ ') + lk : label;
  return '{' + (end ? '/' : '') + dept + (lab ? ' ' + lab : '') + (desc || notes ? ' | ' + desc : '') + (notes ? ' | ' + notes : '') + '}';
}
/* "6 / SND 5 / VID 2" -> own label "6" and the cues it ends. Not a link unless every part after
   a " / " starts with an upper-case department code, so a label such as "5 / 6" stays a label. */
const cueName = c => c.dept + (c.label ? ' ' + c.label : '');
function splitLinks(s) {
  const parts = (' ' + s).split(/\s\/\s+/), label = parts[0].trim(), links = [];
  for (const p of parts.slice(1)) {
    const m = /^(\p{Lu}[\p{Lu}\p{N}_-]+)(?:\s+(.*))?$/u.exec(p.trim());
    if (!m) return { label: s, links: [] };
    links.push({ dept: m[1], label: (m[2] || '').trim() });
  }
  return { label, links };
}
function autoHead(s) {
  if (s.length > 70) return 0;
  if (HEAD1.test(s)) return 1;
  if (HEAD2.test(s)) return 2;
  const m = HEADT.exec(s);
  if (m) return /^(Atto|Act|Parte)$/.test(m[1]) ? 1 : 2;
  return 0;
}
function speechHead(line) {
  const m0 = /^\s*(&\s*)?/.exec(line);
  const i0 = m0[0].length, simul = !!m0[1];
  const ci = line.indexOf(':', i0);
  if (ci < 0) return null;
  const head = line.slice(i0, ci);
  if (/[{}]/.test(head)) return null;
  let nameStr = head, paren = null;
  const pm = /^(.*?)(\s*)(\([^()]*\))\s*$/.exec(head);
  if (pm) { nameStr = pm[1]; const s = i0 + pm[1].length + pm[2].length; paren = { s, e: s + pm[3].length }; }
  nameStr = nameStr.trim();
  if (!nameStr || nameStr.length > 48 || /[()]/.test(nameStr)) return null;
  const words = nameStr.split(/[\s,\/+]+/).filter(Boolean);
  if (words.length > 6) return null;
  let up = false;
  for (const w of words) {
    if (CONNECT.has(w.toLowerCase())) continue;
    if (w !== w.toUpperCase()) return null;
    if (/\p{Lu}/u.test(w)) up = true;
  }
  if (!up) return null;
  if (/\d\s*$/.test(nameStr) && /^\d/.test(line.slice(ci + 1))) return null;   // 10:30
  return { simul, name: nameStr.replace(/\s+/g, ' '), paren, restAt: ci + 1 };
}
function isActionStart(st) {
  if (st[0] !== '(') return false;
  let depth = 0;
  for (let i = 0; i < st.length; i++) {
    if (st[i] === '(') depth++;
    else if (st[i] === ')') { depth--; if (depth === 0) return /^[\s.,;:!?…]*$/.test(st.slice(i + 1)); }
  }
  return true;   // not closed on this line: a multi-line action
}
/* ---------- frontmatter ----------
   ---
   title: Il mare
   author: Marco Vitali
   characters:
     - ANNA
     - MARCO/M - il pescatore
   ---
   Every value is shown on the front page, in this order; the title larger. "characters" gets a page of
   its own after it: name / alias - description. It is also the list speeches are checked against, and
   a speech headed by an alias is shown under the full name. */
const META_TITLE = new Set(['title', 'titolo']);
const META_CHARS = new Set(['characters', 'personaggi']);
const META_SKIP = new Set(['tags', 'aliases', 'cssclasses']);   // Obsidian's own properties
const META_LINE = /^\s*(?:#|-\s|[^\s:][^:]*:)|^\s+\S/;
const normName = s => String(s).toUpperCase().replace(/\s+/g, ' ').trim();
function parseMeta(raw) {
  const unq = v => { v = v.trim(); const m = /^(["'])(.*)\1$/.exec(v); return m ? m[2] : v; };
  const fields = []; let cur = null;
  for (const line of raw.split('\n').slice(1, -1)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    let m = /^\s*-\s+(.*)$/.exec(line);
    if (m) { if (cur && m[1].trim()) cur.items.push(unq(m[1])); continue; }
    m = /^([^\s:][^:]*?)\s*:\s*(.*)$/.exec(line);
    if (m && !/^\s/.test(line)) {
      cur = { key: m[1].trim().toLowerCase(), items: [] }; fields.push(cur);
      const v = (m[2] || '').trim(), lm = /^\[(.*)\]$/.exec(v);
      if (lm) cur.items = lm[1].split(',').map(unq).filter(Boolean);
      else if (v && v !== '|' && v !== '>') cur.items.push(unq(v));
    } else if (cur) cur.items.push(line.trim());
  }
  const out = { title: '', lines: [], chars: [], set: new Set(), alias: new Map(), charsKey: '' };
  for (const f of fields) {
    if (META_SKIP.has(f.key)) continue;
    if (META_CHARS.has(f.key)) {
      if (!out.charsKey) out.charsKey = f.key[0].toUpperCase() + f.key.slice(1);
      for (const it of f.items) {
        const m = /^(.*?)(?:\s+[-–—]\s+|\s*:\s+)(.*)$/.exec(it), names = (m ? m[1] : it).split('/').map(normName).filter(Boolean), name = names[0];
        if (!name || out.set.has(name)) continue;
        out.set.add(name); out.chars.push({ name, aliases: names.slice(1), desc: m ? m[2].trim() : '' });
      }
      continue;
    }
    const big = META_TITLE.has(f.key);
    if (big && !out.title && f.items.length) out.title = f.items.join(' ');
    for (const it of f.items) out.lines.push({ text: it, big });
  }
  for (const c of out.chars) {   // a name always wins over an alias spelled the same
    c.aliases = c.aliases.filter(a => !out.set.has(a) && !out.alias.has(a));
    for (const a of c.aliases) out.alias.set(a, c.name);
  }
  out.aliasSig = Array.from(out.alias).join(';');
  return out;
}
const NAME_SEP = /(\s*[,\/+&]\s*|\s+(?:e|ed|and|y|et)\s+)/i;
/* a speaker name with every alias replaced by the character's name */
function fullName(name, meta) {
  if (!meta || !meta.alias.size || meta.set.has(normName(name))) return name;
  return name.split(NAME_SEP).map((p, i) => i % 2 ? p : (meta.alias.get(normName(p)) || p)).join('');
}
/* Names that stand for several characters without listing them. They are never checked against the list. */
const GROUP_NAME = /^(?:(?:ALL|EVERYONE|EVERYBODY|TUTTI|TUTTE)(?:\s+(?:THE\s+|GLI\s+|LE\s+)?(?:OTHERS|ALTRI|ALTRE)|\s+(?:BUT|EXCEPT|TRANNE|MENO|ECCETTO|SALVO)\s+.+)?|(?:THE\s+|GLI\s+|LE\s+)?(?:OTHERS|ALTRI|ALTRE))$/u;
/* which listed characters a speaker name uses, and which of its names are not in the list */
function castCheck(name, set) {
  const U = normName(name), used = [], unknown = [];
  if (set.has(U)) return { used: [U], unknown };
  if (GROUP_NAME.test(U)) return { used, unknown };
  for (const p of U.split(/\s*[,\/+&]\s*|\s+(?:E|ED|AND|Y|ET)\s+/)) {
    if (!p || GROUP_NAME.test(p)) continue;
    (set.has(p) ? used : unknown).push(p);
  }
  return { used, unknown };
}

function classify(line) {
  const st = stripTokens(line);
  if (st === '') return { type: 'mark' };
  if (/^\s*#{1,6}\s+\S/.test(line)) return { type: 'h' };
  const al = autoHead(st);
  if (al) return { type: 'h', auto: al };
  const hd = speechHead(line);
  if (hd) return { type: 'speech', head: hd };
  if (isActionStart(st)) return { type: 'action' };
  return null;
}
/* ---------- comments ----------
   %%
   ANNA: A speech set aside.
   %%
   Everything between two lines holding %% is kept in the file and left off the page, the cue list and
   the print. One line can also be closed on itself: %% text %%. A %% that is never closed is not a comment. */
const FENCE = /^\s*%%\s*$/, NOTE1 = /^\s*%%(?!\s*$).*%%\s*$/;
const noInk = b => b.type === 'mark' || b.type === 'note';
function uncomment(v) {
  return String(v).replace(/\r\n?/g, '\n').split('\n').map(l => NOTE1.test(l) ? l.trim().slice(2, -2).trim() : l).filter(l => !FENCE.test(l)).join('\n').replace(/^\n+|\s+$/g, '');
}
function commentOut(v) { v = uncomment(v); return v ? '%%\n' + v + '\n%%' : ''; }
function parseScript(text) {
  const lines = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/ /g, ' ').split('\n');
  const blocks = []; let cur = null, gap = 0, at = 0;
  /* frontmatter: only as the first thing in the file, between two --- lines */
  let a = 0; while (a < lines.length && !lines[a].trim()) a++;
  if (a < lines.length && lines[a].trim() === '---') {
    let z = a + 1; while (z < lines.length && lines[z].trim() !== '---' && (!lines[z].trim() || META_LINE.test(lines[z]))) z++;
    if (z < lines.length && lines[z].trim() === '---') {
      blocks.push({ type: 'meta', raw: lines.slice(a, z + 1).map(l => l.replace(/\s+$/, '')).join('\n'), gap: a });
      at = z + 1;
    }
  }
  const ls = lines.slice(at);
  for (let i = 0; i < ls.length; i++) {
    const line = ls[i].replace(/\s+$/, '');
    if (!line.trim()) { gap++; cur = null; continue; }
    const fence = FENCE.test(line); let z = NOTE1.test(line) ? i : -1;
    if (fence) { z = i + 1; while (z < ls.length && !FENCE.test(ls[z])) z++; if (z >= ls.length) z = -1; }
    if (z >= 0) {
      blocks.push({ type: 'note', raw: ls.slice(i, z + 1).map(l => l.replace(/\s+$/, '')).join('\n'), gap });
      cur = null; gap = 0; i = z; continue;
    }
    const c = fence ? null : classify(line);
    if (fence) cur = null;   // never closed: shown as an unrecognised line
    if (c) { cur = Object.assign({ raw: line, gap }, c); blocks.push(cur); gap = 0; }
    else if (cur && cur.type !== 'mark' && cur.type !== 'h') cur.raw += '\n' + line;
    else { cur = { type: 'para', raw: line, gap }; blocks.push(cur); gap = 0; }
  }
  return blocks;
}
function mkCue(m, wi) {
  let dept = m[1].toUpperCase();
  const end = dept.length > 1 && dept[0] === '/';   // {/SND 5} ends cue SND 5
  if (end) dept = dept.slice(1);
  const board = !end && dept === 'BOARD', lk = end || board ? { label: (m[2] || '').trim(), links: [] } : splitLinks((m[2] || '').trim());
  const rest = (m[3] || '').trim(), bar = rest.indexOf('|');   // short text | notes
  const desc = bar < 0 ? rest : rest.slice(0, bar).trim(), notes = bar < 0 ? '' : rest.slice(bar + 1).replace(/\s*\|\s*/g, ' / ').trim();
  return { dept, label: lk.label, links: lk.links, desc, notes, s: m.index, e: m.index + m[0].length, wi, end, board };
}
function analyze(b) {
  const raw = b.raw;
  b.plain = stripTokens(raw); b.sv = hash(raw);
  b.tokens = []; b.cues = []; b.name = ''; b.simul = false; b.level = 0; b.title = '';
  if (b.type === 'meta') { b.meta = parseMeta(raw); return b; }
  if (b.type === 'note') { b.inner = uncomment(raw); b.plain = ''; return b; }
  if (b.type === 'mark') {
    const re = new RegExp(TOKEN_SRC, 'g'); let m;
    while ((m = re.exec(raw))) b.cues.push(mkCue(m, -1));
    return b;
  }
  let from = 0;
  if (b.type === 'h') {
    const m = /^\s*(#{1,6})\s+/.exec(raw);
    if (m) { b.level = Math.min(m[1].length, 2); from = m[0].length; } else b.level = b.auto || 1;
  }
  if (b.type === 'speech') {
    const hd = b.head; b.name = hd.name; b.simul = hd.simul; from = hd.restAt;
    if (hd.paren) b.tokens.push({ k: 'x', text: raw.slice(hd.paren.s, hd.paren.e) }, { k: 'sp' });
  }
  tokenize(b, from, b.type === 'action');
  if (b.type === 'h') b.title = b.tokens.filter(q => q.k === 'w').map(q => q.text).join(' ');
  return b;
}
function tokenize(b, from, baseIt) {
  const raw = b.raw, to = raw.length, out = b.tokens;
  const re = new RegExp(TOKEN_SRC, 'y');
  let i = from, depth = 0, last = null, pending = [];
  const isSp = c => c === ' ' || c === '\t';
  while (i < to) {
    const ch = raw[i];
    if (ch === '\n') { if (out.length) out.push({ k: 'br' }); i++; continue; }
    if (isSp(ch)) {
      while (i < to && isSp(raw[i])) i++;
      const p = out[out.length - 1];
      if (p && p.k !== 'sp' && p.k !== 'br') out.push({ k: 'sp' });
      continue;
    }
    if (ch === '{') {
      re.lastIndex = i; const m = re.exec(raw);
      if (m) {
        const wi = last ? out.indexOf(last) : -2;
        const c = mkCue(m, wi);
        if (last) last.cues.push(c); else pending.push(c);
        b.cues.push(c); i = re.lastIndex; continue;
      }
    }
    let j = i;
    while (j < to) {
      const c = raw[j];
      if (isSp(c) || c === '\n') break;
      if (c === '{' && j > i) { re.lastIndex = j; if (re.test(raw)) break; }
      j++;
    }
    const text = raw.slice(i, j);
    const it = baseIt || depth > 0 || text[0] === '(';
    for (const c of text) { if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1); }
    const w = { k: 'w', text, s: i, e: j, it, cues: [] };
    out.push(w); last = w;
    if (pending.length) { const wi = out.length - 1; for (const c of pending) { c.wi = wi; c.before = true; w.cues.push(c); } pending = []; }
    i = j;
  }
  for (const c of pending) c.wi = -1;
}

function similarity(a, b) {
  const A = new Set(a.toLowerCase().split(/\s+/)), B = new Set(b.toLowerCase().split(/\s+/));
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return (2 * n) / ((A.size + B.size) || 1);
}

/* Replace the document text. Blocks that did not change keep their identity
   (and so their ink); changed blocks are re-matched, the rest becomes orphaned ink. */
function reparse(text) {
  const old = S.blocks, nb = parseScript(text);
  const same = (a, b) => a.raw === b.raw && a.type === b.type;
  let p = 0;
  while (p < old.length && p < nb.length && same(old[p], nb[p])) p++;
  let s = 0;
  while (s < old.length - p && s < nb.length - p && same(old[old.length - 1 - s], nb[nb.length - 1 - s])) s++;
  for (let i = 0; i < p; i++) { old[i].gap = nb[i].gap; nb[i] = old[i]; }
  for (let i = 0; i < s; i++) { const o = old[old.length - 1 - i], j = nb.length - 1 - i; o.gap = nb[j].gap; nb[j] = o; }
  const oldMid = old.slice(p, old.length - s), newMid = nb.slice(p, nb.length - s);
  for (const b of newMid) analyze(b);
  if (oldMid.length === 1 && newMid.length === 1) {
    newMid[0].id = oldMid[0].id;
    const e = S.ink.get(oldMid[0].id);
    if (e && noInk(newMid[0])) { S.ink.delete(oldMid[0].id); S.orphans.push({ text: oldMid[0].plain, snap: e.snap, lines: e.lines, strokes: e.strokes }); }
  } else {
    const byPlain = new Map();
    for (const b of newMid) { if (noInk(b)) continue; const q = byPlain.get(b.plain); if (q) q.push(b); else byPlain.set(b.plain, [b]); }
    const rest = [];
    for (const ob of oldMid) {
      if (noInk(ob)) continue;
      const q = byPlain.get(ob.plain);
      if (q && q.length) q.shift().id = ob.id; else if (S.ink.has(ob.id)) rest.push(ob);
    }
    for (const ob of rest) {
      let best = null, bs = 0;
      for (const b of newMid) { if (b.id || noInk(b)) continue; const sc = similarity(b.plain, ob.plain); if (sc > bs) { bs = sc; best = b; } }
      if (best && bs >= 0.34) best.id = ob.id;
    }
  }
  const kept = new Set();
  for (const b of newMid) { if (b.id) kept.add(b.id); else b.id = S.nextId++; }
  for (const ob of oldMid) {
    if (kept.has(ob.id)) continue;
    const e = S.ink.get(ob.id);
    if (e) { S.ink.delete(ob.id); S.orphans.push({ text: ob.plain, snap: e.snap, lines: e.lines, strokes: e.strokes }); }
  }
  if (S.orphans.length) for (const b of newMid) {
    if (noInk(b) || S.ink.has(b.id)) continue;
    const k = S.orphans.findIndex(o => o.text === b.plain);
    if (k >= 0) { const o = S.orphans.splice(k, 1)[0]; S.ink.set(b.id, { snap: o.snap == null ? o.text : o.snap, lines: o.lines, strokes: o.strokes }); }
  }
  S.blocks = nb;
  S.byId = new Map(nb.map(b => [b.id, b]));
  const sig0 = S.meta ? S.meta.aliasSig : '';
  S.meta = nb.length && nb[0].type === 'meta' ? nb[0].meta : null;
  if ((S.meta ? S.meta.aliasSig : '') !== sig0) S.meas = new Map();   // names in the name column change
  let act = '', scene = '';
  for (const b of nb) {
    if (b.type === 'speech') b.name = fullName(b.head.name, S.meta);
    if (b.type === 'h') { if (b.level === 1) { act = b.title; scene = ''; } else scene = b.title; }
    b.act = act; b.scene = scene;
  }
  groupBlocks(); pairCues();
}
/* Pair every end with the cue it closes: the nearest earlier cue that is still open and has the same
   department and label. An end without a label closes the nearest open cue of its department. An end
   is either a {/DEPT label} token or a cue that links to what it ends, {DEPT 6 / DEPT 5}; a linking
   cue closes its targets first and then stays open itself. Paired cues also get a lane for the
   running rail in the margin. */
function pairCues() {
  const open = new Map(), pairs = []; let ord = 0;
  const close = (c, dept, label) => {
    const q = open.get(dept); if (!q) return null;
    let k = -1;
    for (let i = q.length - 1; i >= 0; i--) if (!label || q[i].label === label) { k = i; break; }
    if (k < 0) return null;
    const s = q.splice(k, 1)[0]; s.endRef = c; c.closes.push(s); pairs.push(s); return s;
  };
  for (const b of S.blocks) for (const c of b.cues) {
    c.b = b; c.ord = ord++; c.endRef = null; c.startRef = null; c.closes = []; c.unresolved = []; c.lane = 0;
    for (const l of c.links) l.ref = null;
    if (c.board) continue;
    if (c.end) { close(c, c.dept, c.label); c.startRef = c.closes[0] || null; continue; }
    for (const l of c.links) { l.ref = close(c, l.dept, l.label); if (!l.ref) c.unresolved.push(l); }
    let q = open.get(c.dept); if (!q) open.set(c.dept, q = []); q.push(c);
  }
  pairs.sort((a, b) => a.ord - b.ord);
  const lanes = [];
  for (const s of pairs) {   // a lane is free again once its rail has ended; a linking cue's tag can hand its lane on
    let k = lanes.findIndex(endOrd => endOrd <= s.ord);
    if (k < 0) k = lanes.length;
    lanes[k] = s.endRef.ord; s.lane = Math.min(k, 5);
  }
  S.pairs = pairs;
}
function groupBlocks() {
  const gs = []; let last = null;
  for (const b of S.blocks) {
    if (b.type === 'speech' && b.simul && last && last.speechy) {
      if (last.kind === 'single') { last.kind = 'simul'; last.blocks = [last.b]; last.b = null; }
      last.blocks.push(b); b.g = last; continue;
    }
    last = { kind: 'single', b, blocks: null, speechy: b.type === 'speech', m: null };
    b.g = last; gs.push(last);
  }
  S.groups = gs;
}
const gBlocks = g => g.kind === 'single' ? [g.b] : g.blocks;

function serialize() {
  const out = [];
  for (const b of S.blocks) { for (let k = 0; k < b.gap; k++) out.push(''); out.push(b.raw); }
  return out.join('\n') + '\n';
}
/* text with blocks [i0, i0+n) replaced by newRaw (empty removes them) */
function textWith(i0, n, newRaw) {
  const out = [], bl = S.blocks;
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    for (let k = 0; k < b.gap; k++) out.push('');
    if (i === i0) {
      const v = String(newRaw == null ? '' : newRaw).replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '');
      if (v.trim() !== '') out.push(v);
      i += n - 1; continue;
    }
    out.push(b.raw);
  }
  return out.join('\n') + '\n';
}
/* text with a new line placed right after block j (j = -1 puts it first) */
function textInsertAfter(j, line) {
  const out = [], bl = S.blocks;
  if (j < 0) out.push(line);
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    for (let k = 0; k < b.gap; k++) out.push('');
    out.push(b.raw);
    if (i === j) out.push(line);
  }
  return out.join('\n') + '\n';
}
/* text with a new line placed just before block i, taking over its spacing */
function textInsertBefore(i0, line) {
  const out = [], bl = S.blocks;
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    for (let k = 0; k < b.gap; k++) out.push('');
    if (i === i0) out.push(line);
    out.push(b.raw);
  }
  return out.join('\n') + '\n';
}

function cutToken(raw, s, e) {
  let a = raw.slice(0, s); const z = raw.slice(e);
  if (/[ \t]$/.test(a) && (z === '' || /^[ \t\n]/.test(z))) a = a.replace(/[ \t]+$/, '');
  return a + z;
}
/* text after several token edits at once: [{ b, s, e, text }], text null removes the token */
function textEdits(edits) {
  const by = new Map();
  for (const ed of edits) { let q = by.get(ed.b); if (!q) by.set(ed.b, q = []); q.push(ed); }
  const out = [];
  for (const b of S.blocks) {
    let raw = b.raw; const q = by.get(b);
    if (q) {
      q.sort((x, y) => y.s - x.s);
      for (const ed of q) raw = ed.text === null ? cutToken(raw, ed.s, ed.e) : raw.slice(0, ed.s) + ed.text + raw.slice(ed.e);
      raw = raw.replace(/^\n+|\s+$/g, '');
    }
    for (let k = 0; k < b.gap; k++) out.push('');
    if (raw.trim() !== '') out.push(raw);
  }
  return out.join('\n') + '\n';
}

/* ---------- ink bookkeeping ---------- */
function lineCount(b) {
  const g = b.g;
  if (!g || !g.m) return 0;
  return g.kind === 'single' ? (g.m.lines[0] || 0) : (g.m.lines[g.blocks.indexOf(b)] || 0);
}
function inkFlag(b) {
  const e = S.ink.get(b.id);
  if (!e || !e.strokes.length) return false;
  if (e.snap !== b.plain) return true;
  const n = lineCount(b);
  return !!(e.lines && n && e.lines !== n);
}
function inkEntry(b) {
  let e = S.ink.get(b.id);
  if (!e) { e = { snap: b.plain, lines: lineCount(b), strokes: [] }; S.ink.set(b.id, e); }
  return e;
}
/* attach ink loaded from disk: exact text in order first, then order and similarity */
function attachInk(file) {
  S.ink = new Map(); S.orphans = [];
  if (!file) return;
  for (const o of (file.orphans || [])) if (o && Array.isArray(o.strokes)) S.orphans.push({ text: String(o.text || ''), snap: o.inked, lines: o.lines, strokes: o.strokes });
  const entries = (file.blocks || []).filter(e => e && Array.isArray(e.strokes) && e.strokes.length);
  const bl = S.blocks, used = new Set(), res = new Array(entries.length).fill(-1);
  const index = new Map();
  bl.forEach((b, i) => { if (noInk(b)) return; const q = index.get(b.plain); if (q) q.push(i); else index.set(b.plain, [i]); });
  let ptr = 0;
  entries.forEach((e, k) => {
    const q = index.get(String(e.text || '')); if (!q) return;
    let j = q.find(i => i >= ptr && !used.has(i));
    if (j === undefined) j = q.find(i => !used.has(i));
    if (j === undefined) return;
    res[k] = j; used.add(j); ptr = j + 1;
  });
  entries.forEach((e, k) => {
    if (res[k] >= 0) return;
    let lo = 0, hi = bl.length;
    for (let q = k - 1; q >= 0; q--) if (res[q] >= 0) { lo = res[q] + 1; break; }
    for (let q = k + 1; q < entries.length; q++) if (res[q] >= 0) { hi = res[q]; break; }
    if (lo > hi) { lo = 0; hi = bl.length; }
    let best = -1, bs = 0;
    for (let i = lo; i < hi; i++) {
      if (used.has(i) || noInk(bl[i])) continue;
      const sc = similarity(bl[i].plain, String(e.text || ''));
      if (sc > bs) { bs = sc; best = i; }
    }
    if (best >= 0 && bs >= 0.34) { res[k] = best; used.add(best); }
  });
  entries.forEach((e, k) => {
    const snap = e.inked == null ? String(e.text || '') : String(e.inked);
    if (res[k] >= 0) S.ink.set(bl[res[k]].id, { snap, lines: e.lines || 0, strokes: e.strokes });
    else S.orphans.push({ text: String(e.text || ''), snap, lines: e.lines || 0, strokes: e.strokes });
  });
}
function inkFile() {
  const blocks = [];
  for (const b of S.blocks) {
    const e = S.ink.get(b.id);
    if (!e || !e.strokes.length) continue;
    const o = { text: b.plain, lines: e.lines || lineCount(b), strokes: e.strokes };
    if (e.snap !== b.plain) o.inked = e.snap;
    blocks.push(o);
  }
  const out = { version: 1, blocks };
  if (S.orphans.length) out.orphans = S.orphans.map(o => ({ text: o.text, inked: o.snap, lines: o.lines, strokes: o.strokes }));
  return out;
}

/* ---------- history ---------- */
function pushHist(op) { S.hist.push(op); if (S.hist.length > 200) S.hist.shift(); S.redo.length = 0; updUndo(); }
function undo() { const op = S.hist.pop(); if (!op) return; closePop(); op.undo(); S.redo.push(op); updUndo(); }
function redo() { const op = S.redo.pop(); if (!op) return; closePop(); op.redo(); S.hist.push(op); updUndo(); }

function applyText(tx) { reparse(tx); relayout(); markDirty('script'); }
/* Change the script text as one undoable step. Only the changed span is kept in history. */
function commitText(nt) {
  const old = serialize();
  if (nt === old) return false;
  applyText(nt);
  const cur = serialize();
  if (cur === old) return false;
  const n = Math.min(old.length, cur.length);
  let p = 0; while (p < n && old.charCodeAt(p) === cur.charCodeAt(p)) p++;
  let s = 0; while (s < n - p && old.charCodeAt(old.length - 1 - s) === cur.charCodeAt(cur.length - 1 - s)) s++;
  const flat = x => x.split('').join('');   // detach from the full text so it can be freed
  const a = flat(old.slice(p, old.length - s)), b = flat(cur.slice(p, cur.length - s));
  const swap = mid => { const c = serialize(); applyText(c.slice(0, p) + mid + c.slice(c.length - s)); };
  pushHist({ undo: () => swap(a), redo: () => swap(b) });
  return true;
}

/* =====================================================================
   LAYOUT
   ===================================================================== */
function elTx(b, from, to) {
  const tx = h('div', 'tx'); tx.dataset.b = b.id;
  const sel = S.sel && S.sel.id === b.id ? S.sel.wi : -9;
  for (let i = from; i < to; i++) {
    const tk = b.tokens[i];
    if (tk.k === 'w') {
      const sp = document.createElement('span');
      sp.className = 'w' + (tk.it ? ' it' : '') + (tk.cues.length ? ' cued' : '') + (i === sel ? ' sel' : '');
      sp.dataset.i = i; sp.textContent = tk.text;
      if (tk.cues.length) {
        const cols = [];
        for (const c of tk.cues) { const col = cueColour(c); if (!cols.includes(col) && cols.length < 3) cols.push(col); }
        sp.style.setProperty('--c', cols[0]);
        if (cols.length > 1) sp.style.setProperty('--ring', cols.map((col, k) => '0 0 0 ' + (1.5 * (k + 1)) + 'px ' + col).join(','));   // one ring per department
      }
      tx.appendChild(sp);
    } else if (tk.k === 'sp') tx.appendChild(document.createTextNode(' '));
    else if (tk.k === 'br') tx.appendChild(document.createElement('br'));
    else if (tk.k === 'x') { const sp = h('span', 'x', tk.text); sp.dataset.i = i; tx.appendChild(sp); }
  }
  return tx;
}
function cueColour(c) { if (c.board) return 'var(--muted)'; const d = deptOf(c.dept); return d ? d.colour : '#888888'; }

/* fr: null for the whole block, or { from, to, off, cont, first, last } for a page fragment */
function buildRow(g, fr) {
  if (g.kind === 'simul') {
    const row = h('div', 'row simul');
    row.appendChild(h('div', 'nm simnm', t('together')));
    const cols = h('div', 'simcols'); cols.style.setProperty('--n', g.blocks.length);
    for (const b of g.blocks) {
      const c = h('div', 'simcell');
      c.appendChild(h('div', 'nm', b.name));
      c.appendChild(elTx(b, 0, b.tokens.length));
      cols.appendChild(c);
    }
    row.appendChild(cols);
    return row;
  }
  const b = g.b;
  if (b.type === 'mark') {
    const row = h('div', 'row mark'); row.dataset.b = b.id;
    row.appendChild(h('div', 'nm')); row.appendChild(h('div', 'rule'));
    return row;
  }
  if (b.type === 'note') {   // takes no room: only a marker in the gutter, never printed
    const row = h('div', 'row note'); row.dataset.b = b.id;
    const k = h('button', 'cmk pbtn noprint', '%%'); k.type = 'button'; k.dataset.b = b.id; k.title = t('noteTitle');
    row.appendChild(k);
    return row;
  }
  if (b.type === 'meta') {   // front page and character page; outside those it takes no room
    const row = h('div', 'row front'); row.dataset.b = b.id;
    if (!fr) { row.classList.add('none'); return row; }
    row.style.height = fr.h + 'px';
    const tx = h('div', 'tx'); tx.dataset.b = b.id; tx.dataset.off = fr.off; tx.dataset.fl = (fr.first ? 'f' : '') + (fr.last ? 'l' : '');
    if (fr.part === 'front') for (const l of b.meta.lines) tx.appendChild(h('div', l.big ? 'ft' : 'fl', l.text));
    else {
      tx.classList.add('cast'); if (b.meta.chars.length > 30) tx.classList.add('two');
      tx.appendChild(h('div', 'ch', b.meta.charsKey));
      const list = h('div', 'cl2');
      for (const c of b.meta.chars) {
        const e = h('div', 'ce'); e.appendChild(h('b', null, c.name));
        if (c.aliases.length) e.appendChild(h('span', 'ca', ' / ' + c.aliases.join(' / ')));
        if (c.desc) e.appendChild(h('span', 'cd', ' — ' + c.desc));
        list.appendChild(e);
      }
      tx.appendChild(list);
    }
    row.appendChild(tx);
    return row;
  }
  const row = h('div', 'row ' + (b.type === 'h' ? 'h' + b.level : b.type)); row.dataset.b = b.id;
  if (b.type === 'h') { row.appendChild(elTx(b, 0, b.tokens.length)); return row; }
  const nm = h('div', 'nm');
  if (b.type === 'speech') {
    if (fr && fr.cont) { nm.classList.add('cont'); nm.textContent = b.name + ' ' + t('contd'); } else nm.textContent = b.name;
  }
  row.appendChild(nm);
  const tx = elTx(b, fr ? fr.from : 0, fr ? fr.to : b.tokens.length);
  if (fr) { tx.dataset.off = fr.off; tx.dataset.fl = (fr.first ? 'f' : '') + (fr.last ? 'l' : ''); }
  row.appendChild(tx);
  return row;
}
function gkey(g) {
  if (g.kind === 'simul') return 'S\u0001' + g.blocks.map(b => b.plain).join('\u0001');
  const b = g.b;
  return b.type + b.level + '\u0001' + (b.type === 'mark' ? '' : b.plain);
}
function measure() {
  const M = $('#measure'), todo = [];
  if (S.meas.size > S.groups.length * 3 + 200) S.meas = new Map();
  for (const g of S.groups) {
    const k = gkey(g); let m = S.meas.get(k);
    if (!m) {
      m = { h: 0, lines: [], nameLines: 1, ls: null };
      S.meas.set(k, m);
      const el = buildRow(g, null); M.appendChild(el); todo.push([m, el]);
    }
    g.m = m;
  }
  for (const [m, el] of todo) {
    m.h = el.getBoundingClientRect().height;
    m.lines = $$('.tx', el).map(x => Math.max(1, Math.round(x.getBoundingClientRect().height / LH)));
    const nm = el.querySelector(':scope > .nm');
    m.nameLines = nm ? Math.max(1, Math.round(nm.getBoundingClientRect().height / LH)) : 1;
  }
  M.textContent = '';
}
/* token index at which each rendered line of a block starts */
function lineStarts(b) {
  const m = b.g.m;
  if (m.ls) return m.ls;
  const M = $('#measure'), row = buildRow(b.g, null);
  M.appendChild(row);
  const starts = []; let lastTop = -1e9;
  for (const el of row.querySelector('.tx').children) {
    if (el.tagName === 'BR') continue;
    const top = el.offsetTop;
    if (top > lastTop + LH / 2) { starts.push(+el.dataset.i); lastTop = top; }
  }
  M.textContent = '';
  return (m.ls = starts);
}
function paginate() {
  const pp = paper(), H = pp.h - GEO.top - GEO.bot, pages = [];
  let cur = null, y = 0, act = '', scene = '';
  const isHead = g => g.kind === 'single' && g.b.type === 'h';
  const parts0 = S.meta ? [S.meta.lines.length && 'front', S.meta.chars.length && 'cast'].filter(Boolean) : [];
  const off = parts0.length;   // front and character pages have no number; the script still starts on page 1
  const newPage = () => { const no = pages.length + 1 - off; cur = { items: [], boards: [], head: null, no, front: no < 1 }; pages.push(cur); y = 0; };
  const push = it => {
    it.y = y; cur.items.push(it); y += it.h;
    const g = it.g;
    if (isHead(g)) { if (g.b.level === 1) { act = g.b.title; scene = ''; } else scene = g.b.title; }
    else if (cur.head === null) cur.head = [act, scene].filter(Boolean).join(' · ');
  };
  const carry = () => {
    const moved = [];
    while (cur.items.length > 1 && isHead(cur.items[cur.items.length - 1].g)) moved.unshift(cur.items.pop());
    newPage();
    for (const it of moved) { it.y = y; cur.items.push(it); y += it.h; }
  };
  newPage();
  for (const g of S.groups) {
    const m = g.m, b = g.kind === 'single' ? g.b : null;
    if (b && b.type === 'meta') {
      parts0.forEach((part, k) => {
        if (cur.items.length) newPage();
        push({ g, h: H, whole: false, part, from: 0, to: 0, off: k * H, cont: k > 0, first: k === 0, last: k === off - 1 });
      });
      if (!off) push({ g, h: 0, whole: true });
      continue;
    }
    if (cur.front && cur.items.length) newPage();
    if (b && b.type === 'h' && b.level === 1 && cur.items.length) newPage();
    if (y + m.h <= H + 0.5) { push({ g, h: m.h, whole: true }); continue; }
    const total = b ? (m.lines[0] || 0) : 0;
    let ls = null;
    if (b && (b.type === 'speech' || b.type === 'action' || b.type === 'para') && total >= 4) {
      ls = lineStarts(b);
      if (ls.length !== total) ls = null;
    }
    if (!ls) { if (cur.items.length) carry(); push({ g, h: m.h, whole: true }); continue; }
    let lf = 0, guard = 0;
    while (guard++ < 500) {
      const rem = total - lf, room = Math.floor((H - y - 8) / LH);
      if (rem <= room) {
        push({ g, h: Math.max(lf === 0 ? m.nameLines : 1, rem) * LH + 8, whole: false, from: ls[lf], to: b.tokens.length, off: lf * LH, cont: lf > 0, first: lf === 0, last: true });
        break;
      }
      let take = room;
      if (rem - take < 2) take = rem - 2;
      if (take < 2 || (lf === 0 && take < m.nameLines)) {
        if (cur.items.length) { carry(); continue; }
        take = Math.max(1, Math.min(room, rem - 1));
      }
      push({ g, h: Math.max(lf === 0 ? m.nameLines : 1, take) * LH + 8, whole: false, from: ls[lf], to: ls[lf + take], off: lf * LH, cont: lf > 0, first: lf === 0, last: false });
      lf += take; newPage();
    }
  }
  for (const P of pages) {
    if (P.head === null) P.head = '';
    const parts = [];
    for (const it of P.items) {
      const bs = gBlocks(it.g);
      for (const b of bs) {
        if (it.whole || it.first) b.page = P.no;
        for (const c of b.cues) {
          if (c.wi >= 0 && !it.whole && (c.wi < it.from || c.wi >= it.to)) continue;
          c.page = P.no;
          if (c.board && c.label && !P.boards.includes(c.label)) P.boards.push(c.label);
        }
      }
      parts.push(bs.map(b => b.id + '~' + b.sv + '~' + b.name).join('+') + (it.whole ? '' : ':' + it.from + '-' + it.to + (it.part || '')));
    }
    P.sig = P.no + '|' + P.head + '|' + titleOf() + '|' + parts.join(',');
    P.fsig = facingSig(P);
    P.rails = [];
  }
  for (const s of S.pairs) {   // a paired cue runs from its page to the page of its end
    const e = s.endRef; if (!s.page || !e.page) continue;
    for (let n = s.page; n <= e.page && n + off <= pages.length; n++) pages[n - 1 + off].rails.push(s);
  }
  for (const P of pages) if (P.rails.length) P.sig += '|' + P.rails.map(s => s.b.id + ':' + s.s + '>' + s.endRef.b.id + ':' + s.endRef.s + '@' + s.lane).join(',');
  S.pages = pages;
}
