# Workbench — UI

**Covers:** what surrounds the pages: the Review panel, find and jump, Settings, view toggles, night mode, language, the start screen, the toolbar and the corner dock, keyboard shortcuts.
**Code:** `src/view.js` (`reviewData`, `renderDrawer`, `findNext`, `jumpTo`, `updOutline`), `src/io.js` (`openSettings`, `bindUI`, `KEYS`, `KEYMAP`, `openKeys`, `showStart`, `init`), `src/view.js` (`pageStep`), `src/style.css` (colours, toolbar, `#dock`), `src/core.js` (`STR`, `t`).
**Checks:** `test/interact`, `test/misc`, `test/shortcuts`, `test/scale-folder`, `test/frontmatter`, `test/notes-todos`, `test/cue-ends`, `test/unit/parse`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Most of this capability was not asked for. It was added while building R0 because each part was cheap and reduced the risk of the first rehearsal: a tolerant parser needs somewhere to show what it could not read; a tool for a dark theatre needs a dark screen; an Italian company needs an Italian interface.

- **Change request, r1.8 (2026-10-09):** "provide a more modern look to the page that is less taxing on the eyes, with cues more visible, top bar less crowded and potential shortcut support".
- **Change request, 2026-10-10:** "improve further the user experience. keep consisten the terms, now boards have remove and cues have delete. keep one and make a hotkey for it for when the cue is selected. When a board is added, allow to enter its name before creating it by opening the text box with the default name selected, so that if i type i overwrite it. Also implement movement for blocks with the same dynamics of cues". Four parts: one word for deleting (UI-12), a key for it (CUE-42, BRD-5), the name of a new board (BRD-28), moving blocks (TXT-28 to TXT-31). Released as r1.9. The client tried the r1.9 features on a real show and reported "all working as expected" (2026-10-10). Which machine, pointer and keyboard were used is not recorded.

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
| UI-9 | Keys act when no text field has the focus, no dialog is open and no cue box is open: B, C, I, N toggle boards, cues, ink and night; 1 to 4 pick a pen, E the eraser, F the finger; + and − zoom, 0 fits; Page Down and Page Up go one page, Home and End to the ends of the script; L and R open the cue list and Review; / goes to Find, and Escape in Find leaves it, empties it and folds it back to the magnifier (r1.9). Ctrl+S saves now. Ctrl+P opens the tool's own print choices, never the browser's print. | change request 2026-10-09 `[ASSUMED]` (which keys) | r1.8 | shortcuts |
| UI-10 | "?" (key, corner button, or Menu) lists every shortcut, in the interface language. The tooltip of a button names its key. | change request 2026-10-09 | r1.8 | shortcuts |
| UI-11 | The toolbar is one row from 1280 px wide: controls sit in groups (tools, undo, view toggles, panels); Find is a magnifier that widens when used. Night mode, zoom and help are not in the toolbar: they float in the bottom right corner of the desk. | change request 2026-10-09 | r1.8 | shortcuts |
| UI-12 | One word for taking something out of the show: "Delete" ("Elimina"), on cues, boards and templates. With the box of a cue or of a board open and no field holding the cursor, the Delete key presses that button; the shortcut list names it. | request 2026-10-10 | r1.9 | shortcuts, boards |

## 3. Consequences

**Review is the safety net of the tolerant parser.** Because nothing is refused (TXT-6, CUE-5, CUE-10, TXT-16), a mistake never stops work, and it is also never blocked from reaching paper. The badge is the only signal; it is on the stage manager to open the panel before printing.

**The browser's find is useless here.** Pages are drawn only when near the screen (PAG), so Ctrl+F is taken over by the tool.

**Two kinds of settings.** What is in `config.json` travels with the show and is part of every revision (title, paper, departments, templates, grid, lock). What is in the browser stays with the machine (language, night mode, toggles). Changing the paper changes every line break and can flag ink (INK-4).

**Changing a department code does not rewrite the script.** Cues already typed keep their code, show in grey and are listed under "Unknown departments" until the code is added back or the cues are edited.

**Strings are a table, not markup.** Every text is a key in `STR` with an English and an Italian value; a unit check requires both. Messages raised by the zip reader and the file dialogs are not in that table and appear in English in either language (`docs/review-2026-10-09.md`, X10).

**The look, since r1.8.** Paper and text are no longer near white and near black, in day or night; the desk is closer to the paper; a lit toggle is a tint instead of a black block. None of this touches the page geometry (PAG): fonts, sizes and line breaks of the script are as before, and print is unchanged except for the cue tags (CUE-7).

**Single-letter keys are a trade.** They are fast and need no modifier, but a letter typed with the focus outside a field now does something. They are off while a cue box is open because there a letter picks a department (CUE-3). The keys were chosen, not asked for: `[ASSUMED]`.

**Ctrl+P is taken over** for the same reason as Ctrl+F: only pages near the screen are drawn, so the browser's own print would give a few pages.

**Not built:** a hint for out-of-order cue labels (CUE-5); keyboard access to every control; any language besides English and Italian.

**Not verified:** the new colours, the tag labels and the corner dock were judged on screenshots only; whether the dock gets under a hand or a pen on the laptop is not known. Shortcuts were not tried on an Italian keyboard (/ and ? need Shift there).

**Not verified, earlier:** night mode and the grid strength in it were judged on screenshots, not on the laptop's display in a dark room.
