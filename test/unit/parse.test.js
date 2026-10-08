// Parser, cue tokens, frontmatter and undo, checked without a browser.
const C = require('./_core'), { ok, S } = C;
const TEXT = '---\ntitle: Il mare\ncharacters:\n  - ANNA/A - la figlia\n  - MARCO\n---\nATTO PRIMO\n\nSCENA 1: Il porto\n\n(Buio.)\n\n'
  + 'ANNA:Chi è là? {LX 1 | luce | lenta}\n& MARCO: Sono io. {SND 2}\nmarco: no\nA: sigla {/LX 1}\n%%\nANNA: nascosta {LX 9}\n%%\n{TODO | rivedere}\n';
C.load(TEXT);
const B = S.blocks, by = t => B.filter(b => b.type === t), cues = B.flatMap(b => b.cues);

ok(C.serialize() === TEXT, 'text survives a parse and write unchanged');
ok(C.serialize().replace(/\n/g, '\r\n') !== TEXT && (C.load(TEXT.replace(/\n/g, '\r\n')), C.serialize() === TEXT), 'Windows line ends are read as plain ones');
C.load(TEXT);
ok(B[0].type === 'meta' && S.meta.title === 'Il mare' && S.meta.chars.length === 2 && S.meta.chars[0].aliases[0] === 'A', 'frontmatter gives title and characters with aliases');
ok(by('h').map(b => b.level + b.plain).join('|') === '1ATTO PRIMO|2SCENA 1: Il porto', 'unmarked ATTO and SCENA lines become headings');
ok(by('action').length === 1 && by('action')[0].plain === '(Buio.)', 'a bracketed line is an action');
ok(by('speech').map(b => b.name).join('|') === 'ANNA|MARCO|ANNA', 'speakers found, "ANNA:Chi" included, alias A read as ANNA');
ok(by('speech')[1].simul && by('speech')[1].plain.endsWith('\nmarco: no'), '"&" marks simultaneous speech; lower-case "marco:" continues it');
ok(C.stripTokens('Ciao {LX 1 | a} mondo') === 'Ciao mondo', 'tokens are stripped from the plain text');
const lx = cues[0];
ok(lx.dept === 'LX' && lx.label === '1' && lx.desc === 'luce' && lx.notes === 'lenta' && !lx.end, 'cue token gives department, number, margin text and description');
ok(cues.length === 4 && !cues.some(c => c.label === '9'), 'a cue inside a %% comment is not a cue');
ok(cues[2].end && S.pairs.length === 1 && cues[2].startRef === lx, '{/LX 1} ends the LX 1 cue');
ok(by('mark').length === 1 && cues[3].dept === 'TODO' && cues[3].desc === 'rivedere', 'a token on its own line is a mark');
ok(C.fullName('A e MARCO', S.meta) === 'ANNA e MARCO', 'aliases expand inside joined names');
const cc = C.castCheck('ANNA e LUCA', S.meta.set);
ok(cc.used.join() === 'ANNA' && cc.unknown.join() === 'LUCA', 'a speaker missing from the character list is reported');

const t0 = C.serialize();
ok(C.commitText(t0.replace('Sono io.', 'Sono qui.')) && !C.commitText(C.serialize()), 'a text change is one step; no change is none');
C.commitText(C.serialize() + 'ANNA: fine.\n');
C.undo(); C.undo();
ok(C.serialize() === t0, 'two undos return to the starting text exactly');
C.redo(); C.redo();
ok(/Sono qui\./.test(C.serialize()) && /ANNA: fine\.\n$/.test(C.serialize()), 'two redos reapply them');
ok(Object.keys(C.STR.en).every(k => k in C.STR.it) && Object.keys(C.STR.it).every(k => k in C.STR.en), 'every string exists in English and Italian');
