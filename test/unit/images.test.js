// A board image that comes with a show is a picture held in the file, never an address (STO-21). Checked without a browser.
const { ok, normCfg } = require('./_core');
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const def = imageData => normCfg({ defaultBoard: { image: 'd.png', h: 500, imageData } }).defaultBoard;

ok(def(PNG).imageData === PNG && def('DATA:image/jpeg;base64,AAAA').imageData === 'DATA:image/jpeg;base64,AAAA', 'the picture of the default board, held in the file itself, is kept');
ok(['http://127.0.0.1:9/beacon.png?show=secret', 'https://example.org/a.png', '//example.org/a.png', 'file:///etc/passwd', 'a.png', ' data:image/png;base64,AAAA', 'data:text/html,x', 'blob:null/1234'].every(u => def(u).imageData === null), 'a web address, a file path or a page in its place is dropped');
ok([42, {}, ['data:image/png;base64,AAAA'], true].every(v => def(v).imageData === null), 'so is anything that is not text');
ok(def('http://127.0.0.1:9/x.png').image === 'd.png' && def('http://127.0.0.1:9/x.png').h === 500, 'the rest of the default board is kept as it was');
const given = { image: 'd.png', h: 500, imageData: 'http://127.0.0.1:9/x.png' }; normCfg({ defaultBoard: given });
ok(given.imageData === 'http://127.0.0.1:9/x.png', 'the settings handed in are not altered');
const old = normCfg({ defaultBoard: { image: 'd.png', h: 600 } }).defaultBoard;
ok(old.image === 'd.png' && old.h === 600 && !('imageData' in old), 'a default board from a show file, which never had the picture inside, is unchanged');
ok(normCfg({}).defaultBoard === null && normCfg({ defaultBoard: null }).defaultBoard === null && normCfg({ defaultBoard: 'x' }).defaultBoard === 'x', 'a show without a default board is read as before');
