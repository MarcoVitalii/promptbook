# Promptbook — Glossary

**Covers:** the words the tool, its documents, its code and its checks use, one meaning each.
**For:** whoever writes a request, a requirement, a string, a function name or a check. Use the word in the first column; where a word has several meanings in use, §1 says which is which.
**Authority:** a capability file decides what a thing does; this file only decides what it is called. Each entry names the requirement that defines it.

**Columns.** *Term* is the word to use in documents, in English strings and in talk. *Italian* is the word the interface uses (`STR.it` in `src/core.js`); "—" means the interface has no fixed word for it. *In the files* is the name in the code or in the saved data, where it differs from the term.

**Keeping it.** A new thing gets its entry here in the change that introduces it. A word is never given a second meaning: pick another word, or qualify it as §1 does. Renaming a term means renaming it in the capability files and in `STR` too.

---

## 1. Words with more than one meaning

These are the words that have caused, or can cause, a misreading. Always use the qualified form.

| Word | Meanings in use | Say |
|---|---|---|
| block | (1) The unit of the script: a speech, an action, a heading and so on. (2) In the client's requests, a blocking board ("adding blocks on a single page", "templated backgrounds for blocks"). (3) Blocking, the movement of the actors. | **block** for (1) only. **board** for (2). **blocking** for (3). A request that says "block" is read for which one it means, and the reading is recorded under Intent. |
| note | (1) A to-do note. (2) A note for the cast. (3) An actor's own note in the script for the actors. (4) In the code, block kind `note` is a comment. (5) In `STR`, the key `notes` is the description of a cue. | **to-do note**, **note for the cast** (or **received note** on the actor's side), **own note**, **comment**, **description**. Never "note" alone. |
| show | (1) The production and everything saved for it. (2) Show mode. (3) `show` in `config.json`: the show-mode settings. (4) `show` in the cast pack: the id of the show. (5) "Show" in the Changes box: a filter. | **show** for (1). **show mode** for (2), always with "mode". **show-mode settings** for (3). **show id** for (4). |
| history | (1) The revisions of a show, a git repository. (2) The undo stack; the section of `core.js` that holds it is named "history". | **history** for (1). **undo** (undo step, undo stack) for (2). |
| lock, locked | (1) The page lock. (2) On a board, what comes from its chain cannot be drawn on. (3) `[LOCKED]`, the tag of a requirement decided by the client. | **page lock**, **locked page numbers** for (1). "locked chain" for (2). The tag is always written in brackets and capitals. |
| line | (1) A line of text. (2) A speech, in an actor's words ("my lines", "the line before yours"). (3) The running line of show mode. (4) The connector line from a tag to its word. (5) The line that marks the place while dragging. (6) "Cue line", a column of the cue list. | **line** for (1) and (2). **running line** (in the SHW file, "the line"), **connector line**, **place line**, **cue line** for the rest. |
| margin | (1) The cue margin, the right column of a script page. (2) "Margin", the short text of a cue. (3) The left gutter. (4) The notes margin of the script for the actors. | **cue margin**, **margin text**, **gutter**, **notes margin**. |
| rail | (1) The running rail between a cue and its end. (2) The panel on the right in show mode. | **running rail** for (1). **show panel** or "rail of calls" for (2). |
| review | (1) Review, the panel of hints. (2) `review: true` on a department: it holds to-do notes. (3) The code review of 2026-10-09, a basis for requirements. | **Review** (capital) for (1). **"To do" department** for (2). **code review** for (3). |
| cast | (1) The actors. (2) A department ticked "Cast". (3) The cast file. | **the cast** or **the actors**, **cast department**, **cast file**. |
| mark | (1) In the code, block kind `mark`: a line that holds only tokens. (2) In show mode, the double tap or arrow key that says where the show is. (3) The release mark of a show. (4) A hint drawn on a cue number. | **cue or board on its own line**, **mark** (show mode only), **release mark**, "marked" as a plain verb. |
| label, number | The second field of a cue token is free text; the interface calls it "Number or label", the cue list "No.". The **tag label** is something else: department and number together, as drawn on the tag. | **label** for the field (a number is a label with a digit). **tag label** for what the tag shows. |
| page | A sheet of the book is one of five things, and "page number" applies to one of them only. | **script page**, **facing page**, **front page**, **character page**, **template sheet**. See §6. |
| release, revision, variant, version | Release: a build of the tool (`r1.11`). Revision: a saved state of a show. Variant: a line of revisions of one show. "Version" is used for none of them. | **release**, **revision**, **variant**. Avoid "version" except for `VERSION` and the `version` fields of the saved files. |
| pace | (1) The pace of the show: words a minute for blocks not timed, kept. (2) The pace of the night: a percentage on top, not kept. | Always with "of the show" or "of the night". |
| delete, remove | One word for taking something out of the show (UI-12). | **Delete** ("Elimina"). Not "Remove". A to-do note ticked in Review is "removed from the script" in prose only. |

## 2. People and products

| Term | Italian | Meaning | Defined in |
|---|---|---|---|
| Promptbook | — | The tool: `promptbook.html`. Capital P, one word. | `SPEC.md` |
| prompt book | — | What the tool holds for one show: script, cues, ink, boards, history. Two words, lower case. | `SPEC.md` §1.3 |
| script for the actors | — | The second tool, `promptbook-cast.html`: it reads, it never edits. In the code `cast.js`, `window.PBC`, and `CAST_APP` when carried inside `promptbook.html`. Not "the cast app" in documents. | CST-7 |
| stage manager | — | The one user the tool is built and tested for. | `SPEC.md` §1.3 |
| writer, director | — | Edit the text, never at the same time as the stage manager. | D15 |
| operator | — | Runs lights, sound or video. Does not use the tool; gets cue lists on paper and as CSV. | `SPEC.md` §1.3 |
| the cast, actor | attori | Read the script for the actors and receive paper. | CST |
| client | — | Who asks for the tool and answers the questions. Their words are quoted under Intent. | `SPEC.md` |

## 3. The script

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| script | copione | The text of the show as typed, with its tokens. The source of truth. | `script.md` | TXT, STO §2.3 |
| block | — | The unit of the script and of everything keyed to it: ink, pages, comparison, page lock, block times. Seven kinds, the next rows. | `h`, `speech`, `action`, `para`, `mark`, `note`, `meta` | TXT §3 |
| heading | — | `# text` is an **act**, `## text` a **scene**. In show mode a scene is the stretch from one heading to the next. | `h` | TXT-1, SHW-25 |
| speech | battuta | `NAME: text`. One block, however many lines. | `speech` | TXT-2 |
| speeches said together | insieme | `& NAME: text` under a speech: spoken at the same time. They move as one. Also "simultaneous speech". | — | TXT-4 |
| action | — | `(text)` on its own line. | `action` | TXT-3 |
| inline direction | — | `(text)` inside a speech, in italics. Not a block. | — | TXT-3 |
| unrecognised line | — | A line the parser cannot classify. Kept, and listed in Review. | `para` | TXT-6 |
| comment | — | Lines between `%%`: a block set aside, not printed, cues inside not parsed. Made with "Comment out" ("Commenta"), undone with "Restore" ("Ripristina"). | `note` | TXT-22 |
| frontmatter | — | The `---` block that opens the script: title, author and the character list. | `meta` | TXT-11 |
| character | personaggio | An entry of the character list in the frontmatter: `NAME/ALIAS - description`. | `characters`, `personaggi` | TXT-14 |
| alias | — | A second spelling of a character's name. Shown and listed under the full name. | — | TXT-15 |
| speaker | — | The name before the colon of a speech, as typed. May be a character, an alias, several joined, or a group name. | — | TXT-2, TXT-16 |
| group name | — | `ALL`, `OTHERS`, `ALL BUT x`, `TUTTI` and the like: never checked against the character list. `CORO` is not one: it is an ordinary name. | — | TXT-17, TXT-18 |
| token | — | Anything in braces in the script: a cue, an end, a linking cue, a board. The stage manager never types one. | `{…}` | CUE-1, BRD-2 |
| grip | — | The faint handle in the left gutter by which a block is dragged. | — | TXT-28 |
| gutter | — | The strip left of the name column: grips, ink flags, comment markers. | — | TXT-24, TXT-28 |
| undo step | — | One entry of the undo stack. Every edit, of whatever size, is one. | — | TXT-10 |

## 4. Cues

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| cue | cue | A position in the text where something is called. No timing data. | `{DEPT label \| margin text \| description}` | CUE-1, D4 |
| department | reparto | Who a cue is for: code, name, colour. Configurable. | `departments` | CUE-6 |
| unknown department | — | A code used in the script that is not in the Settings list. Shown grey, listed in Review. | — | CUE-6 |
| label | numero o sigla | The free text after the department code. Never changed by the tool; a blank one on a new cue becomes the last plus one. | second part of the token | CUE-5, CUE-24 |
| margin text | testo a margine, Margine | The short text of a cue, shown on its tag. | `STR` key `desc` | CUE-20 |
| description | descrizione | The long text of a cue, shown in the cue list only. | `STR` keys `notes`, `hasNotes` | CUE-20 |
| pin | — | To place a cue by tapping a word; also the popover with one button per department. | `openPin` | CUE-3 |
| cue editor, cue box | — | The popover that edits a cue already placed. "Box" also names the outline round the cue word; say "cue box" for the popover and "boxed word" for the outline. | `openCueEdit` | CUE-3, CUE-8 |
| cue word | — | The word a cue follows. Boxed in the department colour. | — | CUE-2, CUE-8 |
| cue on its own line | su riga propria | A cue attached to no word, alone on a line between two blocks. | block kind `mark` | CUE-2, CUE-43 |
| tag | — | What shows a cue in the cue margin: a filled tag label and the margin text. A board has a tag too. | — | CUE-7 |
| connector line | — | The line from a tag to its cue word. | — | CUE-7 |
| end | — | A token that closes a cue: `{/SND 5}`. No number of its own. A **plain end** is an end that is not a linking cue. | `{/DEPT label \| description}` | CUE-9 |
| linking cue | — | A cue that ends others: `{SND 6 / SND 5}`. The cues it ends are its **targets**, each reference a **link**. | — | CUE-11 |
| pair | — | A cue and the end that closes it, found by position and label. An **open cue** has not been closed yet. | `pairCues` | CUE-10 |
| running rail | — | The thin line down the outer margin from a cue to its end, one **lane** per overlapping cue. | — | CUE-17 |
| to-do note | da fare | A cue of a department ticked "To do": left out of the cue list, listed first in Review. | `review: true` | CUE-21 |
| cue list | lista cue | The table computed from the tokens, never stored. Printed and exported from its own panel. | `collectCues` | CUE-35 |
| cue line | — | The column of the cue list that quotes the words round the cue word. | — | CUE-36 |
| duplicate, out of order | — | The two hints on a cue number. Shown in the cue list only, not in Review. | `cuesOutOfOrder` | CUE-5, CUE-37 |

## 5. Ink, boards and templates

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| ink | inchiostro; "Tratti" on the toggle | What the pen draws. Handwriting, never data. | `script.ink.json` | INK-1, K3 |
| stroke | — | One line of ink, from pen down to pen up. Belongs to the block it starts in. | `strokes` | INK-2 |
| snapshot | — | The text and line count of a block as they were when it was inked, cue tokens removed. | `text`, `lines`, `inked` | INK-4, INK-6 |
| flag | — | The red "!" beside a block whose text changed under its ink. Also "ink to check". | — | INK-7 |
| orphaned ink | — | Ink whose block is gone. Kept, listed in Review, re-attached when the same text is back. | `orphans` | INK-8 |
| board | tavola | An image with an ink layer, for blocking. Placed by a `{BOARD name}` token on its own line. | `boards/<name>.json` | BRD-1, BRD-2 |
| board figure | — | A board as drawn: button row, drawing, name. | — | BRD-9 |
| facing page | pagina a fronte | The right page: the boards whose tokens fall on the script page beside it. | — | PAG-2 |
| grid | griglia | The light grey grid on boards and templates. Display only. | `boardGrid` | BRD-11 |
| template | modello | A board kept in the show's configuration, with no token in the script, that other boards are drawn on. | `templates/<name>.json` | BRD-14 |
| base | base | The one template a board or a template is drawn on. A live link, not a copy. | `base` | BRD-15, BRD-16 |
| chain, root | — | A base, its base, and so on down; the root is the last. Drawn greyed and locked under the board. | — | BRD-17, BRD-20 |
| default template | — | The template a new board takes without asking. `defaultBoard` is an older form that still reads. | `defaultTemplate` | BRD-22, BRD-27 |
| Templates view | — | The view that replaces the script to edit templates, each on a **template sheet**. | — | BRD-25 |

## 6. Pages and print

| Term | Italian | Meaning | Defined in |
|---|---|---|---|
| script page | — | The left page: name column, text column, cue margin. The only kind with a page number. | PAG-1 |
| front page | — | The unnumbered page before the script with the frontmatter values. | PAG-7 |
| character page | — | The unnumbered page, or pages, with the character list. | PAG-8 |
| book | — | In print: script pages and facing pages, paired. Against "script pages only". | PAG-11 |
| page label | — | What a page is called: a number, or `12A` for an inserted page. Computed, never an identifier. | PAG-3, PAG-15 |
| page lock | — | The record of where every block was at a hand-out, so that pages start where they did on paper. `lock` in `config.json`, `makeLock`, `lockPlan`. | PAG-13, PAG-14 |
| inserted page | — | A page added under a lock to take overflow: `12A`, `12B`. | PAG-15 |
| changed page | — | A page whose words or breaks differ from the lock. Cues do not count. | PAG-16 |
| continued | (segue) | The label on the second part of a speech split over two pages; "(cont.)" in English. | PAG-6 |
| geometry | — | The fixed sizes of the page in pixels. Changing one moves every line break and so all ink. `GEO`, `PAPERS`. | PAG §3, INK-3 |

## 7. Storage and history

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| show | spettacolo | One production and everything saved for it. | — | STO-1 |
| show file | file spettacolo | The one `.zip` that holds a show. A show kept as a folder does not open. | `.zip` | STO-1 |
| part | — | One file inside a show file. | — | STO-18 |
| missing, unreadable | — | A part that is not there stays silent; a part that is there and cannot be read is said, and kept. Never use one word for the other. | `damaged/` | STO-18 to STO-20 |
| draft | — | The copy of a show the browser keeps when it is not on disk. | `promptbook:draft` | STO-8, STO-26 |
| backup | backup | The whole show as one file, for moving it without a show file. | `.promptbook.json` | STO-8 |
| settings | — | Of the show: travel with it and with every revision. Of the browser (view settings): stay with the machine. | `config.json`; `promptbook:view` | UI-3, UI-8 |
| release mark | — | Which release saved a show last and which is the oldest that opens it without loss. | `release.made`, `release.needs`, `READABLE_FROM` | STO-15 |
| history | cronologia | The revisions and variants of a show: a git repository inside the show file. | `.git/` | HIS-1 |
| revision | revisione | A named state of the whole show, saved on request. A commit and a tag. | — | HIS-2 |
| variant | variante | A line of revisions of one show, for a venue or a contest. A branch. | — | HIS-3 |
| restore | ripristina | Replace the show with a revision. Also the button that brings a comment back. | — | HIS-6, TXT-25 |
| changes | modifiche | The list of what differs between two revisions: added, cut, changed, cues only. Not "diff" in the interface. | `diffBlocks`, `openDiff` | HIS-8, HIS-10 |
| what reaches a character | — | The changes that concern one actor: their speeches, actions that name them, the line before theirs. | `diffFor` | HIS-9 |

## 8. Workbench and input

| Term | Italian | Meaning | Defined in |
|---|---|---|---|
| Review | Rivedi | The panel that lists everything doubtful. | UI-1 |
| hint | — | Something the tool lists and never refuses. There are no errors about what the user typed. | C10 |
| badge | — | The count on the Review button. Some Review sections count in it and some do not. | UI-1 |
| Find | — | The tool's own search; the browser's cannot see pages not yet drawn. | UI-2 |
| toggle | — | A toolbar button that shows or hides: "Boards" (the facing page), "Cues", "Ink"; and "Finger", "Eraser". | UI-4, INP-6 |
| night mode | modalità notte | The dark screen. Print is always light. | UI-6 |
| dock | — | The corner of the desk with night mode, zoom and help. | UI-11 |
| desk | — | The area behind the pages. | UI §3 |
| popover | — | A small box opened by a tap, beside what was tapped. A **dialog** is a box that takes the whole screen's attention (Settings, History). | — |
| pointer | — | Pen, finger or mouse, told apart by the browser. No mode switch between them. | INP-1 |
| palm rule | — | What a touch may do while the pen is near the screen. | INP-3 |
| hold | — | A finger resting 0.3 s on a tag or a grip, after which it lifts and can be dragged. A **long press** (0.56 s) on a block opens its text. | INP-8, INP-7 |
| place | — | Where a drag would land: a **target** word, or the place line between two blocks. | CUE-28, TXT-30 |

## 9. Cast

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| cast department | — ("Attori" on the tick) | A department ticked "Cast". Always a "To do" department as well. | `cast: true` | CST-1 |
| note for the cast | nota per gli attori | A cue of a cast department. Its label is the addressee, its department is who writes. | `{NOTE ANNA \| text}` | CST-2 |
| addressee | — | Who a note for the cast is for: the speaker of its block by default, or the names in its label. | `to` | CST-2 |
| cast file | — | What "Send to cast…" saves: the script for the actors with one show inside, or the text and notes alone. | `<title>-cast.html`, `<title>.cast.json` | CST-4 |
| pack | — | The content of a cast file: the script without tokens, and the notes for the cast. Not used in the interface. | `castPack`, `format: "promptbook-cast"` | CST §3 |
| show id | — | How the script for the actors knows a show from one file to the next. | `castId`, `show` | CST-15 |
| my part | la mia parte | The speaker names an actor has ticked. Their speeches are **my lines**. | `chars` | CST-10 |
| hide | nascondi | Cover my lines for practice. The request said "black out". | `hide` | CST-11 |
| received note | — | A note for the cast, seen from the actor's side. | `notes` | CST-13 |
| own note | — | A note an actor writes on their device. Never leaves it except by "Export my notes". | `own` | CST-12 |
| layer | — | What an actor's device keeps for one show: part, hiding, read marks, own notes. | `promptbook-cast:show:<id>` | CST-15 |
| hand-over | — | Opening a newer cast file of a show already on the device: own notes are anchored again, changed lines marked, "What is new" ("Novità") shown. | `takeOver`, `anchorOwn` | CST-16, CST-19 |

## 10. Show mode

| Term | Italian | Meaning | In the files | Defined in |
|---|---|---|---|---|
| show mode | — ("Show" on the button) | The book read only, for calling the show. | `showOn`, `showOff` | SHW-1, SHW-2 |
| running line | riga | The mark of where the show is. A clock, not a listener. | `showNow` | SHW-5 |
| place | — | Where the line is: a count of words from the top. | `showP` | SHW-6 |
| block time | — | How long a block takes: its words at the pace of the show until it is **timed**, then the time measured. | `show.times` | SHW-19 |
| "Time it" | Cronometra | The switch that lets marks teach block times. Off every time show mode is entered. | `showLearn` | SHW-20 |
| mark | — | A double tap on a word, or an arrow key, that says where the show is. | — | SHW-9 |
| chunk | — | The blocks between two marks while the line runs; its real time is shared among them. | — | SHW-20, SHW-21 |
| correction | — | A mark with "Time it" off: it moves the line and teaches nothing that is kept. | — | SHW-11 |
| pace of the show | — | Words a minute for blocks not timed. Kept. | `show.wpm` | SHW-19 |
| pace of the night | — | A percentage on the block times, 50 to 200. Not kept. | — | SHW-10 |
| call | — | A cue the line is about to reach, shown as a card. | `showCalls` | SHW-12 to SHW-15 |
| warning, standby, GO | attenzione, pronti | The three states of a call: within the warning time, within the standby time, just passed. Estimates, never data on a cue (D5). | `show.warning`, `show.standby` | SHW-12 to SHW-14 |
| map | — | The spine down the right edge: one stretch per scene, a tick per cue. | — | SHW-25 |
| show panel | — | The rail on the right: clock, calls, pace. | — | SHW-26 |
| focus | — | Everything not needed for calling is hidden. | — | SHW-3 |

## 11. Words of the documents

| Term | Meaning | Defined in |
|---|---|---|
| capability | One area of the tool, one file in `docs/specs/`, one ID prefix. | `SPEC.md` §2.2 |
| intent, requirement, consequence | The three parts of every capability file: why, what must hold, what follows. | `SPEC.md` |
| `[LOCKED]`, `[ASSUMED]`, `[OPEN]` | Decided by the client; the builder's reading, standing unless vetoed; still blocking something. | `SPEC.md` |
| basis | Where a requirement comes from. "As built" means settled while building, with no recorded client decision. | `SPEC.md` |
| check | One `ok(condition, sentence)` in a test file. "Checked by" names the files, not the checks. | `docs/verification.md` |
| not built, not verified | Named at the end of every capability file. "Not verified" means never tried outside a simulated browser. | capability files, §3 |
| device trial | A recorded try on the rehearsal laptop, a phone or paper. None is recorded. | `docs/verification.md` §4 |
| compatibility | What an older or a newer release does with a show. Stated per release in `CHANGELOG.md`. | C8, STO-13 |
