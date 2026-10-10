// What the cast receives: the text without tokens and comments, and the notes of the cast departments laid over it.
const C = require('./_core'), { ok, S } = C;
const NOTE = { code: 'NOTE', name: 'Regia', colour: '#0f8b8d', cast: true };
S.cfg = C.normCfg({ departments: C.defaultConfig().departments.concat([NOTE]) });
const TEXT = '---\ntitle: Il mare\ncharacters:\n  - ANNA/A - la figlia\n  - MARCO\n---\n# ATTO PRIMO\n\n'
  + 'ANNA: Chi è là? {LX 1 | luce} Rispondi {NOTE A | più piano | guarda Marco}!\n'
  + '{NOTE | pausa lunga}\n'
  + '%%\nMARCO: Tagliata {NOTE MARCO | mai inviata}.\n%%\n\n'
  + 'MARCO: Sono io. {TODO | rivedere} {NOTE ANNA, MARCO | insieme}\n{SND 2}\n'
  + '& ANNA: Non ti credo! {NOTE tutti | bene}\n{NOTE MARCO}\n\n(Esce.) {NOTE | con calma}\n';
C.load(TEXT);
const P = C.castPack(), N = P.notes;

const d = S.cfg.departments.find(x => x.code === 'NOTE');
ok(d.cast && d.review && !S.cfg.departments.find(x => x.code === 'TODO').cast, 'a cast department is also a review department; the others are not cast');
ok(C.normCfg({ departments: [{ code: 'LX', name: 'Luci', colour: '#c98a00' }] }).departments[0].cast === false, 'a show from an older release has no cast department');
ok(P.format === 'promptbook-cast' && P.version === 1 && P.title === 'Il mare' && P.made === C.VERSION, 'the pack says what it is, its title and the release that made it');
ok(!/[{}%]/.test(P.script) && !P.script.includes('Tagliata'), 'no token and no comment is left in the text sent');
ok(P.script === '---\ntitle: Il mare\ncharacters:\n  - ANNA/A - la figlia\n  - MARCO\n---\n# ATTO PRIMO\n\nANNA: Chi è là? Rispondi!\n\nMARCO: Sono io.\n& ANNA: Non ti credo!\n\n(Esce.)\n',
  'the text keeps its lines and blank lines, a comment leaves one blank line: ' + JSON.stringify(P.script));
const pb = C.parseScript(P.script).map(C.analyze);
ok(pb.map(b => b.type).join() === 'meta,h,speech,speech,speech,action', 'the text sent parses into the blocks the notes count on');
ok(N.length === 5 && N.map(n => n.text).join('|') === 'più piano — guarda Marco|pausa lunga|insieme|bene|con calma', 'only the notes of a cast department that say something are sent: ' + N.map(n => n.text).join('|'));
ok(N.every(n => n.from === 'Regia' && n.colour === '#0f8b8d' && n.dept === 'NOTE'), 'a note carries the name and the colour of its department');
ok(N[0].to.join() === 'ANNA' && N[2].to.join() === 'ANNA,MARCO', 'a label is who the note is for; an alias becomes the name');
ok(N[1].to.join() === 'ANNA' && N[1].block === 2, 'with no label a note is for whoever speaks its block; a note on its own line belongs to the block above: ' + N[1].to.join());
ok(N[3].to.length === 0 && N[4].to.length === 0 && pb[N[4].block].type === 'action', '"tutti" as the label means everyone, and so does no label on a block nobody speaks');
ok(N.map(n => n.block).join() === '2,2,3,4,5' && N.every(n => !('at' in n)), 'a note belongs to a whole block of the text sent, not to a word: ' + N.map(n => n.block).join());
C.load('ANNA e MARCO: Insieme. {NOTE | più forte}\n');
ok(C.castPack().notes[0].to.join() === 'ANNA E MARCO', 'on a line spoken by a group the note is for that group name as written');
C.load(TEXT);
ok(new Set(N.map(n => n.id)).size === 5 && C.castPack().notes.map(n => n.id).join() === N.map(n => n.id).join(), 'a note keeps its id from one pack to the next');
ok(C.serialize() === TEXT, 'making the pack leaves the script untouched');
