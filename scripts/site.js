#!/usr/bin/env node
// Builds the static site in _site/: the two built tools, a front page, and every document as a page.
// Usage: node scripts/site.js   (after python3 build.py). The release workflow publishes _site/ to GitHub Pages.
const fs = require('fs'), path = require('path');
const { Marked } = require('marked');
const root = path.resolve(__dirname, '..'), out = path.join(root, '_site');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
const REPO = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@12.1.0/dist/mermaid.esm.min.mjs';
const VERSION = /const VERSION = '([^']+)'/.exec(read('src/core.js'))[1];
const released = !new RegExp('^## ' + VERSION.replace(/\./g, '\\.') + '\\b.*not yet released', 'm').test(read('CHANGELOG.md'));

/* ---------- pages ---------- */
const list = dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.md')).sort().map(f => dir + '/' + f);
const GROUPS = [
  // the guide for whoever uses the tool, by what the reader needs (Diátaxis): learning, a task, understanding, looking up
  ['Using Promptbook', ['docs/guide/index.md', 'docs/guide/tutorial.md', 'docs/guide/reference.md']],
  ['How to', list('docs/guide/how-to')],
  ['Understanding it', list('docs/guide/explanation')]
];
const PROJECT = [
  ['The project', ['SPEC.md', 'CHANGELOG.md', 'PLAN.md', 'CONTRIBUTING.md']],
  ['Capabilities', list('docs/specs')],
  ['Reference', list('docs').concat(list('docs/background'))]
];
/* The guide exists in Italian too, same file names under docs/guide/it/. The project documents are in English only. */
const IT = 'docs/guide/it/';
const GROUPS_IT = [
  ['Usare Promptbook', [IT + 'index.md', IT + 'tutorial.md', IT + 'reference.md']],
  ['Come fare', list(IT + 'how-to')],
  ['Capire', list(IT + 'explanation')]
];
const PROJECT_IT = [['Il progetto (in inglese)', PROJECT[0][1]], ['Funzionalità (in inglese)', PROJECT[1][1]], ['Riferimenti tecnici (in inglese)', PROJECT[2][1]]];
const NAV = { en: GROUPS.concat(PROJECT), it: GROUPS_IT.concat(PROJECT_IT) };
const langOf = f => f.startsWith(IT) || f.startsWith('it/') ? 'it' : 'en';
/* the same page in the other language: the guide file of the same name, the other front page, or else the front of that guide */
function twin(f) {
  const it = langOf(f) === 'it';
  if (f === 'index.md' || f === 'it/index.md') return it ? 'index.html' : 'it/index.html';
  const g = it ? 'docs/guide/' + f.slice(IT.length) : f.startsWith('docs/guide/') ? IT + f.slice('docs/guide/'.length) : '';
  return PAGES.has(g) ? PAGES.get(g).href : it ? 'docs/guide/index.html' : IT + 'index.html';
}
const PAGES = new Map();   // source path → { title, href }
for (const [, files] of GROUPS.concat(GROUPS_IT, PROJECT)) for (const f of files) {
  const m = /^# +(.+)$/m.exec(read(f));
  PAGES.set(f, { title: m ? m[1].trim().replace(/^Promptbook — /, '') : f, href: f.replace(/\.md$/, '.html') });
}

/* ---------- markdown ---------- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function render(file) {
  const dir = path.posix.dirname(file), rel = to => path.posix.relative(dir, to) || '.';
  const seen = {}; let mermaid = false;
  // A link to another document goes to its page; a link to any other file of the repository goes to GitHub.
  const href = h => {
    if (/^([a-z]+:|#|\/\/)/i.test(h)) return h;
    const [p, hash] = h.split('#'), target = path.posix.normalize(path.posix.join(dir, p));
    if (PAGES.has(target)) return rel(PAGES.get(target).href) + (hash ? '#' + hash : '');
    return fs.existsSync(path.join(root, target)) ? REPO + '/blob/main/' + target : h;
  };
  const md = new Marked({ gfm: true });
  md.use({
    walkTokens(tok) { if (tok.type === 'link') tok.href = href(tok.href); },
    renderer: {
      heading({ tokens, depth, text }) {
        let id = text.toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/ /g, '-');
        seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += '-' + (seen[id] - 1);
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang !== 'mermaid') return false;
        mermaid = true; return `<pre class="mermaid">${esc(text)}</pre>\n`;
      },
      // The documents name each other in backticks (`docs/specs/07-storage.md`): on the site that is a link.
      codespan({ text }) {
        return PAGES.has(text) && text !== file ? `<a href="${rel(PAGES.get(text).href)}"><code>${esc(text)}</code></a>` : false;
      }
    }
  });
  return { html: md.parse(read(file)), mermaid };
}

/* ---------- shell ---------- */
const CSS = `
:root{--bg:#fbfaf8;--fg:#22201c;--mut:#6b665e;--line:#dedad2;--acc:#8a3b12;--code:#f1eee8;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#191817;--fg:#e8e4dc;--mut:#a39d92;--line:#3a3733;--acc:#e59a6a;--code:#262422}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--acc)}
.wrap{display:grid;grid-template-columns:16rem minmax(0,1fr);max-width:80rem;margin:0 auto}
nav{padding:1.5rem 1rem;border-right:1px solid var(--line);font-size:.9rem;position:sticky;top:0;align-self:start;max-height:100vh;overflow-y:auto}
nav .home{font-weight:700;font-size:1.1rem;text-decoration:none;color:var(--fg)}
.lang{display:inline-flex;margin-top:.7rem;border:1px solid var(--line);border-radius:999px;overflow:hidden;font-size:.8rem}
.lang a{padding:.2rem .8rem;text-decoration:none;color:var(--fg)}
.lang a+a{border-left:1px solid var(--line)}
.lang a[aria-current]{background:var(--acc);color:var(--bg);font-weight:600}
nav h2{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin:1.4rem 0 .3rem}
nav ul{list-style:none;margin:0;padding:0}
nav li a{display:block;padding:.15rem 0;text-decoration:none;color:var(--fg)}
nav li a:hover{color:var(--acc)}
nav li a[aria-current]{color:var(--acc);font-weight:600}
main{padding:1.5rem 2rem 4rem;min-width:0}
h1{font-size:1.9rem;line-height:1.2;margin:.2rem 0 1rem}
h2{font-size:1.35rem;margin:2.2rem 0 .6rem;padding-bottom:.25rem;border-bottom:1px solid var(--line)}
h3{font-size:1.1rem;margin:1.6rem 0 .4rem}
code{font:.88em ui-monospace,SFMono-Regular,Consolas,monospace;background:var(--code);padding:.1em .3em;border-radius:3px}
pre{background:var(--code);padding:.8rem 1rem;border-radius:5px;overflow-x:auto}
pre code{background:none;padding:0}
pre.mermaid{background:none;padding:0;text-align:center}
table{display:block;overflow-x:auto;border-collapse:collapse;font-size:.9rem;margin:1rem 0}
th,td{border:1px solid var(--line);padding:.35rem .6rem;vertical-align:top;text-align:left}
th{background:var(--code)}
blockquote{margin:1rem 0;padding:.1rem 1rem;border-left:3px solid var(--line);color:var(--mut)}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--line);font-size:.85rem;color:var(--mut)}
.lead{font-size:1.15rem;color:var(--mut);max-width:42rem}
.go{display:flex;flex-wrap:wrap;gap:1rem;margin:1.5rem 0}
.go a{display:block;padding:.8rem 1.2rem;border:1px solid var(--line);border-radius:6px;text-decoration:none;color:var(--fg);max-width:22rem}
.go a.pri{background:var(--acc);border-color:var(--acc);color:var(--bg)}
.go b{display:block;font-size:1.05rem}
.go span{font-size:.85rem;opacity:.85}
@media(max-width:800px){.wrap{display:block}nav{position:static;max-height:none;border-right:0;border-bottom:1px solid var(--line)}main{padding:1rem 16px 3rem}}
`;
function page(file, title, body, mermaid) {
  const up = path.posix.relative(path.posix.dirname(file), '.') || '.';
  const lang = langOf(file), it = lang === 'it', other = up + '/' + twin(file);
  const here = up + '/' + (file === 'index.md' || file === 'it/index.md' ? file.replace(/\.md$/, '.html') : PAGES.get(file).href);
  const pick = `<div class="lang" role="group" aria-label="Language · Lingua"><a href="${it ? other : here}" lang="en" hreflang="en"${it ? '' : ' aria-current="true"'}>English</a><a href="${it ? here : other}" lang="it" hreflang="it"${it ? ' aria-current="true"' : ''}>Italiano</a></div>`;
  const nav = NAV[lang].map(([name, files]) => `<h2>${name}</h2><ul>` + files.map(f => {
    const p = PAGES.get(f);
    return `<li><a href="${up}/${p.href}"${f === file ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`;
  }).join('') + '</ul>').join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="alternate" hreflang="${it ? 'en' : 'it'}" href="${other}">
<title>${esc(title)}${title === 'Promptbook' ? '' : ' · Promptbook'}</title>
<meta name="description" content="${esc(pkg.description)}">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<nav><a class="home" href="${up}/${it ? 'it/' : ''}index.html">Promptbook</a> <span>${VERSION}</span><br>${pick}${nav}</nav>
<main>
${body}
<footer>Promptbook ${VERSION}${released ? '' : it ? ', una versione costruita prima del rilascio' : ', a build made before its release'} · <a href="${REPO}">${it ? 'Sorgenti su GitHub' : 'Source on GitHub'}</a> · <a href="${up}/LICENSE.txt">${it ? 'Licenza MIT' : 'MIT licence'}</a> · ${it ? 'Carattere incorporato' : 'Embedded font'}: Inter, <a href="${up}/OFL.txt">SIL Open Font License 1.1</a></footer>
</main>
</div>
${mermaid ? `<script type="module">
import mermaid from '${MERMAID}';
mermaid.initialize({ startOnLoad: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neutral' });
</script>` : ''}
</body>
</html>
`;
}

/* ---------- front page ---------- */
const docList = (groups, up) => groups.map(([name, files]) => `<h3>${name}</h3><ul>` + files.map(f => `<li><a href="${up}${PAGES.get(f).href}">${esc(PAGES.get(f).title)}</a></li>`).join('') + '</ul>').join('\n');
const front = () => `<h1>Promptbook</h1>
<p class="lead">${esc(pkg.description)}: script, cues, ink and blocking boards, with generated cue lists and print. No install, no server, no account. A show is one <code>.zip</code> file that stays on your machine.</p>
<div class="go">
<a class="pri" href="promptbook.html"><b>Open Promptbook</b><span>${VERSION}${released ? '' : ' (not yet released)'} · for the stage manager · Chrome or Edge</span></a>
<a href="promptbook-cast.html"><b>Open the script for the actors</b><span>Reads a <code>.cast.json</code> file · phone or computer</span></a>
</div>
<p>Both are single files. To work without a network, download them from the <a href="${REPO}/releases/latest">latest release</a> and open them from disk. Older releases are on the <a href="${REPO}/releases">releases page</a>.</p>
<p>New to it? <a href="docs/guide/tutorial.html">A first show, start to finish</a>, then the <a href="docs/guide/index.html">guide</a>. The guide is also <a href="it/index.html" lang="it" hreflang="it">in italiano</a>.</p>
<h2>Documents</h2>
${docList(NAV.en, '')}`;
const frontIt = () => `<h1>Promptbook</h1>
<p class="lead">Un copione di scena in un solo file HTML: testo, cue, appunti a penna e tavole di regia, con liste cue e stampa generate dal copione. Niente da installare, nessun server, nessun account. Uno spettacolo è un solo file <code>.zip</code> che resta sul tuo computer.</p>
<div class="go">
<a class="pri" href="../promptbook.html"><b>Apri Promptbook</b><span>${VERSION}${released ? '' : ' (non ancora rilasciata)'} · per la direzione di scena · Chrome o Edge</span></a>
<a href="../promptbook-cast.html"><b>Apri il copione per gli attori</b><span>Legge un file <code>.cast.json</code> · telefono o computer</span></a>
</div>
<p>Sono due file singoli, e parlano italiano quando il browser è in italiano. Per lavorare senza rete, scaricali dall’<a href="${REPO}/releases/latest">ultima versione</a> e aprili dal disco. Le versioni precedenti sono nella <a href="${REPO}/releases">pagina delle versioni</a>.</p>
<p>È la prima volta? <a href="../${IT}tutorial.html">Un primo spettacolo, dall’inizio alla fine</a>, poi la <a href="../${IT}index.html">guida</a>.</p>
<h2>Documenti</h2>
${docList(NAV.it, '../')}
<p>I documenti del progetto (specifica, architettura, registro delle modifiche) sono solo in inglese.</p>`;

/* ---------- write ---------- */
const put = (f, text) => { const p = path.join(out, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
fs.rmSync(out, { recursive: true, force: true });
for (const f of ['promptbook.html', 'promptbook-cast.html']) {
  if (!fs.existsSync(path.join(root, f))) { console.error(f + ' is missing: run python3 build.py first'); process.exit(1); }
  put(f, fs.readFileSync(path.join(root, f)));
}
put('LICENSE.txt', read('LICENSE'));
put('OFL.txt', read('fonts/OFL.txt'));
put('index.html', page('index.md', 'Promptbook', front(), false));
put('it/index.html', page('it/index.md', 'Promptbook', frontIt(), false));
for (const [f, p] of PAGES) { const r = render(f); put(p.href, page(f, p.title, r.html, r.mermaid)); }
console.log('_site: ' + (PAGES.size + 2) + ' pages, promptbook.html ' + VERSION + (released ? '' : ' (not yet released)'));
