// Moving a cue token to after another word: the text edit behind dragging a tag. No browser needed.
const C = require('./_core'), { ok, S } = C;
const cue = name => { for (const b of S.blocks) for (const c of b.cues) if ((c.end ? '/' : '') + c.dept + ' ' + c.label === name) return c; return null; };
// the n-th word (from 0) of the script that reads `text`
const word = (text, n = 0) => { for (const b of S.blocks) for (let i = 0; i < b.tokens.length; i++) if (b.tokens[i].k === 'w' && b.tokens[i].text === text && n-- === 0) return { b, wi: i }; return null; };
// loads `before`, moves the cue to after the word, returns the new text (null: nothing to do)
const move = (before, name, text, n) => { C.load(before); const w = word(text, n); return C.textMoveCue(cue(name), w.b, w.wi); };
const tidy = s => !/ {2}| \n|\}[^\s{]/.test(s);   // no double space, no space before a line end, no token glued to the next word
const is = (got, want, m) => ok(got === want && (got === null || tidy(got)), m + (got === want ? '' : ': ' + JSON.stringify(got)));

is(move('ANNA: uno {LX 1} due tre\n', 'LX 1', 'tre'), 'ANNA: uno due tre {LX 1}\n', 'forward in one speech');
is(move('ANNA: uno due tre {LX 1 | luce | nota}\n', 'LX 1', 'uno'), 'ANNA: uno {LX 1 | luce | nota} due tre\n', 'backward in one speech, margin text and notes kept');
is(move('ANNA: uno {LX 1} due\n\nMARCO: tre quattro\n', 'LX 1', 'tre'), 'ANNA: uno due\n\nMARCO: tre {LX 1} quattro\n', 'to another block: gone from the first line, after the word in the second, nothing else changed');
is(move('ANNA: uno due\n\nMARCO: tre {LX 1} quattro\n', 'LX 1', 'uno'), 'ANNA: uno {LX 1} due\n\nMARCO: tre quattro\n', 'to an earlier block');
is(move('ANNA: uno {SND 2} due {LX 1}\n', 'LX 1', 'uno'), 'ANNA: uno {SND 2} {LX 1} due\n', 'a word that already has a cue takes the new one after it');
is(move('ANNA: uno {SND 2} {LX 1} due\n', 'SND 2', 'uno'), 'ANNA: uno {LX 1} {SND 2} due\n', 'dropped on its own word, a cue that is not the last one goes behind the others');
is(move('ANNA: uno\n{VID 1}\nMARCO: due\n', 'VID 1', 'due'), 'ANNA: uno\nMARCO: due {VID 1}\n', 'a cue on its own line becomes a word cue and its line is removed');
is(move('ANNA: uno{LX 1} due\n', 'LX 1', 'uno'), null, 'a token glued to its word, dropped on that word: nothing to do');
is(move('ANNA: uno{LX 1} due\n', 'LX 1', 'due'), 'ANNA: uno due {LX 1}\n', 'a token glued to its word moves to another word');
is(move('ANNA: uno {LX 1} due\n', 'LX 1', 'uno'), null, 'dropped where it is: nothing to do');
is(move('ANNA: {LX 1} uno due\n', 'LX 1', 'due'), 'ANNA: uno due {LX 1}\n', 'a cue before the first word moves without leaving a double space');
is(move('ANNA: {LX 1} uno due\n', 'LX 1', 'uno'), 'ANNA: uno {LX 1} due\n', 'a cue before the first word can go after that word');
is(move('ANNA: uno {SND 5} due tre {/SND 5}\n', '/SND 5', 'due'), 'ANNA: uno {SND 5} due {/SND 5} tre\n', 'an end token keeps its slash');
is(move('ANNA: uno {LX 6 / SND 5 | via | n} due tre\n', 'LX 6', 'tre'), 'ANNA: uno due tre {LX 6 / SND 5 | via | n}\n', 'links, margin text and notes move with the token unchanged');
is(move('ANNA: uno{LX 1}due tre\n', 'LX 1', 'tre'), 'ANNA: uno due tre {LX 1}\n', 'a token glued between two words leaves them as two words');
is(move('ANNA: uno{SND 2}due {LX 1}\n', 'LX 1', 'uno'), 'ANNA: uno{SND 2} {LX 1} due\n', 'the moved token is not glued to the word that follows');
is(move('ANNA: uno due\ntre {LX 1} quattro\n', 'LX 1', 'due'), 'ANNA: uno due {LX 1}\ntre quattro\n', 'to the end of an earlier line of the same speech');
is(move('ANNA: uno due {LX 1}\ntre quattro\n', 'LX 1', 'quattro'), 'ANNA: uno due\ntre quattro {LX 1}\n', 'from the end of a line: no space is left before the line end');
is(move('ANNA: uno\n\n{VID 1}\n\nMARCO: due\n', 'VID 1', 'due'), 'ANNA: uno\n\nMARCO: due {VID 1}\n', 'an own-line cue between blank lines leaves one blank line, not two');
// to a line of its own: the text edit behind dropping a tag between two blocks
const own = (before, name, j) => { C.load(before); return C.textCueOwn(cue(name), j); };
is(own('ANNA: uno {LX 1} due\n\nMARCO: tre\n', 'LX 1', 1), 'ANNA: uno due\n{LX 1}\n\nMARCO: tre\n', 'a word cue dropped between two blocks gets a line of its own under the upper block');
is(own('ANNA: uno {LX 1 | luce | nota} due\n\nMARCO: tre\n', 'LX 1', 2), 'ANNA: uno due\n\nMARCO: tre\n{LX 1 | luce | nota}\n', 'after the last block, with every field kept');
is(own('ANNA: uno\n\nMARCO: tre {LX 1}\n', 'LX 1', 0), '{LX 1}\nANNA: uno\n\nMARCO: tre\n', 'before the first block');
is(own('ANNA: uno{LX 1}due\n\nMARCO: tre\n', 'LX 1', 1), 'ANNA: uno due\n{LX 1}\n\nMARCO: tre\n', 'a glued token leaves its neighbours as two words');
is(own('ANNA: uno\n\n{VID 1}\n\nMARCO: due\n\nANNA: tre\n', 'VID 1', 3), 'ANNA: uno\n\nMARCO: due\n\n{VID 1}\n\nANNA: tre\n', 'a cue that has a line to itself moves as that line, blank lines kept');
is(own('ANNA: uno\n\n{VID 1}\n\nMARCO: due\n', 'VID 1', 1), null, 'dropped just above its own line: nothing to do');
is(own('ANNA: uno\n\n{VID 1}\n\nMARCO: due\n', 'VID 1', 2), null, 'dropped just below its own line: nothing to do');
is(own('ANNA: uno\n\n{VID 1} {LX 2}\n\nMARCO: due\n', 'LX 2', 3), 'ANNA: uno\n\n{VID 1}\n\nMARCO: due\n{LX 2}\n', 'one of two cues sharing a line leaves the other where it was');
C.load('ANNA: uno {SND 5} due {/SND 5}\n\nMARCO: tre\n');
ok(S.pairs.length === 1 && C.commitText(C.textCueOwn(cue('/SND 5'), 2)) && S.pairs.length === 1 && S.blocks[2].type === 'mark', 'an end moved to a line of its own below still closes its cue');
C.undo();
ok(C.serialize() === 'ANNA: uno {SND 5} due {/SND 5}\n\nMARCO: tre\n', 'and one undo puts it back');
C.load('ANNA: uno\n');
ok(C.textMoveCue(null, S.blocks[0], 0) === null && C.textMoveCue({ b: S.blocks[0], s: 0, e: 0 }, S.blocks[0], 99) === null, 'a missing cue or word gives nothing to do');

// pairs
const T = 'ANNA: uno due tre {SND 5 | musica} quattro cinque {/SND 5}\n';
C.load(T);
let w = word('uno');
ok(S.pairs.length === 1 && C.commitText(C.textMoveCue(cue('SND 5'), w.b, w.wi)) && S.pairs.length === 1, 'a start moved two words earlier keeps its pair');
ok(C.serialize() === 'ANNA: uno {SND 5 | musica} due tre quattro cinque {/SND 5}\n', 'and the text is as expected');
C.undo();
ok(C.serialize() === T && S.pairs.length === 1, 'undo gives the starting text exactly');
C.redo();
ok(C.serialize() === 'ANNA: uno {SND 5 | musica} due tre quattro cinque {/SND 5}\n', 'redo moves the cue again');
C.load(T);
w = word('uno');
ok(C.commitText(C.textMoveCue(cue('/SND 5'), w.b, w.wi)) && S.pairs.length === 0, 'an end moved above its start is kept and the pair is gone');
ok(S.hist.length === 1 && (C.undo(), C.serialize() === T && S.pairs.length === 1), 'that move is one undo step, and undo restores the pair');
