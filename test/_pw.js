// Finds Playwright: a normal install, or the copy that ships with the build machine.
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
module.exports = pw;
