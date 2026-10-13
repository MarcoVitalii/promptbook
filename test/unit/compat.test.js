// The release mark of a show and the fields a later release may add, checked without a browser.
const { ok, VERSION, READABLE_FROM, normCfg, relCmp, relMark, relNewer } = require('./_core');
const next = VERSION.replace(/\d+$/, n => +n + 1);   // the release after this one

// release names are numbers part by part, not text
ok(relCmp('r1.9', 'r1.10') < 0 && relCmp('r1.10', 'r1.9') > 0, 'r1.9 is older than r1.10');
ok(relCmp('r1.11', 'r1.11') === 0 && relCmp('r1.2', 'r1.2.0') === 0, 'a release equals itself, with or without a last part of 0');
ok(relCmp('r2', 'r1.99') > 0 && relCmp('r1.10.1', 'r1.10') > 0 && relCmp('r0.1', 'r1.0') < 0, 'the first part that differs decides');
ok([undefined, null, '', 'banana', 12, {}, '1.12', 'r1.x'].every(v => relCmp(v, 'r0.1') < 0 && relCmp(v, VERSION) < 0), 'a name that cannot be read counts as older than any release');
ok(relCmp(READABLE_FROM, VERSION) <= 0 && relCmp(READABLE_FROM, 'r0') > 0, 'the oldest release able to read a show is a release, and not newer than this one: ' + READABLE_FROM);

// the mark written into config.json
const m = relMark({});
ok(m.made === VERSION && m.needs === READABLE_FROM, 'a show saved by this release says so, and names the oldest release that reads it');
ok(relMark({ release: { made: 'r1.10', needs: 'r1.3' } }).needs === READABLE_FROM && relMark({ release: 'x' }).needs === READABLE_FROM, 'an older or unreadable mark is replaced by the mark of this release');
const far = relMark({ release: { made: 'r9.2', needs: 'r9.1', more: 1 } });
ok(far.made === VERSION && far.needs === 'r9.1' && far.more === 1, 'what a newer release asked for stays asked when this one saves, and what else it wrote in the mark is kept');

// when to warn
ok(relNewer({}) === '' && relNewer(null) === '' && relNewer({ release: null }) === '' && relNewer({ release: { made: 'r1.4' } }) === '', 'a show with no mark, as every older release wrote it, asks for nothing');
ok(relNewer({ release: { made: VERSION, needs: READABLE_FROM } }) === '' && relNewer({ release: { made: next, needs: VERSION } }) === '', 'a show this release can read asks for nothing, even when a newer one saved it');
ok(relNewer({ release: { made: next, needs: next } }) === next && relNewer({ release: { needs: 'r99.0' } }) === 'r99.0', 'a show that needs a newer release names it');
ok(relNewer({ release: { needs: 'soon' } }) === '', 'a mark that names no release asks for nothing');
ok(normCfg({ release: { made: next, needs: next } }).release.needs === next && !('release' in normCfg({})), 'the mark survives reading the configuration, and a show without one gets none until it is saved');

// fields this release does not know
const c = normCfg({ departments: [{ code: 'lx', name: 'Luci', colour: '#123456', cast: true, desk: 'ETC Ion', runs: true }, { code: 'SND', name: 'Audio', color: '#00f' }], show: { wpm: 100, hold: 7, times: { a: 2 } }, future: { a: 1 } });
ok(c.departments[0].desk === 'ETC Ion' && c.departments[0].runs === true, 'a field of a department that this release does not know is carried through');
ok(c.departments[0].code === 'LX' && c.departments[0].review === true && c.departments[0].cast === true && c.departments[1].colour === '#00f', 'the fields it knows are still read as before');
ok(c.show.hold === 7 && c.show.wpm === 100 && c.show.times.a === 2 && c.show.standby === 30, 'an unknown field of the show-mode settings is carried through too');
ok(c.future.a === 1, 'an unknown setting of the show is kept, as before');
const again = normCfg(JSON.parse(JSON.stringify(c)));
ok(again.departments[0].desk === 'ETC Ion' && again.show.hold === 7 && JSON.stringify(again) === JSON.stringify(c), 'reading what was written gives the same configuration again');
ok(JSON.stringify(normCfg({ show: 'x' }).show) === JSON.stringify(normCfg({}).show) && JSON.stringify(normCfg({ show: [1] }).show) === JSON.stringify(normCfg({}).show), 'show-mode settings that are not a set of fields give the defaults');
ok(normCfg({}).departments.every(d => Object.keys(d).join() === 'code,name,colour,review,cast'), 'a new show writes its departments with the known fields only');
