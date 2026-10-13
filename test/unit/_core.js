// Loads src/core.js in Node, without a browser. Only what touches no layout is usable: parse, text edits, cue pairing, undo.
// What core.js calls in view.js and io.js is replaced by functions that do nothing.
const fs = require('fs'), path = require('path'), vm = require('vm');
const el = () => ({ className: '', textContent: '', style: {}, dataset: {}, children: [], appendChild(c) { this.children.push(c); return c; }, setAttribute() {} });
const nop = () => {};
const ctx = vm.createContext({ relayout: nop, markDirty: nop, updUndo: nop, closePop: nop, document: { createElement: el, createElementNS: el, createTextNode: el, querySelector: () => null, querySelectorAll: () => [] }, console });
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../src/core.js'), 'utf8'), ctx, { filename: 'src/core.js' });
const NAMES = ['S', 'VERSION', 'STR', 't', 'defaultConfig', 'normCfg', 'stripTokens', 'parseMeta', 'fullName', 'castCheck', 'parseScript', 'analyze', 'reparse', 'pairCues', 'serialize', 'applyText', 'commitText', 'textMoveCue', 'textCueOwn', 'textMoveBlocks', 'undo', 'redo', 'facingLayout', 'FIG_EXTRA', 'FIG_GAP', 'MAX_BOARDS', 'lcs', 'parseBlocks', 'diffBlocks', 'diffWords', 'diffFor', 'diffNames', 'insLabel', 'castPack', 'castTo', 'castSpeaker',
  'showWeight', 'showTimeline', 'showTl', 'showT', 'showP', 'showPlace', 'showCues', 'showNow', 'showSet', 'showPlay', 'showTempo', 'showHere', 'showLearn', 'showUnlearn', 'showNudge', 'showStats', 'showRest', 'showMeasured', 'showStepPlace', 'showCalls', 'showClock', 'showSeg'];
module.exports = vm.runInContext('({' + NAMES.join(',') + '})', ctx);
module.exports.cuesOutOfOrder = vm.runInContext('cuesOutOfOrder', ctx);
// Replaces the show with this text, as opening it would.
module.exports.load = text => vm.runInContext('(text => { S.hist = []; S.redo = []; S.blocks = []; S.byId = new Map(); applyText(text); })', ctx)(text);
module.exports.ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
