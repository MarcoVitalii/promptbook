# Pages and print — PAG

**Covers:** the page layout, how blocks fill pages, the front page and the character page, zoom, print, locked page numbers.
**Code:** `src/core.js` (constants `PAPERS`, `GEO`; LAYOUT: `buildRow`, `measure`, `paginate`; locked page numbers), `src/view.js` (`syncPages`, `renderScriptPage`, `doPrint`), `src/style.css` (page geometry, print).
**Checks:** `test/scale-folder`, `test/frontmatter`, `test/history`, `test/unit/compare`, `test/templates`, `test/boards`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

A prompt book is a book: the script on the left page, the staging on the right, cues in the margin beside the line where they are called (goal G3), and it has to exist on paper (G4). The page layout was given by the client and is locked (D8).

Once a script is printed and handed to the cast, its page numbers are how a room of people find the same line. Request, as received on 2026-10-09: "git versioning below with tags for meaningful moments (revisions, branches for specific shows) with support to lock pages and reprint for rehearsals. Assume that actors will manage their notes on their own. I'd need to produce new pages, and a simple diff like github to align actors on what affects them."

The intent of the page lock: after a hand-out, a change to the text should replace as few sheets as possible, and nobody's page 14 should become page 15.

Nothing the user wrote is left off the paper without a word: a character list longer than one page runs on to further pages (PAG-8).

## 2. Requirements

### 2.1 Layout `[LOCKED]`

Left page (script):

| Name column | Text column | Cue margin |
|---|---|---|
| Character name | Dialogue; actions in italics | Cue tags with connector lines |

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| PAG-1 | The script page has three columns: name, text, cue margin. Simultaneous speech splits the text column into one sub-column per speaker, name on top, text underneath. | D8 `[LOCKED]` | scale-folder |
| PAG-2 | The right page (facing) shows the boards whose `{BOARD}` tokens fall on the left page (BRD-7). | D8 `[LOCKED]` | boards |
| PAG-3 | Page numbers are computed at render time and are never used as identifiers. | D8 `[LOCKED]` | — |
| PAG-4 | Paper is A4 portrait by default; Letter can be chosen in Settings. | A4 (assumption), as built | misc |
| PAG-5 | A level-1 heading starts a new page. No page overflows. | as built | scale-folder |
| PAG-6 | A speech longer than the space left on the page is split by lines; the second part is labelled `(segue)`, or `(cont.)` in the English interface. | as built | scale-folder |
| PAG-7 | Front page: one page before the script. It shows the frontmatter values only, never the keys, centred, in the order written. `title` (or `titolo`) is set large (38 px bold); everything else small (18 px). No running head, no page number, nothing on the facing page. Not shown: `characters`, and Obsidian's own `tags`, `aliases`, `cssclasses`. | D19: `[LOCKED]` by the request, sizes `[ASSUMED]` | frontmatter |
| PAG-8 | Character page: a page of its own after the front page, before the script. Heading: the key as typed (`Personaggi`, `Characters`). One line per character in the order written: **NAME** / ALIAS — description. No running head, no number, nothing facing it. Over 30 characters the list is set smaller in two columns. A list longer than one page runs on to as many pages as it needs, on screen and in print; the heading is on the first only. | D19: `[LOCKED]` by the request, layout `[ASSUMED]`; code review | frontmatter |
| PAG-9 | The front page and the character pages have no number. The script still starts on page 1, so adding frontmatter to an existing show changes no page number. | D19 `[ASSUMED]` | frontmatter |
| PAG-10 | Zoom: in, out and fit-to-width buttons. Zoom scales the page and never reflows it (INK-3). | as built | misc |

### 2.2 Print

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| PAG-11 | Printing goes through the browser. The Print button offers "Book: script and facing pages" and "Script pages only". In the book the facing page is always emitted, blank when the script page has no board, so left and right stay paired. | original scope | notes-todos, templates |
| PAG-12 | Print is always light, whatever the night mode. Toolbar, popovers, ink flags, comment markers and "+ Board" are never printed. Templates are never printed (BRD-25). | as built | templates, boards |

### 2.3 Locked page numbers

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| PAG-13 | Ticking "Lock page numbers here" when saving a revision records where every block was. From then on a page starts where it started on paper. Locking changes no page number and marks no page. | request 2026-10-09 `[LOCKED]` | history |
| PAG-14 | The lock is `lock: { name, rev, pages, n, cont, sig, keys }` in `config.json`, each a list joined by spaces: page labels; blocks starting on each page; whether the page opens mid-block; a hash of what each page held; a hash of every block in order. `rev` is the revision's tag. Being in `config.json`, the lock belongs to the variant and to the revision. | `[ASSUMED]` | history |
| PAG-15 | Locked layout: blocks are matched to the locked ones by their words (cue tokens ignored). A page starts at its first surviving block. Overflow goes to the next page when that page opened mid-block before, otherwise to inserted pages `12A`, `12B` (`12A1` after `12A`; `12+1` when `12A` already exists). An emptied page is dropped and its number is not reused. Past the last locked page numbering continues. No label is used twice. | `[ASSUMED]` | history, unit/compare |
| PAG-16 | A page is changed when its blocks, or the way they break over the page, differ from the lock. Only words count: adding or moving a cue does not mark a page. A changed page shows "∗ changed since …" at its foot, on screen and in print. History lists the changed pages and the pages now empty. | `[ASSUMED]` | history |
| PAG-17 | "Print changed pages" prints only the changed pages, script pages without boards, with no empty sheet. | `[ASSUMED]` | history |
| PAG-18 | Locking again at a later revision makes that one the reference; lettered pages keep their letters. "Unlock" returns to plain numbers. | as built | history |
| PAG-19 | The cue list, Review and the scene menu show the same page labels as the pages. | as built | history |
| PAG-20 | Actors' notes are not handled: an actor moves their own notes to the replaced page. | request 2026-10-09 `[LOCKED]` | — |

## 3. Consequences

**The geometry is fixed in pixels.** A4 is 793 × 1122 px, Letter 816 × 1056 px. Text is 15 px on a 22 px line. Left padding 38, name column 118, gaps 12 and 14, cue margin 166, right padding 46; top 54, bottom 58. The text column takes what is left. These numbers are what keeps ink in place (INK-3); changing any of them moves every line break in every show.

**Layout needs the browser.** Line breaks are found by building each row in a hidden element and measuring it. Pagination, page locks and ink position therefore cannot be computed or checked without a browser.

**Splitting rules as built.** A block is split only when it has four rendered lines or more, and never so that fewer than two lines stay on either side. A heading is not left alone at the foot of a page: it moves to the next page with the block it introduces.

**Pages are drawn only when near the screen.** That keeps a long script fast (a generated 375-page script loads in about 0.4 s) and it is why the browser's own find cannot see the whole script: the tool has its own Find (UI-2). A page that has been drawn stays in the document until its content changes.

**The lock adds to the layout without changing its geometry.** Inserted pages mean the book no longer has consecutive numbers; that is the point. The smallest possible set of reprinted pages follows from PAG-20: every replaced sheet costs an actor the work of moving their notes.

**A lock is matched by content, not by position.** Blocks are recognised by a hash of their words. A change to the words of a block is a different block; its neighbours hold the page starts in place.

**The character list is cut into pages by measuring it.** Each line of the list is measured as it will be set (one column, or two over 30 characters) and the pages are filled column by column: about 78 one-line characters fit the first page of A4, a few more on a page without the heading. Every such page is unnumbered, so a longer list moves no page number of the script (PAG-9) and no locked page. Ink drawn on the character page stays where it was drawn; it is not tied to a name, so after the list changes it may sit beside another one.

**Not built:** a manual page break; a character whose own entry is taller than a page (it gets a page to itself and its end is cut off); "changed since last print" marks outside a lock; double-sided imposition.

**Not verified:** nothing has been printed on paper. Print was checked through the print styles in the browser and by the page count of generated PDFs; the PDFs the checks write were not opened. Paper size and single- or double-sided printing were never confirmed (Q19): A4 and the built print order stand. The printed changed pages are untested on the laptop.
