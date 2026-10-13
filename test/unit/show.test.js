// Show mode without a browser: the time of a block, the line, timing chunks in rehearsal, the pace of the night, the calls, read only (SHW-2, 5, 6, 9 to 14, 19 to 24).
const C = require('./_core'), { ok, S } = C;
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const reset = () => Object.assign(S.show, { on: false, playing: false, base: 0, t0: 0, played: 0, anchor: null, cal: { want: 0, ms: 0 }, tempo: 1, learn: false, last: null, tl: null, cues: [] });
const T = ['# ATTO PRIMO', '', '(Buio. Il mare.) {SND 1}', '',
  'ANNA: uno due tre quattro {LX 1 | luce} cinque sei sette otto',
  'MARCO: uno due tre quattro cinque sei sette otto nove dieci',
  '& ANNA: uno due',
  '{LX 2}', '%%', 'ANNA: una battuta messa da parte.', '%%', '{BOARD molo}',
  'ANNA: fine {/SND 1} {TODO | rivedere}', ''].join('\n');
C.load(T); reset();
S.cfg = C.normCfg({});
const by = (type, n = 0) => S.blocks.filter(b => b.type === type)[n];

// SHW-6: weights
ok(C.showWeight(by('speech')) === 10, 'a speech counts its words plus 2: ' + C.showWeight(by('speech')));
ok(C.showWeight(by('action')) === 3 + 2 + 6, 'an action counts its words plus 2 plus 6: ' + C.showWeight(by('action')));
ok(C.showWeight(by('h')) === 0 && S.blocks.filter(b => b.type === 'mark').every(b => C.showWeight(b) === 0), 'headings and standalone cue lines count nothing');
let tl = C.showTimeline();
ok(tl.total === 11 + 10 + 12 + 3, 'speeches spoken together count as the longest of them: total ' + tl.total);
ok(tl.at.get(by('speech').g) === 11, 'the first speech starts after the action: ' + tl.at.get(by('speech').g));

// SHW-19: every block has a time, its words at the pace of the show until it is timed
const sp = by('speech'), wi = sp.tokens.findIndex(q => q.k === 'w' && q.text === 'cinque');
ok(near(C.showPlace(sp, wi, false), 11 + 4 / 8 * 10), 'the place of a word is its share of the block: ' + C.showPlace(sp, wi, false));
ok(S.cfg.show.wpm === 130 && S.cfg.show.standby === 30 && S.cfg.show.warning === 120 && Object.keys(S.cfg.show.times).length === 0, 'a show without the setting gets 130 wpm, 30 s, 120 s and no timed block');
ok(C.normCfg({ show: { wpm: 9999, standby: 'x', warning: 0 } }).show.wpm === 300 && C.normCfg({ show: { warning: 0 } }).show.warning === 0, 'the pace is clamped, and a warning time of 0 is kept');
const kept = C.normCfg({ show: { times: { a: 4.26, b: 'x', c: -1, d: 99999 }, scenes: { old: 80 } } }).show;
ok(JSON.stringify(kept.times) === '{"a":4.3,"d":3600}' && !('scenes' in kept), 'timed blocks are kept in the configuration in tenths of a second, bad values and the scene paces of the first build are dropped: ' + JSON.stringify(kept));
S.cfg.show.wpm = 120; S.show.tl = null;   // 2 words a second
tl = C.showTl();
ok(tl.list.map(e => e.d).join() === '5500,5000,6000,1500' && tl.ms === 18000 && tl.list.every(e => !e.own), 'an untimed block lasts its words at the pace of the show: ' + tl.list.map(e => e.d).join());
ok(near(C.showT(11 + 5), 5500 + 2500) && near(C.showP(8000), 16) && C.showP(1e9) === tl.total && C.showT(1e9) === 18000, 'a place has a time and a time has a place');
C.showSet(0, 1000);
ok(C.showNow(6000) === 0, 'a stopped line does not move');
C.showPlay(true, 1000);
ok(near(C.showNow(6000), 10), 'a running line crosses each block in its time: ' + C.showNow(6000));
C.showPlay(false, 6000);
ok(near(C.showNow(60000), 10), 'stopping keeps the place');
C.showPlay(true, 60000);
ok(C.showNow(60000 + 3600000) === tl.total, 'the line stops at the end of the script');
C.showPlay(false, 60000);

// SHW-12 to 14: calls
S.show.on = true; S.show.cues = C.showCues();
ok(S.show.cues.map(q => q.name).join() === 'SND 1,LX 1,LX 2,/SND 1', 'every cue is called, ends too; boards and to-do notes are not: ' + S.show.cues.map(q => q.name).join());
const lx1 = S.show.cues[1].at;
ok(near(lx1, 11 + 4 / 8 * 10), 'a cue is called when the line has passed its word: ' + lx1);
const calls = pos => { C.showSet(pos, 0); const c = C.showCalls(0); return ['go', 'standby', 'warning'].map(k => c[k].map(o => o.name).join('+')).join('|') + '|' + (c.next ? c.next.name : ''); };
S.cfg.show.standby = 5; S.cfg.show.warning = 8;   // 10 and 16 words
ok(calls(0) === '||SND 1+LX 1|LX 2', 'far from a cue it is in warning, and the one after is named as next: ' + calls(0));
ok(calls(lx1 - 9) === '|SND 1+LX 1||LX 2', 'within 5 s (10 words) cues are in standby, in the order they come: ' + calls(lx1 - 9));
ok(calls(lx1 + 1) === 'SND 1+LX 1||LX 2|/SND 1', 'a passed cue stays up as GO, the next one is in warning: ' + calls(lx1 + 1));
ok(calls(lx1 + 9) === '|LX 2|/SND 1|', 'a passed cue is gone after 4 seconds: ' + calls(lx1 + 9));
S.cfg.show.warning = 0;
ok(calls(0) === '|||SND 1', 'a warning time of 0 gives no warnings: ' + calls(0));
ok(C.showCalls(0).later.map(o => o.name).join() === 'SND 1,LX 1,LX 2,/SND 1', 'the cues after are listed in order');

// SHW-9, 10, 11: corrections on a show night give the pace of the night and keep nothing
reset(); S.show.on = true; S.cfg = C.normCfg({}); S.cfg.show.wpm = 120;
C.showSet(0, 0); C.showPlay(true, 0); S.show.anchor = { pos: 0, played: 0 };
ok(C.showStepPlace(1, 1000) === 11 && C.showStepPlace(-1, 1000) === 0, 'the next block from the first is the second; there is none before the first');
C.showHere(20, 15000);   // the clock said 30 words, the show was at 20
ok(near(C.showNow(15000), 20), 'a correction puts the line where it is told');
ok(S.show.cal.ms === 15000 && near(S.show.cal.want, 10000) && C.showMeasured() === 0, 'it is measured, and no pace is offered before a minute of running');
ok(Object.keys(S.cfg.show.times).length === 0, 'without "Time it" a correction times no block');
S.show.cal = { want: 54000, ms: 60000 };
ok(C.showMeasured() === 0.9, 'after a minute the pace of the night is the time expected over the time taken: ' + C.showMeasured());
C.showHere(34, 16500);   // 14 words in 1.5 s is a jump
ok(S.show.cal.ms === 60000, 'a far jump is not counted');
C.showPlay(false, 16500); C.showPlay(true, 600000);
C.showHere(35, 605000);
ok(S.show.cal.ms === 60000, 'time while the line is stopped is not running time (1 word in 5 s is too slow to count)');
C.showTempo(0.5, 605000);
ok(S.show.tempo === 0.5 && near(C.showNow(605000), 35) && near(C.showNow(606000), 36), 'the pace of the night keeps the place and slows the line: ' + C.showNow(606000));
C.showSet(0, 0); S.show.cues = C.showCues();
const lx = (c => [...c.standby, ...c.warning, ...c.later].find(o => o.name === 'LX 1'))(C.showCalls(0));
ok(near(lx.s, C.showT(lx1) / 1000 / 0.5), 'and the time to a cue is longer by as much: ' + lx.s);
ok(C.showTempo(9, 0) === undefined && S.show.tempo === 2 && (C.showTempo(0.1, 0), S.show.tempo === 0.5), 'it is held between 50% and 200%');
C.showPlay(false, 0);

// SHW-20, 21: timing chunks in rehearsal
const W = n => Array.from({ length: n }, (_, i) => 'p' + i).join(' ');
const TXT = ['# ATTO PRIMO', '', '## Scena 1', '', 'ANNA: ' + W(98), 'MARCO: ' + W(48), '(Lottano.)', '', '## Scena 2', '', 'MARCO: ' + W(98).replace(/p/g, 'q') + ' {LX 5}', '', '# ATTO PRIMO', '', 'ANNA: ' + W(8), 'MARCO: Sì.', 'ANNA: Sì.', 'MARCO: Sì.', ''].join('\n');
const start = () => { reset(); S.show.on = true; S.show.learn = true; C.showSet(0, 0); C.showPlay(true, 0); S.show.anchor = { pos: 0, played: 0 }; };
C.load(TXT); S.cfg = C.normCfg({}); S.cfg.show.wpm = 120; start();
tl = C.showTl();
ok(tl.segs.map(q => q.key + ':' + q.at + '-' + q.end).join() === 'ATTO PRIMO / Scena 1:0-159,ATTO PRIMO / Scena 2:159-259,ATTO PRIMO #2:259-278', 'a scene runs from its heading to the next and is named by act and scene; a repeated name is numbered: ' + tl.segs.map(q => q.key + ':' + q.at + '-' + q.end).join());
ok(tl.segs[1].t === 79500 && tl.segs[1].te === 129500 && tl.segs[2].lvl === 1 && tl.segs[1].title === 'Scena 2', 'and has its own stretch of time');
const keys = tl.list.map(e => e.key);
ok(new Set(keys).size === keys.length && keys[6] === keys[5] + '.2' && keys[7] === keys[5] + '.3', 'blocks with the same words are told apart by their turn: ' + keys.slice(5).join());
C.showHere(100, 75000);   // the first speech took 75 s instead of 50
tl = C.showTl();
ok(S.cfg.show.times[keys[0]] === 75 && Object.keys(S.cfg.show.times).length === 1 && tl.list[0].own && tl.list[0].d === 75000 && !tl.list[1].own, 'with "Time it", the line put right at the end of a block gives that block its time: ' + JSON.stringify(S.cfg.show.times));
ok(near(S.show.last.ms, 75000) && near(S.show.last.was, 50000), 'and what was timed is told: ' + JSON.stringify(S.show.last));
ok(tl.ms === 139000 + 25000 && near(C.showNow(75000), 100) && near(C.showNow(76000), 102), 'the show is longer by as much, the line stays, and the next block still runs at the pace of the show');
C.showHere(159, 75000 + 59000);   // the second speech and the fight: 29.5 s expected, 59 s taken
ok(S.cfg.show.times[keys[1]] === 50 && S.cfg.show.times[keys[2]] === 9, 'a chunk of several blocks shares its time among them by their times so far: ' + JSON.stringify(S.cfg.show.times));
C.showHere(209, 134000 + 20000);   // half of the long speech of scene 2 in 20 s instead of 25
ok(S.cfg.show.times[keys[3]] === 45, 'a block covered in part takes its share for that part only: ' + S.cfg.show.times[keys[3]]);
C.showUnlearn(154000);
ok(!(keys[3] in S.cfg.show.times) && S.show.last === null && near(C.showNow(154000), 209), '"Undo" takes the last chunk back and keeps the place');
const before = JSON.stringify(S.cfg.show.times);
C.showHere(150, 160000);
ok(JSON.stringify(S.cfg.show.times) === before, 'a mark behind the one before times nothing');
C.showHere(259, 161500);   // 109 words in 1.5 s
ok(JSON.stringify(S.cfg.show.times) === before, 'a chunk more than 5 times too fast is a jump and times nothing');
C.showPlay(false, 161500); C.showHere(159, 170000); C.showPlay(true, 200000);
C.showHere(259, 240000);   // from the jump made while stopped: scene 2 in 40 s
ok(S.cfg.show.times[keys[3]] === 40 && S.cfg.show.times[keys[2]] === 9, 'a mark while the line is stopped only moves it, and the next chunk starts there: ' + S.cfg.show.times[keys[3]]);
C.showPlay(false, 240000); C.showSet(259, 240000); S.show.anchor = { pos: 259, played: S.show.played }; C.showPlay(true, 240000); C.showPlay(false, 250000);
C.showHere(269, 300000);
ok(!(keys[4] in S.cfg.show.times), 'a mark made after stopping the line times nothing');

// SHW-19, 23: a timed block keeps its time whatever the pace, and loses it with its words
S.cfg.show.wpm = 60; S.show.tl = null; tl = C.showTl();
ok(tl.list[0].d === 75000 && tl.list[4].d === 10000, 'a timed block keeps its time when the pace of the show changes; the others follow it');
S.cfg.show.wpm = 120; S.show.tl = null;
const cfg = S.cfg; C.load(TXT.replace('ANNA: p0 p1', 'ANNA: p0 px')); S.cfg = cfg; reset(); S.show.on = true;
tl = C.showTl();
ok(!tl.list[0].own && tl.list[0].d === 50000 && tl.list[1].own && tl.list[1].d === 50000 && tl.list[3].d === 40000, 'change the words of a block and its time is forgotten; the other blocks keep theirs');

// SHW-22, 24: by hand, how much is timed, the pace over the timed speeches, the length of the show
const st = C.showStats();
ok(near(st.share, 99 / (50 + 99 + 9.5), 1e-3) && st.wpm === 0, 'the share of the show that is timed, by time: ' + st.share);
C.showSet(0, 0); C.showNudge(5, 0); C.showNudge(5, 0); C.showNudge(-5, 0);
ok(S.cfg.show.times[C.showTl().list[0].key] === 55 && C.showTl().list[0].own, '+5 s and −5 s set the time of the block the line is in');
ok(C.showStats().wpm === Math.round(250 / 145 * 60), 'once 200 spoken words are timed, the pace over them is measured: ' + C.showStats().wpm);
C.showRest(C.showStats().wpm, 0);
ok(S.cfg.show.wpm === 103 && near(C.showTl().list[4].d, 10 / 103 * 60000) && C.showTl().list[0].d === 55000, 'and one call makes it the pace of everything not timed');
S.cfg.show.wpm = 120; S.show.tl = null;
C.showSet(100, 0); S.show.tempo = 1;
let ck = C.showClock(0);
ok(ck.at === 55000 && ck.total === 55000 + 50000 + 9000 + 40000 + 9500 && ck.left === ck.total - 55000, 'the show has a length, the line a time in it, and the rest is what is left: ' + JSON.stringify(ck));
S.show.tempo = 2; ck = C.showClock(0);
ok(ck.left === (ck.total - 55000) / 2, 'what is left follows the pace of the night');
S.show.tempo = 1;
S.show.cues = C.showCues(); S.cfg.show.standby = 30; S.cfg.show.warning = 120;
C.showSet(100, 0);
const cl = C.showCalls(0);
ok(cl.warning.length === 1 && near(cl.warning[0].s, 50 + 9 + 40), 'the time to a cue adds up the times of the blocks in between: ' + (cl.warning[0] || {}).s);
C.load(T); reset(); S.cfg = C.normCfg({}); S.show.on = true;

// SHW-2: read only
const t0 = C.serialize();
ok(C.commitText(t0 + '\nANNA: di più\n') === false && C.serialize() === t0, 'in show mode the text cannot be changed');
S.show.on = false;
ok(C.commitText(t0 + '\nANNA: di più\n') === true, 'outside show mode it can');
S.show.on = true; C.undo();
ok(C.serialize() !== t0, 'in show mode undo does nothing');
S.show.on = false; C.undo();
ok(C.serialize() === t0, 'outside show mode undo works again');

// The ways of sharing a chunk, the reason a mark timed nothing, Arrow from the mark, a time typed, timing line by line
{
  const N = [10, 40, 5, 20, 25], w = (n, p) => Array.from({ length: n }, (_, i) => p + i).join(' ');
  const TX = ['# ATTO', '', ...N.map((n, i) => (i % 2 ? 'MARCO: ' : 'ANNA: ') + w(n, 'abcde'[i])), '(Lottano a lungo.)', 'ANNA: ' + w(30, 'z'), ''].join('\n');
  const fresh = share => { C.load(TX); S.cfg = C.normCfg({}); S.cfg.show.wpm = 120; reset(); Object.assign(S.show, { on: true, learn: true, fine: {}, marks: [], why: '', opt: { mode: 'rough', share, step: 'line' } }); };
  const go = now => { C.showPlay(true, now); S.show.anchor = { pos: S.show.base, played: S.show.played }; };
  const L = () => C.showTl().list, row = () => L().slice(0, 5).map(e => e.d / 1000).join();
  // speeches 1 and 2 timed one by one, speech 3 set by hand, then one mark over all five after 120 s
  const twoRuns = share => {
    fresh(share); go(0); C.showHere(L()[1].at, 4000); C.showHere(L()[2].at, 35000); C.showPlay(false, 35000);
    C.showNudge(5, 35000); C.showNudge(5, 35000);
    C.showSet(0, 35000); go(35000); C.showHere(L()[5].at, 155000); return row();
  };
  const sum = s => Math.round(s.split(',').reduce((n, v) => n + +v, 0));
  let r = twoRuns('sofar');
  ok(r === '6.6,51,22.2,18.1,22.2' && sum(r) === 120, 'sharing by the times so far stretches every block of the chunk alike: ' + r);
  r = twoRuns('length');
  ok(r === '13.1,45.8,7.6,24,29.5', 'sharing by length gives each block its share of the chunk by its weight, whatever its time was: ' + r);
  r = twoRuns('finer');
  ok(r.split(',')[2] === '13.5' && Math.abs(+r.split(',')[1] / +r.split(',')[0] - 31 / 4) < 0.2 && Math.abs(+r.split(',')[3] / +r.split(',')[4] - 22 / 27) < 0.02 && sum(r) === 120, 'with "finer wins" a block set by hand keeps its time, blocks timed in a smaller chunk keep their proportion, the others share the rest by length: ' + r);
  C.showUnlearn(155000);
  ok(row() === '4,31,13.5,11,13.5' && S.show.fine[L()[2].key] === 0 && !(L()[3].key in S.show.fine), '"Undo" also takes back how the blocks were timed: ' + row());
  // the reason a mark timed nothing
  fresh('sofar'); C.showHere(L()[2].at, 1000);
  ok(S.show.why === 'stop' && !S.show.last, 'a mark while the line is stopped says so');
  C.showSet(0, 1000); go(1000); C.showHere(L()[5].at, 9000);
  ok(S.show.why === 'fast', 'a mark far too fast says so: ' + S.show.why);
  C.showHere(L()[1].at, 20000);
  ok(S.show.why === 'back', 'a mark behind the one before says so: ' + S.show.why);
  C.showHere(L()[2].at, 20500);
  ok(S.show.why === 'short', 'a mark after less than a second says so: ' + S.show.why);
  C.showHere(L()[3].at, 30000);
  ok(S.show.why === '' && S.show.last && S.show.marks.length === 5 && S.show.marks.filter(m => m.ok).length === 1, 'a mark that times a chunk gives no reason, and every mark of the rehearsal is remembered');
  // Arrow down from the mark
  fresh('sofar'); go(0);
  ok(near(C.showStepPlace(1, 14000), L()[2].at), 'Arrow down goes to the block after the one the clock has taken the line into');
  S.show.opt.step = 'mark';
  ok(near(C.showStepPlace(1, 14000), L()[1].at), 'from the mark, Arrow down goes to the block after the last mark');
  C.showHere(C.showStepPlace(1, 14000), 14000);
  ok(L()[0].d === 14000 && !L()[1].own, 'and the first speech alone takes the time: ' + row());
  // a time typed for a block, wherever the line is
  fresh('finer'); C.showFix(L()[2].key, 7.46, 0);
  ok(row() === '6,21,7.5,11,13.5' && S.show.fine[L()[2].key] === 0 && C.showNow(0) === 0, 'a time typed for a block sets it by hand, in tenths of a second, wherever the line is: ' + row());
  go(0); C.showHere(L()[5].at, 120000);
  ok(L()[2].d === 7500 && sum(row()) === 120, 'and a chunk that covers it leaves it alone: ' + row());
  C.showFix(L()[2].key, null, 120000);
  ok(!L()[2].own && L()[2].d === 3500 && !(L()[2].key in S.show.fine), 'nothing typed forgets its time: it is inferred from its words again');
  C.showFix(L()[2].key, 0.1, 120000); C.showFix('none', 5, 120000);
  ok(L()[2].d === 500 && !('none' in S.cfg.show.times), 'a block is never under half a second, and a key that is no block is not kept');
  ok(C.showSecsOf('12') === 12 && C.showSecsOf(' 12,5 s') === 12.5 && C.showSecsOf('1:05') === 65 && C.showSecsOf('') === null && Number.isNaN(C.showSecsOf('abc')) && Number.isNaN(C.showSecsOf('-3')), 'a time is typed as seconds, with a comma or a point, or as minutes and seconds');
  // from time to time: the mark can be behind the line or ahead of it
  fresh('finer'); go(0);
  const drift = C.showNow(60000);
  C.showHere(L()[3].at, 60000);
  ok(drift > L()[5].at && S.show.last && near(L().slice(0, 3).reduce((n, e) => n + e.d, 0), 60000, 150), 'a mark behind the line, the actors being slower, times the blocks since the mark before: ' + row());
  const here = C.showNow(62000);
  C.showHere(L()[5].at, 66000);
  ok(here < L()[4].at && S.show.last && near(L()[3].d + L()[4].d, 6000, 150), 'and a mark ahead of the line, the actors being faster, does the same: ' + row());
  // line by line: the line waits on each block, "Next" gives it exactly its time
  fresh('finer'); S.show.opt.mode = 'line'; S.show.opt.step = 'mark'; C.showSet(L()[1].at + 5, 0); C.showSnap(0);
  ok(C.showByLine() && near(S.show.base, L()[1].at) && near(S.show.anchor.pos, L()[1].at), 'line by line, the line is put at the start of its block');
  C.showSet(0, 0); C.showSnap(0); C.showPlay(true, 0);
  ok(C.showNow(14000) === 0 && near(C.showSince(14000), 14000), 'the line waits on the block while the time since the mark runs');
  C.showHere(C.showStepPlace(1, 14000), 14000); C.showHere(C.showStepPlace(1, 39000), 39000); C.showHere(C.showStepPlace(1, 41000), 41000);
  ok(row() === '14,25,2,11,13.5' && L().slice(0, 3).every(e => e.own) && near(C.showNow(50000), L()[3].at), '"Next" at the end of each block gives each exactly its time, and the line waits on the next: ' + row());
  C.showFix(L()[3].key, 30, 41000); C.showHere(C.showStepPlace(1, 49000), 49000);
  ok(L()[3].d === 8000, 'a block set by hand is timed again by "Next": ' + row());
  S.show.learn = false;
  ok(!C.showByLine() && C.showNow(51000) > L()[4].at, 'without "Time it" the line runs, whatever the way of timing');
}
