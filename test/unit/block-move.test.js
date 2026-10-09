// Moving whole blocks to another place in the script: the text edit behind dragging a block by its grip. No browser needed.
const C = require('./_core'), { ok, S } = C;
// loads `before`, moves n blocks starting at i0 to stand before block j, returns the new text (null: nothing to do)
const move = (before, i0, n, j) => { C.load(before); return C.textMoveBlocks(i0, n, j); };
const is = (got, want, m) => ok(got === want, m + (got === want ? '' : ': ' + JSON.stringify(got)));

const ABC = 'ANNA: uno\nMARCO: due\nANNA: tre\n';
is(move(ABC, 0, 1, 3), 'MARCO: due\nANNA: tre\nANNA: uno\n', 'the first speech moved to the end');
is(move(ABC, 2, 1, 0), 'ANNA: tre\nANNA: uno\nMARCO: due\n', 'the last speech moved to the start');
is(move(ABC, 0, 1, 2), 'MARCO: due\nANNA: uno\nANNA: tre\n', 'one place down');
is(move(ABC, 0, 2, 3), 'ANNA: tre\nANNA: uno\nMARCO: due\n', 'two blocks move together and keep their order');
is(move(ABC, 1, 1, 1), null, 'dropped just above itself: nothing to do');
is(move(ABC, 1, 1, 2), null, 'dropped just below itself: nothing to do');
is(move(ABC, 1, 1, 9), null, 'a place that does not exist: nothing to do');
is(move('ANNA: uno {LX 1 | luce | nota}\nMARCO: due {/LX 1}\n', 0, 1, 2), 'MARCO: due {/LX 1}\nANNA: uno {LX 1 | luce | nota}\n', 'cues move with their block, unchanged');
is(move('ANNA: uno\n\n(azione)\n\nMARCO: due\nANNA: tre\n', 1, 1, 3), 'ANNA: uno\n\nMARCO: due\n\n(azione)\nANNA: tre\n', 'an action takes its blank line along, and the gap it leaves does not close');
is(move('## Scena\n\nANNA: uno\nMARCO: due\n', 1, 1, 3), '## Scena\n\nMARCO: due\n\nANNA: uno\n', 'the blank line under a heading stays under the heading');
is(move('ANNA: uno\n\nMARCO: due\n', 1, 1, 0), 'MARCO: due\nANNA: uno\n', 'a block moved to the top leaves no blank line above it');
is(move('## Scena\nriga libera\nANNA: uno\n', 2, 1, 1), '## Scena\nANNA: uno\n\nriga libera\n', 'an unrecognised line that lands under a speech is kept apart from it by a blank line');
is(move('ANNA: uno\ncontinua qui\nMARCO: due\n', 0, 1, 2), 'MARCO: due\nANNA: uno\ncontinua qui\n', 'a speech of two lines moves whole');

// every move of every block of a mixed script: the same blocks, in the expected order, each with its text untouched
const MIX = '# ATTO\n\n## Scena 1\n\nANNA: uno {LX 1}\n& MARCO: insieme\n\n(azione)\n\n{VID 1 | filmato}\n\n%% nota %%\n\nriga libera\n\nMARCO: due\ntre\n\n{BOARD b1}\n\nANNA: quattro {/LX 1}\n';
C.load(MIX);
const N = S.blocks.length; let bad = '';
for (let i0 = 0; i0 < N && !bad; i0++) for (let j = 0; j <= N && !bad; j++) {
  C.load(MIX);
  const raws = S.blocks.map(b => b.raw), nt = C.textMoveBlocks(i0, 1, j);
  if (j === i0 || j === i0 + 1) { if (nt !== null) bad = 'not null at ' + i0 + '>' + j; continue; }
  const want = raws.slice(); const m = want.splice(i0, 1)[0]; want.splice(j > i0 ? j - 1 : j, 0, m);
  C.load(nt);
  if (S.blocks.map(b => b.raw).join('\u0001') !== want.join('\u0001')) bad = i0 + '>' + j + ': ' + JSON.stringify(nt);
  else if (/\n\n\n|^\n/.test(nt)) bad = 'blank lines doubled at ' + i0 + '>' + j + ': ' + JSON.stringify(nt);
}
ok(N === 11 && !bad, 'each of the ' + N + ' blocks of a mixed script, moved to every place, is read back whole and in the expected order' + (bad ? ' (' + bad + ')' : ''));

// one undo step, and undo returns the text exactly
C.load(MIX);
C.commitText(C.textMoveBlocks(2, 2, N));
ok(S.hist.length === 1 && C.serialize().endsWith('ANNA: uno {LX 1}\n& MARCO: insieme\n'), 'a speech and the speech said with it, moved to the end, is one undo step');
C.undo();
ok(C.serialize() === MIX, 'undo puts the blocks back and the text is the one before');
