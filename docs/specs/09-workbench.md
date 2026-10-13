# Workbench — UI

**Covers:** what surrounds the pages: the Review panel, find and jump, Settings, view toggles, night mode, language, the start screen, the toolbar and the corner dock, keyboard shortcuts.
**Code:** `src/view.js` (`reviewData`, `renderDrawer`, `findNext`, `jumpTo`, `updOutline`), `src/io.js` (`openSettings`, `bindUI`, `KEYS`, `KEYMAP`, `openKeys`, `showStart`, `init`), `src/view.js` (`pageStep`), `src/style.css` (colours, toolbar, `#dock`), `src/core.js` (`STR`, `t`).
**Checks:** `test/interact`, `test/misc`, `test/shortcuts`, `test/scale-folder`, `test/frontmatter`, `test/notes-todos`, `test/cue-ends`, `test/unit/parse`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Most of this capability was not asked for. It is there because each part was cheap and lowers the risk of a rehearsal: a tolerant parser needs somewhere to show what it could not read; a tool for a dark theatre needs a dark screen; an Italian company needs an Italian interface.

- **Change request, 2026-10-09:** "provide a more modern look to the page that is less taxing on the eyes, with cues more visible, top bar less crowded and potential shortcut support".
- **Change request, 2026-10-10:** "improve further the user experience. keep consisten the terms, now boards have remove and cues have delete. keep one and make a hotkey for it for when the cue is selected. When a board is added, allow to enter its name before creating it by opening the text box with the default name selected, so that if i type i overwrite it. Also implement movement for blocks with the same dynamics of cues". Four parts: one word for deleting (UI-12), a key for it (CUE-42, BRD-5), the name of a new board (BRD-28), moving blocks (TXT-28 to TXT-31). The client tried all four on a real show and reported "all working as expected" (2026-10-10). Which machine, pointer and keyboard were used is not recorded.

- **Code review, 2026-10-09:** every reason the tool gives for a show file it cannot open or save comes from the string table, in both languages; so do the headings of the exported cue lists; and a save that fails says why. Answered in UI-5, STO-3 and CUE-38.

One principle runs through it (C10): the tool reports, it does not refuse. Everything doubtful is listed in one place, Review, as a hint the stage manager can act on or ignore.

## 2. Requirements

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| UI-1 | The Review panel lists, each entry jumping to its place: to-do notes; lines not recognised; "&" with no speech above; speakers not in the character list; ink to check; unknown departments; ends with no cue to close; ink whose text was removed. These count in the badge on the Review button. It also lists, not counted: commented-out blocks; every character name with its number of speeches (a name that appears once is usually a typo or a misread line); listed characters that never speak. | original scope; C10 | interact, frontmatter, notes-todos, cue-ends, misc |
| UI-2 | Find (the search field, Ctrl+F, Enter for the next, Shift+Enter for the previous) searches the whole script without regard to case or accents, jumps to the block and flashes it. A menu jumps to any act or scene and shows its page. | as built | interact |
| UI-3 | Settings holds what belongs to the show: title, paper (A4 or Letter), departments (code, name, colour, "To do", "Cast"), template strength, board grid, the pace and the standby and warning times of show mode, and the way into the Templates view. Language is there too, and belongs to the browser. | D7; as built | misc, boards |
| UI-4 | The toolbar toggles the facing page ("Boards"), the cues and the ink. | as built | cuebox |
| UI-5 | The interface is in English and Italian, picked from the browser language and switchable on the start screen and in Settings. Every user-facing text exists in both, the reasons the tool gives for a show file it cannot open or save included. | C9; code review | scale-folder, zipshow, unit/parse |
| UI-6 | Night mode gives a dark screen for a dark theatre. Print is always light. | as built | boards |
| UI-7 | The start screen shows the version of the tool and offers: reopen the last show, open a show file, continue the unsaved draft, try the sample scene, start from pasted text, import a backup. In a browser that cannot save show files it says so. | as built | scale-folder, misc |
| UI-8 | View settings (facing page, cues, ink, night, finger, language) are remembered in the browser, not in the show. | as built | — |
| UI-9 | Keys act when no text field has the focus, no dialog is open and no cue box is open: B, C, I, N toggle boards, cues, ink and night; 1 to 4 pick a pen, E the eraser, F the finger; + and − zoom, 0 fits; Page Down and Page Up go one page, Home and End to the ends of the script; L and R open the cue list and Review; / goes to Find, and Escape in Find leaves it, empties it and folds it back to the magnifier. Ctrl+S saves now. Ctrl+P opens the tool's own print choices, never the browser's print. | change request 2026-10-09 `[ASSUMED]` (which keys) | shortcuts |
| UI-10 | "?" (key, corner button, or Menu) lists every shortcut, in the interface language. The tooltip of a button names its key. | change request 2026-10-09 | shortcuts |
| UI-11 | The toolbar is one row from 1280 px wide: controls sit in groups (tools, undo, view toggles, panels); Find is a magnifier that widens when used. Night mode, zoom and help are not in the toolbar: they float in the bottom right corner of the desk. | change request 2026-10-09 | shortcuts |
| UI-12 | One word for taking something out of the show: "Delete" ("Elimina"), on cues, boards and templates. With the box of a cue or of a board open and no field holding the cursor, the Delete key presses that button; the shortcut list names it. | request 2026-10-10 | shortcuts, boards |

## 3. Consequences

**Review is the safety net of the tolerant parser.** Because nothing is refused (TXT-6, CUE-5, CUE-10, TXT-16), a mistake never stops work, and it is also never blocked from reaching paper. The badge is the only signal; it is on the stage manager to open the panel before printing. Two hints are outside Review and its badge: a cue number used twice and a cue number out of order are marked in the cue list only (CUE-5).

**The browser's find is useless here.** Pages are drawn only when near the screen (PAG), so Ctrl+F is taken over by the tool.

**Two kinds of settings.** What is in `config.json` travels with the show and is part of every revision (title, paper, departments, templates, grid, lock). What is in the browser stays with the machine (language, night mode, toggles). Changing the paper changes every line break and can flag ink (INK-4).

**Changing a department code does not rewrite the script.** Cues already typed keep their code, show in grey and are listed under "Unknown departments" until the code is added back or the cues are edited.

**Strings are a table, not markup.** Every text is a key in `STR` with an English and an Italian value; a unit check requires both, requires every key to be named somewhere in `src/`, and refuses an error raised with a literal message. A reason that comes from the browser and not from the tool (a file the system will not let it read or write) is shown as the browser words it, in the language of the browser.

**The look.** Paper is not pure white and text not pure black, by day or by night; the desk is close to the paper; a lit toggle is a tint, not a black block. None of this touches the page geometry (PAG).

**Single-letter keys are a trade.** They are fast and need no modifier, but a letter typed with the focus outside a field does something. They are off while a cue box is open because there a letter picks a department (CUE-3). The keys were chosen, not asked for: `[ASSUMED]`.

**Ctrl+P is taken over** for the same reason as Ctrl+F: only pages near the screen are drawn, so the browser's own print would give a few pages.

**Not built:** keyboard access to every control; any language besides English and Italian.

**Not verified:** the colours, the tag labels and the corner dock were judged on screenshots only; whether the dock gets under a hand or a pen on the laptop is not known. Shortcuts were not tried on an Italian keyboard (/ and ? need Shift there). Night mode and the grid strength in it were judged on screenshots, not on the laptop's display in a dark room.
