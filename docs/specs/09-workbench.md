# Workbench — UI

**Covers:** what surrounds the pages: the Review panel, find and jump, Settings, view toggles, night mode, language, the start screen.
**Code:** `src/view.js` (`reviewData`, `renderDrawer`, `findNext`, `jumpTo`, `updOutline`), `src/io.js` (`openSettings`, `bindUI`, `showStart`, `init`), `src/core.js` (`STR`, `t`).
**Checks:** `test/interact`, `test/misc`, `test/scale-folder`, `test/frontmatter`, `test/notes-todos`, `test/cue-ends`, `test/unit/parse`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Most of this capability was not asked for. It was added while building R0 because each part was cheap and reduced the risk of the first rehearsal: a tolerant parser needs somewhere to show what it could not read; a tool for a dark theatre needs a dark screen; an Italian company needs an Italian interface.

One principle runs through it (C10): the tool reports, it does not refuse. Everything doubtful is listed in one place, Review, as a hint the stage manager can act on or ignore.

## 2. Requirements

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| UI-1 | The Review panel lists, each entry jumping to its place: to-do notes; lines not recognised; "&" with no speech above; speakers not in the character list; ink to check; unknown departments; ends with no cue to close; ink whose text was removed. These count in the badge on the Review button. It also lists, not counted: commented-out blocks; every character name with its number of speeches (a name that appears once is usually a typo or a misread line); listed characters that never speak. | R0.1; C10 | r0, extended r1.0 to r1.4 | interact, frontmatter, notes-todos, cue-ends, misc |
| UI-2 | Find (the search field, Ctrl+F, Enter for the next, Shift+Enter for the previous) searches the whole script without regard to case or accents, jumps to the block and flashes it. A menu jumps to any act or scene and shows its page. | as built | r0 | interact |
| UI-3 | Settings holds what belongs to the show: title, paper (A4 or Letter), departments (code, name, colour, "To do"), template strength, board grid, and the way into the Templates view. Language is there too, and belongs to the browser. | D7; as built | r0, r1.0, r1.4, r1.6 | misc, boards |
| UI-4 | The toolbar toggles the facing page ("Boards"), the cues and the ink. | as built | r0 | cuebox |
| UI-5 | The interface is in English and Italian, picked from the browser language and switchable on the start screen and in Settings. Every user-facing text exists in both. | C9 | r0 | scale-folder, unit/parse |
| UI-6 | Night mode gives a dark screen for a dark theatre. Print is always light. | as built | r0 | boards |
| UI-7 | The start screen shows the version of the tool and offers: reopen the last show, open a show file, open an older show folder, continue the unsaved draft, try the sample scene, start from pasted text, import a backup. In a browser that cannot save show files it says so. | as built; version r1.0 | r0, r1.0 | scale-folder, misc |
| UI-8 | View settings (facing page, cues, ink, night, finger, language) are remembered in the browser, not in the show. | as built | r0 | — |

## 3. Consequences

**Review is the safety net of the tolerant parser.** Because nothing is refused (TXT-6, CUE-5, CUE-10, TXT-16), a mistake never stops work, and it is also never blocked from reaching paper. The badge is the only signal; it is on the stage manager to open the panel before printing.

**The browser's find is useless here.** Pages are drawn only when near the screen (PAG), so Ctrl+F is taken over by the tool.

**Two kinds of settings.** What is in `config.json` travels with the show and is part of every revision (title, paper, departments, templates, grid, lock). What is in the browser stays with the machine (language, night mode, toggles). Changing the paper changes every line break and can flag ink (INK-4).

**Changing a department code does not rewrite the script.** Cues already typed keep their code, show in grey and are listed under "Unknown departments" until the code is added back or the cues are edited.

**Strings are a table, not markup.** Every text is a key in `STR` with an English and an Italian value; a unit check requires both. Messages raised by the zip reader and the file dialogs are not in that table and appear in English in either language (`docs/review-2026-10-09.md`, X10).

**Not built:** a hint for out-of-order cue labels (CUE-5); keyboard access to every control; any language besides English and Italian.

**Not verified:** night mode and the grid strength in it were judged on screenshots, not on the laptop's display in a dark room.
