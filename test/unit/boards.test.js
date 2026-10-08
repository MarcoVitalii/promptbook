// Arrangement of the boards on a facing page, checked without a browser.
const { ok, normCfg, facingLayout, FIG_EXTRA, FIG_GAP, MAX_BOARDS } = require('./_core');
const W = 733, H = 966;   // A4: page body less the "+ Board" button
const blank = n => Array(n).fill(0.75);
const cols = n => facingLayout(blank(n), W, H).cols;
// height the rows take, each as tall as its taller board
const used = hs => { const L = facingLayout(hs, W, H); let s = 0; for (let k = 0; k < hs.length; k += L.cols) s += L.w * Math.max(...hs.slice(k, k + L.cols)) + FIG_EXTRA + FIG_GAP; return s; };

ok(cols(1) === 1 && cols(2) === 1, 'one or two boards take one column');
ok([3, 4, 5, 8].every(n => cols(n) === 2), 'three boards or more take two columns');
ok(facingLayout(blank(1), W, H).w === 733, 'one blank board on A4 is 733 wide, as before');
ok(facingLayout(blank(2), W, H).w === Math.floor(W * (H - 2 * (FIG_EXTRA + FIG_GAP)) / (2 * W * 0.75)), 'two boards keep the size the single column gave them');
for (let n = 1; n <= 10; n++) ok(used(blank(n)) <= H, n + ' blank boards fit the page height: ' + Math.round(used(blank(n))));
ok(facingLayout(blank(3), W, H).w * 2 + FIG_GAP <= W && facingLayout(blank(8), W, H).w * 2 + FIG_GAP <= W, 'two columns and their gap fit the page width');
ok(facingLayout(blank(3), W, H).w === facingLayout(blank(4), W, H).w, 'a half-empty row does not change the size');
ok(used([0.75, 1.5, 0.5]) <= H && used([1.7, 0.25, 0.25, 1.7, 0.75]) <= H, 'boards of mixed shapes still fit: a row is as tall as its taller board');
ok(facingLayout([], W, H).cols === 1 && facingLayout([], W, H).w === W, 'no board gives one column and no division by zero');
ok(MAX_BOARDS === 8, 'the interface stops at 8 boards per page');

// the grid behind the ink is a setting of the show: a step in board units, 0 for none
ok(normCfg({}).boardGrid === 25, 'a show without the setting, as an older release wrote it, gets the fine grid');
ok(normCfg({ boardGrid: 0 }).boardGrid === 0, 'grid off stays off');
ok(normCfg({ boardGrid: 50 }).boardGrid === 50 && normCfg({ boardGrid: '50' }).boardGrid === 50, 'the coarse grid is kept');
ok(normCfg({ boardGrid: 'x' }).boardGrid === 25 && normCfg({ boardGrid: 30 }).boardGrid === 25 && normCfg({ boardGrid: null }).boardGrid === 25, 'an unknown step falls back to the fine grid');
