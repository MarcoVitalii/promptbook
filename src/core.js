'use strict';
/* =====================================================================
   Promptbook
   core.js : strings, state, parse (text -> blocks, cues, board tokens),
             text edits, undo, compare, layout (blocks -> fixed-measure pages)
   view.js : rendering, ink, boards, pen and touch, editing, cue lists, show mode, print
   io.js   : show file (.zip, File System Access), draft in the browser, history, dialogs, keys
   cast.js : the script for the actors, a second file built from core.js and cast.js
   ===================================================================== */

/* ---------- strings ---------- */
const STR = {
en: {
  appSub: 'Prompt book', openFile: 'Open show file…', reopen: 'Reopen “{0}”', trySample: 'Try the sample scene',
  pasteNew: 'Start from pasted text', contDraft: 'Continue the unsaved draft ({0})', importBk: 'Import a backup file…',
  startHint: 'A show is one .zip file: script, ink, settings, boards and images together. Copy that file to move the show. Create it with “Start from pasted text” or the sample, then “Save as show file…”.',
  noFs: 'This browser cannot save show files. Open the tool in Chrome or Edge for that. Here the show stays inside this browser until you export a backup.',
  menu: 'Menu', mOpen: 'Open show file…', mSaveTo: 'Save as show file…', mText: 'Edit whole script…', mExport: 'Export backup', mImport: 'Import backup…',
  mSettings: 'Settings…', mClose: 'Close show', jump: 'Jump to act or scene', jumpTo: 'Jump to…', find: 'Find…',
  eraser: 'Eraser', finger: 'Finger', fingerTip: 'Let finger and mouse draw (for machines without a pen)', undo: 'Undo', redo: 'Redo',
  boards: 'Boards', boardsTip: 'Show the facing page', cues: 'Cues', cuesTip: 'Show or hide cues', ink: 'Ink', inkTip: 'Show or hide ink',
  night: 'Night mode', fit: 'Fit', zoomIn: 'Zoom in', zoomOut: 'Zoom out', cueList: 'Cue list', print: 'Print', review: 'Review',
  prBook: 'Book: script and facing pages', prScript: 'Script pages only',
  stSaved: 'Saved {0}', stSaving: 'Saving…', stPending: 'Saving soon', stMem: 'Not on disk', stErr: 'Save failed',
  cueAfter: 'Cue after “{0}”', cueOwn: 'Cue on its own line, after this block', ownLine: 'On its own line',
  boardHere: 'Board here', editText: 'Edit text', label: 'Number or label', desc: 'Margin text', del: 'Delete', done: 'Done', lastLabel: 'last was {0}',
  save: 'Save', cancel: 'Cancel', close: 'Close',
  keys: 'Keyboard shortcuts', kHint: 'Single keys work when no text field has the focus and no cue box is open.', kFind: 'Find in the script', kSave: 'Save now', kPens: 'Pen colour',
  kZoom: 'Zoom in and out', kFit: 'Fit the page to the window', kPage: 'Next and previous page', kEnds: 'Start and end of the script', kEsc: 'Close the box or the menu; leave Find',
  editHint: 'Ctrl+Enter saves, Esc cancels. One line per speech: NAME: text. Start a line with & for simultaneous speech.',
  textTitle: 'Script text', pasteTitle: 'Paste the script',
  fmtHelp: '---\ntitle: The Sea\nauthor: Name Surname\ncharacters:\n  - ANNA/A - the daughter\n  - MARCO\n---\n# ACT ONE\n## Scene 1\n(An action on its own line.)\nANNA: Dialogue. (inline direction) More dialogue.\n& MARCO: Spoken at the same time as the line above.',
  contd: '(cont.)', together: 'together', board: 'Board', addBoard: '+ Board', bImage: 'Image…',
  bClear: 'Clear ink', bRename: 'Rename', bCreate: 'Add board', bMore: 'Board actions', bName: 'Board name', facingEmpty: 'No board on this page', boardsFull: 'A page holds {0} boards at most',
  checkInk: 'The text under this ink has changed', inkKeep: 'Ink is fine', inkClear: 'Clear ink on this block',
  rvNone: 'Nothing to review.', rvPara: 'Lines not recognised',
  rvParaHint: 'Shown without a name. Edit them to add NAME: or to join them to the speech above.',
  rvAmp: '“&” with no speech above', rvInk: 'Ink to check', rvOrph: 'Ink whose text was removed', rvUnk: 'Unknown departments', rvChars: 'Characters',
  rvCharsHint: 'A name that appears once may be a typo or a misread line.',
  rvNoChar: 'Not in the character list', rvNoCharHint: 'Speakers missing from “characters” at the top of the script. ALL, OTHERS, ALL BUT… are not checked.',
  rvSilent: 'Listed but never speaks', titleInScript: 'Set by “title” at the top of the script',
  all: 'All', thDept: 'Dept', thNo: 'No.', thDesc: 'Margin', thWhere: 'Act / scene', thLine: 'Cue line', thPage: 'P.', thWho: 'Character', thAct: 'Act', thScene: 'Scene',
  csv: 'CSV', noCues: 'No cues yet. Tap a word in the script.', dup: 'This number is used more than once', outOrder: 'This number is out of order',
  setTitle: 'Settings', showTitle: 'Show title', paperL: 'Paper', langL: 'Language', deptsL: 'Departments', addDept: '+ Department',
  deptHint: 'Changing a code does not rewrite cues already in the script.',
  extChanged: 'This show was changed by another program.', loadTheirs: 'Load that version', keepMine: 'Keep mine',
  reloaded: 'Show reloaded, it was changed outside',
  damaged: 'This show file has parts that cannot be read: {0}. The show is open without them, and nothing is saved until you choose.',
  damagedGo: 'Go on without', damagedClose: 'Close the show', damagedFirst: 'Choose first what to do with the parts that cannot be read.',
  damagedKept: 'What could not be read is kept in the show file, in the folder “damaged”.',
  memBanner: 'This show is only in this browser. Save it as a show file or export a backup.',
  errOpen: 'Could not open the show: {0}', errSave: 'Could not save: {0}', errFile: 'Could not read that file.', errPerm: 'permission to write to the file was denied',
  zipNot: 'not a zip file', zipBad: 'damaged zip file', zip64: 'zip64 is not supported', zipMethod: 'unsupported zip compression', zipBig: 'show too large for a zip file',
  relTitle: 'This show comes from a newer release',
  relWarn: 'This show asks for Promptbook {0} or later; this is {1}. It is open all the same, but this release may show wrongly what it does not know, and may drop it when it saves. Get the newer promptbook.html and open the show with that; until then, change as little as you can here.',
  pastedImg: 'Image pasted as a new board', notFound: 'Not found', exported: 'Backup exported', untitled: 'Untitled show',
  endRow: 'End:', endTitle: 'End of {0}', endLoose: 'End with nothing to close', linkTitle: 'Ends {0}', linkLoose: 'Nothing to end: {0}',
  moveUnpaired: 'Moved. This cue and its end no longer match: check the order.',
  moveBlock: 'Drag to move this block', blockUnpaired: 'Moved. A cue and its end no longer match: check the order.', kDel: 'Delete the cue or the board whose box is open',
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
  pickBase: 'Draw on top of', tplName: 'Template name', tplFade: 'Template strength', tplManage: 'Templates…',
  gridL: 'Board grid', gridOff: 'Off', gridFine: 'Fine', gridCoarse: 'Coarse',
  mHistory: 'History…', hiTitle: 'History', hiNeedFile: 'History is kept inside the show file. Use “Save as show file…” first.',
  hiVariant: 'Variant', hiNewVar: 'New variant', hiVarName: 'Name of a new variant, e.g. a theatre',
  hiVarHint: 'A variant is the show as it is given in one place or on one occasion, with revisions of its own. A change made in one variant does not reach the others.',
  hiRevName: 'Name of this revision, e.g. Rehearsal 12 October', hiSave: 'Save revision', hiLockToo: 'Lock page numbers here',
  hiNow: 'Now', hiNone: 'No revision yet.', hiChanges: 'Changes', hiRestore: 'Restore',
  hiRestored: 'Back to “{0}”. What you had was kept as a revision.', hiSaved: 'Revision “{0}” saved', hiSwitched: 'Now on variant “{0}”',
  hiBefore: 'Before going to “{0}”', hiTaken: 'That name is taken.', hiPacked: 'Part of this history was packed by git (gc or clone) and cannot be read here.',
  hiErr: 'History: {0}',
  lkOff: 'Page numbers are free: they move when text is added or cut.', lkOn: 'Page numbers are locked at “{0}”.',
  lkChanged: 'Changed pages: {0}', lkGone: 'Pages now empty: {0}', lkNone: 'No page has changed.',
  lkUnlock: 'Unlock', lkPrint: 'Print changed pages', lkMark: 'changed since “{0}”',
  dfTitle: 'Changes', dfFrom: 'From', dfTo: 'To', dfWho: 'Show', dfAll: 'Everything, cues too', dfText: 'Text', dfNone: 'No changes.',
  dfAdd: 'added', dfDel: 'cut', dfChg: 'changed', dfCue: 'cues', dfCueLine: 'the line before yours', dfCount: '{0} changes', dfFor: 'for {0}', dfBack: 'Back',
  mCast: 'Send to cast…', caTitle: 'Send to cast', deptCast: 'Cast', deptCastTip: 'Notes for the actors: sent with “Send to cast…”, listed under Review, left out of the cue list',
  caHint: 'The cast file holds the text without cues, comments and to-do notes, plus the notes of the departments marked “Cast”. An actor opens it in a browser, on a phone too: it shows the script, hides their own lines for practice and keeps their own notes on their device. Send a new file after a rehearsal: the notes they wrote stay with them.',
  caNoDept: 'No department is marked “Cast” yet. The notes pinned under such a department are the ones the actors receive; its name tells them who is writing, for example Director.',
  caAddDept: 'Add a “Notes” department', caDeptName: 'Notes', caCount: 'Notes for the cast: {0}', caNone: 'No note for the cast yet: the file will hold the text only.',
  caEveryone: 'Everyone', caSaveHtml: 'Save the cast file (.html)', caSaveJson: 'Text and notes only (.cast.json)',
  caJsonHint: 'The .html file is the reader with this show inside: one file to send. The .cast.json file is for who already keeps the reader and opens the show from its menu.',
  caFor: 'For: blank = {0}', caNote: 'Note for the cast', rvCast: 'Notes for the cast',
  acApp: 'Cast script', acOpen: 'Open a cast file…', acStart: 'Open the file you received from the stage manager (…-cast.html or .cast.json). Your part and your notes stay on this device.',
  acPart: 'My part', acPartHint: 'Tick every name you speak under. Groups and choruses are listed as the script writes them: tick the ones you are part of.',
  acHide: 'Hide my lines', acHideTip: 'Cover my lines to practise; tap a covered line to see it', acPickFirst: 'Tick your character first',
  acNotes: 'Notes', acForMe: 'For me', acMine: 'My notes', acGot: 'Received', acAdd: '+ Note', acNotePh: 'Your note on this line',
  acLost: 'My notes whose line has changed', acNoNotes: 'No notes.', acRead: 'Read', acSize: 'Text size', acExport: 'Export my notes', acImport: 'Import my notes…',
  acSent: 'Sent {0}', acBad: 'This is not a cast file.', acNewer: 'This file needs a newer reader: ask for the .html cast file.', acLoaded: 'Show updated: {0}',
  acTo: 'for {0}', acImported: 'Notes imported: {0}', acNoSpeak: 'No speaker found in this script.', acLang: 'Italiano',
  acNews: 'What is new', acNewsFile: 'File of {0}', acNewsNotes: 'Notes to read: {0}', acNewsLines: 'Lines changed since the file before: {0}, mine {1}',
  acNewsMoved: 'My notes on a line that changed: {0}', acNewsLost: 'My notes whose line was cut: {0}', acNewsNone: 'Nothing changed for you.',
  acMoved: 'The line has changed since you wrote this. Save to keep the note here.', acAttach: 'Put on this line', acLostHint: 'Tap a line, then its note button, to put one of these back.',
  acOlder: 'This file is older than the one opened last ({0}). Nothing was updated.', acOlderAsk: 'This file is older than the one you have ({0}). Open it anyway?',
  acNoStore: 'This browser does not keep your notes when the page is closed. Use “Export my notes” before you close it.', acLine: 'Notes on this line',
  showMode: 'Show', showTip: 'Show mode: nothing can be changed, a line runs down the script and cues are announced',
  shPlay: 'Start or stop the line', shBack: 'Back to the line', shLeave: 'Leave', shLeave2: 'Press again to leave', shStandby: 'STANDBY', shWarning: 'WARNING', shGo: 'GO',
  shNext: 'Next', shNoCue: 'No more cues', shTempo: '{0}%', shSlower: 'Pace of the night: slower', shFaster: 'Pace of the night: faster', shUse: 'Tonight {0}%: use it', shUseTip: 'The pace of this run, measured from your corrections of the line',
  shLearn: 'Time it', shLearnTip: 'For a rehearsal. While the line runs, each double tap says “the show is here”: the time since the mark before is kept for the blocks in between. Stop the line before jumping elsewhere.',
  shTimed: 'Timed {0}, was {1}', shBlockT: 'This block: {0}, timed', shBlockE: 'This block: ~{0}, estimated', shBlockTip: 'The time of the block the line is in: 5 seconds less, 5 seconds more',
  shShare: '{0}% of the show timed', shRest: 'Rest at {0} wpm', shRestTip: 'The pace measured over the timed speeches: use it for everything that is not timed',
  shLeft: '{0} left', shEnds: 'ends ~{0}', shPeekTip: 'Press to look at the place of this cue; the line stays where it is', shMapTip: 'The whole show, scene by scene. Press to look at that place; the line stays where it is.',
  shForget: 'Forget {0} timed blocks', shHint: 'Show mode. Space starts the line. Double tap a word to put the line there.', shBusy: 'Close the editor first.',
  paceL: 'Pace of blocks not timed (words per minute)', standbyL: 'Standby (seconds before the cue)', warningL: 'Warning (seconds before, 0 for none)',
  kShow: 'Show mode', kShLeave: 'Leave show mode (press twice)', kShHint: 'These are the keys of show mode. The editing keys are back when you leave it.',
  kShPlay: 'Start or stop the line', kShBack: 'Back to the line', kShStep: 'Line to the next or previous block', kShPace: 'Pace of the night: slower, faster'
},
it: {
  appSub: 'Copione di scena', openFile: 'Apri il file dello spettacolo…', reopen: 'Riapri «{0}»', trySample: 'Prova la scena di esempio',
  pasteNew: 'Inizia incollando il testo', contDraft: 'Riprendi la bozza non salvata ({0})', importBk: 'Importa un file di backup…',
  startHint: 'Uno spettacolo è un solo file .zip: copione, appunti a penna, impostazioni, schemi e immagini insieme. Per spostarlo basta copiare quel file. Crealo con «Inizia incollando il testo» o con l’esempio, poi «Salva come file spettacolo…».',
  noFs: 'Questo browser non può salvare i file dello spettacolo. Per farlo apri lo strumento in Chrome o Edge. Qui lo spettacolo resta dentro questo browser finché non esporti un backup.',
  menu: 'Menu', mOpen: 'Apri file spettacolo…', mSaveTo: 'Salva come file spettacolo…', mText: 'Modifica tutto il testo…', mExport: 'Esporta backup', mImport: 'Importa backup…',
  mSettings: 'Impostazioni…', mClose: 'Chiudi spettacolo', jump: 'Vai ad atto o scena', jumpTo: 'Vai a…', find: 'Cerca…',
  eraser: 'Gomma', finger: 'Dito', fingerTip: 'Fa disegnare dito e mouse (per computer senza penna)', undo: 'Annulla', redo: 'Ripeti',
  boards: 'Tavole', boardsTip: 'Mostra la pagina a fronte', cues: 'Cue', cuesTip: 'Mostra o nascondi i cue', ink: 'Tratti', inkTip: 'Mostra o nascondi l’inchiostro',
  night: 'Modalità notte', fit: 'Adatta', zoomIn: 'Ingrandisci', zoomOut: 'Riduci', cueList: 'Lista cue', print: 'Stampa', review: 'Rivedi',
  prBook: 'Copione e pagine a fronte', prScript: 'Solo pagine del copione',
  stSaved: 'Salvato {0}', stSaving: 'Salvataggio…', stPending: 'Da salvare', stMem: 'Non su disco', stErr: 'Salvataggio fallito',
  cueAfter: 'Cue dopo «{0}»', cueOwn: 'Cue su riga propria, dopo questo blocco', ownLine: 'Su riga propria',
  boardHere: 'Tavola qui', editText: 'Modifica testo', label: 'Numero o sigla', desc: 'Testo a margine', del: 'Elimina', done: 'Fatto', lastLabel: 'l’ultimo era {0}',
  save: 'Salva', cancel: 'Annulla', close: 'Chiudi',
  keys: 'Scorciatoie da tastiera', kHint: 'I tasti singoli funzionano quando nessun campo di testo è attivo e nessun riquadro dei cue è aperto.', kFind: 'Cerca nel testo', kSave: 'Salva subito', kPens: 'Colore della penna',
  kZoom: 'Ingrandisci e riduci', kFit: 'Adatta la pagina alla finestra', kPage: 'Pagina successiva e precedente', kEnds: 'Inizio e fine del testo', kEsc: 'Chiudi il riquadro o il menu; esci da Cerca',
  editHint: 'Ctrl+Invio salva, Esc annulla. Una riga per battuta: NOME: testo. Inizia la riga con & per le battute simultanee.',
  textTitle: 'Testo del copione', pasteTitle: 'Incolla il copione',
  fmtHelp: '---\ntitolo: Il mare\nautore: Nome Cognome\npersonaggi:\n  - ANNA/A - la figlia\n  - MARCO\n---\n# ATTO PRIMO\n## Scena 1\n(Un’azione su una riga a sé.)\nANNA: Battuta. (didascalia interna) Ancora battuta.\n& MARCO: Detta insieme alla riga sopra.',
  contd: '(segue)', together: 'insieme', board: 'Tavola', addBoard: '+ Tavola', bImage: 'Immagine…',
  bClear: 'Cancella inchiostro', bRename: 'Rinomina', bCreate: 'Aggiungi tavola', bMore: 'Azioni della tavola', bName: 'Nome della tavola', facingEmpty: 'Nessuna tavola in questa pagina', boardsFull: 'Una pagina contiene al massimo {0} tavole',
  checkInk: 'Il testo sotto questo inchiostro è cambiato', inkKeep: 'L’inchiostro va bene', inkClear: 'Cancella l’inchiostro del blocco',
  rvNone: 'Niente da rivedere.', rvPara: 'Righe non riconosciute',
  rvParaHint: 'Mostrate senza nome. Modificale per aggiungere NOME: o per unirle alla battuta sopra.',
  rvAmp: '«&» senza battuta sopra', rvInk: 'Inchiostro da controllare', rvOrph: 'Inchiostro di testo rimosso', rvUnk: 'Reparti sconosciuti', rvChars: 'Personaggi',
  rvCharsHint: 'Un nome che compare una sola volta può essere un refuso o una riga letta male.',
  rvNoChar: 'Non nell’elenco dei personaggi', rvNoCharHint: 'Nomi che mancano da «personaggi» in testa al copione. TUTTI, GLI ALTRI, TUTTI TRANNE… non sono controllati.',
  rvSilent: 'In elenco ma senza battute', titleInScript: 'Impostato da «titolo» in testa al copione',
  all: 'Tutti', thDept: 'Rep.', thNo: 'N.', thDesc: 'Margine', thWhere: 'Atto / scena', thLine: 'Battuta', thPage: 'Pag.', thWho: 'Personaggio', thAct: 'Atto', thScene: 'Scena',
  csv: 'CSV', noCues: 'Ancora nessun cue. Tocca una parola del copione.', dup: 'Questo numero è usato più volte', outOrder: 'Questo numero è fuori ordine',
  setTitle: 'Impostazioni', showTitle: 'Titolo dello spettacolo', paperL: 'Carta', langL: 'Lingua', deptsL: 'Reparti', addDept: '+ Reparto',
  deptHint: 'Cambiare una sigla non riscrive i cue già nel copione.',
  extChanged: 'Questo spettacolo è stato modificato da un altro programma.', loadTheirs: 'Carica quella versione', keepMine: 'Tieni la mia',
  reloaded: 'Spettacolo ricaricato, era stato modificato altrove',
  damaged: 'Questo file spettacolo ha parti illeggibili: {0}. Lo spettacolo è aperto senza, e non viene salvato nulla finché non scegli.',
  damagedGo: 'Continua senza', damagedClose: 'Chiudi lo spettacolo', damagedFirst: 'Scegli prima che cosa fare delle parti illeggibili.',
  damagedKept: 'Ciò che era illeggibile resta nel file spettacolo, nella cartella «damaged».',
  memBanner: 'Questo spettacolo è solo in questo browser. Salvalo come file spettacolo o esporta un backup.',
  errOpen: 'Impossibile aprire lo spettacolo: {0}', errSave: 'Impossibile salvare: {0}', errFile: 'Impossibile leggere il file.', errPerm: 'permesso di scrittura sul file negato',
  zipNot: 'non è un file zip', zipBad: 'file zip danneggiato', zip64: 'il formato zip64 non è supportato', zipMethod: 'compressione zip non supportata', zipBig: 'spettacolo troppo grande per un file zip',
  relTitle: 'Questo spettacolo viene da una versione più recente',
  relWarn: 'Questo spettacolo chiede Promptbook {0} o successivo; questo è {1}. È aperto lo stesso, ma questa versione può mostrare male ciò che non conosce, e può perderlo quando salva. Procurati il promptbook.html più recente e apri lo spettacolo con quello; fino ad allora, cambia qui il meno possibile.',
  pastedImg: 'Immagine incollata come nuova tavola', notFound: 'Non trovato', exported: 'Backup esportato', untitled: 'Spettacolo senza titolo',
  endRow: 'Fine:', endTitle: 'Fine di {0}', endLoose: 'Fine senza niente da chiudere', linkTitle: 'Chiude {0}', linkLoose: 'Niente da chiudere: {0}',
  moveUnpaired: 'Spostato. Il cue e la sua fine non corrispondono più: controlla l’ordine.',
  moveBlock: 'Trascina per spostare il blocco', blockUnpaired: 'Spostato. Un cue e la sua fine non corrispondono più: controlla l’ordine.', kDel: 'Elimina il cue o la tavola del riquadro aperto',
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
  pickBase: 'Disegna sopra a', tplName: 'Nome del modello', tplFade: 'Intensità dei modelli', tplManage: 'Modelli…',
  gridL: 'Griglia delle tavole', gridOff: 'Nessuna', gridFine: 'Fine', gridCoarse: 'Larga',
  mHistory: 'Cronologia…', hiTitle: 'Cronologia', hiNeedFile: 'La cronologia sta dentro il file dello spettacolo. Usa prima «Salva come file spettacolo…».',
  hiVariant: 'Variante', hiNewVar: 'Nuova variante', hiVarName: 'Nome di una nuova variante, es. un teatro',
  hiVarHint: 'Una variante è lo spettacolo come va in scena in un luogo o in un’occasione, con le sue revisioni. Una modifica fatta in una variante non arriva alle altre.',
  hiRevName: 'Nome di questa revisione, es. Prova 12 ottobre', hiSave: 'Salva revisione', hiLockToo: 'Blocca qui i numeri di pagina',
  hiNow: 'Adesso', hiNone: 'Ancora nessuna revisione.', hiChanges: 'Modifiche', hiRestore: 'Ripristina',
  hiRestored: 'Tornato a «{0}». Quello che avevi è stato tenuto come revisione.', hiSaved: 'Revisione «{0}» salvata', hiSwitched: 'Ora sei nella variante «{0}»',
  hiBefore: 'Prima di passare a «{0}»', hiTaken: 'Questo nome è già usato.', hiPacked: 'Una parte di questa cronologia è stata compressa da git (gc o clone) e qui non si può leggere.',
  hiErr: 'Cronologia: {0}',
  lkOff: 'I numeri di pagina sono liberi: si spostano quando si aggiunge o si taglia testo.', lkOn: 'I numeri di pagina sono bloccati a «{0}».',
  lkChanged: 'Pagine cambiate: {0}', lkGone: 'Pagine ora vuote: {0}', lkNone: 'Nessuna pagina è cambiata.',
  lkUnlock: 'Sblocca', lkPrint: 'Stampa le pagine cambiate', lkMark: 'cambiata dopo «{0}»',
  dfTitle: 'Modifiche', dfFrom: 'Da', dfTo: 'A', dfWho: 'Mostra', dfAll: 'Tutto, anche i cue', dfText: 'Testo', dfNone: 'Nessuna modifica.',
  dfAdd: 'aggiunta', dfDel: 'tagliata', dfChg: 'cambiata', dfCue: 'cue', dfCueLine: 'la battuta prima della tua', dfCount: '{0} modifiche', dfFor: 'per {0}', dfBack: 'Indietro',
  mCast: 'Invia agli attori…', caTitle: 'Invia agli attori', deptCast: 'Attori', deptCastTip: 'Note per gli attori: inviate con «Invia agli attori…», elencate in Rivedi e lasciate fuori dalla lista cue',
  caHint: 'Il file per gli attori contiene il testo senza cue, commenti e appunti «da fare», più le note dei reparti segnati «Attori». Un attore lo apre in un browser, anche sul telefono: mostra il copione, nasconde le sue battute per provare a memoria e tiene le sue note sul suo dispositivo. Invia un nuovo file dopo una prova: le note che ha scritto restano a lui.',
  caNoDept: 'Nessun reparto è ancora segnato «Attori». Le note messe sotto un reparto così sono quelle che gli attori ricevono; il suo nome dice loro chi scrive, per esempio Regia.',
  caAddDept: 'Aggiungi un reparto «Note»', caDeptName: 'Note', caCount: 'Note per gli attori: {0}', caNone: 'Ancora nessuna nota per gli attori: il file conterrà solo il testo.',
  caEveryone: 'Tutti', caSaveHtml: 'Salva il file per gli attori (.html)', caSaveJson: 'Solo testo e note (.cast.json)',
  caJsonHint: 'Il file .html è il lettore con dentro questo spettacolo: un solo file da inviare. Il file .cast.json è per chi tiene già il lettore e apre lo spettacolo dal suo menu.',
  caFor: 'Per: vuoto = {0}', caNote: 'Nota per gli attori', rvCast: 'Note per gli attori',
  acApp: 'Copione per gli attori', acOpen: 'Apri un file per gli attori…', acStart: 'Apri il file ricevuto dalla direzione di scena (…-cast.html o .cast.json). La tua parte e le tue note restano su questo dispositivo.',
  acPart: 'La mia parte', acPartHint: 'Spunta ogni nome sotto cui parli. Gruppi e cori sono elencati come li scrive il copione: spunta quelli di cui fai parte.',
  acHide: 'Nascondi le mie battute', acHideTip: 'Copre le mie battute per provare a memoria; tocca una battuta coperta per vederla', acPickFirst: 'Spunta prima il tuo personaggio',
  acNotes: 'Note', acForMe: 'Per me', acMine: 'Le mie note', acGot: 'Ricevute', acAdd: '+ Nota', acNotePh: 'La tua nota su questa battuta',
  acLost: 'Mie note la cui battuta è cambiata', acNoNotes: 'Nessuna nota.', acRead: 'Letta', acSize: 'Dimensione del testo', acExport: 'Esporta le mie note', acImport: 'Importa le mie note…',
  acSent: 'Inviato {0}', acBad: 'Questo non è un file per gli attori.', acNewer: 'Questo file richiede un lettore più recente: chiedi il file .html per gli attori.', acLoaded: 'Spettacolo aggiornato: {0}',
  acTo: 'per {0}', acImported: 'Note importate: {0}', acNoSpeak: 'Nessun personaggio trovato in questo copione.', acLang: 'English',
  acNews: 'Novità', acNewsFile: 'File del {0}', acNewsNotes: 'Note da leggere: {0}', acNewsLines: 'Battute cambiate dal file precedente: {0}, mie {1}',
  acNewsMoved: 'Mie note su una battuta cambiata: {0}', acNewsLost: 'Mie note la cui battuta è stata tagliata: {0}', acNewsNone: 'Per te non è cambiato niente.',
  acMoved: 'La battuta è cambiata da quando l’hai scritta. Salva per tenere qui la nota.', acAttach: 'Metti su questa battuta', acLostHint: 'Tocca una battuta, poi il suo pulsante delle note, per rimetterne una.',
  acOlder: 'Questo file è più vecchio dell’ultimo aperto ({0}). Non è stato aggiornato niente.', acOlderAsk: 'Questo file è più vecchio di quello che hai ({0}). Aprirlo lo stesso?',
  acNoStore: 'Questo browser non conserva le tue note quando la pagina viene chiusa. Usa «Esporta le mie note» prima di chiuderla.', acLine: 'Note su questa battuta',
  showMode: 'Spettacolo', showTip: 'Modalità spettacolo: niente può essere modificato, una riga scorre sul copione e i cue vengono annunciati',
  shPlay: 'Avvia o ferma la riga', shBack: 'Torna alla riga', shLeave: 'Esci', shLeave2: 'Premi ancora per uscire', shStandby: 'PRONTI', shWarning: 'ATTENZIONE', shGo: 'VIA',
  shNext: 'Prossimo', shNoCue: 'Nessun altro cue', shTempo: '{0}%', shSlower: 'Ritmo della serata: più lento', shFaster: 'Ritmo della serata: più veloce', shUse: 'Stasera {0}%: usalo', shUseTip: 'Il ritmo di questa replica, misurato dalle tue correzioni della riga',
  shLearn: 'Cronometra', shLearnTip: 'Per una prova. Mentre la riga scorre, ogni doppio tocco dice «lo spettacolo è qui»: il tempo passato dal segno precedente viene conservato per i blocchi in mezzo. Ferma la riga prima di saltare altrove.',
  shTimed: 'Cronometrato {0}, era {1}', shBlockT: 'Questo blocco: {0}, cronometrato', shBlockE: 'Questo blocco: ~{0}, stimato', shBlockTip: 'Il tempo del blocco in cui si trova la riga: 5 secondi in meno, 5 secondi in più',
  shShare: 'Cronometrato il {0}% dello spettacolo', shRest: 'Il resto a {0} parole/min', shRestTip: 'Il ritmo misurato sulle battute cronometrate: usalo per tutto ciò che non è cronometrato',
  shLeft: 'mancano {0}', shEnds: 'fine ~{0}', shPeekTip: 'Premi per guardare il punto di questo cue; la riga resta dov’è', shMapTip: 'Tutto lo spettacolo, scena per scena. Premi per guardare quel punto; la riga resta dov’è.',
  shForget: 'Dimentica {0} blocchi cronometrati', shHint: 'Modalità spettacolo. Spazio avvia la riga. Doppio tocco su una parola per portarci la riga.', shBusy: 'Chiudi prima l’editor.',
  paceL: 'Ritmo dei blocchi non cronometrati (parole al minuto)', standbyL: 'Pronti (secondi prima del cue)', warningL: 'Attenzione (secondi prima, 0 per nessuna)',
  kShow: 'Modalità spettacolo', kShLeave: 'Esci dalla modalità spettacolo (premi due volte)', kShHint: 'Questi sono i tasti della modalità spettacolo. I tasti di modifica tornano quando esci.',
  kShPlay: 'Avvia o ferma la riga', kShBack: 'Torna alla riga', kShStep: 'Riga al blocco successivo o precedente', kShPace: 'Ritmo della serata: più lento, più veloce'
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
const MAX_BOARDS = 8;   // per facing page, through the interface
const FIG_EXTRA = 46;   // height a board figure takes besides its drawing: button row 26, name 20
const FIG_WIDE = 420;   // from this width a figure shows its buttons; under it, one "\u22ef" button
const FIG_GAP = 12;
const VERSION = 'r1.11';
const READABLE_FROM = 'r1.10';   // the oldest release that opens and saves what this one writes without damaging it (STO-15). Raise it, as a rule to VERSION, whenever a saved format changes in a way an older release would damage
/* release names are compared part by part, as numbers: r1.9 is older than r1.10. A name that cannot be read counts as the oldest */
const relParts = v => { const m = /^r(\d+(?:\.\d+)*)$/i.exec(typeof v === 'string' ? v.trim() : ''); return m ? m[1].split('.').map(Number) : []; };
function relCmp(a, b) {
  const x = relParts(a), y = relParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
}
/* the mark a show carries in config.json: the release that saved it last and the oldest that reads it without loss. What a newer release asked for stays asked */
const relOf = c => c && c.release && typeof c.release === 'object' ? c.release : {};
function relMark(c) { const r = relOf(c); return Object.assign({}, r, { made: VERSION, needs: relCmp(r.needs, READABLE_FROM) > 0 ? r.needs : READABLE_FROM }); }
const relNewer = c => relCmp(relOf(c).needs, VERSION) > 0 ? relOf(c).needs : '';   // the release a show asks for when this one is older, or ''

function defaultConfig() {
  const it = LANG === 'it';
  return { title: '', paper: 'A4', departments: [
    { code: 'LX', name: it ? 'Luci' : 'Lights', colour: '#c98a00' },
    { code: 'SND', name: it ? 'Audio' : 'Sound', colour: '#1f6fd6' },
    { code: 'VID', name: 'Video', colour: '#7a3fd1' },
    { code: 'TODO', name: it ? 'Da fare' : 'To do', colour: '#d62828', review: true } ], defaultBoard: null,
    templates: [], defaultTemplate: null, recentTemplates: [], templateFade: 0.4, boardGrid: 25, lock: null, castId: '', show: { wpm: 130, standby: 30, warning: 120, times: {} } };
}
function normCfg(c) {
  const o = Object.assign(defaultConfig(), c || {});
  if (!Array.isArray(o.departments) || !o.departments.length) o.departments = defaultConfig().departments;
  o.departments = o.departments.map(x => {
    const code = String(x.code || '').toUpperCase().replace(/[^\p{L}\p{N}_-]/gu, '');
    return Object.assign({}, x, { code, name: String(x.name || ''), colour: String(x.colour || x.color || '#888888'), review: !!x.review || !!x.cast, cast: !!x.cast });   // a field a later release added is carried through (STO-17)
  }).filter(x => x.code && x.code !== 'BOARD');
  if (!PAPERS[o.paper]) o.paper = 'A4';
  o.title = String(o.title || '');
  const names = v => Array.isArray(v) ? v.filter(n => typeof n === 'string' && n) : [];
  o.templates = Array.from(new Set(names(o.templates))); o.recentTemplates = names(o.recentTemplates);
  o.defaultTemplate = typeof o.defaultTemplate === 'string' && o.defaultTemplate ? o.defaultTemplate : null;
  o.templateFade = clamp(+o.templateFade || 0.4, 0.15, 0.8);
  const gr = parseInt(o.boardGrid, 10);   // grid step in board units; 0 is off and must survive, null or '' is not 0
  o.boardGrid = [0, 25, 50].includes(gr) ? gr : 25;
  o.castId = typeof o.castId === 'string' ? o.castId : '';   // names the show to the actors' files, whatever its title becomes
  const sw = o.show || {}, num = (v, d, lo, hi) => clamp(v == null || v === '' || !Number.isFinite(+v) ? d : Math.round(+v), lo, hi);   // show mode: pace and lead times
  o.show = Object.assign({}, typeof sw === 'object' && !Array.isArray(sw) ? sw : null, { wpm: num(sw.wpm, 130, 40, 300), standby: num(sw.standby, 30, 5, 300), warning: num(sw.warning, 120, 0, 900), times: {} }); delete o.show.scenes;   // what a later release added is carried through (STO-17); the scene paces of a build that was never released are not
  for (const [k, v] of Object.entries(sw.times && typeof sw.times === 'object' ? sw.times : {})) if (Number.isFinite(+v) && +v > 0) o.show.times[k] = clamp(Math.round(+v * 10) / 10, 0.1, 3600);   // seconds a timed block takes, by its words
  const lk = o.lock;   // locked page numbers, see makeLock
  o.lock = lk && ['pages', 'n', 'cont', 'sig', 'keys'].every(k => typeof lk[k] === 'string') && lk.pages ? Object.assign({}, lk, { name: String(lk.name || ''), rev: String(lk.rev || '') }) : null;
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
  pages: [], pageOff: 0, lockInfo: null, els: [], meas: new Map(),
  view: { zoom: 1, fit: true, facing: true, cues: true, ink: true, night: false },
  tool: { mode: 'pen', colour: INKS[0], width: 0.13, finger: false },
  hist: [], redo: [], sel: null, editing: false, drawer: null, cueFilter: null, findAt: null, loaded: false,
  show: { on: false, playing: false, base: 0, t0: 0, follow: true, played: 0, anchor: null, cal: { want: 0, ms: 0 }, tempo: 1, learn: false, last: null, tl: null, cues: [] },
  store: { mode: 'none', name: '', stamp: {}, dirty: { script: false, ink: false, cfg: false, boards: new Set(), tpls: new Set() }, conflict: false, lastSave: null, err: null }
};
const paper = () => PAPERS[S.cfg.paper] || PAPERS.A4;
const deptOf = code => S.cfg.departments.find(d => d.code === code) || null;
/* a review department holds notes for after the rehearsal: listed in Review, never in the cue list */
const isReview = code => { const d = deptOf(code); return !!(d && d.review); };
/* a cast department holds notes for the actors: a review department whose notes are also sent to them */
const isCast = code => { const d = deptOf(code); return !!(d && d.cast); };
const titleOf = () => (S.meta && S.meta.title) || S.cfg.title;   // the script's own title wins over Settings
/* what is printed for page number n: the number itself, or its locked label such as 12A */
const pl = n => { const P = n ? S.pages[n - 1 + S.pageOff] : null; return P ? P.label : (n || ''); };

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
/* Labels out of order (CUE-5): a hint in the cue list, never a change. A label has a place in the order only
   if it has a digit. It is read as its runs of digits and of letters; anything else only separates them.
   Labels are judged within one act, one department and one leading word (A12 against A13, never against 12).
   In order are the cues of the longest run, in script order, in which no label is lower than one before it;
   of two runs equally long, the one that keeps the earlier cue. Every other numbered cue is out of order. */
function labelKey(label) {
  const r = /\d/.test(label) ? label.toLowerCase().match(/\d+|\p{L}+/gu) : null;
  if (!r) return null;
  const pre = /\d/.test(r[0]) ? '' : r.shift();
  return { pre, runs: r.map(x => /\d/.test(x) ? +x : x) };
}
function cmpRuns(a, b) {   // 12 < 12.5 < 12.10 < 12A < 13: digits as whole numbers, digits before letters, the shorter label first
  for (let i = 0; i < a.length && i < b.length; i++) {
    const x = a[i], y = b[i];
    if (typeof x !== typeof y) return typeof x === 'number' ? -1 : 1;
    if (x !== y) return x < y ? -1 : 1;
  }
  return a.length - b.length;
}
function cuesOutOfOrder(cues) {
  const acts = new Map(), groups = new Map(), odd = new Set(); let a = 0;
  for (const b of S.blocks) { if (b.type === 'h' && b.level === 1) a++; acts.set(b, a); }
  for (const c of cues) {
    const k = c.board || c.end || !c.label ? null : labelKey(c.label); if (!k) continue;
    const g = acts.get(c.b) + '\u0001' + c.dept + '\u0001' + k.pre; let q = groups.get(g); if (!q) groups.set(g, q = []);
    q.push({ c, k: k.runs });
  }
  for (const q of groups.values()) {
    if (q.every((x, i) => !i || cmpRuns(q[i - 1].k, x.k) <= 0)) continue;   // the usual case: nothing out of order
    const n = q.length, len = new Array(n).fill(1); let need = 1, last = null;
    for (let i = n - 2; i >= 0; i--) {   // len[i]: the longest run in order that starts at cue i
      for (let j = i + 1; j < n; j++) if (len[j] >= len[i] && cmpRuns(q[i].k, q[j].k) <= 0) len[i] = len[j] + 1;
      if (len[i] > need) need = len[i];
    }
    for (let i = 0; i < n; i++) {
      if (len[i] === need && (!last || cmpRuns(last.k, q[i].k) <= 0)) { last = q[i]; need--; } else odd.add(q[i].c);
    }
  }
  return odd;
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
/* text after several token edits at once: [{ b, s, e, text }], text null removes the token; ins = { j, line }
   also puts a new line before block j (j = S.blocks.length puts it last), tight under the block above it */
function textEdits(edits, ins) {
  const by = new Map();
  for (const ed of edits) { let q = by.get(ed.b); if (!q) by.set(ed.b, q = []); q.push(ed); }
  const out = []; let carry = 0;   // blank lines above a line that is removed: they merge with those below it
  for (const b of S.blocks) {
    if (ins && S.blocks[ins.j] === b) out.push(ins.line);
    let raw = b.raw; const q = by.get(b);
    if (q) {
      q.sort((x, y) => y.s - x.s);
      for (const ed of q) raw = ed.text === null ? cutToken(raw, ed.s, ed.e) : raw.slice(0, ed.s) + ed.text + raw.slice(ed.e);
      raw = raw.replace(/^\n+|\s+$/g, '');
    }
    const gap = Math.max(b.gap, carry);
    if (raw.trim() === '') { carry = gap; continue; }
    for (let k = 0; k < gap; k++) out.push('');
    out.push(raw); carry = 0;
  }
  if (ins && ins.j === S.blocks.length) out.push(ins.line);
  return out.join('\n') + '\n';
}
/* text with cue c moved to just after word wi of block tb (after the cues already there); null when that is where it is */
function textMoveCue(c, tb, wi) {
  const w = tb && tb.tokens[wi]; if (!w || w.k !== 'w' || !c || !c.b) return null;
  const after = w.cues.filter(q => !q.before);
  if (after[after.length - 1] === c) return null;
  let pos = w.e; for (const q of after) if (q !== c) pos = Math.max(pos, q.e);
  const raw = c.b.raw, sp = x => x === undefined || /\s/.test(x);
  /* a token with text glued on both sides leaves a space, or its neighbours would become one word */
  const cut = c.s > 0 && !sp(raw[c.s - 1]) && !sp(raw[c.e]) ? ' ' : null;
  /* a token glued to the next word (uno{LX 1}due) is followed by text: keep the moved token apart from it */
  const tail = sp(tb.raw[pos]) ? '' : ' ';
  return textEdits([{ b: c.b, s: c.s, e: c.e, text: cut }, { b: tb, s: pos, e: pos, text: ' ' + raw.slice(c.s, c.e) + tail }]);
}
/* text with cue c moved to a line of its own before block j (j = S.blocks.length puts it last); null when that is
   where it is. A cue that already has a line to itself moves as that line, with the blank lines above it. */
function textCueOwn(c, j) {
  if (!c || !c.b || !(j >= 0 && j <= S.blocks.length)) return null;
  const raw = c.b.raw, sp = x => x === undefined || /\s/.test(x);
  if (c.b.type === 'mark' && c.b.cues.length === 1) return textMoveBlocks(S.blocks.indexOf(c.b), 1, j);
  const cut = c.s > 0 && !sp(raw[c.s - 1]) && !sp(raw[c.e]) ? ' ' : null;
  return textEdits([{ b: c.b, s: c.s, e: c.e, text: cut }], { j, line: raw.slice(c.s, c.e) });
}

/* text with blocks [i0, i0+n) moved to stand before block j (j = S.blocks.length puts them last); null when that is
   where they are. The moved blocks keep the blank lines above them and the block that followed them keeps at least as
   many. An unrecognised line that would touch the line above it gets a blank line, or it would be read as part of it. */
function textMoveBlocks(i0, n, j) {
  const bl = S.blocks;
  if (i0 < 0 || n < 1 || i0 + n > bl.length || j < 0 || j > bl.length || (j >= i0 && j <= i0 + n)) return null;
  const mv = bl.slice(i0, i0 + n), seq = [];
  const put = () => { for (const m of mv) seq.push([m, m.gap]); };
  bl.forEach((b, i) => {
    if (i === j) put();
    if (i < i0 || i >= i0 + n) seq.push([b, i === i0 + n ? Math.max(b.gap, mv[0].gap) : b.gap]);
  });
  if (j === bl.length) put();
  const out = [];
  seq.forEach(([b, gap], k) => {
    const up = k ? seq[k - 1][0] : null;
    if (!up && b !== bl[0]) gap = 0;   // a new first line brings no blank line to the top
    if (up && !gap && b.type === 'para' && up.type !== 'mark' && up.type !== 'h') gap = 1;
    for (let q = 0; q < gap; q++) out.push('');
    out.push(b.raw);
  });
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
function pushHist(op) { if (S.show.on) return; S.hist.push(op); if (S.hist.length > 200) S.hist.shift(); S.redo.length = 0; updUndo(); }
function undo() { if (S.show.on) return; const op = S.hist.pop(); if (!op) return; closePop(); op.undo(); S.redo.push(op); updUndo(); }
function redo() { if (S.show.on) return; const op = S.redo.pop(); if (!op) return; closePop(); op.redo(); S.hist.push(op); updUndo(); }

function applyText(tx) { reparse(tx); relayout(); markDirty('script'); }
/* Change the script text as one undoable step. Only the changed span is kept in history. */
function commitText(nt) {
  const old = serialize();
  if (nt === old || S.show.on) return false;   // show mode is read only
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

/* ---------- compare ----------
   Two versions of a script set side by side, block by block: what was added, cut or changed.
   History uses it to show changes; locked pages use lcs() to find where the old pages are now. */
/* longest common subsequence of two lists of strings, as pairs [i, j] in order */
function lcs(a, b) {
  const out = [], tail = []; let p = 0, n = a.length, m = b.length;
  while (p < n && p < m && a[p] === b[p]) { out.push([p, p]); p++; }
  while (n > p && m > p && a[n - 1] === b[m - 1]) { n--; m--; tail.push([n, m]); }
  const N = n - p, M = m - p, W = M + 1;
  if (N && M && N * M <= 4e6) {   // past that the middle counts as all different
    const T = new Uint16Array((N + 1) * W);
    for (let i = N - 1; i >= 0; i--) for (let j = M - 1; j >= 0; j--)
      T[i * W + j] = a[p + i] === b[p + j] ? T[(i + 1) * W + j + 1] + 1 : Math.max(T[(i + 1) * W + j], T[i * W + j + 1]);
    let i = 0, j = 0;
    while (i < N && j < M) {
      if (a[p + i] === b[p + j]) { out.push([p + i, p + j]); i++; j++; }
      else if (T[(i + 1) * W + j] >= T[i * W + j + 1]) i++; else j++;
    }
  }
  for (let k = tail.length - 1; k >= 0; k--) out.push(tail[k]);
  return out;
}
/* a script text as blocks ready to compare, without touching the open show */
function parseBlocks(text) {
  const bl = parseScript(text).map(analyze), meta = bl.length && bl[0].type === 'meta' ? bl[0].meta : null;
  let act = '', scene = '';
  for (const b of bl) {
    if (b.type === 'speech') b.name = fullName(b.head.name, meta);
    if (b.type === 'h') { if (b.level === 1) { act = b.title; scene = ''; } else scene = b.title; }
    b.act = act; b.scene = scene;
  }
  return bl;
}
/* [{ k, a, b }] in reading order: a is the old block, b the new one. k is 'same', 'add', 'del', 'chg',
   or 'cue' for a block whose words are the same and whose cues are not. */
function diffBlocks(A, B) {
  const key = b => b.type + '\u0001' + b.raw, out = [];
  const gap = (i0, i1, j0, j1) => {
    /* between two unchanged blocks, an old and a new block that share half their words are one changed block */
    const pair = new Map(); let from = j0;
    if (i1 - i0 === 1 && j1 - j0 === 1 && A[i0].type === B[j0].type && A[i0].name === B[j0].name) pair.set(i0, j0);
    else for (let i = i0; i < i1; i++) {
      let best = -1, bs = 0.499;
      for (let j = from; j < j1; j++) {
        if (A[i].type !== B[j].type) continue;
        const sc = A[i].plain === B[j].plain ? 2 : similarity(A[i].plain, B[j].plain);
        if (sc > bs) { bs = sc; best = j; }
      }
      if (best >= 0) { pair.set(i, best); from = best + 1; }
    }
    let j = j0;
    for (let i = i0; i < i1; i++) {
      const pj = pair.get(i);
      if (pj === undefined) { out.push({ k: 'del', a: A[i], b: null }); continue; }
      while (j < pj) out.push({ k: 'add', a: null, b: B[j++] });
      out.push({ k: A[i].plain === B[pj].plain && A[i].name === B[pj].name ? 'cue' : 'chg', a: A[i], b: B[pj] }); j = pj + 1;
    }
    while (j < j1) out.push({ k: 'add', a: null, b: B[j++] });
  };
  let i = 0, j = 0;
  for (const [x, y] of lcs(A.map(key), B.map(key)).concat([[A.length, B.length]])) {
    gap(i, x, j, y);
    if (x < A.length) out.push({ k: 'same', a: A[x], b: B[y] });
    i = x + 1; j = y + 1;
  }
  return out;
}
/* word by word: [[kind, words]], kind -1 cut, 0 kept, 1 added */
function diffWords(a, b) {
  const A = a.split(/\s+/).filter(Boolean), B = b.split(/\s+/).filter(Boolean), out = [];
  const put = (k, w) => { const l = out[out.length - 1]; if (l && l[0] === k) l[1] += ' ' + w; else out.push([k, w]); };
  let i = 0, j = 0;
  for (const [x, y] of lcs(A, B).concat([[A.length, B.length]])) {
    while (i < x) put(-1, A[i++]);
    while (j < y) put(1, B[j++]);
    if (x < A.length) put(0, A[x]);
    i = x + 1; j = y + 1;
  }
  return out;
}
/* a block concerns a character who speaks it, or whose name an action spells in capitals */
function concerns(b, name) {
  if (!b || (b.type !== 'speech' && b.type !== 'action')) return false;
  const re = new RegExp('(^|[^\\p{L}\\p{N}])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}\\p{N}])', 'u');
  return re.test(b.type === 'speech' ? b.name : b.plain);
}
/* The changes of a comparison that one reader needs: [{ e, cueLine }].
   who '*': everything. who '': changes to the text, not to cues or comments. who a character: the text
   changes in their own lines, in actions that name them, and in the line spoken just before one of theirs
   in the same scene. */
function diffFor(D, who) {
  const out = [];
  D.forEach((e, i) => {
    if (e.k === 'same') return;
    const bl = e.b || e.a, text = e.k !== 'cue' && bl.type !== 'mark' && bl.type !== 'note';
    if (who === '*' || (text && !who)) { out.push({ e, cueLine: false }); return; }
    if (!text) return;
    if (concerns(e.a, who) || concerns(e.b, who)) { out.push({ e, cueLine: false }); return; }
    if (bl.type !== 'speech') return;
    for (let j = i + 1; j < D.length; j++) {
      const n = D[j].b;
      if (n && n.type === 'h') break;   // a new scene: nobody answers the line before it
      if (n && n.type === 'speech') { if (concerns(n, who)) out.push({ e, cueLine: true }); break; }
    }
  });
  return out;
}
/* the characters a comparison can be read for: the character list, or without one every single speaker */
function diffNames(D) {
  let meta = null; const seen = new Set();
  for (const e of D) for (const b of [e.a, e.b]) {
    if (!b) continue;
    if (b.type === 'meta' && b.meta.chars.length) meta = b.meta;
    if (b.type === 'speech' && !GROUP_NAME.test(normName(b.name))) for (const p of normName(b.name).split(NAME_SEP).filter((x, k) => k % 2 === 0 && x)) seen.add(p);
  }
  return meta ? meta.chars.map(c => c.name) : Array.from(seen).sort();
}

/* ---------- cast ----------
   What the actors receive: the text with every token, comment and cue line taken out, and the notes of
   the cast departments laid over it. A note belongs to a whole block, named by its place in that text.
   Who it is for is its label, names divided by commas; with no label it is for whoever speaks the
   block, and for everyone on a block nobody speaks. ALL or TUTTI as the label means everyone. */
const CAST_ALL = /^(?:ALL|EVERYONE|EVERYBODY|TUTTI|TUTTE)$/;
/* the block a note belongs to: its own, or for a note on its own line the block above it, else the one below */
function castBlock(b) {
  if (b.type !== 'mark') return b;
  const i = S.blocks.indexOf(b), ok = x => x.type !== 'mark' && x.type !== 'note' && x.type !== 'meta';
  for (let k = i - 1; k >= 0; k--) if (ok(S.blocks[k])) return S.blocks[k];
  for (let k = i + 1; k < S.blocks.length; k++) if (ok(S.blocks[k])) return S.blocks[k];
  return null;
}
/* who speaks the block of a note: the addressee when the label is blank; '' = nobody, so everyone */
function castSpeaker(b) { const o = b && castBlock(b); return o && o.type === 'speech' ? normName(o.name) : ''; }
function castTo(c, meta, b) {
  const out = [];
  for (const p of c.label.split(/\s*[,;]\s*/).concat(c.links.map(cueName))) {
    let n = normName(p); if (!n) continue;
    if (CAST_ALL.test(n)) return [];
    if (meta && meta.alias.has(n)) n = meta.alias.get(n);
    if (!out.includes(n)) out.push(n);
  }
  if (!out.length) { const sp = castSpeaker(b); if (sp) out.push(sp); }
  return out;
}
const castNote = c => !c.board && !c.end && isCast(c.dept) && !!(c.desc || c.notes);
function castPack() {
  const out = [], notes = [], ids = new Map(), at = new Map(), re = new RegExp(TOKEN_SRC, 'g');
  let skipped = 0;
  for (const b of S.blocks) {
    if (b.type === 'note' || b.type === 'mark') { skipped += b.gap; continue; }
    /* tokens out; the space before one goes with it, and a line that held only tokens is not left blank */
    const raw = b.type === 'meta' ? b.raw : b.raw.replace(re, '\uE001').replace(/[ \t]+(?=\uE001)/g, '').replace(/\uE001[ \t]+(?=[ \t\n]|$)/g, '\uE001')
      .replace(/\n[ \t]*\uE001+[ \t]*(?=\n|$)/g, '').replace(/\uE001/g, '').replace(/[ \t]+$/gm, '');
    at.set(b, out.length);
    out.push('\n'.repeat(out.length ? Math.max(b.gap, skipped ? 1 : 0) : 0) + raw); skipped = 0;
  }
  for (const b of S.blocks) for (const c of b.cues) {
    const o = castNote(c) ? castBlock(b) : null; if (!o || !at.has(o)) continue;
    const d = deptOf(c.dept), to = castTo(c, S.meta, b), text = [c.desc, c.notes].filter(Boolean).join(' — ');
    const k = hash([c.dept, to.join(','), text, out[at.get(o)]].join('\u0001')), n = ids.get(k) || 0; ids.set(k, n + 1);
    notes.push({ id: n ? k + '.' + n : k, dept: c.dept, from: d.name || c.dept, colour: d.colour, to, text, block: at.get(o) });
  }
  return { format: 'promptbook-cast', version: 1, made: VERSION, show: S.cfg.castId, title: titleOf(), when: new Date().toISOString(), lang: LANG, script: out.join('\n') + '\n', notes };
}

/* ---------- show ----------
   Show day: nothing can be edited and a line runs down the script. The line is a clock, not a
   listener. A place in the show is a count of words from the top. Every block has a time: its
   words at the pace of the show (S.cfg.show.wpm) until it is timed in rehearsal, then the time
   that was measured (S.cfg.show.times, by the block's words). The clock takes the line through
   each block in its time. A cue is called by the time left before the line reaches it. */
const SHOW_BREATH = 2, SHOW_ACTION = 6, SHOW_GO = 4;   // words before each block, words for the business of an action, seconds a passed cue stays up
function showWeight(b) {
  if (b.type !== 'speech' && b.type !== 'action' && b.type !== 'para') return 0;
  const n = (b.tokens || []).reduce((k, q) => k + (q.k === 'w' ? 1 : 0), 0);
  return n ? n + SHOW_BREATH + (b.type === 'action' ? SHOW_ACTION : 0) : 0;
}
/* how a timed block is known: by its words, and by its turn among the blocks with the same words */
function showKey(g, seen) {
  const k = hash(gBlocks(g).map(b => b.tokens.filter(q => q.k === 'w').map(q => q.text.toLowerCase()).join(' ')).join('|'));
  const n = (seen.get(k) || 0) + 1; seen.set(k, n);
  return n > 1 ? k + '.' + n : k;
}
/* where each group starts, in words and in time; speeches spoken together last as long as the longest.
   A scene is the stretch from one heading to the next, named by its act and scene titles. */
function showTimeline() {
  const c = S.cfg.show, at = new Map(), list = [], segs = [{ key: '', title: '', lvl: 1, at: 0, end: 0, t: 0, te: 0 }], seen = new Map(), dup = new Map(); let n = 0, ms = 0, act = '';
  const close = () => { const q = segs[segs.length - 1]; q.end = n; q.te = ms; };
  for (const g of S.groups) {
    if (g.kind === 'single' && g.b.type === 'h') {
      if (g.b.level === 1) act = g.b.title;
      let key = g.b.level === 1 ? act : [act, g.b.title].filter(Boolean).join(' / ');
      const k = (seen.get(key) || 0) + 1; seen.set(key, k); if (k > 1) key += ' #' + k;
      close(); segs.push({ key, title: g.b.title, lvl: g.b.level, at: n, end: n, t: ms, te: ms });
    }
    const w = Math.max(0, ...gBlocks(g).map(showWeight));
    at.set(g, n);
    if (w) {
      const key = showKey(g, dup), own = c.times[key], d = own ? own * 1000 : w / c.wpm * 60000;
      list.push({ g, key, at: n, w, t: ms, d, own: !!own }); n += w; ms += d;
    }
  }
  close();
  let top = false; const kept = [];   // a stretch that opens an act, whether the act heading has text of its own or not
  for (const q of segs) { if (q.lvl === 1) top = true; if (q.end > q.at) { q.act = top; top = false; kept.push(q); } }
  return { src: S.groups, cfg: c, at, list, segs: kept, total: n, ms };
}
/* built again when the script or the settings are replaced; whoever changes a time or the pace in place clears S.show.tl */
const showTl = () => { const tl = S.show.tl; return tl && tl.src === S.groups && tl.cfg === S.cfg.show ? tl : (S.show.tl = showTimeline()); };
function showSeg(pos) { let r = null; for (const q of showTl().segs) if (!r || q.at <= pos + 1e-9) r = q; return r; }
/* the block a place (k 'at', in words) or a time (k 't', in ms) falls in */
function showAt(v, k) {
  const L = showTl().list; let lo = 0, hi = L.length - 1, r = L.length ? 0 : -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (L[m][k] <= v + 1e-9) { r = m; lo = m + 1; } else hi = m - 1; }
  return r < 0 ? null : L[r];
}
/* the time of a place, from the top, and the place of a time */
function showT(pos) { const e = showAt(pos, 'at'); return e ? e.t + clamp((pos - e.at) / e.w, 0, 1) * e.d : 0; }
function showP(ms) { const e = showAt(ms, 't'); return e ? e.at + clamp((ms - e.t) / e.d, 0, 1) * e.w : 0; }
/* the place of a word: the line stands before it, or after it when a cue is called on it */
function showPlace(b, wi, after) {
  const at = showTl().at.get(b.g) || 0; let k = 0, n = 0;
  if (wi < 0) return at;
  b.tokens.forEach((q, i) => { if (q.k === 'w') { n++; if (i < wi || (i === wi && after)) k++; } });
  return at + (n ? k / n * showWeight(b) : 0);
}
function showCues() {
  const out = [];
  for (const b of S.blocks) for (const c of b.cues) {
    if (c.board || isReview(c.dept)) continue;
    out.push({ b, c, name: (c.end ? '/' : '') + cueName(c), at: showPlace(b, c.wi, !c.before) });
  }
  return out.sort((x, y) => x.at - y.at);
}
function showNow(now) {
  const sh = S.show, tl = showTl();
  if (!sh.playing) return clamp(sh.base, 0, tl.total);
  return showP(showT(sh.base) + ((now == null ? Date.now() : now) - sh.t0) * sh.tempo);
}
/* every change of place, pace, time or running state starts the clock again from where the line is */
function showSet(pos, now) {
  const sh = S.show; now = now == null ? Date.now() : now;
  if (sh.playing) sh.played += now - sh.t0;
  sh.base = clamp(pos, 0, showTl().total); sh.t0 = now;
}
function showPlay(on, now) { now = now == null ? Date.now() : now; showSet(showNow(now), now); S.show.playing = !!on; }
/* the pace of the night: how much faster or slower than the times say the line runs. Not kept. */
function showTempo(f, now) { now = now == null ? Date.now() : now; showSet(showNow(now), now); S.show.tempo = clamp(Math.round(f * 100) / 100, 0.5, 2); }
/* The stage manager says where the show really is. While the line runs, two such marks bound a
   chunk: the script between them and the running time it took.
   Timing it (a rehearsal): the time is kept for the blocks of the chunk, see showLearn.
   Otherwise (a show): chunks add up to the pace of the night, which is only offered.
   A mark while the line is stopped, or one that is far too fast or too slow, only moves the line. */
function showHere(pos, now) {
  const sh = S.show, run = sh.playing; now = now == null ? Date.now() : now;
  showSet(pos, now);
  const a = sh.anchor, ms = a && run ? sh.played - a.played : 0, want = a && sh.base > a.pos ? showT(sh.base) - showT(a.pos) : 0;
  sh.last = null;
  if (want > 0 && ms >= 1000) {
    if (sh.learn) { if (ms / want >= 0.2 && ms / want <= 60) showLearn(a.pos, sh.base, ms); }
    else if (ms > 3000 && want / ms >= 0.4 && want / ms <= 2.5) { sh.cal.want += want; sh.cal.ms += ms; }
  }
  sh.anchor = { pos: sh.base, played: sh.played };
}
/* The stretch from place a to place b took ms. The time is shared among its blocks in proportion
   to their times so far; a block covered in part takes its share for that part only. */
function showLearn(a, b, ms) {
  const T = S.cfg.show.times, want = showT(b) - showT(a), k = ms / want, keys = {};
  for (const e of showTl().list) {
    if (e.at >= b) break;
    const f = (Math.min(b, e.at + e.w) - Math.max(a, e.at)) / e.w;
    if (f <= 1e-9) continue;
    keys[e.key] = T[e.key];
    T[e.key] = clamp(Math.round(e.d * (1 - f + f * k) / 100) / 10, 0.1, 3600);
  }
  S.show.last = { ms, was: want, keys };
  S.show.tl = null; markDirty('cfg');
}
/* takes the last timed chunk back */
function showUnlearn(now) {
  const l = S.show.last, T = S.cfg.show.times; if (!l) return;
  showSet(showNow(now), now);
  for (const [k, v] of Object.entries(l.keys)) { if (v == null) delete T[k]; else T[k] = v; }
  S.show.last = null; S.show.tl = null; markDirty('cfg');
}
/* the time of the block the line is in, set by hand: d seconds more or less */
function showNudge(d, now) {
  const pos = showNow(now), e = showAt(pos, 'at'); if (!e) return;
  showSet(pos, now);
  S.cfg.show.times[e.key] = clamp(Math.round((e.d / 1000 + d) * 10) / 10, 0.5, 3600);
  S.show.last = null; S.show.tl = null; markDirty('cfg');
}
/* how much of the show is timed, and the pace measured over its timed speeches once there are 200 words of them */
function showStats() {
  const tl = showTl(); let own = 0, w = 0, ms = 0;
  for (const e of tl.list) if (e.own) { own += e.d; if (gBlocks(e.g).every(b => b.type === 'speech')) { w += e.w; ms += e.d; } }
  return { share: tl.ms ? own / tl.ms : 0, wpm: w >= 200 ? clamp(Math.round(w / ms * 60000), 40, 300) : 0 };
}
/* the pace of the show, for every block that is not timed */
function showRest(wpm, now) {
  showSet(showNow(now), now);
  S.cfg.show.wpm = clamp(Math.round(wpm), 40, 300); S.show.tl = null; markDirty('cfg');
}
const showMeasured = () => S.show.cal.ms >= 60000 ? clamp(Math.round(S.show.cal.want / S.show.cal.ms * 100) / 100, 0.5, 2) : 0;
/* the block before or after the one the line is in */
function showStepPlace(d, now) {
  const L = showTl().list, pos = showNow(now); let i = -1;
  for (let k = 0; k < L.length && L[k].at <= pos + 1e-6; k++) i = k;
  return L.length ? L[clamp(i + d, 0, L.length - 1)].at : 0;
}
/* seconds from place a to place b, at the pace of the night */
const showMs = (a, b) => (showT(b) - showT(a)) / S.show.tempo;
/* what to call now: cues just passed, cues within the standby time, cues within the warning time, and the ones after */
function showCalls(now) {
  const pos = showNow(now), c = S.cfg.show, out = { go: [], standby: [], warning: [], later: [], next: null };
  for (const q of S.show.cues) {
    const s = showMs(pos, q.at) / 1000, o = { q, c: q.c, b: q.b, name: q.name, s };
    if (s <= 0) { if (s > -SHOW_GO) out.go.push(o); }
    else if (s <= c.standby) out.standby.push(o);
    else if (s <= c.warning) out.warning.push(o);
    else out.later.push(o);
  }
  out.next = out.later[0] || null;
  return out;
}
/* how far the show is, how long it is, and what is left at the pace of the night, in ms */
function showClock(now) { const tl = showTl(), at = showT(showNow(now)); return { at, total: tl.ms, left: (tl.ms - at) / S.show.tempo }; }

/* ---------- locked page numbers ----------
   Once a script is printed and handed out, its page numbers must hold. A lock records where every
   block was: S.cfg.lock = { name, rev, pages, n, cont, sig, keys }, each a list joined by spaces.
   pages: the labels in order. n: how many blocks start on each page. cont: 1 when the page opens in the
   middle of a block. sig: what each page held. keys: every block, in order.
   With a lock, paginate() starts each old page where its first surviving block is; text that no longer
   fits goes to inserted pages 12A, 12B; a page left empty disappears and its number is not reused. */
const flows = g => !(g.kind === 'single' && (g.b.type === 'meta' || g.b.type === 'note'));
const itemStarts = it => it.whole || it.first;
const pageKey = P => hash(P.items.filter(it => flows(it.g)).map(it => it.g.m.kh + (it.whole ? '' : ':' + it.off + '+' + it.h)).join(' '));
function makeLock(name, rev) {
  const P = S.pages.filter(p => !p.front);
  return { name: String(name || ''), rev: rev || '', pages: P.map(p => p.label).join(' '),
    n: P.map(p => p.items.filter(it => flows(it.g) && itemStarts(it)).length).join(' '),
    cont: P.map(p => { const it = p.items.find(q => flows(q.g)); return it && !itemStarts(it) ? 1 : 0; }).join(' '),
    sig: P.map(pageKey).join(' '), keys: S.groups.filter(flows).map(g => g.m.kh).join(' ') };
}
function lockPlan() {
  const L = S.cfg.lock; if (!L) return null;
  const pages = L.pages.split(' '), at = [];
  L.n.split(' ').forEach((c, i) => { for (let k = 0; k < +c; k++) at.push(i); });
  const gs = S.groups.filter(flows), want = new Map(), sig = new Map(), sigs = L.sig.split(' ');
  for (const [i, j] of lcs(L.keys ? L.keys.split(' ') : [], gs.map(g => g.m.kh))) want.set(gs[j], at[i]);
  pages.forEach((lab, i) => sig.set(lab, sigs[i]));
  return { pages, cont: L.cont.split(' ').map(x => x === '1'), want, sig, taken: new Set(pages) };
}
const alpha = k => k > 26 ? alpha(Math.floor((k - 1) / 26)) + alpha((k - 1) % 26 + 1) : String.fromCharCode(64 + k);
/* the k-th page inserted after a locked page: 12 gives 12A, 12B; 12A gives 12A1, 12A2 */
function insLabel(base, k, taken) {
  const mk = n => base + (/\d$/.test(base) ? alpha(n) : n);
  let s = mk(k);
  for (let n = k; taken.has(s); n++) s = base + '+' + n;   // 12A already stands after 12: 12+1 goes between them
  taken.add(s);
  return s;
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
/* dark or white text, whichever reads better on a department colour */
function inkOn(col) {
  const m = /^#([0-9a-f]{6})$/i.exec(col); if (!m) return 'var(--paper)';
  const n = parseInt(m[1], 16), lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255) > 0.179 ? '#16150f' : '#fff';
}

/* the handle in the gutter by which a block is dragged to another place; never printed */
function grip(row, b) {
  const k = h('button', 'grip pbtn noprint'); k.type = 'button'; k.tabIndex = -1; k.dataset.b = b.id; k.title = t('moveBlock');
  row.appendChild(k);
}
/* fr: null for the whole block, or { from, to, off, cont, first, last } for a page fragment */
function buildRow(g, fr) {
  if (g.kind === 'simul') {
    const row = h('div', 'row simul'); grip(row, g.blocks[0]);
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
    row.appendChild(h('div', 'nm')); row.appendChild(h('div', 'rule')); grip(row, b);
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
  if (!fr || fr.first) grip(row, b);
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
      m = { h: 0, lines: [], nameLines: 1, ls: null, kh: hash(k) };
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
/* boards on a facing page: one column up to two boards, then two columns filled row by row.
   hs: height of each board for a width of 1. Returns the columns and the one width all boards get. */
function facingLayout(hs, availW, availH) {
  const n = hs.length, cols = n > 2 ? 2 : 1, cw = (availW - (cols - 1) * FIG_GAP) / cols;
  let sum = 0, rows = 0;
  for (let k = 0; k < n; k += cols) { sum += cw * Math.max(...hs.slice(k, k + cols)); rows++; }
  const f = sum ? Math.min(1, (availH - rows * (FIG_EXTRA + FIG_GAP)) / sum) : 1;
  return { cols, w: Math.floor(cw * f) };
}
function paginate() {
  const pp = paper(), H = pp.h - GEO.top - GEO.bot, pages = [];
  let cur = null, y = 0, act = '', scene = '';
  const isHead = g => g.kind === 'single' && g.b.type === 'h';
  const parts0 = S.meta ? [S.meta.lines.length && 'front', S.meta.chars.length && 'cast'].filter(Boolean) : [];
  const off = parts0.length;   // front and character pages have no number; the script still starts on page 1
  const lk = lockPlan();   // null while page numbers are free
  let li = -1, sub = 0, tail = 0;   // the locked page being filled, pages inserted after it, pages past the last locked one
  const label = to => {
    const L = lk.pages;
    if (to != null) { li = to; sub = 0; }
    else if (li < 0) li = 0;
    else if (li >= L.length - 1) return String((parseInt(L[L.length - 1], 10) || L.length) + (++tail));
    else if (!sub && lk.cont[li + 1]) li++;   // the next page opened mid-block before: what runs over goes on it
    else return insLabel(L[li], ++sub, lk.taken);
    return L[li];
  };
  const newPage = to => {
    const no = pages.length + 1 - off;
    cur = { items: [], boards: [], head: null, no, front: no < 1, label: no < 1 ? '' : String(no), chg: false }; pages.push(cur); y = 0;
    if (lk && no >= 1) cur.label = label(to);
  };
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
    const to = lk ? lk.want.get(g) : undefined;
    if (to !== undefined && to > li) { if (cur.items.length) newPage(to); else cur.label = label(to); }
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
    P.chg = !!lk && !P.front && lk.sig.get(P.label) !== pageKey(P);
    P.sig = P.no + '|' + P.label + (P.chg ? '*' + S.cfg.lock.name : '') + '|' + P.head + '|' + titleOf() + '|' + parts.join(',');
    P.fsig = facingSig(P);
    P.rails = [];
  }
  for (const s of S.pairs) {   // a paired cue runs from its page to the page of its end
    const e = s.endRef; if (!s.page || !e.page) continue;
    for (let n = s.page; n <= e.page && n + off <= pages.length; n++) pages[n - 1 + off].rails.push(s);
  }
  for (const P of pages) if (P.rails.length) P.sig += '|' + P.rails.map(s => s.b.id + ':' + s.s + '>' + s.endRef.b.id + ':' + s.endRef.s + '@' + s.lane).join(',');
  S.pages = pages; S.pageOff = off;
  const now = new Set(pages.map(P => P.label));
  S.lockInfo = lk ? { changed: pages.filter(P => P.chg).map(P => P.label), gone: lk.pages.filter(x => !now.has(x)) } : null;
}
