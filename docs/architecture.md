# Promptbook — Architecture

**Describes:** `src/` as built. **Model:** C4, levels 1 to 3, drawn as Mermaid flowcharts.
**Companion files:** `SPEC.md` (why and what), `docs/verification.md` (what the checks cover).

How to read the diagrams: a box is a person, a software system, a container (something that runs or stores data on its own) or a component (a part inside one container). The second line of a box, in square brackets, says which. An arrow points from the part that acts to the part acted on, and its label says what for; where a label is passive ("read by"), read it that way round. A dashed arrow is either an optional outside tool (levels 1 and 2) or a call that goes against the intended layering (level 3).

---

## 1. Intent

The architecture exists to satisfy five product constraints (`SPEC.md` §2.1):

| Constraint | What it forces |
|---|---|
| C1 one HTML file, no install, no server, no libraries | Everything is one single-page application; the script for the actors is a second file built from the same sources. Zip, git objects, CSV and the IndexedDB wrapper are written by hand. |
| C2 no network | No back end, no telemetry, no CDN. The font is embedded. All data stays in the browser or in files the user picks. |
| C3 Chrome or Edge on a pen-and-touch laptop | The File System Access API is the storage path; pointer events tell pen, finger and mouse apart. |
| C4 one editor at a time | No merge, no locking protocol, no sync. A changed file on disk is detected and the user is asked. |
| C6 a show is plain files | The script is the source of truth and holds the cues. Everything else is keyed to its text. |

## 2. Level 1 — System context

```mermaid
flowchart TB
  sm["<b>Stage manager</b><br/>[Person]<br/>Pins cues, draws ink and boards,<br/>saves revisions, prints"]
  wr["<b>Writer or director</b><br/>[Person]<br/>Changes the script text.<br/>One editor at a time"]
  ops["<b>Operators</b><br/>[Person] lights, sound, video<br/>Read the cue lists"]
  cast["<b>Cast</b><br/>[Person]<br/>Read the script and their notes on a phone;<br/>on paper, pages and the changes that reach them"]

  pb["<b>Promptbook</b><br/>[Software system]<br/>A prompt book in one HTML file:<br/>script, cues, ink, boards, cue lists,<br/>print, history, show mode;<br/>and the script for the actors"]

  disk["<b>Local disk</b><br/>[External system]<br/>Holds the show file"]
  print["<b>Printer or PDF</b><br/>[External system]<br/>The browser's print dialog"]
  sheet["<b>Spreadsheet</b><br/>[External system]<br/>Opens the CSV cue lists"]
  git["<b>git</b><br/>[External system, optional]<br/>Reads and merges the history<br/>kept inside the show"]
  sync["<b>File copy or sync</b><br/>[External system, optional]<br/>Moves or replaces the show file"]

  sm -->|"annotates, edits, saves, prints"| pb
  wr -->|"edits the text in the tool"| pb
  pb -->|"reads and writes the show<br/>File System Access API"| disk
  pb -->|"book, script, cue lists,<br/>changed pages, change lists"| print
  pb -->|"cues.csv, one per department"| sheet
  print -->|"cue sheets"| ops
  sheet -->|"cue lists"| ops
  print -->|"pages and changes"| cast
  pb -->|"the cast file, sent by chat or mail"| cast
  git -.->|"log, diff, merge<br/>on the unzipped show"| disk
  sync -.->|"replaces the file"| disk

  classDef person fill:#08427b,stroke:#052e56,color:#ffffff
  classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef ext fill:#6b6b6b,stroke:#4a4a4a,color:#ffffff
  class sm,wr,ops,cast person
  class pb system
  class disk,print,sheet,git,sync ext
```

| Element | Role | Source |
|---|---|---|
| Stage manager | The one user for whom the tool is built and tested. | D13, D15 |
| Writer or director | Changes the text in the tool. Never at the same time as the stage manager. | D2, D15 |
| Operators | Do not use the tool. They receive paper and CSV. | D9 |
| Cast | Read the script for the actors, a file of their own that never edits the script; receive paper. | CST, HIS-9 |
| Local disk | The only place a show is kept besides the browser's own storage. | D10 |
| git | Optional. The tool writes a repository git can read; it never calls git. | HIS-1 |
| File copy or sync | Not a feature: a fact of life. A replaced show file is detected (STO-11). | D15 |

There is no arrow to any network host. That absence is a requirement (C2), not an omission: the cast file travels by whatever means the company already uses, outside the tool.

## 3. Level 2 — Containers

```mermaid
flowchart TB
  sm["<b>Stage manager</b><br/>[Person]"]

  subgraph system["Promptbook [Software system]"]
    app["<b>promptbook.html</b><br/>[Container: single-page application in Chrome or Edge]<br/>Plain JavaScript, CSS, embedded Inter font.<br/>All behaviour of the tool. No server, no network"]
    ls[("<b>localStorage</b><br/>[Container: browser storage]<br/>promptbook:draft, the show while not on disk<br/>promptbook:view, view settings and language")]
    idb[("<b>IndexedDB promptbook / kv</b><br/>[Container: browser storage]<br/>Handle of the last show file")]
    zip[("<b>Show file</b>, name.promptbook.zip<br/>[Container: file on the local disk]<br/>script.md, script.ink.json, config.json,<br/>boards/, templates/, .git/")]
    bak[("<b>Backup</b>, name.promptbook.json<br/>[Container: file on the local disk]<br/>The whole show in one JSON file")]
    castapp["<b>promptbook-cast.html</b><br/>[Container: single-page application in any browser]<br/>The script for the actors, with a show inside.<br/>Keeps part and notes in its own localStorage"]
  end

  out["<b>Exports</b><br/>[Files handed to others]<br/>cues.csv, cues.zip"]
  print["<b>Printer or PDF</b><br/>[External system]"]
  git["<b>git</b><br/>[External system, optional]"]

  sm -->|"pen, finger, mouse, keyboard"| app
  app -->|"draft, 0.7 s after a change,<br/>when the show is not on disk"| ls
  app -->|"remembers what to reopen"| idb
  app -->|"opens once into memory,<br/>rewrites the whole archive on every save"| zip
  app -->|"exports by download,<br/>imports by file input"| bak
  app -->|"downloads"| out
  app -->|"Send to cast: writes a copy<br/>with the text and the notes inside"| castapp
  app -->|"window.print"| print
  zip -.->|"read by git once unzipped:<br/>log, diff, merge"| git

  classDef person fill:#08427b,stroke:#052e56,color:#ffffff
  classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
  classDef store fill:#2f6f9f,stroke:#1f4b6b,color:#ffffff
  classDef ext fill:#6b6b6b,stroke:#4a4a4a,color:#ffffff
  class sm person
  class app,castapp container
  class ls,idb,zip,bak store
  class out,print,git ext
```

| Container | Technology | Holds | Written when | Spec |
|---|---|---|---|---|
| `promptbook.html` | HTML, CSS, JavaScript in one file of about 570 KB, of which about 110 KB is the font and about 140 KB the actors' file, carried as a string | Nothing durable. All state is in memory in one object, `S`. | — | all |
| Show file | Zip (store or deflate), written by `buildZip` | The show and its history | 0.7 s after the last change; the whole archive each time | STO-1, STO-2 |
| `localStorage` | Two keys | The draft of a show not on disk; view settings | Draft: 0.7 s after a change. Settings: on toggle | STO-8, UI-8 |
| IndexedDB | One store, one key `dir` | A file handle | After every open and "Save as show file…" | STO-7 |
| Backup | JSON, `format: "promptbook"` | Script, ink, settings, boards and templates with images as data URLs | On request | STO-8 |
| Exports | CSV with BOM; zip of CSVs | Cue lists | On request | CUE-38, CUE-39 |
| `promptbook-cast.html` | `core.js` and `cast.js` in one file, system fonts; its own `localStorage` keys | The text and the notes sent, inside the file; on the device, the actor's part, read marks and own notes | When "Send to cast…" is used | CST |

Two storage modes follow from these containers. `S.store.mode` is `zip` or `memory`: in `zip` the show's files are a map in memory (`S.store.files`) written out as one archive; in `memory` the show is saved as the draft.

## 4. Level 3 — Components of `promptbook.html`

`promptbook-cast.html` is not drawn: it is `core.js` (strings, helpers, parser) joined with `cast.js`, whose sections are the show (`usePack`, `anchorOwn`), the text, the sheets and the files (`docs/specs/10-cast.md` §3).

The application is three source files concatenated into one `<script>` in the order `core.js`, `view.js`, `io.js`. They share one scope: there are no modules. A component below is a section of a file, marked in the source with `/* ---------- name ---------- */` or a `=====` banner.

```mermaid
flowchart TB
  subgraph core["src/core.js — text, model, layout"]
    strings["<b>Strings</b><br/>[Component]<br/>STR, t: English and Italian"]
    state["<b>State and settings</b><br/>[Component]<br/>S, normCfg, PAPERS, GEO"]
    edits["<b>Text edits</b><br/>[Component]<br/>textWith, textEdits,<br/>textMoveCue, fmtToken"]
    undo["<b>Undo history</b><br/>[Component]<br/>commitText, undo, redo"]
    model["<b>Document model</b><br/>[Component]<br/>reparse, groupBlocks, pairCues"]
    parse["<b>Parser</b><br/>[Component]<br/>parseScript, classify, analyze,<br/>tokenize, parseMeta"]
    inkbk["<b>Ink bookkeeping</b><br/>[Component]<br/>attachInk, inkFile, inkFlag"]
    layout["<b>Layout</b><br/>[Component]<br/>buildRow, measure, paginate"]
    lock["<b>Page lock</b><br/>[Component]<br/>makeLock, lockPlan, insLabel"]
    cmp["<b>Compare</b><br/>[Component]<br/>lcs, diffBlocks, diffFor"]
    castc["<b>Cast pack</b><br/>[Component]<br/>castPack, castTo, isCast"]
    showc["<b>Show times</b><br/>[Component]<br/>showTimeline, showLearn, showCalls"]
  end

  subgraph view["src/view.js — screen and input"]
    render["<b>Page renderer and navigation</b><br/>[Component]<br/>relayout, syncPages, layoutTags,<br/>drawInk, jumpTo, findNext"]
    input["<b>Pointer input</b><br/>[Component]<br/>pen, finger, mouse, palm rule,<br/>ink strokes, cue drag"]
    pop["<b>Popovers and block editor</b><br/>[Component]<br/>openPin, openCueEdit, editGroup"]
    exp["<b>CSV and print</b><br/>[Component]<br/>csvText, exportCSV, doPrint"]
    panels["<b>Cue list and Review</b><br/>[Component]<br/>collectCues, reviewData, renderDrawer"]
    boards["<b>Boards and templates</b><br/>[Component]<br/>fillBoard, renderFacing,<br/>boardAct, renderTemplates"]
    showv["<b>Show mode</b><br/>[Component]<br/>showOn, showTick, showFollow,<br/>renderShowSide"]
  end

  subgraph io["src/io.js — storage and shell"]
    store["<b>Store</b><br/>[Component]<br/>loadStore, markDirty, saveNow,<br/>outside-change guard"]
    zipc["<b>Zip codec</b><br/>[Component]<br/>buildZip, readZip, crc32"]
    draft["<b>Draft and backup</b><br/>[Component]<br/>bundle, saveDraft, idb,<br/>exportBundle, importBundle"]
    gitc["<b>Git history</b><br/>[Component]<br/>gPut, gTree, gSave,<br/>gCheckout, histSave"]
    histui["<b>History and Changes dialogs</b><br/>[Component]<br/>openHistory, openDiff"]
    castio["<b>Send to cast</b><br/>[Component]<br/>openCast, castHTML"]
    shell["<b>Shell</b><br/>[Component]<br/>dialogs, Settings, toolbar, keys,<br/>start screen, init, window.PB"]
  end

  input -->|"tap"| pop
  input -->|"stroke, erase"| inkbk
  input -->|"drop a cue tag"| edits
  pop -->|"new text"| edits
  edits --> undo
  undo -->|"applyText"| model
  model --> parse
  model -->|"keeps ink with its block"| inkbk
  render --> layout
  layout -->|"where old pages start"| lock
  lock --> cmp
  cmp -->|"parseBlocks"| parse
  panels --> model
  exp --> panels
  boards --> render
  store --->|"loadShow"| model
  store --> zipc
  store --> draft
  gitc --> store
  gitc -->|"lock at a revision"| lock
  histui --> gitc
  histui --> cmp
  castio --> castc
  castc --> model
  showv --> showc
  showc --> model
  showv --> render

  undo -.->|"relayout"| render
  undo -.->|"markDirty"| store
  layout -..->|"facingSig"| boards
  boards -.->|"writeBlob, markDirty"| store

  classDef comp fill:#85bbf0,stroke:#5d82a8,color:#000000
  classDef base fill:#c6dcf5,stroke:#5d82a8,color:#000000
  class parse,model,edits,undo,inkbk,cmp,lock,layout,render,boards,input,pop,panels,exp,store,zipc,draft,gitc,histui,shell,castc,showc,showv,castio comp
  class strings,state base
```

Reading note: the layout engine draws one arrow behind a box. The dashed `facingSig` arrow runs from Layout to Boards and templates; it only passes behind Cue list and Review on the way.

Three components have no arrows, to keep the picture readable. `Strings` and `State and settings` are used by every component: `t()` is called about 300 times and `S` is read or written about 650 times across the three files. `Shell` wires up all the others: it binds the toolbar, the menu and the keyboard to their functions and calls `init`.

| Component | File, section | Responsibility | Serves |
|---|---|---|---|
| Strings | `core.js`, strings | Every user-facing text, in English and Italian, read with `t('key')` | UI-5 |
| State and settings | `core.js`, constants, state | The one mutable state object `S`; defaults and clean-up of `config.json`; page geometry | all |
| Parser | `core.js`, PARSE | Text to blocks (`h`, `speech`, `action`, `para`, `mark`, `note`, `meta`), words and cue tokens. Pure. | TXT |
| Document model | `core.js`, `reparse`, `pairCues` | Replaces the text while keeping each unchanged block's identity; pairs ends with cues; assigns rail lanes | TXT, CUE-9, INK-5 |
| Text edits | `core.js`, `textWith` … `textMoveCue`, `textMoveBlocks` | Every change to the show's text is computed as a new full text | CUE, TXT-31, BRD-5 |
| Undo history | `core.js`, history | `commitText` applies a text and records the changed span; a stack of `{undo, redo}` closures, 200 deep | TXT-5 |
| Ink bookkeeping | `core.js`, ink bookkeeping | Which ink belongs to which block, the "check" flag, orphaned ink, the ink file | INK |
| Compare | `core.js`, compare | Longest common run of blocks and of words; what a change means for one character | HIS-8, HIS-9 |
| Cast pack | `core.js`, cast | The text without tokens and the notes for the actors, as one object | CST-2, CST-5, CST-6 |
| Show times | `core.js`, show | The time of every block, the place of the line, what a mark teaches, which cues are to be called | SHW-5, SHW-6, SHW-12 to SHW-24 |
| Page lock | `core.js`, locked page numbers | Records where blocks were; plans where pages must start; names inserted pages | PAG-13 to PAG-19 |
| Layout | `core.js`, LAYOUT | Builds a row's DOM, measures it in a hidden element, breaks blocks into pages | PAG |
| Page renderer and navigation | `view.js`, VIEW, navigation | Draws only the pages near the screen; margin tags, connector lines, rails, ink; jump and find | PAG-10, CUE-7, UI-2 |
| Boards and templates | `view.js`, facing page, templates | Facing page, board figures, grid, template chains, Templates view, images | BRD |
| Show mode | `view.js`, show | Read only and focus; the running line, the page in steps, the rail of calls, the map | SHW |
| Pointer input | `view.js`, INPUT, drag | One state machine for pen, finger and mouse: draw, erase, tap, scroll, long press, drag a cue or a block | INP, CUE-25 to CUE-34, CUE-43, TXT-28 to TXT-30 |
| Popovers and block editor | `view.js`, POPOVERS, in-place editor | Cue pin, cue editor, board name, comment, ink flag; the text editor of a block | CUE-3, TXT-8 |
| Cue list and Review | `view.js`, PANELS | Rows computed from the tokens; the Review sections and the badge | CUE-35, UI-1 |
| CSV and print | `view.js`, end of PANELS | CSV text, downloads, print modes | CUE-38, PAG-11 |
| Store | `io.js`, STORE | The two storage modes behind `readFile` / `writeBlob`; dirty flags; autosave; outside-change guard; opening a show; parts that cannot be read; the release mark | STO |
| Zip codec | `io.js`, zip | Reads and writes zip archives with the browser's deflate; checks every entry against its CRC | STO-1, STO-23 to STO-25 |
| Draft and backup | `io.js`, `bundle` … `importBundle`, `idb` | The show as one JSON object; draft in `localStorage`; last handle in IndexedDB | STO-7, STO-8 |
| Git history | `io.js`, HISTORY | Loose objects, trees, commits, refs; commit, checkout, revision, variant, restore; objects used only when whole | HIS-1 to HIS-6, HIS-13 to HIS-15 |
| History and Changes dialogs | `io.js`, `openHistory`, `openDiff` | The two dialogs over the git history and the comparison | HIS-7, HIS-10 |
| Send to cast | `io.js`, cast | The dialog, and the actors' file written with the show inside | CST-4 |
| Shell | `io.js`, DIALOGS, TOOLBAR | Dialog frame, Settings, menu, toolbar and corner dock, keyboard (`KEYS`, `KEYMAP`, `openKeys`), paste, start screen, sample, `init`, and `window.PB` for the tests | UI |

## 5. How a change travels

One path carries every change to the script text: a pinned cue, an edited block, a moved tag, a renamed board. Ink and board strokes skip the parser and go straight to the store.

```mermaid
sequenceDiagram
  actor SM as Stage manager
  participant IN as Pointer input
  participant PO as Popover
  participant TE as Text edits and undo
  participant MO as Parser and model
  participant RE as Renderer and layout
  participant ST as Store
  participant F as Show file

  SM->>IN: finger tap on a word
  IN->>PO: handleTap opens the cue pin
  SM->>PO: tap a department
  PO->>TE: insertWordCue, commitText(new full text)
  TE->>MO: applyText, reparse
  MO-->>TE: unchanged blocks keep their id and ink, cues paired
  TE->>RE: relayout
  RE->>RE: measure new rows, paginate, redraw pages whose signature changed
  TE->>ST: markDirty script
  TE->>TE: push the changed span on the undo stack
  Note over ST: 0.7 s after the last change
  ST->>F: has the file changed outside?
  F-->>ST: no
  ST->>F: write script.md into the archive, rewrite the archive
  ST-->>SM: status "Saved 20:13"
```

Three properties of this path are the centre of the design:

1. **The text is replaced whole.** No component edits a block object in place. `reparse` then finds what stayed the same by comparing the unchanged run at the start and at the end, and matches the middle by text and similarity. That is how ink survives edits (INK-5) and why a cue has no id of its own: it is found again by block id and offset.
2. **A page is redrawn only when its signature changes.** `paginate` gives every page a string made of its blocks, fragments, head and rails; `syncPages` compares it with what is on screen.
3. **Saving is by dirty flag and timer.** `markDirty` sets a flag and restarts a 0.7 s timer; `saveNow` writes what is flagged and, in a show file, rewrites the archive.

## 6. Data

The show is a set of files inside the show file. Shapes are specified in `docs/specs/07-storage.md`.

```
name.promptbook.zip
  script.md              the script, with cue and board tokens      source of truth
  script.ink.json        ink strokes, keyed to block text
  config.json            title, paper, departments, templates, grid, page lock,
                         show-mode times, release mark
  boards/<slug>.json     one drawing per board, plus its image file
  templates/<slug>.json  one drawing per template, plus its image file
  damaged/               parts that could not be read, kept as found
  .git/                  loose objects, refs, HEAD: revisions and variants
```

Derived and never stored: blocks, cue pairs, pages, page numbers, the cue list, the Review lists, the comparison of two revisions, the calls of show mode.

## 7. Build and verification

```mermaid
flowchart LR
  src["<b>src/</b><br/>core.js, view.js, io.js,<br/>style.css, index.html;<br/>cast.js, cast.css, cast.html"]
  fonts["<b>fonts/</b><br/>Inter subset, three faces"]
  build["<b>build.py</b><br/>joins them, refuses a script<br/>close tag inside the JS"]
  html["<b>promptbook.html</b><br/><b>promptbook-cast.html</b><br/>the release, built,<br/>not in the repository"]
  unit["<b>test/unit</b><br/>Node, no browser:<br/>core.js in a vm, DOM stubbed"]
  e2e["<b>test/*.test.js</b><br/>Playwright, Chromium:<br/>real clicks, simulated pen and touch"]
  check["<b>scripts/check.sh</b><br/>fast or full, skips when unchanged"]
  hooks["<b>Hooks and CI</b><br/>Claude Code after an edit and at the end of a turn,<br/>git pre-commit, GitHub Actions"]

  src --> build
  fonts --> build
  build --> html
  src -->|"core.js only"| unit
  html --> e2e
  hooks --> check
  check --> build
  check --> unit
  check --> e2e
```

The unit checks read `src/core.js`; the browser checks read the two built files. A browser result means nothing until the build has run after the last change to `src/`. `build.py` writes `promptbook-cast.html` first, then `promptbook.html` with that file inside it as the string `CAST_APP`. GitHub Actions runs the build and every check on each pull request and push to `main` (`.github/workflows/ci.yml`); a tag `rX.Y` publishes the two files as a GitHub release and on GitHub Pages (`release.yml`). Current numbers are in `docs/verification.md`.

## 8. Consequences

What the architecture buys, and what it costs.

| Consequence | Detail |
|---|---|
| One file to hand over | Copy `promptbook.html` and a show file to any machine with Chrome or Edge. Every release on GitHub carries the file. |
| No back end to fail in rehearsal | Nothing to start, nothing to log into, nothing that needs the theatre's network. |
| Hand-written infrastructure | Zip, git objects, IndexedDB and CSV, a few hundred lines in all. Each covers only what the tool needs: no zip64, no encrypted entries, no packed git objects, no git index. |
| One scope, no modules | Any function can call any other. The layers (parse, layout, interact, store) are conventions, not boundaries: `core.js` calls up into `view.js` and `io.js` (`relayout`, `facingSig`, `closePop`, `markDirty`, `updUndo`) and `view.js` calls up into `io.js` (`markDirty`, `writeBlob`, `readFile`, `onDisk`, `buildZip`, `saveError`). The unit checks have to stub four of these to load `core.js`. |
| Layout needs a browser | Line breaks are measured in the DOM, so pagination, page locks and ink position cannot be checked without Chromium. |
| Whole-archive saves | A show file is rewritten in full on every save, history included. Simple and atomic; the cost grows with the history (`docs/specs/08-history.md` §3). |
| One state object | `S` is the only state. Easy to inspect and to export for the tests; nothing prevents any code from changing any part of it. |
| Device-bound input | The pointer state machine is the least testable code and the part most dependent on real hardware (`docs/verification.md` §4). |
