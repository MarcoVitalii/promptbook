// Cue labels out of order (CUE-5): which cues carry the hint, checked without a browser.
const C = require('./_core'), { ok, S } = C;
// one speech per cue, in the order given; a part that is not a token is written as its own line (a heading)
const text = parts => parts.map((p, i) => p[0] === '{' ? 'ANNA: parola' + i + ' ' + p + '\n' : '\n' + p + '\n\n').join('');
const odd = parts => {
  C.load(text(parts));
  const cues = S.blocks.flatMap(b => b.cues), set = C.cuesOutOfOrder(cues);
  return cues.filter(c => set.has(c)).map(c => c.dept + ' ' + c.label).join();
};
const lx = labels => odd(labels.split(',').map(l => '{LX ' + l.trim() + '}'));

ok(lx('1, 2, 3, 10, 11') === '', 'labels that rise are in order');
ok(lx('1, 2, 5, 9, 40') === '', 'missing numbers are not out of order');
ok(lx('1, 2, 2, 3') === '', 'a repeated number is a duplicate, not out of order');
ok(lx('1, 2, 7, 3, 4') === 'LX 7', 'one label out of place is the only one marked, not those after it');
ok(lx('1, 5, 2, 3, 4, 6') === 'LX 5', 'a cue moved up among lower numbers is the one marked');
ok(lx('9, 1, 2, 3') === 'LX 9', 'a high first label is marked when the rest is in order');
ok(lx('1, 2, 10, 11, 3, 4, 5') === 'LX 10,LX 11', 'the shorter run is the one marked');
ok(lx('1, 2, 4, 3, 5') === 'LX 3', 'of two labels swapped, the later one is marked');
ok(lx('12, 12.5, 12.9, 12.10, 12A, 12B, 13') === '', 'points and letters after a number are in order; 12.10 follows 12.9');
ok(lx('1, 2, 3.5, 2.5, 3, 4') === 'LX 3.5', 'a point cue above the numbers after it is marked');
ok(lx('12, 12B, 12A, 12C, 13') === 'LX 12A', 'letters after a number are ordered');
ok(lx('12a, 12A, 12b') === '' && lx('7, 007, 8') === '', 'capitals and leading zeros do not count');
ok(odd(['{LX 12}', '{LX 12,5}', '{LX 12-7}', '{LX 13}']) === '' && odd(['{LX 12}', '{LX 12,9}', '{LX 12,5}', '{LX 12,7}']) === 'LX 12,9', 'a comma or a dash separates as a point does');
ok(lx('1, 2, preset, 3, buio, 4') === '', 'a label without a digit is never out of order');
ok(lx('1, sipario, 5, 2, 3') === 'LX 5', 'a label without a digit does not break the order of those around it');
ok(lx('A1, A2, B1, 3, A3, 4, B2') === '', 'labels that begin with letters are judged only against the same letters');
ok(lx('A12, A14, A13, A15') === 'LX A13', 'A12 A14 A13: the order is kept within one leading word');
ok(odd(['{LX 1}', '{SND 1}', '{LX 2}', '{SND 2}', '{LX 9}', '{SND 3}', '{LX 3}', '{LX 4}']) === 'LX 9', 'each department has its own order');
ok(odd(['{LX 8}', '{SND 1}', '{LX 9}', '{SND 2}']) === '', 'a low number of one department after a high one of another is in order');
ok(odd(['{SND 5}', '{SND 6}', '{/SND 5}', '{SND 7}', '{/SND 6}', '{SND 8 / SND 7}', '{/SND}']) === '', 'an end is not judged against its cue, nor against the cues between them');
ok(S.pairs.length === 4, 'the ends of that script did pair');
ok(odd(['ATTO PRIMO', '{LX 1}', '{LX 2}', '{LX 3}', 'ATTO SECONDO', '{LX 1}', '{LX 2}']) === '', 'numbers that start again in a new act are in order');
ok(odd(['ATTO PRIMO', '{LX 1}', '{LX 2}', 'ATTO SECONDO', '{LX 1}', '{LX 5}', '{LX 2}', '{LX 3}']) === 'LX 5', 'within the second act the order is judged as in the first');
ok(odd(['{LX}', '{LX 2}', '{LX | luce}', '{LX 1}', '{LX 3}']) === 'LX 1', 'a cue without a number takes no part');
const T = text(['{LX 3}', '{LX 1}', '{LX 2}']);
C.load(T); C.cuesOutOfOrder(S.blocks.flatMap(b => b.cues));
ok(C.serialize() === T && S.hist.length === 0, 'the hint changes neither the text nor the undo history');
ok(!!C.STR.en.outOrder && !!C.STR.it.outOrder, 'the hint has its sentence in both languages');
