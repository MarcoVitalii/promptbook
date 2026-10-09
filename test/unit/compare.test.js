// Comparing two versions of a script: blocks added, cut and changed, and what reaches one character.
const C = require('./_core'), { ok } = C;
const OLD = '---\ntitle: Il mare\ncharacters:\n  - ANNA/A\n  - MARCO\n  - IL GUARDIANO\n---\n# ATTO PRIMO\n\n## Scena 1\n\n(Buio. Si sente il mare.)\n\n'
  + 'ANNA: Chi è là? Rispondi subito!\nMARCO: Sono io. Non gridare, ti prego.\nANNA: Tu. Dopo tre anni ti presenti così.\nIL GUARDIANO: Chi c’è laggiù?\n\n'
  + '## Scena 2\n\n(MARCO si siede sulla cassa.)\n\nMARCO: Una barca.\nANNA: Hai sbagliato molo.\n{LX 3 | buio}\n';
const NEW = OLD
  .replace('Non gridare, ti prego.', 'Non gridare, ti prego: svegli tutto il porto.')   // MARCO changed; ANNA speaks next
  .replace('IL GUARDIANO: Chi c’è laggiù?\n', '')                                        // cut
  .replace('ANNA: Hai sbagliato molo.', 'ANNA: Hai sbagliato molo. {SND 4 | onda}\nMARCO: Allora ho sbagliato vita.')   // cue only, then a new line
  .replace('(MARCO si siede sulla cassa.)', '(MARCO resta in piedi vicino alla cassa.)')
  .replace('{LX 3 | buio}', '{LX 3 | buio lento}');

ok(C.lcs('a b c d e'.split(' '), 'a x c e'.split(' ')).map(p => p.join('')).join(' ') === '00 22 43', 'the common run of two lists is found in order');
ok(C.lcs([], ['a']).length === 0 && C.lcs(['a', 'b'], ['a', 'b']).length === 2, 'empty and equal lists are handled');

const D = C.diffBlocks(C.parseBlocks(OLD), C.parseBlocks(NEW)), kinds = D.filter(e => e.k !== 'same').map(e => e.k + ':' + (e.b || e.a).type).join(' ');
ok(kinds === 'chg:speech del:speech chg:action cue:speech add:speech cue:mark', 'changed, cut, added and cue-only blocks are told apart: ' + kinds);
ok(C.diffBlocks(C.parseBlocks(OLD), C.parseBlocks(OLD)).every(e => e.k === 'same'), 'a text compared with itself has no changes');

const words = C.diffWords('Sono io. Non gridare, ti prego.', 'Sono io. Non gridare, ti prego: svegli tutto il porto.');
ok(JSON.stringify(words) === JSON.stringify([[0, 'Sono io. Non gridare, ti'], [-1, 'prego.'], [1, 'prego: svegli tutto il porto.']]), 'a changed line is marked word by word');

const show = who => C.diffFor(D, who).map(o => o.e.k + ':' + ((o.e.b || o.e.a).name || (o.e.b || o.e.a).type) + (o.cueLine ? ':before' : '')).join(' ');
ok(C.diffFor(D, '*').length === 6, 'everything: six changes, cues included');
ok(show('') === 'chg:MARCO del:IL GUARDIANO chg:action add:MARCO', 'text only: cue changes are left out: ' + show(''));
ok(show('ANNA') === 'chg:MARCO:before', 'ANNA gets the changed line she answers, marked as the line before hers: ' + show('ANNA'));
ok(show('MARCO') === 'chg:MARCO chg:action add:MARCO', 'MARCO gets his own lines and the action that names him: ' + show('MARCO'));
ok(show('IL GUARDIANO') === 'del:IL GUARDIANO', 'a cut line reaches the character who lost it');
ok(C.diffNames(D).join() === 'ANNA,MARCO,IL GUARDIANO', 'the readers offered are the characters of the list');
ok(C.diffNames(C.diffBlocks(C.parseBlocks('B: uno\nANNA e MARCO: due\nTUTTI: tre\n'), C.parseBlocks(''))).join() === 'ANNA,B,MARCO', 'without a list, every single speaker; joined and group names are split or left out');

const cut = C.diffBlocks(C.parseBlocks(OLD), C.parseBlocks(OLD.replace(/## Scena 2[\s\S]*$/, '')));
ok(cut.filter(e => e.k === 'del').length === 5 && C.diffFor(cut, 'MARCO').length === 2, 'a cut scene shows as its blocks cut, and each character sees their own');

const taken = new Set(['12', '12A', '13']);
ok(C.insLabel('13', 1, taken) === '13A' && C.insLabel('13', 2, taken) === '13B' && C.insLabel('13A', 1, taken) === '13A1', 'inserted pages are 13A, 13B; after 13A comes 13A1');
ok(C.insLabel('12', 1, taken) === '12+1', 'a page inserted before an existing 12A gets a label that sorts between them');
